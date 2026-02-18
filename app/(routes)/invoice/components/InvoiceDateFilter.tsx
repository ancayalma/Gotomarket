"use client";

import * as React from "react";
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, isWithinInterval } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export type DateFilterType = "all-time" | "weekly" | "monthly" | "quarterly" | "annual" | "custom";

interface InvoiceDateFilterProps {
    onFilterChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
    storageKey?: string;
}

export function InvoiceDateFilter({
    onFilterChange,
    storageKey = "crm-invoice-date-filter"
}: InvoiceDateFilterProps) {
    const [filterType, setFilterType] = React.useState<DateFilterType>("all-time");
    const [customRange, setCustomRange] = React.useState<DateRange | undefined>(undefined);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Initialize from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const { type, range } = JSON.parse(saved);
                setFilterType(type);
                if (range) {
                    setCustomRange({
                        from: range.from ? new Date(range.from) : undefined,
                        to: range.to ? new Date(range.to) : undefined
                    });
                }
            } catch (e) {
                console.error("Failed to load date filter", e);
            }
        }
        setIsLoaded(true);
    }, [storageKey]);

    // Apply filter when type or range changes
    React.useEffect(() => {
        if (!isLoaded) return;

        let from: Date | undefined = undefined;
        let to: Date | undefined = new Date(); // To now

        const now = new Date();

        switch (filterType) {
            case "weekly":
                from = startOfWeek(now, { weekStartsOn: 1 });
                break;
            case "monthly":
                from = startOfMonth(now);
                break;
            case "quarterly":
                from = startOfQuarter(now);
                break;
            case "annual":
                from = startOfYear(now);
                break;
            case "custom":
                from = customRange?.from;
                to = customRange?.to;
                break;
            case "all-time":
            default:
                from = undefined;
                to = undefined;
                break;
        }

        onFilterChange({ from, to });

        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify({
            type: filterType,
            range: customRange ? {
                from: customRange.from?.toISOString(),
                to: customRange.to?.toISOString()
            } : null
        }));
    }, [filterType, customRange, isLoaded, onFilterChange, storageKey]);

    const filterLabels: Record<DateFilterType, string> = {
        "all-time": "All Time",
        "weekly": "This Week",
        "monthly": "This Month",
        "quarterly": "This Quarter",
        "annual": "This Year",
        "custom": "Custom Range"
    };

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{filterLabels[filterType]}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                    {(["all-time", "weekly", "monthly", "quarterly", "annual"] as DateFilterType[]).map((type) => (
                        <DropdownMenuItem
                            key={type}
                            onClick={() => setFilterType(type)}
                            className="flex items-center justify-between"
                        >
                            {filterLabels[type]}
                            {filterType === type && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setFilterType("custom")}
                        className="flex items-center justify-between"
                    >
                        Custom Range
                        {filterType === "custom" && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {filterType === "custom" && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                    <DateRangePicker
                        date={customRange}
                        setDate={setCustomRange}
                        className="h-8 w-[240px]"
                    />
                </div>
            )}
        </div>
    );
}
