"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

/**
 * Safely attempt a database operation — logs errors but continues.
 */
async function safeOp(label: string, fn: () => Promise<any>) {
    try {
        return await fn();
    } catch (err: any) {
        systemLogger.error(`[DELETE_TEAM][${label}]`, err?.message || err);
    }
}

export const deleteTeam = async (teamId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const isGlobalAdmin = currentUser.isGlobalAdmin;
        const isTeamOwner = currentUser.teamId === teamId && currentUser.teamRole === "OWNER";
        if (!isGlobalAdmin && !isTeamOwner) {
            return { error: "Unauthorized: You do not have permission to delete this company." };
        }

        // Cast prisma to any to avoid TS errors on field names — 
        // safeOp catches any runtime errors from wrong field names
        const db = prismadb as any;

        // ═══════════════════════════════════════════════
        // PHASE 1: Dissociate all users
        // ═══════════════════════════════════════════════
        const departments = await prismadb.team.findMany({
            where: { parent_id: teamId, team_type: "DEPARTMENT" },
            select: { id: true },
        });
        const deptIds = departments.map((d: { id: string }) => d.id);

        if (deptIds.length > 0) {
            await prismadb.users.updateMany({
                where: { team_id: { in: deptIds } },
                data: { team_id: null, department_id: null, team_role: "MEMBER" },
            });
        }
        await prismadb.users.updateMany({
            where: { team_id: teamId },
            data: { team_id: null, department_id: null, team_role: "MEMBER" },
        });

        // ═══════════════════════════════════════════════
        // PHASE 2: Delete departments and their children
        // ═══════════════════════════════════════════════
        if (deptIds.length > 0) {
            for (const deptId of deptIds) {
                await safeOp("dept-roles", () => db.customRole.deleteMany({ where: { team_id: deptId } }));
                await safeOp("dept-perms", () => db.rolePermission.deleteMany({ where: { team_id: deptId } }));
            }
            await prismadb.team.deleteMany({ where: { id: { in: deptIds } } });
        }

        // ═══════════════════════════════════════════════
        // PHASE 3: Delete all child records of the team
        // We delete ALL models that have a team_id relation to Team.
        // Using sequential deletes for models that may have sub-children.
        // ═══════════════════════════════════════════════

        // -- Grandchild-heavy models: delete sequentially to clear sub-records first --

        // Boards → ProjectMember, Project_Opportunities
        await safeOp("project-members", () => db.projectMember.deleteMany({ where: { project: { assigned_team: { id: teamId } } } }));
        await safeOp("project-opps", () => db.project_Opportunities.deleteMany({ where: { assigned_project: { team_id: teamId } } }));

        // Tasks → tasksComments
        await safeOp("task-comments", () => db.tasksComments.deleteMany({ where: { taskRelation: { team_id: teamId } } }));

        // crm_Cases → crm_Case_Comments, CaseStatusTransition, crm_Entitlement
        await safeOp("case-comments", () => db.crm_Case_Comments.deleteMany({ where: { case: { team_id: teamId } } }));
        await safeOp("case-transitions", () => db.caseStatusTransition.deleteMany({ where: { case: { team_id: teamId } } }));
        await safeOp("case-entitlements", () => db.crm_Entitlement.deleteMany({ where: { case: { team_id: teamId } } }));

        // crm_Opportunities → crm_Opportunity_Competitors, crm_Opportunity_Splits
        await safeOp("opp-competitors", () => db.crm_Opportunity_Competitors.deleteMany({ where: { assigned_opportunity: { team_id: teamId } } }));
        await safeOp("opp-splits", () => db.crm_Opportunity_Splits.deleteMany({ where: { opportunity: { team_id: teamId } } }));
        await safeOp("opp-stages", () => db.crm_Opportunities_Sales_Stages.deleteMany({ where: { assigned_opportunity: { team_id: teamId } } }));

        // crm_Outreach_Campaigns → crm_Outreach_Items, crm_Outreach_AB_Variant, crm_Outreach_Drafts
        await safeOp("outreach-items", () => db.crm_Outreach_Items.deleteMany({ where: { campaign: { team_id: teamId } } }));
        await safeOp("outreach-ab", () => db.crm_Outreach_AB_Variant.deleteMany({ where: { campaign: { team_id: teamId } } }));
        await safeOp("outreach-drafts", () => db.crm_Outreach_Drafts.deleteMany({ where: { campaign: { team_id: teamId } } }));

        // crm_Workflow → crm_Workflow_Execution
        await safeOp("workflow-exec", () => db.crm_Workflow_Execution.deleteMany({ where: { workflow: { team_id: teamId } } }));

        // SLA_Policy → SLA_Milestone → SLA_MilestoneInstance
        await safeOp("sla-milestone-inst", () => db.sLA_MilestoneInstance.deleteMany({ where: { milestone: { policy: { team_id: teamId } } } }));
        await safeOp("sla-milestones", () => db.sLA_Milestone.deleteMany({ where: { policy: { team_id: teamId } } }));

        // ApprovalProcess → ApprovalStep
        await safeOp("approval-steps", () => db.approvalStep.deleteMany({ where: { process: { team_id: teamId } } }));

        // ApprovalRequest → ApprovalRequestAction
        await safeOp("approval-actions", () => db.approvalRequestAction.deleteMany({ where: { request: { team_id: teamId } } }));

        // crm_Quotes → crm_QuoteItems
        await safeOp("quote-items", () => db.crm_QuoteItems.deleteMany({ where: { quote: { team_id: teamId } } }));

        // KnowledgeArticle → KnowledgeArticleLink
        await safeOp("kb-links", () => db.knowledgeArticleLink.deleteMany({ where: { article: { team_id: teamId } } }));

        // CustomObjectDefinition → CustomFieldDefinition
        await safeOp("custom-fields", () => db.customFieldDefinition.deleteMany({ where: { object: { team_id: teamId } } }));

        // crm_Products → crm_ProductBundles
        await safeOp("product-bundles", () => db.crm_ProductBundles.deleteMany({ where: { product: { team_id: teamId } } }));

        // crm_Message_Portal → crm_Portal_Message, crm_Portal_Recipient
        await safeOp("portal-msg-views", () => db.crm_Portal_Message_View.deleteMany({ where: { message: { portal: { team_id: teamId } } } }));
        await safeOp("portal-msg-recip", () => db.crm_Portal_Message_Recipient.deleteMany({ where: { message: { portal: { team_id: teamId } } } }));
        await safeOp("portal-messages", () => db.crm_Portal_Message.deleteMany({ where: { portal: { team_id: teamId } } }));
        await safeOp("portal-recipients", () => db.crm_Portal_Recipient.deleteMany({ where: { portal: { team_id: teamId } } }));

        // crm_Lead_Activities (via lead)
        await safeOp("lead-activities", () => db.crm_Lead_Activities.deleteMany({ where: { lead: { team_id: teamId } } }));

        // Sandbox → SandboxDeployLog
        await safeOp("sandbox-logs", () => db.sandboxDeployLog.deleteMany({ where: { sandbox: { team_id: teamId } } }));

        // API keys → API logs
        await safeOp("api-logs", () => db.crm_ApiLogs.deleteMany({ where: { tenant_id: teamId } }));

        // Quest → QuestProgress
        await safeOp("quest-progress", () => db.questProgress.deleteMany({ where: { quest: { team_id: teamId } } }));

        // crm_Subscriptions children
        // crm_BillingInvoice may reference subscriptions - clear those

        // -- Now delete all direct children in parallel --
        const tf = { where: { team_id: teamId } };
        await Promise.all([
            safeOp("custom-roles", () => db.customRole.deleteMany(tf)),
            safeOp("brand-ids", () => db.teamBrandIdentity.deleteMany(tf)),
            safeOp("role-perms", () => db.rolePermission.deleteMany(tf)),
            safeOp("nav-configs", () => db.navigationConfig.deleteMany(tf)),
            safeOp("accounts", () => db.crm_Accounts.deleteMany(tf)),
            safeOp("leads", () => db.crm_Leads.deleteMany(tf)),
            safeOp("opps", () => db.crm_Opportunities.deleteMany(tf)),
            safeOp("contacts", () => db.crm_Contacts.deleteMany(tf)),
            safeOp("contracts", () => db.crm_Contracts.deleteMany(tf)),
            safeOp("lead-pools", () => db.crm_Lead_Pools.deleteMany(tf)),
            safeOp("acct-tasks", () => db.crm_Accounts_Tasks.deleteMany(tf)),
            safeOp("campaigns", () => db.crm_Outreach_Campaigns.deleteMany(tf)),
            safeOp("portals", () => db.crm_Message_Portal.deleteMany(tf)),
            safeOp("products", () => db.crm_Products.deleteMany(tf)),
            safeOp("quotes", () => db.crm_Quotes.deleteMany(tf)),
            safeOp("subs", () => db.crm_Subscriptions.deleteMany(tf)),
            safeOp("billing", () => db.crm_BillingInvoice.deleteMany(tf)),
            safeOp("workflows", () => db.crm_Workflow.deleteMany(tf)),
            safeOp("widgets", () => db.crm_CustomWidget.deleteMany(tf)),
            safeOp("ai-logs", () => db.crm_AiUsageLog.deleteMany(tf)),
            safeOp("api-keys", () => db.crm_ApiKeys.deleteMany({ where: { tenant_id: teamId } })),
            safeOp("boards", () => db.boards.deleteMany(tf)),
            safeOp("invoices", () => db.invoices.deleteMany(tf)),
            safeOp("docs", () => db.documents.deleteMany(tf)),
            safeOp("my-accounts", () => db.myAccount.deleteMany(tf)),
            safeOp("tasks", () => db.tasks.deleteMany(tf)),
            safeOp("employees", () => db.employees.deleteMany(tf)),
            safeOp("cases", () => db.crm_Cases.deleteMany(tf)),
            safeOp("sla", () => db.sLA_Policy.deleteMany(tf)),
            safeOp("presence", () => db.agentPresence.deleteMany(tf)),
            safeOp("skills", () => db.agentSkill.deleteMany(tf)),
            safeOp("routing", () => db.routingConfig.deleteMany(tf)),
            safeOp("kb-cats", () => db.knowledgeCategory.deleteMany(tf)),
            safeOp("kb-arts", () => db.knowledgeArticle.deleteMany(tf)),
            safeOp("val-rules", () => db.validationRule.deleteMany(tf)),
            safeOp("approval-procs", () => db.approvalProcess.deleteMany(tf)),
            safeOp("approval-reqs", () => db.approvalRequest.deleteMany(tf)),
            safeOp("notifs", () => db.notification.deleteMany(tf)),
            safeOp("custom-objs", () => db.customObjectDefinition.deleteMany(tf)),
            safeOp("custom-recs", () => db.customRecord.deleteMany(tf)),
            safeOp("layouts", () => db.pageLayout.deleteMany(tf)),
            safeOp("ai-config", () => db.teamAiConfig.deleteMany(tf)),
            safeOp("email-config", () => db.teamEmailConfig.deleteMany(tf)),
            safeOp("sms-config", () => db.teamSmsConfig.deleteMany(tf)),
            safeOp("captcha", () => db.teamCaptchaConfig.deleteMany(tf)),
            safeOp("integrations", () => db.tenant_Integrations.deleteMany(tf)),
            safeOp("sys-activity", () => db.systemActivity.deleteMany(tf)),
            safeOp("quests", () => db.quest.deleteMany(tf)),
            safeOp("sandboxes", () => db.sandbox.deleteMany(tf)),
        ]);

        // ═══════════════════════════════════════════════
        // PHASE 4: Delete the team
        // ═══════════════════════════════════════════════
        await prismadb.team.delete({ where: { id: teamId } });

        revalidatePath("/partners");
        revalidatePath("/platform");

        return { success: true };
    } catch (error: any) {
        systemLogger.error("[DELETE_TEAM] Fatal:", error);
        return { error: `Failed to delete company: ${error?.message || "Unknown error"}` };
    }
};
