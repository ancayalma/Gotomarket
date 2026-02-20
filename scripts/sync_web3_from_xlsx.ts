
import ExcelJS from "exceljs";
import { prismadbCrm } from "../lib/prisma-crm";

const WEB3_POOL_ID = "6996045ddd6d4cdbc82a20d7";
const FILE_PATH = "/Volumes/Mayor/Build/crm-official-1/temp/Web3Crypto Investors_emails.xlsx";

async function syncWeb3() {
    console.log("🚀 STARTING WEB3 XLSX SYNC...");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(FILE_PATH);
    const worksheet = workbook.worksheets[0];

    let processed = 0;
    let updatedAccs = 0;
    let createdContacts = 0;
    let matchedCandidates = 0;

    const rowCount = worksheet.rowCount;
    console.log(`Processing ${rowCount - 1} data rows...`);

    // We'll iterate manually to handle async operations
    for (let i = 2; i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        const investorName = row.getCell(2).value?.toString()?.trim();
        const type = row.getCell(3).value?.toString()?.trim();
        const location = row.getCell(4).value?.toString()?.trim();
        const primaryContact = row.getCell(5).value?.toString()?.trim();
        const contactTitle = row.getCell(6).value?.toString()?.trim();
        const email = row.getCell(7).value?.toString()?.trim()?.toLowerCase();
        const phone = row.getCell(8).value?.toString()?.trim();

        if (!investorName) continue;

        processed++;
        if (processed % 100 === 0) console.log(`Processed ${processed} rows...`);

        // 1. Find or Update Account
        let account = await (prismadbCrm as any).crm_Accounts.findFirst({
            where: { name: investorName }
        });

        if (account) {
            // Update email if missing
            if (email && (!account.email || !account.additional_emails.includes(email))) {
                await (prismadbCrm as any).crm_Accounts.update({
                    where: { id: account.id },
                    data: {
                        email: account.email || email,
                        additional_emails: {
                            set: Array.from(new Set([...(account.additional_emails || []), email]))
                        },
                        type: type || account.type,
                        billing_city: location || account.billing_city
                    }
                });
                updatedAccs++;
            }
        } else {
            // Create account if it doesn't exist? 
            // The user wanted to "re-link recently created accounts".
            // If it doesn't exist, we might skip it or create it.
            // Let's create it to be safe and ensure the pool is full.
            account = await (prismadbCrm as any).crm_Accounts.create({
                data: {
                    name: investorName,
                    email: email || null,
                    additional_emails: email ? [email] : [],
                    type: type || "Venture Capital",
                    billing_city: location || null,
                    status: "Active",
                    v: 1,
                    team_id: "6934998c7038863976a7a5fd" // Default team
                }
            });
            updatedAccs++;
        }

        // 2. Link to Lead Pool / Candidate
        const existingCand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
            where: { pool: WEB3_POOL_ID, accountsIDs: account.id }
        });

        if (!existingCand) {
            await (prismadbCrm as any).crm_Lead_Candidates.create({
                data: {
                    pool: WEB3_POOL_ID,
                    companyName: investorName,
                    status: "CONVERTED",
                    accountsIDs: account.id,
                    industry: type,
                    v: 1,
                    dedupeKey: `xlsx_sync_${account.id}`
                }
            });
            matchedCandidates++;
        } else if (existingCand.status !== "CONVERTED") {
            await (prismadbCrm as any).crm_Lead_Candidates.update({
                where: { id: existingCand.id },
                data: { status: "CONVERTED" }
            });
            matchedCandidates++;
        }

        // 3. Find or Create Contact
        if (primaryContact && email) {
            const names = primaryContact.split(" ");
            const firstName = names[0];
            const lastName = names.slice(1).join(" ") || "Contact";

            const existingContact = await (prismadbCrm as any).crm_Contacts.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { AND: [{ first_name: firstName }, { last_name: lastName }, { accountsIDs: account.id }] }
                    ]
                }
            });

            if (!existingContact) {
                await (prismadbCrm as any).crm_Contacts.create({
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        mobile_phone: phone,
                        position: contactTitle,
                        accountsIDs: account.id,
                        status: true,
                        v: 1,
                        team_id: "6934998c7038863976a7a5fd"
                    }
                });
                createdContacts++;
            } else {
                // Update existing contact if fields are missing
                await (prismadbCrm as any).crm_Contacts.update({
                    where: { id: existingContact.id },
                    data: {
                        email: existingContact.email || email,
                        mobile_phone: existingContact.mobile_phone || phone,
                        position: existingContact.position || contactTitle,
                        accountsIDs: account.id // Ensure linkage
                    }
                });
            }
        }
    }

    console.log("--- Sync Complete ---");
    console.log(`Total Rows Processed: ${processed}`);
    console.log(`Accounts Created/Updated: ${updatedAccs}`);
    console.log(`Contacts Created: ${createdContacts}`);
    console.log(`Candidates Linked/Converted: ${matchedCandidates}`);
}

syncWeb3().catch(console.error);
