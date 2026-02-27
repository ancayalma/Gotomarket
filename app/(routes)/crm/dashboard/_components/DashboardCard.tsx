"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, Shield } from "lucide-react";
import React from "react";

export type CardVariant = "default" | "success" | "info" | "violet" | "warning";

interface DashboardCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    count?: number | string;
    description?: string;
    variant?: CardVariant;
    isLocked?: boolean;
    primaryColor?: string;
    iconClassName?: string;
    hideIcon?: boolean;
    centered?: boolean;
    labelClassName?: string;
    descriptionClassName?: string;
}

const variantIconStyles: Record<CardVariant, string> = {
    default: "text-muted-foreground group-hover:text-foreground",
    success: "text-emerald-500",
    info: "text-cyan-500",
    violet: "text-violet-500",
    warning: "text-amber-500",
};

const DashboardCard = React.forwardRef<HTMLButtonElement, DashboardCardProps>(
    ({ className, icon: Icon, label, count, description, variant = "default", isLocked = false, iconClassName, primaryColor, hideIcon = false, centered = false, labelClassName, descriptionClassName, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLocked && !props.onClick}
                className={cn(
                    "relative group w-full p-3 overflow-hidden transition-all duration-300",
                    "bg-background border border-border hover:border-primary/50 rounded-2xl",
                    "h-[110px]",
                    isLocked && "opacity-80 grayscale-[0.5] hover:grayscale-0",
                    className
                )}
                {...props}
            >
                {/* Giant Watermark Icon */}
                <Icon
                    className={cn(
                        "absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-all duration-700 pointer-events-none opacity-10 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary",
                        variant === "default" && "text-muted-foreground",
                        variant === "success" && "text-emerald-500",
                        variant === "info" && "text-cyan-500",
                        variant === "violet" && "text-violet-500",
                        variant === "warning" && "text-amber-500"
                    )}
                />

                {isLocked && (
                    <Shield className="absolute top-2 right-2 w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                )}

                <div className={cn("relative z-10 w-full h-full flex flex-col justify-center", (hideIcon || centered) ? "items-center text-center gap-1" : "items-start pl-1")}>
                    {(hideIcon || centered) ? (
                        // Centered Layout (Stats/Deep Dive)
                        <>
                            <h3 className={cn("font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent mb-0.5 py-0.5 px-2 leading-tight", labelClassName)}>
                                {label}
                            </h3>
                            {count !== undefined && (
                                <span className="text-3xl font-bold tracking-tight text-foreground">
                                    {count}
                                </span>
                            )}
                            {description && (
                                <p className={cn("text-[9px] text-muted-foreground font-medium opacity-80", descriptionClassName)}>
                                    {description}
                                </p>
                            )}
                        </>
                    ) : (
                        // Clean List Layout (Entities/Icons) - Left Aligned, No Central Icon
                        <>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className={cn("font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent py-0.5 px-2 leading-tight", labelClassName)}>
                                    {label}
                                </h3>
                            </div>

                            <div className="flex items-baseline gap-1">
                                {count !== undefined && (
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {count}
                                    </span>
                                )}
                            </div>

                            {description && (
                                <p className={cn("text-[9px] text-muted-foreground font-medium truncate max-w-full opacity-80 mt-0.5", descriptionClassName)}>
                                    {description}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
        );
    }
);

DashboardCard.displayName = "DashboardCard";

export default DashboardCard;
