
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_IDS = [
    '698ffa35aaceb199fddea3ae', // Lex Sokolin
    '698807680d46fc855b711676'  // Erik Osol
];

async function main() {
    // Find all junk leads first
    const junkLeads = await prisma.crm_Leads.findMany({
        where: {
            id: { notIn: KEEP_IDS }
        }
    });

    console.log(`Found ${junkLeads.length} junk leads to migrate.`);

    for (const lead of junkLeads) {
        // Create Account from Lead data
        // Lead firstName/lastName might be "Direct" or similar for scraped data
        // Lead company is the account name
        const accountName = lead.company || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Account';

        await prisma.crm_Accounts.create({
            data: {
                v: 1,
                name: accountName,
                email: lead.email,
                office_phone: lead.phone,
                description: lead.description,
                website: lead.outreach_meeting_link || '', // Use link if present, or just blank
                team_id: lead.team_id,
                assigned_to: lead.assigned_to,
                status: 'Active',
                type: 'Prospect'
            }
        });
    }

    // Now delete the migrated junk leads
    const junkIds = junkLeads.map(l => l.id);

    // Need to handle relations again (Activities, etc.)
    await prisma.crm_Lead_Activities.deleteMany({
        where: { lead: { in: junkIds } }
    });
    await prisma.crm_Outreach_Items.deleteMany({
        where: { lead: { in: junkIds } }
    });
    await prisma.crm_Portal_Recipient.deleteMany({
        where: { lead: { in: junkIds } }
    });
    await prisma.crm_Lead_Pools_Leads.deleteMany({
        where: { lead: { in: junkIds } }
    });
    await prisma.crm_Contact_Candidate_Leads.deleteMany({
        where: { lead: { in: junkIds } }
    });

    const deleteResult = await prisma.crm_Leads.deleteMany({
        where: { id: { in: junkIds } }
    });

    console.log(`Migrated ${junkLeads.length} leads to Accounts and deleted them from Leads table.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
