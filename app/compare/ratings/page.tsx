export const dynamic = "force-dynamic";
import { Metadata } from "next";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import RatingsClient from "./RatingsClient";

export const metadata: Metadata = {
    title: "CRM Comparison Ratings — BasaltCRM vs 8 Competitors | Full Analysis",
    description: "Comprehensive feature-by-feature comparison of BasaltCRM against Salesforce, HubSpot, Zoho, Pipedrive, Monday.com, Freshsales, Dynamics 365, and Close CRM across 16 categories.",
    openGraph: {
        title: "BasaltCRM vs Every Major CRM — The Definitive Ratings",
        description: "16 categories, 8 competitors, 1 winner. See the full star-rating breakdown.",
        type: "website",
        url: "https://crm.basalthq.com/compare/ratings",
    },
    twitter: {
        card: "summary_large_image",
        title: "BasaltCRM vs Every Major CRM — The Definitive Ratings",
        description: "16 categories, 8 competitors, 1 winner. See the full star-rating breakdown.",
    },
};

export default function ComparisonRatingsPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />
                <main className="flex-grow pt-20">
                    <RatingsClient />
                </main>
                <BasaltFooter />
            </div>
        </div>
    );
}
