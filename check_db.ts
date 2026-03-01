import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("Database connection successful");
        const count = await (prisma as any).users.count();
        console.log("Users count:", count);
    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
