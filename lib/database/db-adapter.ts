import { prismadb } from "@/lib/prisma";
import { prismadbCrm } from "@/lib/prisma-crm";
import { PrismaClient } from "@prisma/client";
import { MongoClient, Db, Collection } from "mongodb";

/**
 * DB_TARGET defines the current underlying database engine.
 */
export type DBEngine = "COSMOS_MONGO" | "NATIVE_MONGO";

export class DatabaseAdapter {
    private prisma: PrismaClient;
    private engine: DBEngine;
    private mongoClient: MongoClient | null = null;
    private mongoDb: Db | null = null;
    private connectionUrl: string;

    constructor(prisma: PrismaClient, connectionUrl: string) {
        this.prisma = prisma;
        this.connectionUrl = connectionUrl;
        this.engine = (process.env.DB_ENGINE as DBEngine) || "NATIVE_MONGO";
    }

    public get engineType(): DBEngine {
        return this.engine;
    }

    public get client(): PrismaClient {
        return this.prisma;
    }

    /**
     * Lazily connects and retrieves the native MongoDB database object.
     * This provides raw access to collections, avoiding Prisma's wrapping limitations.
     */
    public async getNativeDb(): Promise<Db> {
        if (this.mongoDb) return this.mongoDb;

        if (!this.mongoClient) {
            this.mongoClient = new MongoClient(this.connectionUrl);
            await this.mongoClient.connect();
        }

        // URL parsing to extract the default DB name
        const dbName = new URL(this.connectionUrl).pathname.slice(1) || 'test';
        this.mongoDb = this.mongoClient.db(dbName);
        return this.mongoDb;
    }

    /**
     * Retrieves a native MongoDB collection.
     */
    public async getNativeCollection(collectionName: string): Promise<Collection> {
        const db = await this.getNativeDb();
        return db.collection(collectionName);
    }

    /**
     * Helper for raw aggregations using native MongoDB driver to avoid Prisma translation issues.
     */
    public async executeRawAggregation(collectionName: string, pipeline: any[]) {
        let optimizedPipeline = [...pipeline];

        if (this.engine === "COSMOS_MONGO") {
            console.log(`[DB Adapter] Running CosmosDB tailored aggregation on ${collectionName}`);
        } else {
            console.log(`[DB Adapter] Running Native MongoDB aggregation on ${collectionName}`);
        }

        try {
            const collection = await this.getNativeCollection(collectionName);
            return await collection.aggregate(optimizedPipeline).toArray();
        } catch (error) {
            console.warn(`[DB Adapter] Native aggregation failed, falling back to Prisma. Error:`, error);
            // Fallback to Prisma
            const model = (this.prisma as any)[collectionName];
            if (model && model.aggregateRaw) {
                return await model.aggregateRaw({ pipeline: optimizedPipeline });
            }
            throw error;
        }
    }

    /**
     * Helper for raw queries using native MongoDB driver.
     */
    public async executeRawQuery(collectionName: string, filter: any, options?: any) {
        if (this.engine === "COSMOS_MONGO") {
            console.log(`[DB Adapter] Running CosmosDB tailored raw query on ${collectionName}`);
        }

        try {
            const collection = await this.getNativeCollection(collectionName);
            return await collection.find(filter, options).toArray();
        } catch (error) {
            console.warn(`[DB Adapter] Native find failed, falling back to Prisma. Error:`, error);
            // Fallback to Prisma
            const model = (this.prisma as any)[collectionName];
            if (model && model.findRaw) {
                return await model.findRaw({ filter, options });
            }
            throw error;
        }
    }

    public async runTransaction<T>(callback: (prisma: any) => Promise<T>): Promise<T> {
        if (this.engine === "COSMOS_MONGO") {
            console.log(`[DB Adapter] Executing Prisma transaction (Cosmos Compat mode)`);
            return (this.prisma as any).$transaction(callback);
        } else {
            console.log(`[DB Adapter] Executing Prisma transaction (Native MongoDB mode)`);
            return (this.prisma as any).$transaction(callback);
        }
    }

    public async executeRawCommand(command: any) {
        if (this.engine === "COSMOS_MONGO") {
            console.log(`[DB Adapter] Running CosmosDB tailored command`);
        }
        try {
            const db = await this.getNativeDb();
            return await db.command(command);
        } catch (e) {
            return this.prisma.$runCommandRaw(command);
        }
    }
}

// Compute URL strings for primary and CRM instances
const primaryDbUrl = process.env.DATABASE_URL || "";
let crmDbUrl = process.env.CRM_DATABASE_URL;
if (!crmDbUrl && primaryDbUrl) {
    const dbName = process.env.PRISMA_DB_NAME || "BasaltCRM";
    try {
        const u = new URL(primaryDbUrl);
        if (!u.pathname || u.pathname === "/") u.pathname = `/${dbName}`;
        crmDbUrl = u.toString();
    } catch {
        crmDbUrl = `${primaryDbUrl}/${dbName}`;
    }
}

export const dbAdapter = new DatabaseAdapter(prismadb as any, primaryDbUrl);
export const crmDbAdapter = new DatabaseAdapter(prismadbCrm as any, crmDbUrl || "");
