import { crmDbAdapter } from "../lib/database/db-adapter";

async function run() {
    const result = await crmDbAdapter.executeRawCommand({
        listCollections: 1
    });
    console.log("Collections:", (result as any).cursor.firstBatch.map((c: any) => c.name));
}

run().catch(console.error);
