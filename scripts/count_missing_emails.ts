
import { prismadbCrm } from "../lib/prisma-crm";

async function countEmptyEmails() {
    const poolId = "6996045ddd6d4cdbc82a20d7";
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        where: { pool: poolId },
        include: {
            assigned_accounts: {
                include: { contacts: true }
            }
        }
    });

    let total = candidates.length;
    let empty = 0;
    candidates.forEach((c: any) => {
        let email: string | null = null;
        const acc = c.assigned_accounts;
        if (acc) {
            if (acc.email) email = acc.email;
            else if (acc.additional_emails && acc.additional_emails.length > 0) email = acc.additional_emails[0];
            else if (acc.contacts && acc.contacts.length > 0) email = acc.contacts[0].email;
        }
        if (!email) {
            empty++;
            if (empty < 5) console.log(`Missing for: ${c.companyName}`);
        }
    });

    console.log(`Total in Pool: ${total} | Empty Emails: ${empty}`);
}

countEmptyEmails().catch(console.error);
