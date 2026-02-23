
import ExcelJS from 'exceljs';
import { prismadbCrm } from '../lib/prisma-crm';
import { prismadb } from '../lib/prisma';

async function fixPhones() {
    const filePath = '/Users/mayordelmar/Desktop/Local Workspace/crm-official/ISO Campaign.xlsx';
    const poolId = "699792e83e5cb6e1f2525326";

    console.log(`Starting phone fix for pool: ${poolId}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
        throw new Error("Worksheet not found");
    }
    console.log(`Total rows in sheet: ${sheet.rowCount}`);

    let updatedAccountsTotal = 0;
    let updatedLeadsTotal = 0;
    let missedCompanies: string[] = [];

    const excelData: { company: string, phone: string, email?: string }[] = [];
    let skipCount = 0;
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const company = row.getCell(1).text?.trim();
        const email = row.getCell(2).text?.trim();
        const phone = row.getCell(5).text?.trim();

        if ((company || email) && phone && phone !== "—" && phone !== "") {
            excelData.push({ company, phone, email });
        } else {
            if (skipCount < 10) {
                console.log(`Row ${rowNumber} skipped: Comp="${company}", Phone="${phone}"`);
            }
            skipCount++;
        }
    });

    console.log(`Working with ${excelData.length} valid records from Excel... (Skipped ${skipCount})`);

    let count = 0;
    for (const item of excelData) {
        count++;
        // console.log(`Processing ${count}/${excelData.length}: ${item.company}`);

        let candidates = [];
        if (item.company) {
            candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
                where: {
                    pool: poolId,
                    companyName: { equals: item.company, mode: 'insensitive' }
                }
            });
        }

        if (candidates.length === 0 && item.email) {
            candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
                where: {
                    pool: poolId,
                    additional_emails: { has: item.email }
                }
            });
        }

        if (candidates.length === 0) {
            missedCompanies.push(item.company || item.email || "Unknown");
            continue;
        }

        for (const cand of candidates) {
            if (cand.accountsIDs) {
                const updateAcc = { office_phone: item.phone };
                try {
                    await (prismadb.crm_Accounts as any).update({
                        where: { id: cand.accountsIDs },
                        data: updateAcc
                    });
                    await (prismadbCrm as any).crm_Accounts.update({
                        where: { id: cand.accountsIDs },
                        data: updateAcc
                    });
                    updatedAccountsTotal++;

                    // Also update Contact Candidates for this specific lead candidate
                    const updatedContacts = await (prismadbCrm as any).crm_Contact_Candidates.updateMany({
                        where: { leadCandidate: cand.id },
                        data: { phone: item.phone }
                    });
                    if (updatedContacts.count > 0) {
                        console.log(`  Updated ${updatedContacts.count} contact candidates for ${cand.companyName}`);
                    }
                } catch (err) {
                    console.error(`Failed to update account for ${cand.companyName}:`, (err as Error).message);
                }
            }
        }
    }

    console.log("\n--- Final Summary ---");
    console.log(`Successfully Updated Accounts: ${updatedAccountsTotal}`);
    console.log(`Companies not found in Pool: ${missedCompanies.length}`);
    if (missedCompanies.length > 0) {
        console.log(`Sample Missed (first 5): ${missedCompanies.slice(0, 5).join(", ")}`);
    }
}

fixPhones().catch(console.error).finally(() => process.exit());
