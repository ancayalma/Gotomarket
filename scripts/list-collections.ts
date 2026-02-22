
import { prismadbCrm } from  "../lib/prisma-crm";

async function run() {
    const result = await (prismadbCrm as any).$runCommandRaw({
        listCollections: 1
    });
    console.log("Collections:", result.cursor.firstBatch.map((c: any) => c.name));
}

run().catch(console.error);
