"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { EnhancedDateFilter, DateFilterType } from "@/components/date-filter/EnhancedDateFilter";

export const DateRangeSelector = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize from URL or default to last 30 days
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const handleFilterChange = (range: { from: Date | undefined; to: Date | undefined }, type: DateFilterType) => {
        if (range.from && range.to) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("from", format(range.from, "yyyy-MM-dd"));
            params.set("to", format(range.to, "yyyy-MM-dd"));

            // Only push if different from current query to avoid infinite loops if storage and URL conflict
            if (params.get("from") !== from || params.get("to") !== to) {
                router.push(`?${params.toString()}`);
            }
        }
    };

    return (
        <div className="w-full md:w-auto">
            <EnhancedDateFilter
                onFilterChange={handleFilterChange}
                storageKey="partners-ai-usage-date-filter"
                initialType={from ? "custom" : "monthly"}
                initialRange={from && to ? { from: new Date(from), to: new Date(to) } : undefined}
                showAllTime={false}
            />
        </div>
    );
};

