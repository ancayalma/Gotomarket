import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import locations from "@/data/locations.json";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";

export const metadata = {
    title: "Global Markets & Locations | BasaltCRM",
    description: "Discover how BasaltCRM empowers businesses across the globe with decentralized, compliant AI agents and localized infrastructure.",
};

export default function LocationHubPage() {
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
                            <span>Global Markets</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                            Deploy Operations Anywhere
                        </h1>
                        <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                            From GDPR compliance in London to NYDFS in New York, BasaltCRM delivers localized compliance, currency tracking, and hyper-local contextual AI globally.
                        </p>
                    </div>
                </section>

                <section className="py-12 bg-black/40 border-t border-white/10">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.map((location) => (
                                <Link key={location.slug} href={`/location/${location.slug}`} className="block group">
                                    <div className="h-full p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full translate-x-8 -translate-y-8 group-hover:bg-primary/20 transition-colors" />
                                        
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                        
                                        <h3 className="text-xl font-bold mb-1 text-white group-hover:text-primary transition-colors relative z-10">
                                            {location.name}
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest relative z-10">
                                            {location.country}
                                        </p>
                                        <p className="text-gray-400 text-sm line-clamp-2 relative z-10">
                                            {location.description}
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
