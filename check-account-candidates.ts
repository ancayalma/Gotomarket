
import { prismadbCrm } from "./lib/prisma-crm";

async function run() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2); // Go back 2 days to be safe

    const accounts = await (prismadbCrm as any).crm_Accounts.findMany({
        where: {
            createdAt: { gte: yesterday }
        },
        take: 10,
        select: { id: true, name: true, createdAt: true }
    });

    console.log(`Found ${accounts.length} recent accounts (sample of 10):`);

    for (const acc of accounts) {
        const candidate = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
            where: { accountsIDs: acc.id }
        });
        console.log(`Account: ${acc.name} (${acc.id}) Created: ${acc.createdAt} -> Candidate: ${candidate ? candidate.id : 'MISSING'} (Pool: ${candidate?.pool || 'N/A'})`);
    }
}

run().catch(console.error);
