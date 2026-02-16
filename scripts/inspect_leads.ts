
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const leads = await prisma.crm_Leads.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            email: true
        }
    });

    console.log(`Total leads: ${leads.length}`);
    console.log('--- Leads List ---');
    leads.forEach(l => {
        console.log(`${l.id}: ${l.firstName} ${l.lastName} | ${l.email} | ${l.company}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
