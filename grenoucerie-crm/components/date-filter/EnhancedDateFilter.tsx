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

interface EnhancedDateFilterProps {
    onFilterChange: (range: { from: Date | undefined; to: Date | undefined }, type: DateFilterType) => void;
    storageKey?: string;
    initialType?: DateFilterType;
    initialRange?: DateRange;
    className?: string;
    showAllTime?: boolean;
}

export function EnhancedDateFilter({
    onFilterChange,
    storageKey,
    initialType = "all-time",
    initialRange,
    className,
    showAllTime = true
}: EnhancedDateFilterProps) {
    const [filterType, setFilterType] = React.useState<DateFilterType>(initialType);
    const [customRange, setCustomRange] = React.useState<DateRange | undefined>(initialRange);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Initialize from localStorage if storageKey is provided
    React.useEffect(() => {
        if (storageKey) {
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
        }
        setIsLoaded(true);
    }, [storageKey]);

    const lastEmitted = React.useRef<{ from: string | undefined; to: string | undefined; type: string } | null>(null);

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

        const fromStr = from?.toISOString();
        const toStr = to?.toISOString();

        // Prevent infinite loops by checking if values actually changed
        if (
            lastEmitted.current?.from === fromStr &&
            lastEmitted.current?.to === toStr &&
            lastEmitted.current?.type === filterType
        ) {
            return;
        }

        lastEmitted.current = { from: fromStr, to: toStr, type: filterType };
        onFilterChange({ from, to }, filterType);

        // Save to localStorage
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify({
                type: filterType,
                range: customRange ? {
                    from: customRange.from?.toISOString(),
                    to: customRange.to?.toISOString()
                } : null
            }));
        }
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
        <div className={cn("flex items-center gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{filterLabels[filterType]}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                    {showAllTime && (
                        <DropdownMenuItem
                            onClick={() => setFilterType("all-time")}
                            className="flex items-center justify-between"
                        >
                            {filterLabels["all-time"]}
                            {filterType === "all-time" && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    )}
                    {(["weekly", "monthly", "quarterly", "annual"] as DateFilterType[]).map((type) => (
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
