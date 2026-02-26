import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

async function main() {
    const url = process.env.DATABASE_URL || "";
    console.log("DATABASE_URL:", url.replace(/:([^@:]+)@/, ":****@"));

    const prisma = new PrismaClient({
        datasources: { db: { url } },
        log: ["query", "info", "warn", "error"],
    });

    try {
        console.log("\n1. Testing $connect()...");
        await prisma.$connect();
        console.log("   ✅ Connected");

        console.log("\n2. Testing $runCommandRaw (ping)...");
        const ping = await prisma.$runCommandRaw({ ping: 1 });
        console.log("   ✅ Ping:", JSON.stringify(ping));

        console.log("\n3. Testing pageView.findFirst()...");
        const view = await (prisma as any).pageView.findFirst();
        console.log("   ✅ Result:", view ? "found doc" : "null (empty collection)");

        console.log("\n4. Testing pageView.create()...");
        const created = await (prisma as any).pageView.create({
            data: {
                path: "/_test_diag",
                userAgent: "diagnostic-script",
                ipHash: "test123",
            },
        });
        console.log("   ✅ Created:", created.id);

        // Clean up
        await (prisma as any).pageView.delete({ where: { id: created.id } });
        console.log("   ✅ Cleaned up test record");

    } catch (err: any) {
        console.error("\n❌ Error:", err.message);
        console.error("   Full error:", JSON.stringify(err, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
