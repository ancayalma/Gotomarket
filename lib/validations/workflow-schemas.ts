import { z } from "zod";

// =============================================================================
// WORKFLOW ENGINE ZOD SCHEMAS
// Derived directly from Prisma schema.prisma model definitions.
// Used by the FlowState SCHEMA_REGISTRY for dynamic field extraction.
// =============================================================================

// --- Cases (crm_Cases) ---
export const caseSchema = z.object({
    id: z.string(),
    case_number: z.string(),
    subject: z.string(),
    description: z.string().nullable().optional(),
    status: z.string(), // NEW, OPEN, IN_PROGRESS, WAITING_ON_CUSTOMER, ESCALATED, RESOLVED, CLOSED
    priority: z.string(), // LOW, MEDIUM, HIGH, CRITICAL
    origin: z.string(), // EMAIL, PHONE, WEB, CHAT, SOCIAL, PORTAL, INTERNAL
    type: z.string().nullable().optional(), // QUESTION, PROBLEM, INCIDENT, FEATURE_REQUEST, TASK
    reason: z.string().nullable().optional(),
    contact_id: z.string().nullable().optional(),
    account_id: z.string().nullable().optional(),
    assigned_to: z.string().nullable().optional(),
    parent_case_id: z.string().nullable().optional(),
    internal_notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    sla_breached: z.boolean().optional(),
    escalation_level: z.number().optional(),
    source_email_from: z.string().nullable().optional(),
    createdAt: z.date().optional(),
    closedAt: z.date().nullable().optional(),
    resolvedAt: z.date().nullable().optional(),
});

// --- Products (crm_Products) ---
export const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    description: z.string().nullable().optional(),
    price: z.number(),
    costPrice: z.number().nullable().optional(),
    taxRate: z.number().nullable().optional(),
    category: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    stock: z.number().optional(),
    weight: z.number().nullable().optional(),
    isDigital: z.boolean().optional(),
    active: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    currency: z.string().nullable().optional(),
    isSubscription: z.boolean().optional(),
    taxable: z.boolean().optional(),
    imageUrl: z.string().nullable().optional(),
});

// --- Quotes (crm_Quotes) ---
export const quoteSchema = z.object({
    id: z.string(),
    title: z.string(),
    quoteNumber: z.string(),
    status: z.string().optional(), // DRAFT, SENT, ACCEPTED, REJECTED
    totalAmount: z.number().optional(),
    taxRateValue: z.number().optional(),
    notes: z.string().nullable().optional(),
    terms: z.string().nullable().optional(),
    payerMemo: z.string().nullable().optional(),
    expirationDate: z.date().nullable().optional(),
    accountId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    leadId: z.string().nullable().optional(),
    opportunityId: z.string().nullable().optional(),
    createdBy: z.string(),
});

// --- Tasks (crm_Accounts_Tasks) ---
export const crmTaskSchema = z.object({
    id: z.string(),
    content: z.string(),
    taskStatus: z.string().nullable().optional(),
    dueDateAt: z.date().nullable().optional(),
    priority: z.string(),
    section: z.string().nullable().optional(),
});

// --- Form Submissions (FormSubmission) ---
export const formSubmissionSchema = z.object({
    id: z.string(),
    form_id: z.string(),
    extracted_email: z.string().nullable().optional(),
    extracted_phone: z.string().nullable().optional(),
    extracted_name: z.string().nullable().optional(),
    extracted_company: z.string().nullable().optional(),
    status: z.string(), // NEW, VIEWED, CONVERTED, SPAM, ARCHIVED
    is_deleted: z.boolean().optional(),
    lead_id: z.string().nullable().optional(),
    source_url: z.string().nullable().optional(),
    ip_hash: z.string().nullable().optional(),
    referrer: z.string().nullable().optional(),
    utm_source: z.string().nullable().optional(),
    utm_medium: z.string().nullable().optional(),
    utm_campaign: z.string().nullable().optional(),
    createdAt: z.date().optional(),
});

// --- Outreach Campaigns (crm_Outreach_Campaigns) ---
export const outreachCampaignSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    status: z.string(), // DRAFT, PENDING_APPROVAL, ACTIVE, PAUSED, COMPLETED, ARCHIVED
    total_leads: z.number().optional(),
    emails_sent: z.number().optional(),
    emails_opened: z.number().optional(),
    emails_replied: z.number().optional(),
    sms_sent: z.number().optional(),
    sms_delivered: z.number().optional(),
    calls_initiated: z.number().optional(),
    meetings_booked: z.number().optional(),
    followup_enabled: z.boolean().optional(),
    followup_delay_hours: z.number().optional(),
    followup_max_count: z.number().optional(),
    auto_reply_enabled: z.boolean().optional(),
    ab_enabled: z.boolean().optional(),
    launchedAt: z.date().nullable().optional(),
    completedAt: z.date().nullable().optional(),
});

// --- Outreach Items (crm_Outreach_Items) ---
export const outreachItemSchema = z.object({
    id: z.string(),
    campaign_id: z.string(),
    lead_id: z.string().nullable().optional(),
    status: z.string(), // PENDING, RESEARCHING, READY, SENT, DELIVERED, OPENED, CLICKED, REPLIED, BOUNCED, FAILED, SKIPPED
    channel: z.string().nullable().optional(),
    subject: z.string().nullable().optional(),
    sent_at: z.date().nullable().optional(),
    opened_at: z.date().nullable().optional(),
    replied_at: z.date().nullable().optional(),
    bounced_at: z.date().nullable().optional(),
    followup_count: z.number().optional(),
});

// --- DealRooms (crm_DealRooms) ---
export const dealRoomSchema = z.object({
    id: z.string(),
    contract_id: z.string(),
    slug: z.string(),
    password_protection: z.string().nullable().optional(),
    valid_until: z.date().nullable().optional(),
    hero_video_url: z.string().nullable().optional(),
    welcome_message: z.string().nullable().optional(),
    interactive_pricing: z.boolean().optional(),
    total_views: z.number().optional(),
    unique_visitors: z.number().optional(),
    engagement_score: z.number().optional(),
    is_active: z.boolean().optional(),
    last_viewed_at: z.date().nullable().optional(),
});

// --- Lead Pools (crm_Lead_Pools) ---
export const leadPoolSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    team_id: z.string().nullable().optional(),
});

// --- Subscriptions (crm_Subscriptions) ---
export const subscriptionSchema = z.object({
    id: z.string(),
    plan_name: z.string(),
    amount: z.number(),
    currency: z.string().optional(),
    interval: z.string().optional(), // monthly, yearly
    billing_day: z.number().optional(),
    next_billing_date: z.date(),
    status: z.string(), // ACTIVE, PAUSED, CANCELLED, OVERDUE, SUSPENDED
    payment_provider: z.string().optional(),
    customer_email: z.string().nullable().optional(),
    last_charge_date: z.date().nullable().optional(),
    last_charge_status: z.string().nullable().optional(),
    discount_applied: z.boolean().optional(),
});

// --- Billing Invoices (crm_BillingInvoice) ---
export const billingInvoiceSchema = z.object({
    id: z.string(),
    invoice_number: z.string(),
    type: z.string(), // SUBSCRIPTION, AI_USAGE, ECHO_CREDITS, ONE_TIME
    description: z.string().nullable().optional(),
    period_start: z.date(),
    period_end: z.date(),
    subtotal: z.number(),
    discount: z.number().optional(),
    tax: z.number().optional(),
    total: z.number(),
    payment_method: z.string().nullable().optional(),
    payment_status: z.string(), // PENDING, PAID, FAILED, REFUNDED, WAIVED
    transaction_id: z.string().nullable().optional(),
    paid_at: z.date().nullable().optional(),
    pdf_url: z.string().nullable().optional(),
});
