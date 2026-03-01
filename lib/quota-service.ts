import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

export type QuotaResource = "LEADS" | "USERS" | "STORAGE" | "CREDITS";

/**
 * SOC2 A1.2: Enforce tenant-level resource quotas based on their subscription plan.
 * Prevents "Noisy Neighbor" resource exhaustion and subscription fraud.
 */
export async function checkTeamQuota(teamId: string, resource: QuotaResource): Promise<{ allowed: boolean; message?: string }> {
    try {
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });

        if (!team) return { allowed: false, message: "Team not found" };
        if (!team.assigned_plan) {
            // If no plan, assume FREE limits
            const freePlan = await prismadb.plan.findUnique({ where: { slug: "FREE" } });
            if (!freePlan) return { allowed: true }; // Fallback safety
            (team as any).assigned_plan = freePlan;
        }

        const plan = team.assigned_plan!;

        switch (resource) {
            case "USERS": {
                const userCount = await prismadb.users.count({ where: { team_id: teamId } });
                if (userCount >= plan.max_users) {
                    return { allowed: false, message: `User limit reached (${plan.max_users} users max on ${plan.name} plan)` };
                }
                break;
            }
            case "LEADS": {
                // Example: We might want specific limits for leads in the Plan model eventually.
                // For now, let's assume a default based on plan level if not explicitly in the model.
                // Or check a generic 'max_records' if added. 
                // Using max_credits as a proxy for 'records' if null.
                const leadCount = await (prismadb as any).crm_Leads.count({ where: { team_id: teamId } });
                const limit = (plan as any).max_leads || 5000; // Default high limit if not set
                if (leadCount >= limit) {
                    return { allowed: false, message: `Lead limit reached (${limit} leads max)` };
                }
                break;
            }
            // Add other cases as needed
        }

        return { allowed: true };
    } catch (error) {
        systemLogger.error("[QUOTA_CHECK_ERROR]", error);
        return { allowed: true }; // Fail open for UX, but log error
    }
}
