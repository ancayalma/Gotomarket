import { crmDbAdapter } from "../lib/database/db-adapter";

async function run() {
    const result = await crmDbAdapter.executeRawCommand({
        listDatabases: 1
    });
    console.log("Databases:", JSON.stringify((result as any).databases, null, 2));
}

run().catch(console.error);
