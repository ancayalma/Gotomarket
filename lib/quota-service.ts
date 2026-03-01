import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

export type QuotaResource = "LEADS" | "USERS" | "STORAGE" | "CREDITS" | "CONTACTS" | "ACCOUNTS" | "OPPORTUNITIES";

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
                const leadCount = await (prismadb as any).crm_Leads.count({ where: { team_id: teamId } });
                const limit = (plan as any).max_leads || 5000;
                if (leadCount >= limit) {
                    return { allowed: false, message: `Lead limit reached (${limit} leads max)` };
                }
                break;
            }
            case "CONTACTS": {
                const contactCount = await prismadb.crm_Contacts.count({ where: { team_id: teamId } });
                const limit = (plan as any).max_contacts || 5000;
                if (contactCount >= limit) {
                    return { allowed: false, message: `Contact limit reached (${limit} contacts max)` };
                }
                break;
            }
            case "ACCOUNTS": {
                const accountCount = await prismadb.crm_Accounts.count({ where: { team_id: teamId } });
                const limit = (plan as any).max_accounts || 1000;
                if (accountCount >= limit) {
                    return { allowed: false, message: `Account limit reached (${limit} accounts max)` };
                }
                break;
            }
            case "OPPORTUNITIES": {
                const opportunityCount = await prismadb.crm_Opportunities.count({ where: { team_id: teamId } });
                const limit = (plan as any).max_opportunities || 1000;
                if (opportunityCount >= limit) {
                    return { allowed: false, message: `Opportunity limit reached (${limit} opportunities max)` };
                }
                break;
            }
            case "STORAGE": {
                const docs = await prismadb.documents.aggregate({
                    where: { team_id: teamId },
                    _sum: { size: true }
                });
                const usedBytes = docs._sum.size || 0;
                const usedMB = usedBytes / (1024 * 1024);

                if (usedMB >= plan.max_storage) {
                    return { allowed: false, message: `Storage limit reached (${plan.max_storage} MB max)` };
                }
                break;
            }
            case "CREDITS": {
                // Sum all AI usage logs for this team
                const usageLogs = await prismadb.crm_AiUsageLog.aggregate({
                    where: { tenant_id: teamId },
                    _sum: { cost: true } // Or use a 'credits' field if we add one. For now max_credits as a numeric limit.
                });

                // If we assume 1 credit = 1 unit of work (e.g. 1 request or 1000 tokens), 
                // we might need a better metric. Let's use count of requests for now if 'cost' is not credits.
                // Or better, check if plan.max_credits is > 0
                const currentUsage = await prismadb.crm_AiUsageLog.count({
                    where: { tenant_id: teamId }
                });

                if (plan.max_credits !== -1 && currentUsage >= plan.max_credits) {
                    return { allowed: false, message: `AI Credit limit reached (${plan.max_credits} credits max). Upgrade your plan for more.` };
                }
                break;
            }
        }

        return { allowed: true };
    } catch (error) {
        systemLogger.error("[QUOTA_CHECK_ERROR]", error);
        return { allowed: true }; // Fail open for UX, but log error
    }
}
