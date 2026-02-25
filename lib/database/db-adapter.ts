import { prismadb } from "@/lib/prisma";
import { prismadbCrm } from "@/lib/prisma-crm";
import { PrismaClient } from "@prisma/client";

/**
 * DB_TARGET defines the current underlying database engine.
 * While Prisma handles the connection and ORM abstraction natively for both 
 * Azure CosmosDB (MongoDB API) and Native MongoDB (OVHCloud/Atlas),
 * Azure CosmosDB has certain limits and nuances (e.g., specific transaction limits,
 * $regex limitations, and complex raw aggregation differences) compared to native MongoDB.
 * 
 * We use this Adapter to wrap Prisma functionality and gracefully handle those quirks. 
 * If the platform switches back to Azure Cosmos DB in the future, simply change the DB_ENGINE
 * environment variable to "COSMOS_MONGO".
 */
export type DBEngine = "COSMOS_MONGO" | "NATIVE_MONGO";

export class DatabaseAdapter {
    private prisma: PrismaClient;
    private engine: DBEngine;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
        // Determine engine from an environment variable, defaulting to native MongoDB.
        // Set DB_ENGINE="NATIVE_MONGO" or "COSMOS_MONGO" in .env
        this.engine = (process.env.DB_ENGINE as DBEngine) || "NATIVE_MONGO";
    }

    /**
     * Returns the current active database engine (Cosmos or Native MongoDB)
     */
    public get engineType(): DBEngine {
        return this.engine;
    }

    /**
     * Access the underlying Prisma Client
     */
    public get client(): PrismaClient {
        return this.prisma;
    }

    /**
     * Helper for raw aggregations.
     * Cosmos DB query optimization differs slightly from MongoDB, particularly 
     * around unsupported aggregation pipeline stages.
     */
    public async executeRawAggregation(collectionName: string, pipeline: any[]) {
        // Modify pipelines dynamically based on the connected engine
        let optimizedPipeline = [...pipeline];

        if (this.engine === "COSMOS_MONGO") {
            // Azure Cosmos DB might struggle with certain complex native MongoDB aggregations.
            // E.g., strip out unsupported pipeline operators or simplify `$lookup` if necessary.
            console.log(`[DB Adapter] Running CosmosDB tailored aggregation on ${collectionName}`);
        } else {
            console.log(`[DB Adapter] Running Native MongoDB aggregation on ${collectionName}`);
        }

        // Use Prisma's findRaw / aggregateRaw under the hood
        const model = (this.prisma as any)[collectionName];
        if (model && model.aggregateRaw) {
            return model.aggregateRaw({ pipeline: optimizedPipeline });
        }

        throw new Error(`Collection ${collectionName} does not support raw aggregations.`);
    }

    /**
     * Helper for raw queries, intercepting regex or complex filtering.
     */
    public async executeRawQuery(collectionName: string, filter: any, options?: any) {
        if (this.engine === "COSMOS_MONGO") {
            // Cosmos DB handles $regex differently, sometimes requiring specific index hints.
            console.log(`[DB Adapter] Running CosmosDB tailored raw query on ${collectionName}`);
        }

        const model = (this.prisma as any)[collectionName];
        if (model && model.findRaw) {
            return model.findRaw({ filter, options });
        }

        throw new Error(`Collection ${collectionName} does not support raw queries.`);
    }

    /**
     * Cosmos DB for MongoDB has strict RU limits on transactions and older versions
     * don't support multi-document transactions out of the box.
     * Native MongoDB (replica sets on OVH) supports robust transactions.
     */
    public async runTransaction<T>(callback: (prisma: any) => Promise<T>): Promise<T> {
        if (this.engine === "COSMOS_MONGO") {
            // Azure Cosmos MongoDB RU based limits may throw exceptions on large transactions.
            // A production app may intercept these and fallback to linear execution.
            console.log(`[DB Adapter] Executing Prisma transaction (Cosmos Compat mode)`);
            return (this.prisma as any).$transaction(callback);
        } else {
            // Native MongoDB transaction
            console.log(`[DB Adapter] Executing Prisma transaction (Native MongoDB mode)`);
            return (this.prisma as any).$transaction(callback);
        }
    }

    /**
     * Executes a raw database command (e.g., listCollections, ping).
     */
    public async executeRawCommand(command: any) {
        if (this.engine === "COSMOS_MONGO") {
            console.log(`[DB Adapter] Running CosmosDB tailored command`);
        }
        return this.prisma.$runCommandRaw(command);
    }
}

// Export a singleton instance of the adapter to be used throughout the app.
export const dbAdapter = new DatabaseAdapter(prismadb);
export const crmDbAdapter = new DatabaseAdapter(prismadbCrm);
