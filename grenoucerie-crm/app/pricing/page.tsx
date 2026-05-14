
export const dynamic = "force-dynamic";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import LiquidMetal from "@/app/components/LiquidMetal";
import PricingClient from "./PricingClient";
import Script from "next/script";

export default function PricingPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <Script
                id="pricing-offer-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Offer",
                        "name": "BasaltCRM Scale Plan",
                        "price": "79.00",
                        "priceCurrency": "USD",
                        "description": "Unlimited CRM access, Voice AI, and Autonomous LeadGen.",
                        "url": "https://crm.basalthq.com/pricing"
                    })
                }}
            />
            <div className="fixed inset-0 z-0">
                <LiquidMetal opacity={0.9} />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />
                <PricingClient />
                <BasaltFooter />
            </div>
        </div>
    );
}
