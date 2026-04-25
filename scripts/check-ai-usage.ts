import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.crm_AiUsageLog.findMany({
        where: { service: 'email' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(logs, null, 2));

    const totalLogs = await prisma.crm_AiUsageLog.count({ where: { service: 'email' } });
    console.log("Total email logs:", totalLogs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
