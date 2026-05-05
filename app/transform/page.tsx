import { Metadata } from "next";
import { TransformClient } from "./_components/TransformClient";
import { FileText, Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "BasaltLens | BasaltHQ",
    description: "Convert massive PDFs and documents into structured data instantly with AI.",
};

export default function TransformPage() {
    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        BasaltLens <span className="text-orange-500">Studio</span>
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Vision AI
                        </div>
                    </h1>
                    <p className="text-sm text-white/50 mt-1">
                        Upload complex documents and extract structured tables directly to Excel.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <div className="flex flex-col">
                        <span className="text-xs text-white/40 font-medium">Free Tier</span>
                        <span className="text-sm text-white font-semibold">25 Pages / mo</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-8 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <TransformClient />
            </div>
        </div>
    );
}
