
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
            "group relative overflow-hidden rounded-2xl border-[1px] transition-all duration-300 h-[110px] w-full cursor-pointer",
            isActive
                ? "border-primary/50 bg-[#18181b] ring-2 ring-primary/30"
                : "border-[#27272a] bg-[#09090b] hover:border-white/20 hover:bg-[#121214]",
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
                "absolute -right-6 -bottom-6 w-36 h-36 -rotate-12 transition-all duration-500 pointer-events-none opacity-10 group-hover:opacity-20 group-hover:scale-110",
                card.iconColor
            )}
        />

        <div className="absolute top-5 left-6 right-6 z-10 space-y-1">
            <span className={cn(
                "block text-[11px] font-bold uppercase tracking-wider transition-colors leading-none",
                card.iconColor
            )}>
                {card.title}
            </span>
            <span className={cn(
                "block text-sm font-bold tracking-tight leading-tight transition-colors text-white truncate",
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
