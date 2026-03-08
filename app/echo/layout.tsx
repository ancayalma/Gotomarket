import "../globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import UtilityBar from "@/components/UtilityBar";
import Footer from "@/app/(routes)/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://crm.basalthq.com"),
    title: 'BasaltEcho - Real-Time AI Voice Conversations',
    description: 'Professional-grade, ultra-low latency voice AI powered by Azure OpenAI. Pay per second with ETH.',
};

export default function BasaltECHOLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.className} min-h-screen flex flex-col overflow-hidden`}>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
            <div className="shrink-0">
                <UtilityBar />
                <Footer />
            </div>
        </div>
    );
}
