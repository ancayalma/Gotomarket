
import { prismadbCrm } from "../lib/prisma-crm";

async function runUltimateRecovery() {
    console.log("🚀 STARTING ULTIMATE DATA RECOVERY...");

    const WEB3_POOL_ID = "6996045ddd6d4cdbc82a20d7";
    const MAYOR_USER_ID = "692d0e74bf21172162457117";

    // 1. Recover Web3 batch (3604 accounts)
    console.log("\n--- Stage 1: Recovering Web3 Crypto Investors ---");
    const web3Accounts = await (prismadbCrm as any).crm_Accounts.findMany({
        where: {
            createdBy: MAYOR_USER_ID,
            createdAt: { gte: new Date("2026-02-18T00:00:00Z") }
        }
    });

    console.log(`Found ${web3Accounts.length} candidate accounts for Web3.`);
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
                    dedupeKey: `recovery_web3_${acc.id}`,
                    v: 1
                }
            });
            web3Restored++;
        }
    }
    console.log(`✅ Web3: ${web3Restored} new links created.`);

    // 2. Recover Scraped Pools from Global Companies
    console.log("\n--- Stage 2: Recovering Scraped Data from Global Companies ---");
    const jobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({
        select: { id: true, pool: true, user: true }
    });
    const jobToPool: any = {};
    jobs.forEach((j: any) => jobToPool[j.id] = { pool: j.pool, user: j.user });

    const globalCompanies = await (prismadbCrm as any).crm_Global_Companies.findMany();
    console.log(`Processing ${globalCompanies.length} global companies...`);

    let scrapedRestored = 0;
    let accountsCreated = 0;

    for (const gc of globalCompanies) {
        let jobId = gc.provenance?.jobId || gc.provenance?.sources?.[0]?.jobId;
        if (!jobId || !jobToPool[jobId]) continue;

        const info = jobToPool[jobId];

        // Ensure Account exists
        let account = await (prismadbCrm as any).crm_Accounts.findFirst({
            where: {
                OR: [
                    { website: gc.domain },
                    { name: gc.companyName }
                ]
            }
        });

        if (!account) {
            account = await (prismadbCrm as any).crm_Accounts.create({
                data: {
                    name: gc.companyName,
                    website: gc.domain,
                    description: gc.description,
                    industry: undefined, // Industry in global is string, in account is ObjectId? Check schema.
                    type: "Prospect",
                    status: "Active",
                    createdBy: info.user,
                    v: 0
                }
            });
            accountsCreated++;
        }

        // Link to Pool
        const existingCand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
            where: { pool: info.pool, accountsIDs: account.id }
        });

        if (!existingCand) {
            await (prismadbCrm as any).crm_Lead_Candidates.create({
                data: {
                    pool: info.pool,
                    companyName: gc.companyName,
                    domain: gc.domain,
                    industry: gc.industry,
                    status: "NEW",
                    accountsIDs: account.id,
                    dedupeKey: `recovery_scraped_${gc.id}`,
                    v: 1
                }
            });
            scrapedRestored++;
        }
    }
    console.log(`✅ Scraped Recovery: ${scrapedRestored} pool links created, ${accountsCreated} new Accounts promoted.`);

    // 3. Recover Contacts
    console.log("\n--- Stage 3: Recovering Contacts ---");
    // Search for contacts with domains matching global companies
    let contactsLinked = 0;
    for (const gc of globalCompanies) {
        if (!gc.domain) continue;
        const jobId = gc.provenance?.jobId || gc.provenance?.sources?.[0]?.jobId;
        if (!jobId || !jobToPool[jobId]) continue;
        const info = jobToPool[jobId];

        const matchingContacts = await (prismadbCrm as any).crm_Contacts.findMany({
            where: { email: { contains: gc.domain, mode: "insensitive" } }
        });

        for (const contact of matchingContacts) {
            // Find the candidate record for this company in this pool
            const candidate = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                where: { pool: info.pool, domain: gc.domain }
            });

            if (candidate) {
                const existingPerson = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
                    where: { leadCandidate: candidate.id, fullName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() }
                });

                if (!existingPerson) {
                    await (prismadbCrm as any).crm_Contact_Candidates.create({
                        data: {
                            leadCandidate: candidate.id,
                            fullName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                            email: contact.email,
                            phone: contact.mobile_phone || contact.office_phone,
                            v: 1
                        }
                    });
                    contactsLinked++;
                }
            }
        }
    }
    console.log(`✅ Contact Recovery: ${contactsLinked} people linked to pools.`);

    console.log("\n🏁 RECOVERY COMPLETE.");
}

runUltimateRecovery().catch(console.error);
