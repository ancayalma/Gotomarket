import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";
import { getTeamAiTokenBalance } from "@/lib/ai-tokens";

export type QuotaResource = "LEADS" | "USERS" | "STORAGE" | "CREDITS" | "AI_TOKENS" | "CONTACTS" | "ACCOUNTS" | "OPPORTUNITIES";

/**
 * SOC2 A1.2: Enforce tenant-level resource quotas based on their subscription plan.
 * Prevents "Noisy Neighbor" resource exhaustion and subscription fraud.
 * Platform admins (is_admin) bypass all quota checks for testing purposes.
 */
export async function checkTeamQuota(teamId: string, resource: QuotaResource, userId?: string): Promise<{ allowed: boolean; message?: string }> {
    try {
        // Admin bypass: platform superadmins always pass quota checks
        if (userId) {
            const requestingUser = await prismadb.users.findUnique({
                where: { id: userId },
                select: { is_admin: true }
            });
            if (requestingUser?.is_admin) {
                return { allowed: true };
            }
        }

        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });

        if (!team) return { allowed: false, message: "Team not found" };
        if (!team.assigned_plan) {
            const freePlan = await prismadb.plan.findUnique({ where: { slug: "FREE" } });
            if (!freePlan) return { allowed: true };
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
                const currentUsage = await prismadb.crm_AiUsageLog.count({
                    where: { tenant_id: teamId }
                });

                if (plan.max_credits !== -1 && currentUsage >= plan.max_credits) {
                    return { allowed: false, message: `AI Credit limit reached (${plan.max_credits} credits max). Upgrade your plan for more.` };
                }
                break;
            }
            case "AI_TOKENS": {
                const balance = await getTeamAiTokenBalance(teamId);
                // -1 = unlimited
                if (balance !== -1 && balance <= 0) {
                    return { allowed: false, message: "AI token balance exhausted. Top up or upgrade your plan." };
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
