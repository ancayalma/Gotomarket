"use client";

import { client } from "@/lib/thirdweb";
import { ConnectEmbed, darkTheme, lightTheme, useProfiles, useActiveAccount } from "thirdweb/react";
import { useTheme } from "next-themes";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ThirdwebLoginEmbed() {
  const account = useActiveAccount();
  const { data: profiles } = useProfiles({ client });
  const router = useRouter();
  const [isBackendLoggedIn, setIsBackendLoggedIn] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Detect SSO status on mount
  useEffect(() => {
    fetch("/api/auth/thirdweb/is-logged-in")
      .then((res) => res.json())
      .then((loggedIn) => {
        if (loggedIn) setIsBackendLoggedIn(true);
      })
      .catch(console.error);
  }, []);

  // After backend login, auto-onboard with profile data then redirect
  useEffect(() => {
    if (!isBackendLoggedIn) return;

    const tryOnboard = async (currentProfiles: any[]) => {
      let email: string | undefined = undefined;
      let displayName: string | undefined = undefined;

      if (currentProfiles && currentProfiles.length > 0) {
        const emailProfile =
          currentProfiles.find((p: any) => p.details?.email && p.details?.name) ||
          currentProfiles.find((p: any) => p.details?.email);

        if (emailProfile?.details) {
          const details = emailProfile.details as any;
          email = details.email;
          displayName = details.name || details.givenName || details.email;
        }
      }

      try {
        const res = await fetch("/api/auth/thirdweb/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, displayName }),
        });
        
        const data = await res.json();

        if (data.needsRegistration) {
          // New user with PENDING status — send to register
          router.push("/register");
          return;
        }

        if (!res.ok) {
          setOnboardingError(data.error || "Onboarding failed. No email detected.");
          return;
        }
      } catch (err) {
        console.error("[ThirdwebLogin] Onboarding error:", err);
      }
      
      // Redirect to dashboard (either bridged existing session, or failed but we proceed to NextAuth guard)
      router.push("/dashboard");
    };

    // If profiles exist and have data, onboard immediately
    if (profiles && profiles.length > 0) {
      tryOnboard(profiles);
      return;
    }

    // If profiles are empty, wait up to 3 seconds for Thirdweb to fetch them
    // from the In-App Wallet social provider before falling back to external wallet behavior.
    const timer = setTimeout(() => {
      tryOnboard(profiles || []);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isBackendLoggedIn, profiles, router]);

  // Remove Thirdweb branding via DOM mutation observer
  useEffect(() => {
    const removeBranding = () => {
      const brandingLinks = document.querySelectorAll('a[href*="thirdweb.com/connect"]');
      brandingLinks.forEach((link) => {
        if (link.parentElement && link.parentElement.style.display !== "none") {
          link.parentElement.style.display = "none";
        }
      });
      const spans = document.querySelectorAll("span");
      spans.forEach((span) => {
        if (
          span.textContent === "Powered by" &&
          span.nextElementSibling?.tagName.toLowerCase() === "svg"
        ) {
          const container = span.closest('div[style*="padding-top"]');
          if (container && (container as HTMLElement).style.display !== "none") {
            (container as HTMLElement).style.display = "none";
          }
        }
      });
    };

    const observer = new MutationObserver(() => removeBranding());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(removeBranding, 50);
    setTimeout(removeBranding, 500);

    return () => observer.disconnect();
  }, []);

  const wallets = [
    inAppWallet({
      auth: {
        options: [
          "google",
          "apple",
          "discord",
          "telegram",
          "farcaster",
          "email",
          "x",
          "passkey",
          "phone",
          "twitch",
          "steam",
          "github",
          "line",
          "epic",
          "tiktok",
          "facebook",
          "coinbase",
        ],
      },
      executionMode: {
        mode: "EIP4337",
        smartAccount: {
          chain: base,
          sponsorGas: true,
        },
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://crm.basalthq.com";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-center py-4">
        <ConnectEmbed
          client={client}
          wallets={wallets}
          chain={base}
          auth={{
            isLoggedIn: async () => {
              const res = await fetch("/api/auth/thirdweb/is-logged-in");
              return await res.json();
            },
            doLogin: async (params) => {
              await fetch("/api/auth/thirdweb/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
              });
              setIsBackendLoggedIn(true);
            },
            getLoginPayload: async ({ address }) => {
              const res = await fetch(
                `/api/auth/thirdweb/payload?address=${address}&chainId=${base.id}`
              );
              return await res.json();
            },
            doLogout: async () => {
              await fetch("/api/auth/thirdweb/logout", { method: "POST" });
              window.location.href = "/sign-in";
            },
          }}
          appMetadata={{
            name: "BasaltCRM",
            url: baseUrl,
            logoUrl: `${baseUrl}/BasaltCRM.png`,
          }}
          privacyPolicyUrl="https://basalthq.com/privacy"
          termsOfServiceUrl="https://basalthq.com/terms"
          showThirdwebBranding={false}
          modalSize="compact"
          theme={isDark ? darkTheme({
            colors: {
              accentText: "hsl(24, 100%, 50%)",
              accentButtonBg: "hsl(24, 100%, 50%)",
              primaryButtonBg: "hsl(24, 100%, 50%)",
              primaryButtonText: "hsl(0, 0%, 100%)",
              modalBg: "hsl(0, 0%, 5%)",
              borderColor: "hsl(0, 0%, 15%)",
              separatorLine: "hsl(0, 0%, 15%)",
              secondaryText: "hsl(0, 0%, 60%)",
              primaryText: "hsl(0, 0%, 95%)",
              connectedButtonBg: "hsl(0, 0%, 12%)",
              connectedButtonBgHover: "hsl(0, 0%, 18%)",
              inputAutofillBg: "hsl(0, 0%, 8%)",
              selectedTextBg: "hsl(24, 100%, 50%)",
              selectedTextColor: "hsl(0, 0%, 100%)",
              secondaryButtonBg: "hsl(0, 0%, 12%)",
              secondaryButtonHoverBg: "hsl(0, 0%, 18%)",
              secondaryButtonText: "hsl(0, 0%, 85%)",
              skeletonBg: "hsl(0, 0%, 12%)",
              tertiaryBg: "hsl(0, 0%, 8%)",
              tooltipBg: "hsl(0, 0%, 15%)",
              tooltipText: "hsl(0, 0%, 90%)",
              danger: "hsl(0, 80%, 50%)",
              success: "hsl(142, 71%, 45%)",
            },
          }) : lightTheme({
            colors: {
              accentText: "hsl(24, 100%, 50%)",
              accentButtonBg: "hsl(24, 100%, 50%)",
              primaryButtonBg: "hsl(24, 100%, 50%)",
              primaryButtonText: "hsl(0, 0%, 100%)",
            }
          })}
        />
      </div>

      {onboardingError && (
        <p className="mt-3 p-3 bg-red-900/10 border border-red-700/20 rounded-lg text-red-400 text-sm text-center max-w-md">
          {onboardingError}
        </p>
      )}

      {/* Legacy credentials link */}
      <Link
        href="/sign-in?legacy=true"
        className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <KeyRound className="w-3.5 h-3.5" />
        Sign in with email &amp; password
      </Link>
    </div>
  );
}
