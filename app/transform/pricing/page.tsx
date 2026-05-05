import React from "react";
import { CheckCircle2, Zap } from "lucide-react";

export default function PricingPage() {
    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Transparent, Pay-as-you-go Pricing</h1>
                <p className="text-lg text-white/50 max-w-2xl mx-auto">
                    No hidden fees or subscriptions for PDF extraction. Your first 5 pages are completely free to ensure our vision models accurately parse your documents.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Free Tier */}
                <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-2xl p-8 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
                    
                    <h3 className="text-xl font-medium text-white mb-2">Evaluation Tier</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-bold tracking-tighter text-white">$0</span>
                        <span className="text-white/40 font-medium">/ 5 pages</span>
                    </div>
                    <p className="text-sm text-white/50 mb-8 flex-1">
                        Perfect for testing small invoices, W-2s, or single-page ledgers to verify the extraction quality.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/40 mt-0.5" />
                            <span className="text-sm text-white/70">Up to 5 pages per document</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/40 mt-0.5" />
                            <span className="text-sm text-white/70">Interactive bounding box preview</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-white/40 mt-0.5" />
                            <span className="text-sm text-white/70">Full Excel (.xlsx) export</span>
                        </div>
                    </div>
                </div>

                {/* Paid Tier */}
                <div className="border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.1)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                    
                    <div className="flex items-center gap-2 mb-2 text-orange-400">
                        <Zap className="w-4 h-4 fill-orange-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Production Volume</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-5xl font-bold tracking-tighter text-white">$0.05</span>
                        <span className="text-white/60 font-medium">/ page</span>
                    </div>
                    <p className="text-sm text-white/60 mb-8 flex-1">
                        Designed for massive data ledgers and multi-page corporate financial filings.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-orange-400 mt-0.5" />
                            <span className="text-sm text-white/80">Support for up to 200 pages</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-orange-400 mt-0.5" />
                            <span className="text-sm text-white/80">Immediate Stripe checkout</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-orange-400 mt-0.5" />
                            <span className="text-sm text-white/80">Streamed memory generation (No retention)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 p-6 border border-white/10 rounded-xl bg-white/[0.02] w-full text-center">
                <h4 className="text-sm font-semibold text-white mb-2">Need to process more than 200 pages?</h4>
                <p className="text-sm text-white/50">
                    Documents larger than 200 pages require dedicated asynchronous processing to prevent browser timeouts. Please contact support to set up a custom batch-processing pipeline.
                </p>
            </div>
        </div>
    );
}
