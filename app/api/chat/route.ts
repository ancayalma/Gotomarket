import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
import { prismadb } from "@/lib/prisma";
const db: any = prismadbChat;
import { getAiSdkModel, isReasoningModel, logAiUsage } from "@/lib/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { systemLogger } from "@/lib/logger";
import { checkTeamQuota } from "@/lib/quota-service";

// ═══════════════════════════════════════════════════════════════════
// CRM Query Tools — Let Varuni directly query team-scoped CRM data
// ═══════════════════════════════════════════════════════════════════

function buildCrmTools(teamId: string, userId: string) {
    return {
        query_leads: (tool as any)({
            description: "Search and filter CRM leads. Returns up to 25 leads matching the criteria. Use this to answer questions about lead counts, statuses, pipeline stages, and outreach progress.",
            parameters: z.object({
                search: z.string().optional().describe("Free text search across name, email, company"),
                status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]).optional().describe("Lead status filter"),
                pipeline_stage: z.enum(["Identify", "Engage_AI", "Engage_Human", "Offering", "Finalizing", "Closed"]).optional().describe("Pipeline stage filter"),
                outreach_status: z.enum(["IDLE", "PENDING", "SENT", "OPENED", "MEETING_LINK_CLICKED", "MEETING_BOOKED", "CLOSED"]).optional().describe("Outreach status filter"),
                assigned_to: z.string().optional().describe("User ID of the lead owner"),
                limit: z.number().min(1).max(50).optional().describe("Max results (default 25)"),
            }),
            execute: async ({ search, status, pipeline_stage, outreach_status, assigned_to, limit }: any) => {
                const where: any = { team_id: teamId };
                if (status) where.status = status;
                if (pipeline_stage) where.pipeline_stage = pipeline_stage;
                if (outreach_status) where.outreach_status = outreach_status;
                if (assigned_to) where.assigned_to = assigned_to;
                if (search) {
                    where.OR = [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { company: { contains: search, mode: "insensitive" } },
                    ];
                }
                const leads = await prismadb.crm_Leads.findMany({
                    where,
                    take: limit || 25,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, firstName: true, lastName: true, email: true, company: true,
                        status: true, pipeline_stage: true, outreach_status: true, jobTitle: true,
                        lead_source: true, createdAt: true, assigned_to: true,
                    }
                });
                const total = await prismadb.crm_Leads.count({ where: { team_id: teamId, ...(status ? { status } : {}), ...(pipeline_stage ? { pipeline_stage } : {}) } });
                return { results: leads, count: leads.length, totalMatching: total };
            },
        }),

        query_accounts: (tool as any)({
            description: "Search CRM accounts (companies/organizations). Returns up to 25 accounts matching the criteria.",
            parameters: z.object({
                search: z.string().optional().describe("Search by company name, email, or industry"),
                status: z.enum(["Active", "Inactive"]).optional(),
                type: z.string().optional().describe("Account type: Customer, Partner, Vendor, Prospect"),
                limit: z.number().min(1).max(50).optional(),
            }),
            execute: async ({ search, status, type, limit }: any) => {
                const where: any = { team_id: teamId };
                if (status) where.status = status;
                if (type) where.type = type;
                if (search) {
                    where.OR = [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ];
                }
                const accounts = await prismadb.crm_Accounts.findMany({
                    where,
                    take: limit || 25,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, name: true, email: true, website: true,
                        industry: true, annual_revenue: true, employees: true,
                        type: true, status: true, city: true, country: true, createdAt: true,
                    }
                });
                const total = await prismadb.crm_Accounts.count({ where: { team_id: teamId } });
                return { results: accounts, count: accounts.length, totalAccounts: total };
            },
        }),

        query_contacts: (tool as any)({
            description: "Search CRM contacts (individuals linked to accounts). Returns up to 25 contacts.",
            parameters: z.object({
                search: z.string().optional().describe("Search by name, email, or position"),
                status: z.enum(["active", "inactive"]).optional(),
                limit: z.number().min(1).max(50).optional(),
            }),
            execute: async ({ search, status, limit }: any) => {
                const where: any = { team_id: teamId };
                if (status) {
                    if (status === "active") where.is_active = true;
                    else where.is_active = false;
                }
                if (search) {
                    where.OR = [
                        { first_name: { contains: search, mode: "insensitive" } },
                        { last_name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { position: { contains: search, mode: "insensitive" } },
                    ];
                }
                const contacts = await prismadb.crm_Contacts.findMany({
                    where,
                    take: limit || 25,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, first_name: true, last_name: true, email: true,
                        position: true, mobile_phone: true, office_phone: true,
                        is_active: true, createdAt: true,
                        assigned_account: { select: { name: true } },
                    }
                });
                const total = await prismadb.crm_Contacts.count({ where: { team_id: teamId } });
                return { results: contacts, count: contacts.length, totalContacts: total };
            },
        }),

        query_opportunities: (tool as any)({
            description: "Search CRM opportunities (deals). Returns up to 25 deals with stage, budget, and status info.",
            parameters: z.object({
                search: z.string().optional().describe("Search by deal name"),
                status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "CLOSED"]).optional(),
                min_budget: z.number().optional().describe("Minimum budget filter"),
                max_budget: z.number().optional().describe("Maximum budget filter"),
                limit: z.number().min(1).max(50).optional(),
            }),
            execute: async ({ search, status, min_budget, max_budget, limit }: any) => {
                const where: any = { team_id: teamId };
                if (status) where.status = status;
                if (search) where.name = { contains: search, mode: "insensitive" };
                if (min_budget !== undefined || max_budget !== undefined) {
                    where.budget = {};
                    if (min_budget !== undefined) where.budget.gte = min_budget;
                    if (max_budget !== undefined) where.budget.lte = max_budget;
                }
                const opps = await prismadb.crm_Opportunities.findMany({
                    where,
                    take: limit || 25,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true, name: true, description: true, budget: true,
                        expected_revenue: true, currency: true, close_date: true,
                        status: true, next_step: true, createdAt: true,
                        assigned_sales_stage: { select: { name: true, probability: true } },
                        assigned_to_user: { select: { name: true } },
                    }
                });
                const total = await prismadb.crm_Opportunities.count({ where: { team_id: teamId } });
                return { results: opps, count: opps.length, totalDeals: total };
            },
        }),

        get_pipeline_stats: (tool as any)({
            description: "Get a summary of the sales pipeline: lead counts per stage, deal counts per status, total revenue, team size, and other KPIs. Use this for dashboard-style questions.",
            parameters: z.object({}),
            execute: async () => {
                const [leadsByStage, leadsByStatus, dealsByStatus, totalLeads, totalDeals, totalAccounts, totalContacts] = await Promise.all([
                    prismadb.crm_Leads.groupBy({ by: ["pipeline_stage"], where: { team_id: teamId }, _count: true }),
                    prismadb.crm_Leads.groupBy({ by: ["status"], where: { team_id: teamId }, _count: true }),
                    prismadb.crm_Opportunities.groupBy({ by: ["status"], where: { team_id: teamId }, _count: true, _sum: { budget: true } }),
                    prismadb.crm_Leads.count({ where: { team_id: teamId } }),
                    prismadb.crm_Opportunities.count({ where: { team_id: teamId } }),
                    prismadb.crm_Accounts.count({ where: { team_id: teamId } }),
                    prismadb.crm_Contacts.count({ where: { team_id: teamId } }),
                ]);

                return {
                    leadsByPipelineStage: leadsByStage.map((g: any) => ({ stage: g.pipeline_stage, count: g._count })),
                    leadsByStatus: leadsByStatus.map((g: any) => ({ status: g.status, count: g._count })),
                    dealsByStatus: dealsByStatus.map((g: any) => ({ status: g.status, count: g._count, totalBudget: g._sum?.budget || 0 })),
                    totals: { leads: totalLeads, deals: totalDeals, accounts: totalAccounts, contacts: totalContacts },
                };
            },
        }),

        get_recent_activity: (tool as any)({
            description: "Get recent CRM activity: latest lead activities, newly created leads, and recent deal updates. Use this to answer 'what happened recently' questions.",
            parameters: z.object({
                days: z.number().min(1).max(90).optional().describe("Number of days to look back (default 7)"),
                limit: z.number().min(1).max(50).optional().describe("Max results per category (default 10)"),
            }),
            execute: async ({ days, limit }: any) => {
                const since = new Date();
                since.setDate(since.getDate() - (days || 7));
                const take = limit || 10;

                const [recentLeads, recentDeals, recentActivities] = await Promise.all([
                    prismadb.crm_Leads.findMany({
                        where: { team_id: teamId, createdAt: { gte: since } },
                        take,
                        orderBy: { createdAt: "desc" },
                        select: { id: true, firstName: true, lastName: true, company: true, status: true, pipeline_stage: true, createdAt: true },
                    }),
                    prismadb.crm_Opportunities.findMany({
                        where: { team_id: teamId, updatedAt: { gte: since } },
                        take,
                        orderBy: { updatedAt: "desc" },
                        select: { id: true, name: true, status: true, budget: true, updatedAt: true, assigned_sales_stage: { select: { name: true } } },
                    }),
                    prismadb.crm_Lead_Activities.findMany({
                        where: { team_id: teamId, createdAt: { gte: since } },
                        take,
                        orderBy: { createdAt: "desc" },
                        select: { id: true, type: true, notes: true, createdAt: true },
                    }),
                ]);

                return {
                    newLeads: recentLeads,
                    updatedDeals: recentDeals,
                    activities: recentActivities,
                    period: `Last ${days || 7} days`,
                };
            },
        }),
    };
}

/**
 * Build the CRM Chief Agent system prompt with current time and comprehensive ontology
 */
function buildCrmAgentSystemPrompt(timezone?: string, teamName?: string, userRole?: string): string {
    // Get current time in user's timezone (default to UTC if not specified)
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const now = new Date();
    const formattedTime = now.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    });

    return `You are the Chief CRM Agent for ${teamName ? teamName : "Basalt CRM"}—an intelligent, autonomous AI assistant purpose-built to help sales teams, account managers, and business operators manage their customer relationships, sales pipelines, and business operations with maximum efficiency.

## CURRENT CONTEXT
- **Current Time**: ${formattedTime}
- **Timezone**: ${tz}
- **User Role**: ${userRole || "User"}
- **Organization**: ${teamName || "Basalt CRM"}

## CORE IDENTITY & MISSION
You are a proactive, knowledgeable, and action-oriented assistant. Your mission is to:
1. Help users manage and grow their customer relationships
2. Streamline sales processes and pipeline management
3. Provide actionable insights from CRM data
4. Automate repetitive tasks and workflows
5. Ensure data integrity and best practices across all CRM operations

## CRM ONTOLOGY & DOMAIN KNOWLEDGE

### PRIMARY ENTITIES

#### **Accounts** (crm_Accounts)
Business organizations or companies in the CRM. Key attributes:
- **Identity**: name, company_id, VAT, website, email
- **Contact Info**: office_phone, fax
- **Addresses**: billing (street, city, state, postal_code, country) and shipping addresses
- **Business Info**: industry (linked to Industry_Type), annual_revenue, employees, type (Customer/Partner/Vendor/Prospect)
- **Status**: Active/Inactive
- **Ownership**: assigned_to (user), team_id
- **Relationships**: has many Contacts, Leads, Opportunities, Contracts, Invoices, Documents, Tasks

#### **Contacts** (crm_Contacts)
Individual people associated with accounts. Key attributes:
- **Identity**: first_name, last_name, email, personal_email, birthday
- **Professional**: position, office_phone, mobile_phone
- **Social**: twitter, facebook, linkedin, skype, instagram, youtube, tiktok
- **Status**: active/inactive, email_unsubscribed
- **Tags & Notes**: custom categorization
- **Ownership**: assigned_to, created_by, team_id
- **Relationships**: belongs to Account, linked to Opportunities

#### **Leads** (crm_Leads)
Potential customers in early sales stages. Key attributes:
- **Identity**: firstName, lastName, company, jobTitle, email, phone
- **Source**: lead_source, refered_by, campaign
- **Status**: NEW, CONTACTED, QUALIFIED, LOST
- **Type**: DEMO (default)
- **Pipeline Stage**: Identify → Engage_AI → Engage_Human → Offering → Finalizing → Closed
- **Outreach Tracking**: outreach_status (IDLE/PENDING/SENT/OPENED/MEETING_LINK_CLICKED/MEETING_BOOKED/CLOSED), outreach_sent_at, outreach_opened_at, meeting_link, meeting_booked_at
- **Multi-Channel**: outreach_transport, sms_status, call_status, phone_verified
- **Ownership**: assigned_to, team_id, project (Board)

#### **Opportunities** (crm_Opportunities)
Sales deals being actively pursued. Key attributes:
- **Identity**: name, description
- **Financials**: budget, expected_revenue, currency
- **Timeline**: close_date, next_step
- **Stage**: sales_stage (linked to Sales_Stages with probability)
- **Type**: linked to Opportunities_Type
- **Status**: ACTIVE, INACTIVE, PENDING, CLOSED
- **Ownership**: assigned_to, created_by, team_id
- **Relationships**: linked to Account, Campaign, Contacts, Documents

#### **Contracts** (crm_Contracts)
Legal agreements with customers. Key attributes:
- **Identity**: title, description, type
- **Value**: monetary value
- **Dates**: startDate, endDate, renewalReminderDate, customerSignedDate, companySignedDate
- **Status**: NOTSTARTED, INPROGRESS, SIGNED
- **Relationships**: linked to Account

#### **Invoices** (Invoices)
Financial documents for billing. Key attributes:
- **Identity**: invoice_number, variable_symbol, order_number
- **Dates**: date_created, date_received, date_due, date_tax
- **Financial**: invoice_amount, invoice_currency, invoice_items (JSON)
- **Partner Info**: partner name, addresses, VAT/TAX numbers, bank details
- **Document**: invoice_file_url, invoice_file_mimeType
- **Integration**: rossum_status, rossum_annotation_id (AI document processing)
- **Status**: linked to invoice_States

### SALES PIPELINE ENTITIES

#### **Campaigns** (crm_campaigns)
Marketing campaigns that generate leads/opportunities. Attributes: name, description, status.

#### **Sales Stages** (crm_Opportunities_Sales_Stages)
Configurable pipeline stages with: name, probability (%), order.

#### **Opportunity Types** (crm_Opportunities_Type)
Categories of opportunities: name, order.

### LEAD GENERATION ENTITIES

#### **Lead Pools** (crm_Lead_Pools)
Collections of leads with ICP (Ideal Customer Profile) configuration. Used for organizing and processing leads.

#### **Lead Gen Jobs** (crm_Lead_Gen_Jobs)
Automated lead generation tasks with: status (QUEUED/RUNNING/PAUSED/STOPPED/SUCCESS/FAILED), providers, queryTemplates, counters, logs.

#### **Lead Candidates** (crm_Lead_Candidates)
Pre-qualified potential leads with: domain, companyName, description, industry, techStack, score, status (NEW/APPROVED/REJECTED/CONVERTED).

#### **Contact Candidates** (crm_Contact_Candidates)
Contact information discovered during lead gen: fullName, title, email, emailStatus (VALID/RISKY/INVALID/CATCH_ALL/UNKNOWN), phone, linkedinUrl, confidence.

#### **Global Companies/Persons** (crm_Global_Companies, crm_Global_Persons)
Shared database of companies and individuals for deduplication across the platform.

### PROJECT MANAGEMENT ENTITIES

#### **Boards** (Boards)
Project boards for task management. Attributes: title, description, icon, visibility, branding (logo, colors), watchers.

#### **Sections** (Sections)
Columns within boards: title, position.

#### **Tasks** (Tasks)
Work items within sections: title, content, priority, dueDateAt, position, tags, taskStatus (ACTIVE/PENDING/COMPLETE), likes.

#### **Account Tasks** (crm_Accounts_Tasks)
Tasks specifically linked to CRM accounts with similar attributes to Tasks.

#### **Task Comments** (tasksComments)
Discussion on tasks: comment, createdAt, user.

### DOCUMENT MANAGEMENT

#### **Documents** (Documents)
Files attached to CRM records: document_name, document_file_url, mimeType, size, tags, document_system_type (INVOICE/RECEIPT/CONTRACT/OFFER/OTHER).

### USER & TEAM MANAGEMENT

#### **Users** (Users)
System users with: name, email, avatar, role (via roleId), userStatus (ACTIVE/INACTIVE/PENDING), userLanguage, is_admin, is_account_admin, team_id, team_role (OWNER/ADMIN/MEMBER).

User personalization: meeting_link, signature_html, resource_links, outreach_prompt_default, calendar preferences.

#### **Teams** (Team)
Multi-tenant organization units: name, slug, logo_url, owner_id, subscription_plan, status (ACTIVE/PENDING/SUSPENDED), plan_id.

#### **Roles** (Role)
Permission-based access control: name, permissions[], description.

#### **Plans** (Plan)
Subscription tiers: name, slug (FREE/TEAM/ENTERPRISE), price, max_users, max_storage, max_credits, billing_cycle, features[].

### AI & INTEGRATION ENTITIES

#### **Chat Sessions/Messages** (chat_Sessions, chat_Messages)
Conversation history with AI: title, isTemporary, messages with role/content/tokenUsage.

#### **AI Models** (AiModel)
Available AI models: name, modelId, provider (OPENAI/AZURE/ANTHROPIC/GOOGLE/GROK/DEEPSEEK/PERPLEXITY/MISTRAL), pricing.

#### **System/Team AI Config**
AI configuration at system and team level: provider, apiKey, modelId, useSystemKey.

#### **OpenAI Keys** (openAi_keys)
User-specific API keys: organization_id, api_key.

#### **Gmail Tokens** (gmail_Tokens)
Email integration: access_token, refresh_token, scope, expiry_date.

### CMS & PUBLIC CONTENT

#### **Blog Posts** (BlogPost): title, slug, content, excerpt, coverImage, category, author.
#### **Job Postings** (JobPosting): title, department, location, type, requirements.
#### **Doc Articles** (DocArticle): title, slug, category, content, videoUrl.

## WORKFLOW & PROCESS KNOWLEDGE

### Lead-to-Customer Journey
1. **Identify**: Lead discovered/created → NEW status
2. **Engage_AI**: Automated outreach via email/SMS/call
3. **Engage_Human**: Sales rep takes over qualified leads
4. **Offering**: Opportunity created, proposals sent
5. **Finalizing**: Contract negotiation, signatures
6. **Closed**: Deal won → Account created/updated

### Outreach Sequence
1. IDLE → PENDING (queued for send)
2. PENDING → SENT (message delivered)
3. SENT → OPENED (tracking pixel/link clicked)
4. OPENED → MEETING_LINK_CLICKED → MEETING_BOOKED
5. Any stage → CLOSED (complete or disqualified)

### Pipeline Management
- Opportunities progress through configurable Sales Stages
- Each stage has probability % for forecasting
- Expected revenue = budget × probability
- Track close_date for pipeline velocity

## COMMUNICATION GUIDELINES

1. **Be Proactive**: Anticipate user needs, suggest next actions
2. **Be Specific**: Reference entity names, IDs, dates when relevant
3. **Be Actionable**: Provide clear steps, not vague advice
4. **Be Data-Driven**: Base recommendations on CRM data patterns
5. **Respect Time**: The current time context matters for deadlines, follow-ups, scheduling
6. **Maintain Context**: Remember conversation history within the session

## CAPABILITIES & TOOLS

### You CAN:
- Answer questions about CRM concepts, best practices, and workflows
- **DIRECTLY QUERY the CRM database** using your tools to get real-time data
- Search and filter leads, accounts, contacts, and opportunities
- Get pipeline statistics ... lead counts per stage, deal totals, revenue summaries
- View recent CRM activity (new leads, deal updates, activities)
- Suggest sales strategies and outreach approaches
- Guide users through CRM features and processes
- Provide templates for emails, proposals, and follow-ups
- Calculate pipeline metrics and forecasts
- Recommend next best actions based on real data

### AVAILABLE TOOLS:
- **query_leads**: Search leads by name, email, status, pipeline stage, outreach status
- **query_accounts**: Search accounts by name, industry, type, status
- **query_contacts**: Search contacts by name, email, position
- **query_opportunities**: Search deals by name, status, budget range
- **get_pipeline_stats**: Get full pipeline summary with counts and revenue per stage
- **get_recent_activity**: Get recent lead/deal/activity changes (configurable days)

When users ask about their data, ALWAYS use your tools to get real numbers. Never guess or make up data.
If a question requires writing data (creating leads, updating records, sending emails), explain that you can only read data and guide them to perform the action in the CRM interface.`;
}

// Helper to extract content from either UIMessage (parts array) or ModelMessage (content string) format
function extractMessageContent(message: any): string {
    // If content is already a string, use it
    if (typeof message.content === 'string') {
        return message.content;
    }
    // AI SDK 5.x UIMessage format: extract text from parts array
    if (Array.isArray(message.parts)) {
        return message.parts.map((part: any) => {
            if (typeof part === 'string') return part;
            if (part.type === 'text' && typeof part.text === 'string') return part.text;
            if (typeof part.content === 'string') return part.content;
            return '';
        }).join('');
    }
    return '';
}

// POST /api/chat
// Handles streaming chat completions
export async function POST(req: Request) {
    const auth = await getServerSession(authOptions);
    if (!auth) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const payload = await req.json();
        // Retrieve sessionId from the body, and optional timezone for system prompt
        const { sessionId, parentId, messages: incomingMessages, content, timezone } = payload;

        if (!sessionId) {
            return new NextResponse("Session ID is required", { status: 400 });
        }

        const chatSession = await db.chat_Sessions.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession || chatSession.user !== auth.user.id) {
            return new NextResponse("Session Not Found", { status: 404 });
        }

        // Build conversation for the model
        // Handles both AI SDK 5.x UIMessage (parts array) and legacy ModelMessage (content string) formats
        let modelMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
        let lastUserContent = content;

        // Fetch team details for context
        let teamName = "Basalt CRM";
        let userRole = "MEMBER";

        try {
            const user = await prismadb.users.findUnique({
                where: { id: auth.user.id },
                include: { assigned_team: true }
            });
            if (user?.assigned_team?.name) teamName = user.assigned_team.name;
            if (user?.team_role) userRole = user.team_role;

            // Enforce AI token quota before processing
            if (user?.team_id) {
                const quota = await checkTeamQuota(user.team_id, "AI_TOKENS", auth!.user.id);
                if (!quota.allowed) {
                    return new NextResponse(
                        JSON.stringify({ error: quota.message || "AI token limit reached. Please top up your AI tokens." }),
                        { status: 429, headers: { "Content-Type": "application/json" } }
                    );
                }
            }
        } catch (e) {
            console.warn("Failed to fetch user context for chat", e);
        }

        // Build the CRM agent system prompt with timezone awareness
        const systemPrompt = buildCrmAgentSystemPrompt(timezone, teamName, userRole);

        if (incomingMessages && Array.isArray(incomingMessages)) {
            // Convert incoming messages to ModelMessage format (content string)
            const convertedMessages = incomingMessages
                .filter((m: any) => m.role && (m.content || m.parts)) // Filter out empty messages
                .map((m: any) => ({
                    role: m.role as "system" | "user" | "assistant",
                    content: extractMessageContent(m),
                }))
                .filter((m: any) => m.content); // Filter out messages with empty content

            // Check if there's already a system message; if not, prepend our CRM agent system prompt
            const hasSystemMessage = convertedMessages.some((m: any) => m.role === "system");
            if (hasSystemMessage) {
                // Replace the first system message with our enhanced prompt
                const systemIndex = convertedMessages.findIndex((m: any) => m.role === "system");
                convertedMessages[systemIndex] = { role: "system", content: systemPrompt };
                modelMessages = convertedMessages;
            } else {
                // Prepend the CRM agent system prompt
                modelMessages = [
                    { role: "system", content: systemPrompt },
                    ...convertedMessages,
                ];
            }

            // Find the last user message content
            const lastUserMessage = [...incomingMessages].reverse().find((m: any) => m.role === "user");
            if (!lastUserContent && lastUserMessage) {
                lastUserContent = extractMessageContent(lastUserMessage);
            }
        } else if (content) {
            modelMessages = [
                { role: "system", content: systemPrompt },
                { role: "user", content },
            ];
        } else {
            return new NextResponse("No content or messages provided", { status: 400 });
        }

        // Ensure we have valid messages
        if (modelMessages.length === 0 || !lastUserContent) {
            return new NextResponse("No valid messages to process", { status: 400 });
        }

        // Create user message if the session is not temporary
        let userMessageId: string | null = null;
        if (!chatSession.isTemporary && lastUserContent) {
            const userMessage = await db.chat_Messages.create({
                data: {
                    session: sessionId,
                    parent: parentId,
                    role: "user",
                    content: lastUserContent,
                    model: undefined,
                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                },
            });
            userMessageId = userMessage.id;
            await db.chat_Sessions.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
            });
        }

        // Call Azure OpenAI (or fallback OpenAI) with streaming
        const { model } = await getAiSdkModel(auth.user.id);
        if (!model) {
            return new NextResponse("No openai key found", { status: 500 });
        }

        // Build CRM tools if we have a team context
        let teamIdForTools: string | null = null;
        try {
            const toolUser = await prismadb.users.findUnique({
                where: { id: auth.user.id },
                select: { team_id: true }
            });
            teamIdForTools = toolUser?.team_id || null;
        } catch (_) {}

        const crmTools = teamIdForTools ? buildCrmTools(teamIdForTools, auth.user.id) : {};

        let result: any;
        try {
            // Omit temperature for reasoning models (o1, etc.)
            const temperature = isReasoningModel(model.modelId) ? undefined : 1;

            const textStreamPromise = streamText({
                model,
                messages: modelMessages,
                temperature,
                tools: crmTools,
                maxSteps: 5,
                onFinish: async ({ text: completion, usage }: any) => {
                    try {
                        if (!chatSession.isTemporary) {
                            await db.chat_Messages.create({
                                data: {
                                    session: sessionId,
                                    parent: userMessageId || parentId || undefined,
                                    role: "assistant",
                                    content: completion,
                                    model: model.modelId,
                                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                                    tokenUsage: usage || undefined,
                                },
                            });
                            await db.chat_Sessions.update({
                                where: { id: sessionId },
                                data: { updatedAt: new Date() },
                            });
                        }

                        // Log usage and consume AI tokens via centralized logAiUsage
                        if (usage) {
                            const usageAny = usage as any;
                            try {
                                const chatUser = await prismadb.users.findUnique({
                                    where: { id: auth!.user.id },
                                    select: { team_id: true }
                                });
                                if (chatUser?.team_id) {
                                    await logAiUsage({
                                        teamId: chatUser.team_id,
                                        userId: auth!.user.id,
                                        service: "chat",
                                        model: model.modelId || "unknown",
                                        usage: {
                                            promptTokens: usageAny.promptTokens || 0,
                                            completionTokens: usageAny.completionTokens || 0
                                        },
                                        description: "Chat completion"
                                    });
                                }
                            } catch (tokenErr) {
                                systemLogger.error("[CHAT_AI_TOKEN_CONSUME_ERROR]", tokenErr);
                            }
                        }
                    } catch (e) {
                        systemLogger.error("[CHAT_MESSAGES_ON_COMPLETION_SAVE_ERROR]", e);
                    }
                },
            } as any);

            // Handle both promise and sync return (SDK robust handling)
            if (textStreamPromise instanceof Promise) {
                result = await textStreamPromise;
            } else {
                result = textStreamPromise;
            }
        } catch (err) {
            systemLogger.error("[CHAT_STREAM_TEXT_ERROR]", err);
            return new NextResponse("Error calling streamText", { status: 500 });
        }

        // Attempt to use known response methods
        if (result && typeof result.toDataStreamResponse === 'function') {
            return result.toDataStreamResponse();
        } else if (result && typeof result.toTextStreamResponse === 'function') {
            return result.toTextStreamResponse();
        } else if (result instanceof Response) {
            return result;
        } else {
            systemLogger.error("[CHAT_STREAM_ERROR] Invalid result object:", result);
            return new NextResponse("Stream generation failed: Invalid result", { status: 500 });
        }

    } catch (error) {
        systemLogger.error("[CHAT_MESSAGES_POST]", error);
        return new NextResponse("Failed to process message", { status: 500 });
    }
}
