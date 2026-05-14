"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { LayoutDashboard, TableProperties, FileText, Settings, Pen, CreditCard, Database, Layers } from "lucide-react";

const TOOLS = [
    { id: "EXCEL", icon: TableProperties, label: "Tabular Extraction" },
    { id: "MARKDOWN", icon: FileText, label: "Layout to Markdown" },
    { id: "JSON", icon: Settings, label: "Receipts to JSON" },
    { id: "TEXT", icon: Pen, label: "Handwriting & OCR" },
];

export function SidebarNav() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const activeTool = searchParams.get("tool");
    const isActiveJobs = pathname?.includes("/transform/jobs");
    const isStudioActive = !activeTool && !isActiveJobs && pathname === "/transform";

    return (
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
            <div className="px-2 py-1.5 text-[9px] uppercase tracking-widest text-white/20 font-bold">Workspace</div>
            <Link href="/transform" className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors group cursor-pointer ${
                isStudioActive ? "bg-white/[0.06] text-white" : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}>
                <LayoutDashboard className={`w-3.5 h-3.5 transition-colors ${isStudioActive ? "text-orange-400" : "text-white/30 group-hover:text-orange-400"}`} />
                Extraction Studio
            </Link>

            <div className="px-2 py-1.5 mt-3 text-[9px] uppercase tracking-widest text-white/20 font-bold">Tools</div>
            {TOOLS.map((t) => {
                const isActive = activeTool === t.id;
                const Icon = t.icon;
                return (
                    <Link key={t.id} href={`/transform?tool=${t.id}`} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors group cursor-pointer ${
                        isActive ? "bg-orange-500/10 text-orange-400" : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}>
                        <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-orange-400" : "text-white/25 group-hover:text-orange-400"}`} />
                        {t.label}
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </Link>
                );
            })}

            <div className="px-2 py-1.5 mt-3 text-[9px] uppercase tracking-widest text-white/20 font-bold">Account</div>
            <Link href="/transform/pricing" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors group cursor-pointer">
                <CreditCard className="w-3.5 h-3.5 text-white/25 group-hover:text-orange-400 transition-colors" />
                Pricing &amp; Quotas
            </Link>
            <Link href="/transform/jobs" className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium transition-colors group cursor-pointer ${
                isActiveJobs ? "bg-orange-500/10 text-orange-400" : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            }`}>
                <Layers className={`w-3.5 h-3.5 transition-colors ${isActiveJobs ? "text-orange-400" : "text-white/25 group-hover:text-orange-400"}`} />
                View Jobs
            </Link>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-white/25 cursor-not-allowed">
                <Database className="w-3.5 h-3.5 opacity-40" />
                History
            </div>
        </nav>
    );
}
