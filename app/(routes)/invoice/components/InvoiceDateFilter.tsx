"use client";

import * as React from "react";
import { EnhancedDateFilter } from "@/components/date-filter/EnhancedDateFilter";

interface InvoiceDateFilterProps {
    onFilterChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
    storageKey?: string;
}

export function InvoiceDateFilter({
    onFilterChange,
    storageKey = "crm-invoice-date-filter"
}: InvoiceDateFilterProps) {
    return (
        <EnhancedDateFilter
            onFilterChange={onFilterChange}
            storageKey={storageKey}
        />
    );
}
