"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
}

interface CurrencySelectorProps {
    value: string;
    onChange: (code: string) => void;
    className?: string;
}

export default function CurrencySelector({ value, onChange, className }: CurrencySelectorProps) {
    const [currencies, setCurrencies] = useState<Currency[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get("/api/crm/currencies");
                setCurrencies(data);
            } catch {
                // Fallback if currencies haven't been seeded yet
                setCurrencies([
                    { id: "usd", code: "USD", name: "US Dollar", symbol: "$" },
                    { id: "eur", code: "EUR", name: "Euro", symbol: "€" },
                    { id: "gbp", code: "GBP", name: "British Pound", symbol: "£" },
                ]);
            }
        })();
    }, []);

    return (
        <Select value={value || "USD"} onValueChange={onChange}>
            <SelectTrigger className={className || "w-32 h-8 text-sm"}>
                <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
                {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                            <span className="text-muted-foreground w-4 text-center">{c.symbol}</span>
                            <span>{c.code}</span>
                            <span className="text-xs text-muted-foreground">— {c.name}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
