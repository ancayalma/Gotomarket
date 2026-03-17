/**
 * Rollup Field Computation Engine
 *
 * Computes aggregate values from child records for ROLLUP-type custom fields.
 * Uses Prisma to query child records and apply aggregate functions.
 */

import { prismadb } from "@/lib/prisma";

export type RollupFunction = "SUM" | "COUNT" | "AVG" | "MIN" | "MAX";

export interface RollupFieldConfig {
    rollup_function: RollupFunction;
    rollup_object: string;   // Child model name (e.g. "crm_Opportunities")
    rollup_field: string;    // Field to aggregate (e.g. "budget")
    rollup_filter?: Record<string, unknown>; // Optional Prisma where clause
}

/**
 * Map of supported Prisma model names to their actual Prisma client accessors.
 * Only models that support rollup aggregation are listed.
 */
const MODEL_MAP: Record<string, string> = {
    crm_Accounts: "crm_Accounts",
    crm_Contacts: "crm_Contacts",
    crm_Leads: "crm_Leads",
    crm_Opportunities: "crm_Opportunities",
    crm_Cases: "crm_Cases",
    crm_Contracts: "crm_Contracts",
    crm_Invoices: "crm_Invoices",
    CustomRecord: "customRecord",
};

/**
 * Compute a single rollup field value by aggregating child records.
 *
 * @param parentId - The parent record ID
 * @param parentField - The field on the child that references the parent (e.g. "account_id")
 * @param config - Rollup configuration (function, object, field, filter)
 * @returns The computed aggregate value
 */
export async function computeRollupField(
    parentId: string,
    parentField: string,
    config: RollupFieldConfig
): Promise<{ value: number | null; count: number; error?: string }> {
    try {
        const modelAccessor = MODEL_MAP[config.rollup_object];
        if (!modelAccessor) {
            return { value: null, count: 0, error: `Unsupported model: ${config.rollup_object}` };
        }

        // Build the where clause
        const where: Record<string, unknown> = {
            [parentField]: parentId,
            ...(config.rollup_filter || {}),
        };

        // Get the model from Prisma
        const model = (prismadb as any)[modelAccessor];
        if (!model) {
            return { value: null, count: 0, error: `Model not found: ${modelAccessor}` };
        }

        // For COUNT, we don't need the field
        if (config.rollup_function === "COUNT") {
            const count = await model.count({ where });
            return { value: count, count };
        }

        // For numeric aggregations, use Prisma's _aggregate
        const aggregation = await model.aggregate({
            where,
            _sum: { [config.rollup_field]: true },
            _avg: { [config.rollup_field]: true },
            _min: { [config.rollup_field]: true },
            _max: { [config.rollup_field]: true },
            _count: true,
        });

        const count = aggregation._count || 0;

        switch (config.rollup_function) {
            case "SUM":
                return { value: aggregation._sum?.[config.rollup_field] ?? 0, count };
            case "AVG":
                return { value: aggregation._avg?.[config.rollup_field] ?? 0, count };
            case "MIN":
                return { value: aggregation._min?.[config.rollup_field] ?? null, count };
            case "MAX":
                return { value: aggregation._max?.[config.rollup_field] ?? null, count };
            default:
                return { value: null, count: 0, error: `Unknown rollup function: ${config.rollup_function}` };
        }
    } catch (error) {
        console.error(`Rollup computation error:`, error);
        return { value: null, count: 0, error: (error as Error).message };
    }
}

/**
 * Compute all rollup fields for a parent record.
 *
 * @param parentId - The parent record ID
 * @param parentField - The child's foreign key field name referencing the parent
 * @param rollupFields - Array of rollup field configurations with their apiNames
 * @returns Record with computed rollup values keyed by apiName
 */
export async function computeAllRollups(
    parentId: string,
    parentField: string,
    rollupFields: Array<{ apiName: string; config: RollupFieldConfig }>
): Promise<Record<string, number | null>> {
    const results: Record<string, number | null> = {};

    await Promise.all(
        rollupFields.map(async (field) => {
            const result = await computeRollupField(parentId, parentField, field.config);
            results[field.apiName] = result.value;
        })
    );

    return results;
}
