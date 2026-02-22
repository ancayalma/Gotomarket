
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.boards.findMany({
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5
    });
    console.log(JSON.stringify(boards, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
