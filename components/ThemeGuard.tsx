"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { checkTeamFeature } from "@/lib/subscription";

export default function ThemeGuard({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const user = session?.user as any;
        if (user?.assigned_team) {
            const hasCustomThemes = checkTeamFeature(user.assigned_team, "custom_themes");

            // If they don't have access to custom themes, locked to Midnight Protocol
            if (!hasCustomThemes && theme !== "midnight-protocol") {
                setTheme("midnight-protocol");
            }
        }
    }, [session, theme, setTheme]);

    return <>{children}</>;
}
