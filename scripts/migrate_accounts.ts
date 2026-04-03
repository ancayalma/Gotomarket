import { prismadbCrm } from '../lib/prisma-crm';

async function run() {
    const POOL_ID = '69cefadd4643a9b151b62d89';
    const TARGET_TEAM = '69ce9c26e8f6d7cd8945f89f';

    const cands = await prismadbCrm.crm_Lead_Candidates.findMany({ where: { pool: POOL_ID } });
    const accIds = cands.map(c => c.accountsIDs).filter(Boolean) as string[];

    console.log(`Found ${cands.length} candidates, and ${accIds.length} associated accounts to migrate.`);

    if (accIds.length > 0) {
        const updateAccs = await prismadbCrm.crm_Accounts.updateMany({
            where: { id: { in: accIds } },
            data: { team_id: TARGET_TEAM }
        });
        console.log(`Updated ${updateAccs.count} accounts.`);

        const contacts = await prismadbCrm.crm_Contacts.findMany({
            where: { accountsIDs: { in: accIds } }
        });
        console.log(`Found ${contacts.length} contacts linked to these accounts.`);

        if (contacts.length > 0) {
            const updateContacts = await prismadbCrm.crm_Contacts.updateMany({
                where: { accountsIDs: { in: accIds } },
                data: { team_id: TARGET_TEAM }
            });
            console.log(`Updated ${updateContacts.count} contacts.`);
        }

        // Just in case, update the pool itself (even though it might already have the right team_id)
        await prismadbCrm.crm_Lead_Pools.updateMany({
            where: { id: POOL_ID },
            data: { team_id: TARGET_TEAM }
        });
        console.log(`Made sure Lead Pool was pointing to the correct team.`);
    }
}

run().catch(console.error);
