"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabNavigationCardProps {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;      // Tailwind color class for text/icon (e.g., "text-blue-500")
    gradient: string;   // Tailwind gradient classes (e.g., "from-blue-500/20")
    borderColor: string; // Tailwind border color class
    shadowColor: string; // Tailwind shadow color class
    isActive: boolean;
    onClick: () => void;
}

export default function TabNavigationCard({
    label,
    icon: Icon,
    color,
    gradient,
    borderColor,
    shadowColor,
    isActive,
    onClick,
}: TabNavigationCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl border transition-colors duration-300 h-[100px] w-full flex flex-col justify-center items-center text-center",
                isActive
                    ? cn("bg-background border-primary/50 ring-1 ring-primary/20 scale-[1.02] shadow-lg shadow-primary/10")
                    : cn("bg-background/60 border-border hover:border-primary/50 opacity-90 hover:opacity-100")
            )}
        >
            {/* Giant Watermark Icon - Positioned Right */}
            <Icon
                className={cn(
                    "absolute -right-2 -bottom-2 w-20 h-20 -rotate-12 transition-[color,background-color,border-color,transform] duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary",
                    isActive ? "opacity-30 scale-110" : "opacity-10 group-hover:opacity-50",
                    color
                )}
            />

            <div className="relative z-10 w-full px-2 text-center group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/50 group-hover:bg-clip-text">
                <span
                    className={cn(
                        "block text-[13px] font-black tracking-wider transition-colors uppercase leading-tight px-1",
                        isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-transparent"
                    )}
                >
                    {label}
                </span>
            </div>

            {/* Subtle Glow on Hover */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-500 pointer-events-none",
                isActive ? "opacity-20" : "opacity-0 group-hover:opacity-100"
            )} />
        </button>
    );
};
