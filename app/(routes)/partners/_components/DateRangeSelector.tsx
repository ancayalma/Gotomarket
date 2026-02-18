"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateRangePicker, DateRangePickerValue } from "@tremor/react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

export const DateRangeSelector = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize from URL or default to last 30 days
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const [value, setValue] = useState<DateRangePickerValue>({
        from: from ? new Date(from) : subDays(new Date(), 30),
        to: to ? new Date(to) : new Date(),
    });

    const handleValueChange = (newValue: DateRangePickerValue) => {
        setValue(newValue);

        if (newValue.from && newValue.to) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("from", format(newValue.from, "yyyy-MM-dd"));
            params.set("to", format(newValue.to, "yyyy-MM-dd"));
            router.push(`?${params.toString()}`);
        }
    };

    return (
        <div className="w-full md:w-auto">
            <DateRangePicker
                value={value}
                onValueChange={handleValueChange}
                className="bg-card border-border/50 text-foreground"
                enableSelect={true}
                selectPlaceholder="Select range"
                color="violet"
            />
        </div>
    );
};
