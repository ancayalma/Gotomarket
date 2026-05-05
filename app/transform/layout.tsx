import React from "react";
import Link from "next/link";
import { FileText, CreditCard, LayoutDashboard, Database, HelpCircle, FileType2 } from "lucide-react";

export default function PdfWizardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* Sleek Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-md flex flex-col z-20 shadow-2xl relative">
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                            <FileType2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold tracking-tight text-white/90">BasaltLens</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
                    <Link href="/transform" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors group">
                        <LayoutDashboard className="w-4 h-4 text-white/40 group-hover:text-orange-400 transition-colors" />
                        Extraction Studio
                    </Link>
                    <Link href="/transform/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors group">
                        <CreditCard className="w-4 h-4 text-white/40 group-hover:text-orange-400 transition-colors" />
                        Pricing & Quotas
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/40 cursor-not-allowed">
                        <Database className="w-4 h-4 opacity-50" />
                        History (Coming Soon)
                    </div>
                </nav>

                {/* Bottom Links */}
                <div className="p-4 border-t border-white/5">
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-white/50 hover:text-white transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Documentation & API
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-auto bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.05),rgba(255,255,255,0))]">
                <div className="max-w-7xl mx-auto p-8 pt-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
