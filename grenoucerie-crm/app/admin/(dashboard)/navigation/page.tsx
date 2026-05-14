
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import { getNavigationConfig } from "@/actions/navigation/get-navigation-config";
import { getDictionary } from "@/lib/dictionaries";
import { prismadb } from "@/lib/prisma";
import { DEFAULT_NAV_STRUCTURE } from "@/lib/navigation-defaults";
import { NavigationEditor } from "./_components/NavigationEditor";
import { redirect } from "next/navigation";
import { getSubscriptionPlan } from "@/lib/subscription";

export default async function NavigationPage() {
    // Navigation Manager Refresh
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect(`/admin/login`);
    }

    // Fetch all necessary data for the editor
    const [modules, dbNavConfig, dict, user] = await Promise.all([
        getModules(),
        getNavigationConfig(),
        getDictionary(session.user.userLanguage as any),
        prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true, team_role: true, is_admin: true, assigned_team: { select: { slug: true, subscription_plan: true, module_overrides: true, assigned_plan: { select: { features: true } } } } }
        })
    ]);

    if (!modules || !dict || !user) {
        return <div>Error loading editor data.</div>;
    }

    const teamRole = user.team_role || "MEMBER";
    const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes(teamRole.toUpperCase()) || user.assigned_team?.slug === "basalthq";
    const isPartnerAdmin = user.is_admin || teamRole === "PLATFORM_ADMIN";

    const team = user.assigned_team;
    let features: string[] = [];

    if (team?.assigned_plan) {
        features = team.assigned_plan.features;
    } else {
        features = getSubscriptionPlan(String(team?.subscription_plan || "FREE")).features;
    }

    if (team?.module_overrides) {
        features = Array.from(new Set([...features, ...team.module_overrides]));
    }

    const config = dbNavConfig as any;

    return (
        <div className="h-full">
            <NavigationEditor
                initialStructure={config?.structure || DEFAULT_NAV_STRUCTURE}
                initialTitleFont={config?.titleFont}
                initialTitleFontSize={config?.titleFontSize}
                initialTitleFontWeight={config?.titleFontWeight}
                initialTitleFontStyle={config?.titleFontStyle}
                initialItemFont={config?.itemFont}
                initialItemFontSize={config?.itemFontSize}
                initialItemFontWeight={config?.itemFontWeight}
                initialItemFontStyle={config?.itemFontStyle}
                modules={modules}
                dict={dict}
                features={features}
                isPartnerAdmin={isPartnerAdmin}
                isAdmin={isAdmin}
                teamRole={teamRole}
            />
        </div>
    );
}
