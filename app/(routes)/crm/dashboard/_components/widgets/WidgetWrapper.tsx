"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LucideIcon, Search, RefreshCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface WidgetWrapperProps {
    title: string;
    icon: LucideIcon;
    iconColor?: string;
    onSearch?: (term: string) => void;
    searchValue?: string;
    footerHref?: string;
    footerLabel?: string;
    children: React.ReactNode;
    className?: string;
    count?: number;
    rightAction?: React.ReactNode;
}

export const WidgetWrapper = ({
    title,
    icon: Icon,
    iconColor = "text-primary",
    onSearch,
    searchValue,
    footerHref,
    footerLabel = "View Report",
    children,
    className,
    count,
    rightAction,
}: WidgetWrapperProps) => {
    return (
        <Card className={cn("flex flex-col h-[400px] bg-card/40 border-border backdrop-blur-xl group/widget", className)}>
            <CardHeader className="p-3 pb-1 space-y-0">
                <div className="flex items-center justify-between h-10 mb-1">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {count !== undefined ? (
                            <div className={cn("min-w-[28px] h-7 px-1.5 rounded-lg bg-muted/50 shadow-sm group-hover/widget:scale-110 transition-transform duration-300 shrink-0 flex items-center justify-center", iconColor)}>
                                <span className="text-sm font-bold">{count}</span>
                            </div>
                        ) : (
                            <div className={cn("p-1.5 rounded-lg bg-muted/50 shadow-sm group-hover/widget:scale-110 transition-transform duration-300 shrink-0", iconColor)}>
                                <Icon size={16} />
                            </div>
                        )}
                        <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-none truncate">
                            {title}
                        </CardTitle>
                    </div>
                    <div className="shrink-0 ml-2">
                        {rightAction}
                    </div>
                </div>

                {onSearch && (
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" size={12} />
                        <Input
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="pl-8 h-8 bg-background/50 border-border focus:bg-background focus:border-primary/50 transition-colors text-[11px] rounded-lg"
                            onChange={(e) => onSearch(e.target.value)}
                            value={searchValue}
                        />
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 pt-2 px-4">
                <div className="h-full overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </CardContent>

            <CardFooter className="p-2 border-t border-border flex items-center justify-between bg-muted/[0.01] gap-2">
                {footerHref && (
                    <Link
                        href={footerHref}
                        className="text-[10px] font-black uppercase tracking-tighter text-primary/80 hover:text-primary transition-all flex items-center gap-1.5 min-w-0"
                    >
                        <span className="truncate">{footerLabel}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-40 group-hover/widget:opacity-100 transition-opacity" />
                    </Link>
                )}

                <div className="flex items-center gap-2 ml-auto shrink-0">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 border border-border text-[9px] text-muted-foreground/50 font-bold group/refresh cursor-pointer hover:bg-muted transition-colors">
                        <RefreshCcw size={10} className="group-hover/refresh:rotate-180 transition-transform duration-700 text-primary/30" />
                        <span suppressHydrationWarning className="uppercase tracking-widest hidden sm:inline opacity-60">Synced</span>
                        <span suppressHydrationWarning className="tabular-nums">
                            {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date())}
                        </span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};
