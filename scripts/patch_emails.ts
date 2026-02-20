
import { prismadbCrm } from "../lib/prisma-crm";

async function patchEmails() {
    console.log("🛠️  Starting Email Patching...");

    const accounts = await (prismadbCrm as any).crm_Accounts.findMany({
        select: { id: true, name: true, email: true, additional_emails: true }
    });

    console.log(`Checking ${accounts.length} accounts...`);
    let patched = 0;

    for (const acc of accounts) {
        if (!acc.email && acc.additional_emails && acc.additional_emails.length > 0) {
            const primaryEmail = acc.additional_emails[0];
            await (prismadbCrm as any).crm_Accounts.update({
                where: { id: acc.id },
                data: { email: primaryEmail }
            });
            patched++;
        }
    }

    console.log(`✅ Patched ${patched} accounts with primary emails.`);

    // Also verify if candidates need conversion status synced
    const updated = await (prismadbCrm as any).crm_Lead_Candidates.updateMany({
        where: {
            accountsIDs: { not: null },
            status: { not: "CONVERTED" }
        },
        data: { status: "CONVERTED" }
    });
    console.log(`✅ Synced ${updated.count} candidates to CONVERTED status.`);
}

patchEmails().catch(console.error);
