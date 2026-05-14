import "@/app/globals.css";
import UtilityBar from "@/components/UtilityBar";
import Footer from "@/app/(routes)/components/Footer";

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://crm.basalthq.com"),
    title: "Message Portal",
    description: "Secure message viewing portal",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="antialiased relative min-h-[100dvh] flex flex-col overflow-hidden">
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
