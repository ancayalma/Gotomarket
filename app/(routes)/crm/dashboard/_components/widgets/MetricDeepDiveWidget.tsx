"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { WidgetWrapper } from "./WidgetWrapper";
import { ListFilter, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    columns: { header: string; key: string; render?: (val: any) => React.ReactNode }[];
}

const DeepDiveModal = ({ isOpen, onClose, title, data, columns }: DeepDiveModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-[#09090b] border-[#27272a] text-white">
                <DialogHeader className="px-6 py-4 border-b border-white/5">
                    <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                        <ListFilter className="text-primary" size={20} />
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                {columns.map((col, i) => (
                                    <th key={i} className="pb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-10 text-center text-muted-foreground italic text-sm">No records found</td>
                                </tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        {columns.map((col, j) => (
                                            <td key={j} className="py-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                                {col.render ? col.render(row[col.key]) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface MetricDeepDiveWidgetProps {
    title: string;
    value: string | number;
    trend?: {
        value: string;
        isUp: boolean;
        label: string;
    };
    icon: any;
    iconColor?: string;
    variant?: "default" | "success" | "info" | "warning" | "violet";
    deepDiveTitle: string;
    deepDiveData: any[];
    deepDiveColumns: { header: string; key: string; render?: (val: any) => React.ReactNode }[];
    description?: string;
    centered?: boolean;
}

export const MetricDeepDiveWidget = ({
    title,
    value,
    trend,
    icon: Icon,
    iconColor = "text-primary",
    variant = "default",
    deepDiveTitle,
    deepDiveData,
    deepDiveColumns,
    description,
    centered = false
}: MetricDeepDiveWidgetProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    "relative group w-full p-4 overflow-hidden transition-all duration-300 cursor-pointer",
                    "bg-[#09090b] border border-[#27272a] hover:border-primary/50 rounded-2xl h-[110px] flex flex-col justify-center",
                )}
            >
                <Icon
                    className={cn(
                        "absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none opacity-10 group-hover:opacity-20",
                        iconColor
                    )}
                />

                <div className={cn("relative z-10 flex flex-col", centered ? "items-center text-center gap-1" : "items-start pl-1")}>
                    <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent py-1 px-2 leading-tight">
                        {title}
                    </h3>

                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                            {value}
                        </span>
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                trend.isUp ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                            )}>
                                {trend.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {trend.value}
                            </div>
                        )}
                    </div>

                    {description && (
                        <p className="text-[9px] text-muted-foreground font-medium opacity-80 mt-1 truncate">
                            {description}
                        </p>
                    )}
                </div>

                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>

            <DeepDiveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={deepDiveTitle}
                data={deepDiveData}
                columns={deepDiveColumns}
            />
        </>
    );
};
