
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
        },
        select: { id: true }
    });

    const junkIds = junkLeads.map(l => l.id);
    console.log(`Found ${junkIds.length} junk leads.`);

    if (junkIds.length === 0) {
        console.log("No junk leads to delete.");
        return;
    }

    // 1. Delete crm_Lead_Activities
    try {
        const count = await prisma.crm_Lead_Activities.deleteMany({
            where: { lead: { in: junkIds } }
        });
        console.log(`Deleted ${count.count} activities.`);
    } catch (e) {
        console.error("Error deleting crm_Lead_Activities:", (e as any).message);
    }

    // 2. Delete crm_Outreach_Items
    try {
        const count = await prisma.crm_Outreach_Items.deleteMany({
            where: { lead: { in: junkIds } }
        });
        console.log(`Deleted ${count.count} outreach items.`);
    } catch (e) {
        console.error("Error deleting crm_Outreach_Items:", (e as any).message);
    }

    // 3. Delete crm_Portal_Recipient
    try {
        const count = await prisma.crm_Portal_Recipient.deleteMany({
            where: { lead: { in: junkIds } }
        });
        console.log(`Deleted ${count.count} portal recipients.`);
    } catch (e) {
        console.error("Error deleting crm_Portal_Recipient:", (e as any).message);
    }

    // 4. Delete crm_Lead_Pools_Leads
    try {
        const count = await prisma.crm_Lead_Pools_Leads.deleteMany({
            where: { lead: { in: junkIds } }
        });
        console.log(`Deleted ${count.count} lead pool maps.`);
    } catch (e) {
        console.error("Error deleting crm_Lead_Pools_Leads:", (e as any).message);
    }

    // 5. Delete crm_Contact_Candidate_Leads
    try {
        const count = await prisma.crm_Contact_Candidate_Leads.deleteMany({
            where: { lead: { in: junkIds } }
        });
        console.log(`Deleted ${count.count} contact candidate maps.`);
    } catch (e) {
        console.error("Error deleting crm_Contact_Candidate_Leads:", (e as any).message);
    }

    // 6. Delete Junk Leads
    try {
        const result = await prisma.crm_Leads.deleteMany({
            where: {
                id: {
                    in: junkIds
                }
            }
        });
        console.log(`Deleted ${result.count} junk leads.`);
    } catch (e) {
        console.error("Error deleting crm_Leads:", (e as any).message);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
