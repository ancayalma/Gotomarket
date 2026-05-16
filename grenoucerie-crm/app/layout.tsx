import "./globals.css";

import { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { ToastProvider } from "@/app/providers/ToastProvider";
import TopLoader from "@/app/components/TopLoader";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import SuspensionCheck from "@/components/SuspensionCheck";
import RecentActivityTracker from "@/components/RecentActivityTracker";
import { SessionProvider } from "@/app/providers/SessionProvider";
import { ThirdwebClientProvider } from "@/app/providers/ThirdwebProvider";
import { SWRSessionProvider } from "@/components/providers/swr-session-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearnProvider } from "@/components/providers/learn-provider";

const inter = Inter({ subsets: ["latin"] });

function getSafeBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://grenoucerie-platform.vercel.app";

  if (!envUrl || envUrl.trim() === "") {
    return PRODUCTION_FALLBACK;
  }

  const trimmed = envUrl.trim();

  // Skip localhost URLs in production
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return PRODUCTION_FALLBACK;
  }

  // Ensure URL has protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSafeBaseUrl();
  const baseUrl = siteUrl || "https://grenoucerie-platform.vercel.app";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Grenoucerie CRM – Gestión Comercial",
      template: `%s | Grenoucerie CRM`,
    },
    description: "CRM comercial de Grenoucerie para gestión de leads, contactos y oportunidades en España, Francia y Petfood.",
    keywords: ["CRM", "Grenoucerie", "ranicultura", "gestión comercial", "leads", "ventas", "Francia"],
    authors: [{ name: "FEROD 2019 S.L." }],
    creator: "Grenoucerie / FEROD 2019 S.L.",
    publisher: "Grenoucerie / FEROD 2019 S.L.",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: "Grenoucerie CRM – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      url: "https://grenoucerie-platform.vercel.app",
      siteName: "Grenoucerie CRM",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Grenoucerie CRM – The Autonomous AI CRM",
      description: "Automated prospecting, zero-latency voice agents, and free business tools.",
      creator: "@Grenoucerie",
    },
    manifest: "/site.webmanifest",
    alternates: {
      canonical: baseUrl,
    },
  };
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Grenoucerie CRM",
  "url": "https://crm.basalthq.com",
  "logo": "https://crm.basalthq.com/Grenoucerie CRM.png",
  "sameAs": [
    "https://twitter.com/Grenoucerie"
  ]
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1"
        />
        {/* Mobile browser chrome colors — matches app background for immersive feel */}
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="stylesheet" href="https://use.typekit.net/eur3bvn.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {/* FOUC prevention: set data-theme before paint so next-themes doesn't need its own <script> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme")||"obsidian-gold";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "w5p7mimt0l");
          `}
        </Script>
        <TopLoader />
        <AnalyticsTracker />
        <ThirdwebClientProvider>
          <SessionProvider session={session}>
            <SWRSessionProvider>
              <ThemeProvider>
                <RecentActivityTracker />
                <LearnProvider>
                  {children}
                </LearnProvider>
                {/* Team Suspension Check */}
                <SuspensionCheck />
                <ToastProvider />
              </ThemeProvider>
            </SWRSessionProvider>
          </SessionProvider>
        </ThirdwebClientProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>