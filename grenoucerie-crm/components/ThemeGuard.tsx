"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { checkTeamFeature } from "@/lib/subscription";
import { getUserTheme } from "@/actions/user/update-theme";

export default function ThemeGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const hasRestored = useRef(false);

    useEffect(() => {
        // Only run once per session after auth is resolved
        if (status !== "authenticated" || !session?.user?.id) return;
        if (hasRestored.current) return;

        const user = session.user as any;
        const hasCustomThemes = user?.assigned_team
            ? checkTeamFeature(user.assigned_team, "custom_themes")
            : false;

        // If they don't have access to custom themes → lock to Midnight Protocol
        if (!hasCustomThemes) {
            if (theme !== "midnight-protocol") {
                setTheme("midnight-protocol");
            }
            hasRestored.current = true;
            return;
        }

        // User HAS access — restore their DB-persisted theme
        (async () => {
            try {
                const { preferredTheme, customThemes } = await getUserTheme();

                // Sync custom themes from DB → localStorage (so ThemeProvider/CustomThemeInjector can find them)
                if (customThemes && Array.isArray(customThemes) && customThemes.length > 0) {
                    localStorage.setItem("custom-themes", JSON.stringify(customThemes));
                }

                // Apply the persisted theme if it differs from the current cookie value
                if (preferredTheme && preferredTheme !== theme) {
                    setTheme(preferredTheme);
                }
            } catch (err) {
                console.error("[ThemeGuard] Failed to restore theme from DB:", err);
            }

            hasRestored.current = true;
        })();
    }, [status, session, theme, setTheme]);

    return <>{children}</>;
}
