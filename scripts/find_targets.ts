
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetLeads = await prisma.crm_Leads.findMany({
        where: {
            OR: [
                { lastName: { contains: 'Sokolin', mode: 'insensitive' } },
                { lastName: { contains: 'Osol', mode: 'insensitive' } }
            ]
        }
    });

    console.log('Target Leads found:', targetLeads.length);
    targetLeads.forEach(l => console.log(`${l.id}: ${l.firstName} ${l.lastName}`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
