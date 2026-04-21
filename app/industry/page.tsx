import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import industries from "@/data/industries.json";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";

export const metadata = {
    title: "Industries | BasaltCRM",
    description: "Discover how BasaltCRM's autonomous AI agents transform operations and hypercharge growth across 50+ industries.",
};

export default function IndustryHubPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <section className="relative w-full pt-32 pb-20 overflow-hidden">
                    <div className="container px-4 md:px-6 relative z-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                            <span>Industry Solutions</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                            Built for Your Ecosystem
                        </h1>
                        <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                            Whether you're selling real estate, managing healthcare patients, or scaling a SaaS empire, BasaltCRM adapts its AI workflow to your exact use cases.
                        </p>
                    </div>
                </section>

                <section className="py-12 bg-black/40 border-t border-white/10">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {industries.map((industry) => (
                                <Link key={industry.slug} href={`/industry/${industry.slug}`} className="block group">
                                    <div className="h-full p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full translate-x-8 -translate-y-8 group-hover:bg-primary/20 transition-colors" />
                                        
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                        
                                        <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors relative z-10">
                                            {industry.name}
                                        </h3>
                                        <p className="text-sm font-medium text-cyan-500 mb-3 relative z-10">
                                            {industry.use_case}
                                        </p>
                                        <p className="text-gray-400 text-sm line-clamp-2 relative z-10">
                                            {industry.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <BasaltFooter />
            </div>
        </div>
    );
}
