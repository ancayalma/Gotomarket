
import { prismadbCrm } from "../lib/prisma-crm";
import { prismadb } from "../lib/prisma";

async function diagnose() {
    const poolId = "699792e83e5cb6e1f2525326";
    console.log(`Checking pool: ${poolId}`);

    const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
        where: { id: poolId },
        select: { name: true }
    });

    if (!pool) {
        console.error("Pool not found!");
        return;
    }

    console.log(`Pool Name: ${pool.name}`);

    // Get all leads linked to this pool
    const poolLeads = await (prismadbCrm as any).crm_Lead_Pools_Leads.findMany({
        where: { pool: poolId },
        select: { lead: true }
    });

    const leadIds = poolLeads.map((pl: any) => pl.lead);
    console.log(`Total Leads linked in pool: ${leadIds.length}`);

    const leads = await prismadb.crm_Leads.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, company: true, phone: true, email: true }
    });

    const leadsWithPhone = leads.filter(l => l.phone && l.phone !== "—" && l.phone !== "");
    console.log(`Leads with phone: ${leadsWithPhone.length}`);
    console.log(`Leads missing phone: ${leads.length - leadsWithPhone.length}`);

    // Get all candidates in this pool
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        where: { pool: poolId },
        select: { id: true, companyName: true, accountsIDs: true, domain: true }
    });

    console.log(`Total Candidates in pool: ${candidates.length}`);

    const accountIds = candidates.map((c: any) => c.accountsIDs).filter(Boolean);
    const uniqueAccountIds = Array.from(new Set(accountIds));

    const accounts = await (prismadbCrm as any).crm_Accounts.findMany({
        where: { id: { in: uniqueAccountIds } },
        select: { id: true, name: true, office_phone: true }
    });

    const accountsWithPhone = accounts.filter((a: any) => a.office_phone && a.office_phone !== "—" && a.office_phone !== "");
    console.log(`Accounts with office_phone: ${accountsWithPhone.length}`);
    console.log(`Accounts missing office_phone: ${accounts.length - accountsWithPhone.length}`);

    // Check contact candidates
    const contactCandidates = await (prismadbCrm as any).crm_Contact_Candidates.findMany({
        where: { leadCandidate: { in: candidates.map((c: any) => c.id) } },
        select: { fullName: true, phone: true, leadCandidate: true }
    });

    const contactsWithPhone = contactCandidates.filter((cc: any) => cc.phone && cc.phone !== "—" && cc.phone !== "");
    console.log(`Contact Candidates with phone: ${contactsWithPhone.length}`);

    // Check global companies
    const domains = candidates.map((c: any) => c.domain).filter(Boolean);
    const globalCompanies = await (prismadbCrm as any).crm_Global_Companies.findMany({
        where: { domain: { in: domains } },
        select: { domain: true, phones: true }
    });

    const globalWithPhone = globalCompanies.filter((gc: any) => gc.phones && gc.phones.length > 0);
    console.log(`Global Companies with phones: ${globalWithPhone.length}`);

    const query = "Payroc";
    console.log(`\nDEEP SCAN: Searching for raw text "${query}" in ALL collections...`);

    const result = await (prismadb as any).$runCommandRaw({
        listCollections: 1
    });
    const collections = result.cursor.firstBatch.map((c: any) => c.name);

    for (const collName of collections) {
        try {
            const matches = await (prismadb as any).$runCommandRaw({
                find: collName,
                filter: {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { companyName: { $regex: query, $options: 'i' } },
                        { company: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                },
                limit: 5
            });

            const docs = matches.cursor.firstBatch;
            if (docs.length > 0) {
                console.log(`\n[${collName}] Matches found:`);
                docs.forEach((d: any) => {
                    console.log(JSON.stringify(d, null, 2));
                });
            }
        } catch (e) {
            // ignore collections that don't have these fields
        }
    }
}

diagnose().catch(console.error);
