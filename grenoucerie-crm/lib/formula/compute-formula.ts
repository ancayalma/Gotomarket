/**
 * Formula Field Computation Engine
 *
 * Evaluates FORMULA-type custom fields against a record.
 * Reuses the existing tokenizer/parser from the validation engine.
 */

import { tokenize, FormulaParser } from "@/lib/validation/engine-core";

export interface FieldDefinition {
    apiName: string;
    type: string; // "FORMULA" | "ROLLUP" | other
    formula_expression?: string | null;
}

/**
 * Evaluate a single formula expression against record data.
 * Unlike the validation engine (which returns boolean), this returns the raw computed value.
 */
export function evaluateExpression(
    formula: string,
    record: Record<string, unknown>
): unknown {
    try {
        const tokens = tokenize(formula);
        const parser = new FormulaParser(tokens, record);
        return parser.parse();
    } catch (error) {
        console.error(`Formula computation error for "${formula}":`, error);
        return null;
    }
}

/**
 * Compute all FORMULA fields for a record and return an enriched copy.
 * Formula fields are read-only computed values that appear alongside stored fields.
 *
 * @param record - The raw record data (from DB)
 * @param fieldDefinitions - All field definitions for the object, including FORMULA fields
 * @returns A new record object with computed formula values injected
 */
export function computeFormulaFields(
    record: Record<string, unknown>,
    fieldDefinitions: FieldDefinition[]
): Record<string, unknown> {
    const enriched = { ...record };

    // First pass: compute all formula fields
    const formulaFields = fieldDefinitions.filter(
        f => f.type === "FORMULA" && f.formula_expression
    );

    // Sort by dependency depth (simple heuristic: formulas referencing other formula fields)
    // For now, do two passes to handle single-level formula-to-formula references
    for (let pass = 0; pass < 2; pass++) {
        for (const field of formulaFields) {
            const value = evaluateExpression(field.formula_expression!, enriched);
            enriched[field.apiName] = value;
        }
    }

    return enriched;
}

/**
 * Compute a single formula field value.
 * Useful when you only need one field's value without enriching the whole record.
 */
export function computeSingleFormula(
    formula: string,
    record: Record<string, unknown>
): { value: unknown; error?: string } {
    try {
        const value = evaluateExpression(formula, record);
        return { value };
    } catch (error) {
        return { value: null, error: (error as Error).message };
    }
}

/**
 * Format a computed formula value for display based on the intended output type.
 */
export function formatFormulaValue(
    value: unknown,
    format?: "number" | "currency" | "percent" | "text" | "date"
): string {
    if (value === null || value === undefined) return "—";

    switch (format) {
        case "currency":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
            }).format(Number(value));
        case "percent":
            return `${Number(value).toFixed(1)}%`;
        case "number":
            return new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
            }).format(Number(value));
        case "date":
            if (value instanceof Date) {
                return value.toLocaleDateString();
            }
            return new Date(String(value)).toLocaleDateString();
        default:
            return String(value);
    }
}
