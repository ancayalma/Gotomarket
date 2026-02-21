
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const integration = await prisma.tenant_Integrations.findFirst();
    console.log("Integration Details:");
    console.log(JSON.stringify(integration, null, 2));

    const team = await prisma.team.findUnique({
        where: { id: integration.tenant_id },
        select: { slug: true }
    });
    console.log("Team Slug:", team?.slug);
}

main().catch(console.error).finally(() => prisma.$disconnect());
