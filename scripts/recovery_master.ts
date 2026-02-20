
import { prismadbCrm } from "../lib/prisma-crm";

async function runRecovery() {
    console.log("🚀 Starting Ultimate Data Recovery...");

    const WEB3_POOL_ID = "6996045ddd6d4cdbc82a20d7";
    const ISO_POOL_ID = "699792e83e5cb6e1f2525326";
    const MAYOR_USER_ID = "692d0e74bf21172162457117";

    // 1. Recover Web3 Crypto Investors (The 3000+ accounts from Feb 18)
    console.log("\n--- Stage 1: Recovering Web3 Crypto Investors ---");
    const web3Accounts = await (prismadbCrm as any).crm_Accounts.findMany({
        where: {
            createdBy: MAYOR_USER_ID,
            createdAt: { gte: new Date("2026-02-18T00:00:00Z") },
            // Filter for investor types to be sure
            OR: [
                { type: { contains: "Venture", mode: "insensitive" } },
                { type: { contains: "Angel", mode: "insensitive" } },
                { type: { contains: "Asset", mode: "insensitive" } },
                { type: { contains: "Hedge", mode: "insensitive" } },
                { type: { contains: "Corporation", mode: "insensitive" } },
                { name: { contains: "Crypto", mode: "insensitive" } },
                { name: { contains: "Capital", mode: "insensitive" } }
            ]
        }
    });

    console.log(`Found ${web3Accounts.length} accounts for Web3 recovery.`);
    let web3Restored = 0;
    for (const acc of web3Accounts) {
        const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
            where: { accountsIDs: acc.id, pool: WEB3_POOL_ID }
        });
        if (!existing) {
            await (prismadbCrm as any).crm_Lead_Candidates.create({
                data: {
                    pool: WEB3_POOL_ID,
                    companyName: acc.name,
                    industry: acc.industry || acc.type,
                    status: "NEW",
                    accountsIDs: acc.id,
                    dedupeKey: `recovery_${acc.id}`,
                    v: 1
                }
            });
            web3Restored++;
        }
    }
    console.log(`✅ Web3 Recovery Complete: ${web3Restored} links created.`);

    // 2. Recover Scraped Data (The 39 other pools)
    console.log("\n--- Stage 2: Recovering Scraped Data via Keywords ---");
    const otherPools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
        where: { NOT: { id: { in: [WEB3_POOL_ID, ISO_POOL_ID] } } }
    });

    const historicalAccounts = await (prismadbCrm as any).crm_Accounts.findMany({
        where: {
            createdAt: { lt: new Date("2026-02-18T00:00:00Z") }
        }
    });

    console.log(`Scanning ${historicalAccounts.length} historical accounts for ${otherPools.length} pools...`);

    let totalScrapedRestored = 0;
    for (const acc of historicalAccounts) {
        let bestPoolId = null;
        let bestScore = 0;

        for (const pool of otherPools) {
            let score = 0;
            const poolWords = pool.name.toLowerCase().split(/\s+/);

            for (const word of poolWords) {
                const cleanWord = word.replace(/[^a-z0-9]/g, "");
                if (cleanWord.length < 4) continue;
                if (acc.name.toLowerCase().includes(cleanWord)) score += 10;
            }

            if (score > bestScore) {
                bestScore = score;
                bestPoolId = pool.id;
            }
        }

        if (bestPoolId && bestScore > 0) {
            const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                where: { accountsIDs: acc.id, pool: bestPoolId }
            });
            if (!existing) {
                await (prismadbCrm as any).crm_Lead_Candidates.create({
                    data: {
                        pool: bestPoolId,
                        companyName: acc.name,
                        industry: acc.industry || acc.type,
                        status: "NEW",
                        accountsIDs: acc.id,
                        dedupeKey: `recovery_keyword_${acc.id}`,
                        v: 1
                    }
                });
                totalScrapedRestored++;
            }
        }
    }
    console.log(`✅ Scraped Data Recovery Complete: ${totalScrapedRestored} links created.`);

    console.log("\n🏁 ALL RECOVERY STAGES COMPLETE.");
}

runRecovery().catch(console.error);
