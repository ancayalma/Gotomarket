
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

const prisma = new PrismaClient();

function getString(cellValue: any): string {
    if (cellValue === null || cellValue === undefined) return '';
    if (typeof cellValue === 'object') {
        // Handle Rich Text from ExcelJS
        if (cellValue.richText && Array.isArray(cellValue.richText)) {
            return cellValue.richText.map((rt: any) => rt.text).join('').trim();
        }
        // Handle Hyperlinks or other objects with .text
        if (cellValue.text) {
            return String(cellValue.text).trim();
        }
    }
    return String(cellValue).trim();
}


const TEAM_ID = '6934998c7038863976a7a5fd'; // BasaltHQ
const USER_EMAIL = 'mmfmilton@gmail.com';

async function main() {
    const user = await prisma.users.findUnique({ where: { email: USER_EMAIL } });
    if (!user) throw new Error('User not found');
    const userId = user.id;

    const files = [
        '/Volumes/Mayor/Build/crm-official-1/temp/import-samples/Web3Crypto Investors_emails.xlsx',
        '/Volumes/Mayor/Build/crm-official-1/temp/import-samples/Web3Crypto Investors_names & phones.xlsx'
    ];

    const investorMap = new Map<string, any>();

    for (const filePath of files) {
        console.log(`Processing ${path.basename(filePath)}...`);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) continue;

        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').toLowerCase().trim();
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const data: any = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const h = headers[colNumber];
                if (h) data[h] = cell.value;
            });

            const investorName = getString(data['investors']);
            if (!investorName || investorName === 'null') return;

            const existing = investorMap.get(investorName) || {};

            // Extract fields using helper to avoid Object definition errors
            const typeVal = getString(data['type']);
            const locVal = getString(data['location']);
            const contactVal = getString(data['primary contact']);
            const titleVal = getString(data['primary contact title']);
            const websiteVal = getString(data['website']);

            const rawEmail = getString(data['email']);
            const rawPhone = getString(data['phone']);

            // Resolve Email
            let email = existing.email;
            if (rawEmail && rawEmail.includes('@')) {
                email = rawEmail;
            }

            // Resolve Phone
            let phone = existing.phone;

            // 1. Use phone column if it exists and is NOT an email
            if (rawPhone && !rawPhone.includes('@')) {
                phone = rawPhone;
            }
            // 2. Fallback: Check 'email' column for values that look like phones (no '@', length > 5)
            else if (rawEmail && !rawEmail.includes('@') && rawEmail.length > 5) {
                // Only if we don't have a phone yet
                if (!phone) phone = rawEmail;
            }

            // 3. Override for specific file type (names & phones) if needed
            if (filePath.includes('names & phones') && rawEmail && !rawEmail.includes('@')) {
                phone = rawEmail;
            }

            const merged = {
                ...existing,
                name: investorName,
                type: typeVal || existing.type,
                location: locVal || existing.location,
                contactName: contactVal || existing.contactName,
                contactTitle: titleVal || existing.contactTitle,
                email: email,
                phone: phone,
                website: websiteVal || existing.website
            };

            investorMap.set(investorName, merged);
        });
    }

    console.log(`Found ${investorMap.size} unique investors.`);

    let pool = await prisma.crm_Lead_Pools.findFirst({
        where: { name: "Web3 Crypto Investors", team_id: TEAM_ID }
    });

    if (!pool) {
        pool = await prisma.crm_Lead_Pools.create({
            data: {
                v: 1,
                name: "Web3 Crypto Investors",
                description: "Imported from Web3Crypto Investors XLSX files",
                user: userId,
                team_id: TEAM_ID,
                status: "ACTIVE",
                color: "#6366f1"
            }
        });
        console.log(`Created pool: ${pool.id}`);
    } else {
        console.log(`Using existing pool: ${pool.id}`);
    }

    const poolId = pool.id;
    const investors = Array.from(investorMap.values());
    const batchSize = 5;
    let count = 0;

    // Processing strictly sequential to avoid transaction/connection errors
    for (let i = 0; i < investors.length; i++) {
        const inv = investors[i];
        if (i % 25 === 0) console.log(`Processing batch ${i}... (Current: ${inv.name})`);
        try {
            // 1. Dedupe/Find Candidate
            let candidate = await prisma.crm_Lead_Candidates.findFirst({
                where: { pool: poolId, companyName: inv.name }
            });

            // 2. Create/Update Account (company)
            let account = await prisma.crm_Accounts.findFirst({
                where: { name: inv.name, team_id: TEAM_ID }
            });

            if (!account) {
                account = await prisma.crm_Accounts.create({
                    data: {
                        v: 1,
                        name: inv.name,
                        type: inv.type || "Analyst",
                        billing_city: inv.location,
                        status: "Active",
                        team_id: TEAM_ID,
                        createdBy: userId,
                        website: inv.website || ""
                    }
                });
            } else {
                // Update account if missing info
                await prisma.crm_Accounts.update({
                    where: { id: account.id },
                    data: {
                        type: account.type === "Analyst" && inv.type ? inv.type : undefined, // Update type if placeholder
                        billing_city: inv.location || undefined,
                        website: inv.website || undefined
                    }
                });
            }

            // 3. Create/Update Contact
            if (inv.contactName) {
                const names = inv.contactName.trim().split(/\s+/);
                const firstName = names[0];
                const lastName = names.slice(1).join(' ') || 'Unknown';

                let existingContact = await prisma.crm_Contacts.findFirst({
                    where: { accountsIDs: account.id, first_name: firstName, last_name: lastName }
                });

                if (!existingContact) {
                    existingContact = await prisma.crm_Contacts.create({
                        data: {
                            v: 1,
                            first_name: firstName,
                            last_name: lastName,
                            email: inv.email || null,
                            mobile_phone: inv.phone ? String(inv.phone) : null,
                            position: inv.contactTitle || null,
                            accountsIDs: account.id,
                            team_id: TEAM_ID,
                            createdBy: userId
                        }
                    });
                } else {
                    // Update contact info if missing
                    await prisma.crm_Contacts.update({
                        where: { id: existingContact.id },
                        data: {
                            email: (inv.email) ? inv.email : undefined,
                            mobile_phone: (inv.phone) ? String(inv.phone) : undefined,
                            position: (inv.contactTitle) ? inv.contactTitle : undefined
                        }
                    });
                }
            }

            // 4. Register/Update Candidate in Pool
            if (!candidate) {
                candidate = await prisma.crm_Lead_Candidates.create({
                    data: {
                        v: 1,
                        pool: poolId,
                        companyName: inv.name,
                        industry: inv.type,
                        description: inv.location,
                        status: "NEW",
                        accountsIDs: account.id
                    }
                });
                count++; // Only count new candidates as "Added"
            } else {
                await prisma.crm_Lead_Candidates.update({
                    where: { id: candidate.id },
                    data: {
                        accountsIDs: account.id, // Ensure link
                        industry: inv.type || undefined,
                        description: inv.location || undefined
                    }
                });
            }

            // 5. Upsert Contact Candidate (linked to Lead Candidate)
            if (inv.contactName && candidate) {
                const ccDedupe = inv.email || inv.contactName;
                let cc = await prisma.crm_Contact_Candidates.findFirst({
                    where: { leadCandidate: candidate.id, dedupeKey: ccDedupe }
                });

                if (!cc) {
                    await prisma.crm_Contact_Candidates.create({
                        data: {
                            v: 1,
                            leadCandidate: candidate.id,
                            fullName: inv.contactName,
                            title: inv.contactTitle,
                            email: inv.email,
                            phone: inv.phone ? String(inv.phone) : null,
                            dedupeKey: ccDedupe,
                            status: "NEW"
                        }
                    });
                } else {
                    await prisma.crm_Contact_Candidates.update({
                        where: { id: cc.id },
                        data: {
                            title: inv.contactTitle || undefined,
                            email: inv.email || undefined,
                            phone: inv.phone ? String(inv.phone) : null
                        }
                    });
                }
            }
        } catch (err) {
            console.error(`Failed to ingest ${inv.name}:`, err);
        }
    }

    console.log(`Ingestion complete! ${count} records added.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
