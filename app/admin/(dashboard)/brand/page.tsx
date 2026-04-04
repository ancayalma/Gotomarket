import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BrandClient from "./components/brand-client";

const MULTI_BRAND_PLANS = ["ENTERPRISE", "EXEMPT", "SCALE"];

export default async function BrandIdentityPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: { select: { subscription_plan: true, parent_id: true } } },
    });

    const normalizedRole = (user?.team_role || '').trim().toUpperCase();
    if (!user || (!user.is_admin && normalizedRole !== "SUPER_ADMIN" && normalizedRole !== "OWNER" && normalizedRole !== "ADMIN" && normalizedRole !== "PLATFORM_ADMIN" && normalizedRole !== "PLATFORM ADMIN")) {
        redirect("/crm/dashboard");
    }

    const plan = String(user.assigned_team?.subscription_plan || "FREE");
    const isMultiBrand = MULTI_BRAND_PLANS.includes(plan);

    let initialData = null;
    let allBrands: any[] = [];

    if (user.team_id) {
        const targetTeamId = user.assigned_team?.parent_id || user.team_id;
        if (isMultiBrand) {
            allBrands = await prismadb.teamBrandIdentity.findMany({
                where: { team_id: targetTeamId },
                orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
            });
            initialData = allBrands.find((b: any) => b.is_default) || allBrands[0] || null;
        } else {
            initialData = await prismadb.teamBrandIdentity.findFirst({
                where: { team_id: targetTeamId, is_default: true },
            });
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full h-[calc(100vh-64px)] overflow-hidden">
            <BrandClient
                initialData={initialData}
                teamId={user.assigned_team?.parent_id || user.team_id || ""}
                allBrands={allBrands}
                isMultiBrand={isMultiBrand}
            />
        </div>
    );
}
