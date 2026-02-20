
import { prismadbCrm } from "../lib/prisma-crm";

async function auditWeb3() {
    const poolId = "6996045ddd6d4cdbc82a20d7";
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        where: { pool: poolId, status: "CONVERTED" },
        select: { accountsIDs: true }
    });
    const accIds = candidates.map((c: any) => c.accountsIDs).filter(Boolean);
    console.log(`Total converted candidates in Web3: ${candidates.length}`);
    console.log(`Total linked accounts: ${accIds.length}`);

    const sampleSize = 200;
    const accs = await (prismadbCrm as any).crm_Accounts.findMany({
        where: { id: { in: accIds } },
        include: { contacts: true },
        take: sampleSize
    });

    let hasEmail = 0;
    let noEmail = 0;
    accs.forEach((acc: any) => {
        let email = acc.email || (acc.additional_emails?.[0]);
        if (!email && acc.contacts.length > 0) email = acc.contacts[0].email;
        if (email) hasEmail++; else noEmail++;
    });

    console.log(`Sample of ${accs.length} Web3 Accounts: ${hasEmail} has email, ${noEmail} missing.`);
}

auditWeb3().catch(console.error);
