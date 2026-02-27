
import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavigationCardData = {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    iconColor: string;
};

interface NavigationCardProps {
    card: NavigationCardData;
    loading?: boolean;
    className?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export const NavigationCard = ({ card, loading = false, className, isActive, onClick }: NavigationCardProps) => (
    <div
        onClick={onClick}
        className={cn(
            "group relative w-full p-3 overflow-hidden transition-all duration-300 bg-background border border-[1px] rounded-2xl h-[110px] cursor-pointer",
            isActive
                ? "border-primary/50 ring-2 ring-primary/30"
                : "border-border hover:border-primary/50",
            className
        )}
    >
        {/* Background Gradient Tint */}
        <div className={cn(
            "absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity bg-gradient-to-br",
            card.color
        )} />

        {/* Giant Watermark Icon - Positioned Right */}
        <card.icon
            className={cn(
                "absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-all duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary",
                isActive ? "opacity-30 scale-110" : "opacity-10 group-hover:opacity-50",
                card.iconColor
            )}
        />

        <div className="relative z-10 w-full h-full flex flex-col items-start pl-1 justify-center">
            <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent py-0.5 px-2 leading-tight mb-0.5">
                {card.title}
            </h3>
            <span className={cn(
                "block text-xl font-bold tracking-tight text-foreground mt-0.5 px-2 truncate",
            )}>
                {card.description}
            </span>
        </div>

        {/* Subtle Glow on Hover */}
        <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-500 pointer-events-none",
            isActive ? "opacity-20" : "opacity-0 group-hover:opacity-100"
        )} />
    </div>
);
