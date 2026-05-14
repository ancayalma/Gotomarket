import React from "react";
import { LucideIcon } from "lucide-react";

export type ProjectCardData = {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    iconColor: string;
};

export const ProjectCard = ({ card, loading = false }: { card: ProjectCardData, loading?: boolean }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-background hover:border-primary/50 p-3 transition-colors duration-300 h-[110px] w-full cursor-pointer">
        {/* Giant Watermark Icon - Positioned Right */}
        <card.icon
            className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-[color,background-color,border-color,transform] duration-700 pointer-events-none opacity-10 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary ${card.iconColor}`}
        />

        <div className="relative z-10 w-full h-full flex flex-col items-start pl-1 justify-center">
            <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent py-0.5 px-2 leading-tight mb-0.5">
                {card.title}
            </h3>
            <span className="block text-xl font-bold tracking-tight text-foreground mt-0.5 px-2 truncate">
                {card.description}
            </span>
        </div>

        {/* Subtle Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
);
