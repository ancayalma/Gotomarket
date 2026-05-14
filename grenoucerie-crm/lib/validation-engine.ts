/**
 * Validation Rule Formula Engine (Server-side)
 * 
 * Extends the core engine with Prisma-backed rule fetching.
 */

import { evaluateFormula } from "./validation/engine-core";

export interface ValidationResult {
    isValid: boolean;
    errors: {
        ruleName: string;
        ruleId: string;
        message: string;
    }[];
}

export { evaluateFormula, testFormula } from "./validation/engine-core";

/**
 * Run all active validation rules for a given object type against record data.
 * Returns a ValidationResult with pass/fail and error messages.
 */
export async function validateRecord(
    objectType: string,
    record: Record<string, unknown>,
    teamId: string,
    context: 'SAVE' | 'CREATE_ONLY' | 'UPDATE_ONLY' = 'SAVE'
): Promise<ValidationResult> {
    // Dynamic import to avoid circular deps and client-side bundling
    const { prismadb } = await import("@/lib/prisma");

    const rules = await prismadb.validationRule.findMany({
        where: {
            team_id: teamId,
            object_type: objectType,
            is_active: true,
            OR: [
                { trigger_on: 'SAVE' },
                { trigger_on: context },
            ],
        },
        orderBy: { order: 'asc' },
    });

    const errors: ValidationResult['errors'] = [];

    for (const rule of rules) {
        const isErrorCondition = evaluateFormula(rule.formula, record);
        if (isErrorCondition) {
            errors.push({
                ruleName: rule.name,
                ruleId: rule.id,
                message: rule.error_message,
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
