import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import getAllCommits from "@/actions/github/get-repo-commits";
import { prismadb } from "@/lib/prisma";
import AdminSidebar from "./components/AdminSidebar";
import { getSubscriptionPlan } from "@/lib/subscription";

import { ReactNode } from "react";

import Header from "@/app/(routes)/components/Header";
import SideBar from "@/app/(routes)/components/SideBar";
import Footer from "@/app/(routes)/components/Footer";
import ThemeGuard from "@/components/ThemeGuard";
import UtilityBar from "@/components/UtilityBar";


const AnyFooter = Footer as any;
const AnySideBar = SideBar as any;

export default async function AdminDashboardLayout({
    children,
}: {
    children: any;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect(`/admin/login`);
    }

    // Check for admin status (Global or Team Admin)
    const teamInfo = await getCurrentUserTeamId();

    if (!teamInfo?.isAdmin) {
        return redirect(`/admin/login?error=unauthorized`);
    }

    // Fetch build info for sidebar
    const build = await getAllCommits();

    // Check if user is partner admin (BasaltHQ) or global admin
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email as string },
        include: { assigned_team: { include: { assigned_plan: true } } }
    });

    // Enforce password change — redirect back to main app where modal will force the change
    if (user?.mustChangePassword) {
        return redirect(`/`);
    }

    const showModules = user?.is_admin || user?.assigned_team?.slug === "basalthq";

    const team = user?.assigned_team;
    const planSlug = (team as any)?.assigned_plan?.slug || team?.subscription_plan || "FREE";
    const configFeatures = getSubscriptionPlan(String(planSlug)).features;
    let features: string[] = [];
    
    if ((team as any)?.assigned_plan) {
        features = Array.from(new Set([...(team as any).assigned_plan.features, ...configFeatures]));
    } else {
        features = configFeatures;
    }
    
    if (team?.module_overrides) {
        features = Array.from(new Set([...features, ...team.module_overrides]));
    }
    features.push(String(planSlug).toLowerCase());

    return (
        <ThemeGuard>
            <div className="fixed inset-0 flex h-[100dvh] overflow-hidden">
                {/* Restored Global Sidebar for Admin */}
                <AnySideBar />
                <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
                    <Header
                        id={session.user.id as string}
                        name={session.user.name as string}
                        email={session.user.email as string}
                        avatar={session.user.image as string}
                        lang={session.user.userLanguage as string}
                    />
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        <AdminSidebar showModules={!!showModules} features={features} />
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
                            {children}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <UtilityBar />
                        <AnyFooter />
                    </div>
                </div>
            </div>
        </ThemeGuard>
    );
}
