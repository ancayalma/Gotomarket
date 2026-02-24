
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import { getNavigationConfig } from "@/actions/navigation/get-navigation-config";
import { getDictionary } from "@/lib/dictionaries";
import { prismadb } from "@/lib/prisma";
import { DEFAULT_NAV_STRUCTURE } from "@/lib/navigation-defaults";
import { NavigationEditor } from "./_components/NavigationEditor";
import { redirect } from "next/navigation";

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
            select: { team_id: true, team_role: true, is_admin: true, assigned_team: { select: { slug: true } } }
        })
    ]);

    if (!modules || !dict || !user) {
        return <div>Error loading editor data.</div>;
    }

    const teamRole = user.team_role || "MEMBER";
    const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes(teamRole.toUpperCase()) || user.assigned_team?.slug === "basalthq";
    const isPartnerAdmin = user.is_admin || teamRole === "PLATFORM_ADMIN";

    const features: string[] = []; // In a real app, resolve features from team's plan

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
