
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding types and stages...");

    // Add Disposition (Types)
    const won = await prisma.crm_Opportunities_Type.create({
        data: { v: 0, name: 'Closed WON', order: 100 }
    });

    const lost = await prisma.crm_Opportunities_Type.create({
        data: { v: 0, name: 'Closed LOST', order: 101 }
    });

    console.log("Created Dispositions:", won.name, lost.name);

    // Add LOST Stages
    const stages = [
        { name: 'Follow-up', probability: 0 },
        { name: 'Rehash', probability: 0 },
        { name: 'No Show', probability: 0 },
        { name: 'Reschedule', probability: 0 },
    ];

    for (const s of stages) {
        await prisma.crm_Opportunities_Sales_Stages.create({
            data: { v: 0, name: s.name, probability: s.probability }
        });
    }

    console.log("LOST Stages seeded.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
