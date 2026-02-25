import { prismadb } from "../lib/prisma";

async function checkLeads() {
    const totalLeads = await prismadb.crm_Leads.count();
    const leadsWithTeam = await prismadb.crm_Leads.count({
        where: { team_id: { not: null } }
    });
    const leadsByTeam = await prismadb.crm_Leads.groupBy({
        by: ['team_id'],
        _count: true
    });

    console.log("Total Leads:", totalLeads);
    console.log("Leads with Team:", leadsWithTeam);
    console.log("Groups:", JSON.stringify(leadsByTeam, null, 2));

    const leads = await prismadb.crm_Leads.findMany({
        select: { createdAt: true }
    });
    console.log("Leads Creation Dates:", leads.map(l => l.createdAt));
}

checkLeads().catch(console.error);
