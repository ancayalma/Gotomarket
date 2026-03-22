import { prismadb } from "@/lib/prisma";
import { searchDocuments } from "@/lib/document-rag";
import { getAiSdkModel, logAiUsage } from "@/lib/openai";
import { generateText } from "ai";
import { z } from "zod";
import { systemLogger } from "@/lib/logger";

// ─── Tool Definitions ────────────────────────────────────────────────────────

/**
 * Tools the deal agent can invoke. Each tool has:
 * - requiresHuman: if true, action is PROPOSED (needs approval), not executed
 * - execute: the function that runs when approved/auto-executed
 */

interface DealContext {
  opportunityId: string;
  campaignId?: string;
  accountId: string;
  contactId?: string;
  leadId?: string;
  teamId: string;
  userId: string;
  replySnippet?: string;
  documentIds?: string[];
}

interface AgentAction {
  actionType: string;
  requiresHuman: boolean;
  payload: Record<string, any>;
  reasoning: string;
}

// Actions that ALWAYS require human approval (financial/legal implications)
const HUMAN_REQUIRED_ACTIONS = new Set([
  "SEND_QUOTE",
  "GENERATE_CONTRACT",
  "CREATE_INVOICE",
  "APPROVE_ENTITLEMENT",
]);

// ─── Deal Agent Core ─────────────────────────────────────────────────────────

/**
 * Process an opportunity through the AI deal agent.
 * The agent analyzes the context (reply, documents, account data) and
 * proposes/executes the next best action(s).
 *
 * Guardrails:
 * - Financial actions always require human approval
 * - All actions are logged in crm_Agentic_Actions
 * - The agent cannot make commitments not in campaign documents
 */
export async function processDealWithAgent(ctx: DealContext): Promise<{
  actions: Array<{ id: string; type: string; status: string; reasoning: string }>;
}> {
  const results: Array<{ id: string; type: string; status: string; reasoning: string }> = [];

  try {
    // ─── 1. Gather context ─────────────────────────────────────────────
    const [opportunity, account, contact, recentActivities, documentChunks] =
      await Promise.all([
        prismadb.crm_Opportunities.findUnique({
          where: { id: ctx.opportunityId },
          select: { id: true, name: true, status: true, description: true, deal_value: true },
        }),
        prismadb.crm_Accounts.findUnique({
          where: { id: ctx.accountId },
          select: { id: true, name: true, industry: true, website: true, description: true },
        }),
        ctx.contactId
          ? prismadb.crm_Contacts.findFirst({
              where: { id: ctx.contactId },
              select: { id: true, first_name: true, last_name: true, email: true, position: true },
            })
          : null,
        prismadb.crm_Lead_Activities.findMany({
          where: { lead: ctx.leadId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { type: true, metadata: true, createdAt: true },
        }),
        // RAG: search campaign documents for relevant context
        ctx.documentIds && ctx.documentIds.length > 0
          ? searchDocuments(ctx.replySnippet || "pricing features terms", {
              documentIds: ctx.documentIds,
              topK: 5,
            })
          : [],
      ]);

    if (!opportunity || !account) {
      systemLogger.warn(
        `[DEAL_AGENT] Missing opportunity or account: opp=${ctx.opportunityId}, acct=${ctx.accountId}`
      );
      return { actions: [] };
    }

    // ─── 2. Build agent prompt ─────────────────────────────────────────
    const documentContext = documentChunks.length > 0
      ? [
          "\n--- CAMPAIGN DOCUMENTS (RAG) ---",
          ...documentChunks.map(
            (c: any, i: number) => `[Doc ${i + 1}: ${c.documentName}] ${c.content}`
          ),
          "--- END DOCUMENTS ---\n",
        ].join("\n")
      : "\n(No campaign documents attached)\n";

    const activitySummary = recentActivities
      .map(
        (a: any) =>
          `${a.type} at ${new Date(a.createdAt).toLocaleDateString()}: ${JSON.stringify(a.metadata || {}).substring(0, 200)}`
      )
      .join("\n");

    const systemPrompt = [
      "You are an autonomous CRM deal agent. Your job is to analyze the current deal context",
      "and decide the next best action(s) to advance the opportunity toward closing.",
      "",
      "AVAILABLE ACTIONS (choose one or more):",
      "- DRAFT_RESPONSE: Draft a reply email to the prospect",
      "- SEND_FOLLOWUP: Send a follow-up email",
      "- ATTACH_DOC: Attach a specific document to the next email",
      "- SEND_QUOTE: Create a quote with specific line items (REQUIRES HUMAN APPROVAL)",
      "- GENERATE_CONTRACT: Generate a contract from template (REQUIRES HUMAN APPROVAL)",
      "- CREATE_INVOICE: Create an invoice for accepted work (REQUIRES HUMAN APPROVAL)",
      "- APPROVE_ENTITLEMENT: Activate entitlements for the account (REQUIRES HUMAN APPROVAL)",
      "- MOVE_STAGE: Move the opportunity to a different pipeline stage",
      "- ESCALATE_HUMAN: Flag this deal for manual intervention",
      "",
      "RULES:",
      "1. NEVER propose actions not supported by the campaign documents",
      "2. NEVER propose pricing below what's in the documents",
      "3. For financial actions, provide detailed line items in the payload",
      "4. Always explain your reasoning",
      "5. If the reply is ambiguous, ESCALATE_HUMAN",
      "6. You may propose multiple actions (e.g., DRAFT_RESPONSE + ATTACH_DOC)",
      "",
      "Respond with a JSON array of actions. Each action has:",
      '{ "actionType": "...", "payload": {...}, "reasoning": "..." }',
    ].join("\n");

    const userPrompt = [
      `OPPORTUNITY: ${opportunity.name} (${opportunity.status})`,
      `ACCOUNT: ${account.name}`,
      `CONTACT: ${contact ? `${contact.first_name} ${contact.last_name} (${contact.position || "N/A"})` : "Unknown"}`,
      "",
      "LATEST REPLY:",
      ctx.replySnippet || "(No reply to analyze)",
      "",
      "RECENT ACTIVITY:",
      activitySummary || "(No recent activity)",
      "",
      documentContext,
      "",
      "Based on this context, what action(s) should be taken next?",
    ].join("\n");

    // ─── 3. Call AI ────────────────────────────────────────────────────
    const { model, modelId, teamId: resolvedTeamId } = await getAiSdkModel(ctx.userId);
    if (!model) {
      systemLogger.warn("[DEAL_AGENT] No AI model available");
      return { actions: [] };
    }

    const { text: rawResponse, usage } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
    });

    await logAiUsage({
      teamId: resolvedTeamId,
      userId: ctx.userId,
      service: "deal_agent" as any,
      model: modelId || "unknown",
      usage: {
        promptTokens: (usage as any)?.promptTokens || 0,
        completionTokens: (usage as any)?.completionTokens || 0,
      },
      description: `Deal agent for opportunity ${ctx.opportunityId}`,
    });

    // ─── 4. Parse agent output ─────────────────────────────────────────
    let proposedActions: AgentAction[] = [];
    try {
      // Extract JSON from the response (may be wrapped in markdown)
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        proposedActions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      systemLogger.warn(`[DEAL_AGENT] Failed to parse AI response: ${rawResponse.substring(0, 200)}`);
      // Fallback: escalate to human
      proposedActions = [{
        actionType: "ESCALATE_HUMAN",
        requiresHuman: false,
        payload: { reason: "AI response could not be parsed" },
        reasoning: "The AI output was not parseable. Escalating to human for review.",
      }];
    }

    // ─── 5. Create action records ──────────────────────────────────────
    for (const action of proposedActions) {
      const requiresHuman =
        HUMAN_REQUIRED_ACTIONS.has(action.actionType) || action.requiresHuman;

      const record = await prismadb.crm_Agentic_Actions.create({
        data: {
          campaign_id: ctx.campaignId,
          opportunity_id: ctx.opportunityId,
          contact_id: ctx.contactId,
          account_id: ctx.accountId,
          action_type: action.actionType,
          status: requiresHuman ? "PROPOSED" : "EXECUTED",
          payload: action.payload as any,
          reasoning: action.reasoning,
          requires_human: requiresHuman,
          executed_at: requiresHuman ? undefined : new Date(),
          team_id: ctx.teamId,
        },
      });

      // Auto-execute non-human-required actions
      if (!requiresHuman) {
        try {
          await executeAction(action.actionType, action.payload, ctx);
        } catch (execErr: any) {
          await prismadb.crm_Agentic_Actions.update({
            where: { id: record.id },
            data: {
              status: "REJECTED",
              result: { error: execErr?.message } as any,
            },
          });
        }
      }

      results.push({
        id: record.id,
        type: action.actionType,
        status: requiresHuman ? "PROPOSED" : "EXECUTED",
        reasoning: action.reasoning,
      });

      systemLogger.info(
        `[DEAL_AGENT] ${requiresHuman ? "PROPOSED" : "EXECUTED"}: ${action.actionType} — ${action.reasoning.substring(0, 100)}`
      );
    }

    return { actions: results };
  } catch (err: any) {
    systemLogger.error(`[DEAL_AGENT] Failed: ${err?.message}`);
    return { actions: results };
  }
}

// ─── Action Execution ────────────────────────────────────────────────────────

/**
 * Execute a non-human-required action immediately.
 * Human-required actions go through the approval workflow.
 */
async function executeAction(
  actionType: string,
  payload: Record<string, any>,
  ctx: DealContext
): Promise<void> {
  switch (actionType) {
    case "MOVE_STAGE":
      if (payload.stage) {
        await prismadb.crm_Opportunities.update({
          where: { id: ctx.opportunityId },
          data: { status: payload.stage },
        });
      }
      break;

    case "ESCALATE_HUMAN":
      // Log activity for human attention
      if (ctx.leadId) {
        await prismadb.crm_Lead_Activities.create({
          data: {
            lead: ctx.leadId,
            user: ctx.userId,
            type: "agent_escalation",
            metadata: {
              reason: payload.reason || "Agent escalated to human",
              opportunityId: ctx.opportunityId,
            } as any,
          },
        });
      }
      break;

    case "DRAFT_RESPONSE":
      // Store draft for human review (even though auto-executed, the draft needs sending)
      // This will be picked up by the campaign contact tracker UI
      break;

    case "SEND_FOLLOWUP":
      // Trigger the follow-up endpoint
      if (ctx.leadId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${baseUrl}/api/outreach/followup/${ctx.leadId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: ctx.campaignId,
            customPrompt: payload.customPrompt,
          }),
        }).catch(() => { });
      }
      break;

    default:
      systemLogger.info(`[DEAL_AGENT] No auto-executor for action: ${actionType}`);
  }
}

// ─── Approval Execution ──────────────────────────────────────────────────────

/**
 * Execute a previously-proposed action after human approval.
 * Called from the approval API endpoint.
 */
export async function executeApprovedAction(
  actionId: string,
  approvedBy: string,
  modifiedPayload?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const action = await prismadb.crm_Agentic_Actions.findUnique({
      where: { id: actionId },
    });

    if (!action) return { success: false, error: "Action not found" };
    if (action.status !== "PROPOSED") return { success: false, error: `Action is ${action.status}, not PROPOSED` };

    const payload = (modifiedPayload || action.payload) as Record<string, any>;

    // Execute based on action type
    switch (action.action_type) {
      case "SEND_QUOTE": {
        if (!action.account_id) break;
        await prismadb.crm_Quotes.create({
          data: {
            title: payload.title || `Quote for ${action.opportunity_id}`,
            quoteNumber: `Q-${Date.now()}`,
            totalAmount: payload.totalAmount || 0,
            notes: payload.notes,
            accountId: action.account_id,
            contactId: action.contact_id || undefined,
            opportunityId: action.opportunity_id || undefined,
            createdBy: approvedBy,
            team_id: action.team_id!,
            items: {
              create: (payload.lineItems || []).map((item: any) => ({
                name: item.name,
                description: item.description,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
              })),
            },
          },
        });
        break;
      }

      case "CREATE_INVOICE": {
        // Create a basic invoice record
        await prismadb.invoices.create({
          data: {
            invoice_number: `INV-${Date.now()}`,
            invoice_amount: String(payload.amount || 0),
            invoice_type: "outgoing",
            description: payload.description || "Auto-generated from deal agent",
            partner: payload.partnerName || "",
            partner_email: payload.partnerEmail || "",
            invoice_file_mimeType: "application/pdf",
            invoice_file_url: "",
            status: "DRAFT",
            payment_status: "UNPAID",
          },
        });
        break;
      }

      case "APPROVE_ENTITLEMENT": {
        if (!action.account_id) break;
        await prismadb.crm_Entitlement.create({
          data: {
            name: payload.name || "Standard Entitlement",
            account_id: action.account_id,
            type: payload.type || "unlimited",
            total_cases: payload.totalCases,
            remaining_cases: payload.totalCases,
            channels: payload.channels || ["email"],
            start_date: new Date(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            team_id: action.team_id,
          },
        });
        break;
      }

      default:
        return { success: false, error: `Unknown action type for approval: ${action.action_type}` };
    }

    // Mark as executed
    await prismadb.crm_Agentic_Actions.update({
      where: { id: actionId },
      data: {
        status: "EXECUTED",
        approved_by: approvedBy,
        approved_at: new Date(),
        executed_at: new Date(),
        payload: payload as any,
        result: { executedBy: approvedBy } as any,
      },
    });

    systemLogger.info(`[DEAL_AGENT] Approved & executed: ${action.action_type} (${actionId})`);
    return { success: true };
  } catch (err: any) {
    systemLogger.error(`[DEAL_AGENT] Approval execution failed: ${err?.message}`);
    return { success: false, error: err?.message };
  }
}

/**
 * Reject a proposed action.
 */
export async function rejectAction(
  actionId: string,
  rejectedBy: string,
  reason?: string
): Promise<void> {
  await prismadb.crm_Agentic_Actions.update({
    where: { id: actionId },
    data: {
      status: "REJECTED",
      rejected_at: new Date(),
      result: { rejectedBy, reason } as any,
    },
  });
}
