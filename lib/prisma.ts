import { PrismaClient } from "@prisma/client";

const TENANT_MODELS = [
  "crm_Accounts", "crm_Leads", "crm_Opportunities", "crm_Outreach_Campaigns",
  "crm_Contacts", "crm_Contracts", "Boards", "Invoices", "Documents",
  "Tasks", "crm_Accounts_Tasks", "CustomRole", "crm_CustomWidget",
  "TeamEmailConfig", "TeamAiConfig", "CustomModelRequest", "TeamSmsConfig",
  "TeamCaptchaConfig", "crm_Lead_Pools", "Form", "FormSubmission",
  "crm_Message_Portal", "RolePermission", "crm_Workflow",
  "CustomObjectDefinition", "CustomRecord", "PageLayout", "crm_Cases",
  "SLA_Policy", "RoutingConfig", "KnowledgeCategory", "KnowledgeArticle",
  "ValidationRule", "ApprovalProcess", "ApprovalRequest", "Notification",
  "crm_Products", "crm_Quotes", "NavigationConfig"
];

const TARGET_OPS = ["findMany", "findFirst", "count", "aggregate", "updateMany", "deleteMany"];

const baseClient = new PrismaClient();

const client = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (TENANT_MODELS.includes(model) && TARGET_OPS.includes(operation as string)) {
          try {
            let cookieStore;
            try {
              const { cookies } = await import("next/headers");
              cookieStore = await cookies();
            } catch (e) { /* Headers not available */ }

            if (cookieStore) {
              const { getCurrentUserTeamId } = await import("@/lib/team-utils");
              const teamInfo = await getCurrentUserTeamId();
              if (teamInfo && !teamInfo.isGlobalAdmin && teamInfo.teamId) {
                (args as any).where = { ...(args as any).where || {}, team_id: teamInfo.teamId };
              }
            }
          } catch (e) {
            console.error(`[PRISMA_MIDDLEWARE_ERROR] Model: ${model}, Op: ${operation}`, e);
          }
        }
        return query(args);
      }
    }
  }
});

const globalForPrisma = globalThis as unknown as { prismadb_v2: any };

export const prismadb = globalForPrisma.prismadb_v2 || client;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismadb_v2 = prismadb;
}
