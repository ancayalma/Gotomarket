
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.crm_Leads.count();
    console.log(`Total Leads in DB: ${count}`);

    const sample = await prisma.crm_Leads.findMany({
        take: 5,
        select: { firstName: true, lastName: true, company: true }
    });
    console.log('Sample Leads:', JSON.stringify(sample, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
