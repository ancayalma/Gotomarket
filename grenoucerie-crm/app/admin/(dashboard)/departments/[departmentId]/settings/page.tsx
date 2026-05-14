import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default async function DepartmentSettingsPage({
    params,
}: {
    params: Promise<{ departmentId: string }>;
}) {
    const { departmentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    // Fetch the department and verify it exists as a DEPARTMENT type
    const department = await prismadb.team.findUnique({
        where: { id: departmentId },
        select: {
            id: true,
            name: true,
            slug: true,
            team_type: true,
            parent_id: true,
            assigned_plan: { select: { slug: true } },
            subscription_plan: true,
            parent_team: {
                select: {
                    id: true,
                    name: true,
                    assigned_plan: { select: { slug: true } },
                    subscription_plan: true,
                }
            }
        }
    });

    if (!department || department.team_type !== "DEPARTMENT") {
        return redirect("/admin?tab=departments");
    }

    // Verify the user is either a super admin or a member/admin of this department
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            is_admin: true,
            team_id: true,
            team_role: true,
            department_id: true,
        }
    });

    if (!user) return redirect("/sign-in");

    const isSuperAdmin = user.is_admin === true;
    const isOrgAdmin = user.team_id === department.parent_id && ["ADMIN", "SUPER_ADMIN", "OWNER"].includes(user.team_role || "");
    const isDeptMember = user.department_id === departmentId;

    if (!isSuperAdmin && !isOrgAdmin && !isDeptMember) {
        return redirect("/admin?tab=departments");
    }

    // Use parent org's plan for domain verification eligibility
    const planSlug = department.parent_team?.assigned_plan?.slug
        || department.parent_team?.subscription_plan
        || department.assigned_plan?.slug
        || department.subscription_plan
        || undefined;

    return (
        <Container
            title={`${department.name} — Settings`}
            description={`Configure email and service settings for the ${department.name} department.`}
        >
            <div className="space-y-6 p-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/admin?tab=departments" className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Departments
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{department.name}</span>
                    <span>/</span>
                    <span className="text-foreground font-medium">Settings</span>
                </div>

                {/* Email Settings — reuses the company-level tabbed component */}
                <TeamEmailSettings teamId={department.id} planSlug={planSlug} title="Department Email Settings" />

                {/* Delivery Stats */}
                <EmailDeliveryStats teamId={department.id} />
            </div>
        </Container>
    );
}
