
import { prismadbCrm } from "./lib/prisma-crm";

async function run() {
    const result = await (prismadbCrm as any).$runCommandRaw({
        listDatabases: 1
    });
    console.log("Databases:", JSON.stringify(result.databases, null, 2));
}

run().catch(console.error);
