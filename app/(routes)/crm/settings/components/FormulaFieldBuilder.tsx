"use client";

import { useState, useCallback } from "react";
import {
    Calculator, FlaskConical, Play, Hash, Type, Calendar,
    ArrowDown01, Sigma, ChevronDown, ChevronRight, Info, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import axios from "axios";

interface FormulaFieldBuilderProps {
    objectId: string;
    existingFields: Array<{ apiName: string; name: string; type: string }>;
    onSave: (fieldData: FormulaFieldData) => void;
    onCancel: () => void;
    initialData?: Partial<FormulaFieldData>;
}

export interface FormulaFieldData {
    name: string;
    apiName: string;
    type: "FORMULA" | "ROLLUP";
    formula_expression?: string;
    rollup_function?: string;
    rollup_object?: string;
    rollup_field?: string;
    rollup_filter?: Record<string, unknown>;
}

const ROLLUP_FUNCTIONS = [
    { value: "SUM", label: "Sum", description: "Total of all values" },
    { value: "COUNT", label: "Count", description: "Number of records" },
    { value: "AVG", label: "Average", description: "Mean of all values" },
    { value: "MIN", label: "Minimum", description: "Smallest value" },
    { value: "MAX", label: "Maximum", description: "Largest value" },
];

const ROLLUP_OBJECTS = [
    { value: "crm_Opportunities", label: "Opportunities" },
    { value: "crm_Contacts", label: "Contacts" },
    { value: "crm_Cases", label: "Cases" },
    { value: "crm_Contracts", label: "Contracts" },
    { value: "crm_Invoices", label: "Invoices" },
    { value: "crm_Leads", label: "Leads" },
    { value: "CustomRecord", label: "Custom Records" },
];

const FUNCTION_REFERENCE = [
    {
        category: "Math",
        functions: [
            { name: "ROUND(value, decimals)", desc: "Round to N decimal places" },
            { name: "ABS(value)", desc: "Absolute value" },
            { name: "MAX(a, b)", desc: "Larger of two values" },
            { name: "MIN(a, b)", desc: "Smaller of two values" },
            { name: "POWER(base, exp)", desc: "Exponentiation" },
            { name: "SQRT(value)", desc: "Square root" },
            { name: "MOD(a, b)", desc: "Remainder after division" },
            { name: "CEILING(value)", desc: "Round up to integer" },
            { name: "FLOOR(value)", desc: "Round down to integer" },
        ],
    },
    {
        category: "Text",
        functions: [
            { name: "CONCAT(a, b, ...)", desc: "Join text values" },
            { name: "LEN(text)", desc: "Character count" },
            { name: "UPPER(text)", desc: "Convert to uppercase" },
            { name: "LOWER(text)", desc: "Convert to lowercase" },
            { name: "TRIM(text)", desc: "Remove whitespace" },
            { name: "LEFT(text, n)", desc: "First N characters" },
            { name: "RIGHT(text, n)", desc: "Last N characters" },
            { name: "CONTAINS(text, search)", desc: "Check if text contains search" },
            { name: "SUBSTITUTE(text, old, new)", desc: "Replace text" },
        ],
    },
    {
        category: "Logic",
        functions: [
            { name: "IF(condition, then, else)", desc: "Conditional value" },
            { name: "ISBLANK(value)", desc: "Check if empty" },
            { name: "NOT_BLANK(value)", desc: "Check if not empty" },
            { name: "ISNUMBER(value)", desc: "Check if numeric" },
        ],
    },
    {
        category: "Date",
        functions: [
            { name: "NOW()", desc: "Current date and time" },
            { name: "TODAY()", desc: "Current date" },
            { name: "YEAR(date)", desc: "Year from date" },
            { name: "MONTH(date)", desc: "Month from date (1-12)" },
            { name: "DAY(date)", desc: "Day from date (1-31)" },
            { name: "DATEDIFF(d1, d2, unit)", desc: "Diff in DAYS/MONTHS/YEARS" },
        ],
    },
    {
        category: "Operators",
        functions: [
            { name: "+ - * /", desc: "Arithmetic" },
            { name: "== != > < >= <=", desc: "Comparison" },
            { name: "AND OR NOT", desc: "Logical" },
        ],
    },
];

export default function FormulaFieldBuilder({
    objectId,
    existingFields,
    onSave,
    onCancel,
    initialData,
}: FormulaFieldBuilderProps) {
    const [fieldType, setFieldType] = useState<"FORMULA" | "ROLLUP">(
        initialData?.type || "FORMULA"
    );
    const [name, setName] = useState(initialData?.name || "");
    const [apiName, setApiName] = useState(initialData?.apiName || "");
    const [formula, setFormula] = useState(initialData?.formula_expression || "");
    const [rollupFn, setRollupFn] = useState(initialData?.rollup_function || "SUM");
    const [rollupObject, setRollupObject] = useState(initialData?.rollup_object || "");
    const [rollupField, setRollupField] = useState(initialData?.rollup_field || "");

    const [previewResult, setPreviewResult] = useState<unknown>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [showReference, setShowReference] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>("Math");

    // Auto-generate apiName from name
    const handleNameChange = useCallback((val: string) => {
        setName(val);
        if (!initialData?.apiName) {
            setApiName(
                val
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .replace(/\s+/g, "_")
                    + "_c"
            );
        }
    }, [initialData?.apiName]);

    // Insert field reference at cursor
    const insertField = useCallback((fieldApi: string) => {
        setFormula((prev) => prev + fieldApi);
    }, []);

    // Preview formula
    const handlePreview = useCallback(async () => {
        if (!formula.trim()) return;
        setPreviewing(true);
        setPreviewError(null);
        try {
            const sampleData: Record<string, unknown> = {};
            existingFields.forEach((f) => {
                if (f.type === "NUMBER" || f.type === "CURRENCY") sampleData[f.apiName] = 100;
                else if (f.type === "BOOLEAN") sampleData[f.apiName] = true;
                else if (f.type === "DATE" || f.type === "DATETIME") sampleData[f.apiName] = new Date().toISOString();
                else sampleData[f.apiName] = "Sample";
            });

            const { data } = await axios.post(
                `/api/custom-objects/${objectId}/formula-preview`,
                { formula, sampleData }
            );
            setPreviewResult(data.value);
            if (data.error) setPreviewError(data.error);
        } catch {
            setPreviewError("Failed to evaluate formula");
        }
        setPreviewing(false);
    }, [formula, existingFields, objectId]);

    const handleSave = useCallback(() => {
        if (!name.trim() || !apiName.trim()) return;

        const fieldData: FormulaFieldData = {
            name,
            apiName,
            type: fieldType,
        };

        if (fieldType === "FORMULA") {
            fieldData.formula_expression = formula;
        } else {
            fieldData.rollup_function = rollupFn;
            fieldData.rollup_object = rollupObject;
            fieldData.rollup_field = rollupField;
        }

        onSave(fieldData);
    }, [name, apiName, fieldType, formula, rollupFn, rollupObject, rollupField, onSave]);

    return (
        <div className="space-y-6 p-6 rounded-xl border border-white/10 bg-card">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">
                        {initialData ? "Edit" : "New"} Computed Field
                    </h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Field Type Toggle */}
            <div className="flex gap-2">
                <button
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition text-sm font-medium ${
                        fieldType === "FORMULA"
                            ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                            : "border-white/10 text-muted-foreground hover:bg-white/5"
                    }`}
                    onClick={() => setFieldType("FORMULA")}
                >
                    <FlaskConical className="w-4 h-4" />
                    Formula Field
                </button>
                <button
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition text-sm font-medium ${
                        fieldType === "ROLLUP"
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 text-muted-foreground hover:bg-white/5"
                    }`}
                    onClick={() => setFieldType("ROLLUP")}
                >
                    <Sigma className="w-4 h-4" />
                    Rollup Summary
                </button>
            </div>

            {/* Name & API Name */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground mb-1">Display Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Weighted Revenue"
                    />
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground mb-1">API Name</Label>
                    <Input
                        value={apiName}
                        onChange={(e) => setApiName(e.target.value)}
                        placeholder="e.g. weighted_revenue_c"
                        className="font-mono text-xs"
                    />
                </div>
            </div>

            {/* Formula Editor */}
            {fieldType === "FORMULA" && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                            Formula Expression
                        </Label>
                        <button
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            onClick={() => setShowReference(!showReference)}
                        >
                            <Info className="w-3 h-3" />
                            {showReference ? "Hide" : "Show"} Function Reference
                        </button>
                    </div>

                    <Textarea
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="e.g. budget * probability / 100"
                        className="font-mono text-sm min-h-[80px]"
                    />

                    {/* Field Picker */}
                    <div>
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                            Insert Field
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {existingFields
                                .filter((f) => f.type !== "FORMULA" && f.type !== "ROLLUP")
                                .map((f) => (
                                    <button
                                        key={f.apiName}
                                        onClick={() => insertField(f.apiName)}
                                        className="px-2 py-0.5 rounded border border-white/10 text-[11px] font-mono hover:bg-white/10 hover:border-purple-500/30 transition flex items-center gap-1"
                                    >
                                        {f.type === "NUMBER" || f.type === "CURRENCY" ? (
                                            <Hash className="w-2.5 h-2.5 text-blue-400" />
                                        ) : f.type === "DATE" || f.type === "DATETIME" ? (
                                            <Calendar className="w-2.5 h-2.5 text-amber-400" />
                                        ) : (
                                            <Type className="w-2.5 h-2.5 text-green-400" />
                                        )}
                                        {f.apiName}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Function Reference */}
                    {showReference && (
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 max-h-[300px] overflow-y-auto">
                            {FUNCTION_REFERENCE.map((cat) => (
                                <div key={cat.category}>
                                    <button
                                        className="flex items-center gap-1  text-xs font-semibold text-muted-foreground hover:text-white w-full"
                                        onClick={() =>
                                            setExpandedCategory(
                                                expandedCategory === cat.category ? null : cat.category
                                            )
                                        }
                                    >
                                        {expandedCategory === cat.category ? (
                                            <ChevronDown className="w-3 h-3" />
                                        ) : (
                                            <ChevronRight className="w-3 h-3" />
                                        )}
                                        {cat.category}
                                    </button>
                                    {expandedCategory === cat.category && (
                                        <div className="mt-1 ml-4 space-y-0.5">
                                            {cat.functions.map((fn) => (
                                                <div
                                                    key={fn.name}
                                                    className="flex items-center justify-between text-[11px] py-0.5"
                                                >
                                                    <code className="font-mono text-purple-300">
                                                        {fn.name}
                                                    </code>
                                                    <span className="text-muted-foreground">
                                                        {fn.desc}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreview}
                            disabled={!formula.trim() || previewing}
                            className="gap-1.5"
                        >
                            <Play className="w-3 h-3" />
                            Test Formula
                        </Button>
                        {previewResult !== null && !previewError && (
                            <Badge
                                variant="outline"
                                className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            >
                                Result: {String(previewResult)}
                            </Badge>
                        )}
                        {previewError && (
                            <Badge
                                variant="outline"
                                className="text-red-400 border-red-500/30 bg-red-500/10"
                            >
                                Error: {previewError}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Rollup Configuration */}
            {fieldType === "ROLLUP" && (
                <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-sm text-cyan-300 flex items-center gap-2">
                        <ArrowDown01 className="w-4 h-4 shrink-0" />
                        Rollup fields aggregate values from related child records into a single value on the parent.
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1">
                                Aggregate Function
                            </Label>
                            <Select value={rollupFn} onValueChange={setRollupFn}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLLUP_FUNCTIONS.map((fn) => (
                                        <SelectItem key={fn.value} value={fn.value}>
                                            <div className="flex flex-col">
                                                <span>{fn.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1">
                                Source Object
                            </Label>
                            <Select value={rollupObject} onValueChange={setRollupObject}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select object..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLLUP_OBJECTS.map((obj) => (
                                        <SelectItem key={obj.value} value={obj.value}>
                                            {obj.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1">
                                Field to Aggregate
                            </Label>
                            <Input
                                value={rollupField}
                                onChange={(e) => setRollupField(e.target.value)}
                                placeholder="e.g. budget"
                                className="h-9 text-xs font-mono"
                                disabled={rollupFn === "COUNT"}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={
                        !name.trim() ||
                        !apiName.trim() ||
                        (fieldType === "FORMULA" && !formula.trim()) ||
                        (fieldType === "ROLLUP" && !rollupObject)
                    }
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                >
                    <Calculator className="w-4 h-4 mr-1.5" />
                    Save Field
                </Button>
            </div>
        </div>
    );
}
