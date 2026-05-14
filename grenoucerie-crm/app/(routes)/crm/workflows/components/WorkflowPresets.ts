import { Node, Edge } from "@xyflow/react";

export interface WorkflowPreset {
    id: string;
    name: string;
    description: string;
    category: string;
    flow_type: string;
    trigger_type: string;
    nodes: Node[];
    edges: Edge[];
}

// Layout helper for clean left-to-right spacing
const startY = 150;
const gapX = 400; // Spacing between nodes horizontally

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
    // ============================================
    // CATEGORY: Lead & Account Management
    // ============================================
    {
        id: "lead-routing-engine",
        name: "Intelligent Lead Routing",
        description: "Evaluates, flags, and routes high-value leads. Notifies management via Slack if Score > 80.",
        category: "Lead & Account Management",
        flow_type: "AUTO_FLOW",
        trigger_type: "LEAD_CREATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Lead Created", triggerType: "LEAD_CREATED" } },
            { id: "cond-1", type: "condition", position: { x: 50 + gapX, y: startY }, data: { label: "Score > 80?", conditions: [{ field: "LeadScore", operator: "greater_than", value: "80" }] } },
            // Branch true goes up slightly
            { id: "assign-true", type: "action", position: { x: 50 + (gapX * 2), y: startY - 120 }, data: { label: "Assign to Manager", actionType: "assign_owner", assignMode: "MANAGER" } },
            { id: "notify-true", type: "action", position: { x: 50 + (gapX * 3), y: startY - 120 }, data: { label: "Slack Notify", actionType: "call_webhook", method: "POST", url: "https://hooks.slack.com/services/..." } },
            // Branch false goes down slightly
            { id: "delay-false", type: "delay", position: { x: 50 + (gapX * 2), y: startY + 120 }, data: { label: "Wait 1 Day", duration: 1, unit: "days" } },
            { id: "assign-false", type: "action", position: { x: 50 + (gapX * 3), y: startY + 120 }, data: { label: "Round Robin", actionType: "assign_owner", assignMode: "ROUND_ROBIN", roundRobinPool: "inbound-sdr" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "cond-1", type: "interactive" },
            { id: "e2", source: "cond-1", target: "assign-true", sourceHandle: "true", type: "interactive" },
            { id: "e3", source: "cond-1", target: "delay-false", sourceHandle: "false", type: "interactive" },
            { id: "e4", source: "assign-true", target: "notify-true", type: "interactive" },
            { id: "e5", source: "delay-false", target: "assign-false", type: "interactive" }
        ]
    },
    {
        id: "lead-enrichment",
        name: "Lead Data Enrichment",
        description: "Fires an external webhook to Clearbit, waits for payload, then triggers AI to summarize company intel.",
        category: "Lead & Account Management",
        flow_type: "AUTO_FLOW",
        trigger_type: "LEAD_CREATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Lead Created", triggerType: "LEAD_CREATED" } },
            { id: "webhook-1", type: "action", position: { x: 50 + gapX, y: startY }, data: { label: "Clearbit Enrichment", actionType: "call_webhook", method: "POST", url: "https://api.clearbit.com/v1/enrich", outputVariable: "clearbit_data" } },
            { id: "varuni-1", type: "varuni", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Extract Intel", model: "claude-haiku", systemPrompt: "Summarize the company's tech stack and size from the JSON.", contextFields: [{ name: "payload", value: "{{clipboard_data}}" }], outputVariable: "intel_summary" } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Write to Lead", objectType: "crm_Leads", fields: [{ field: "Description", value: "{{intel_summary}}" }] } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "webhook-1", type: "interactive" },
            { id: "e2", source: "webhook-1", target: "varuni-1", type: "interactive" },
            { id: "e3", source: "varuni-1", target: "update-1", type: "interactive" }
        ]
    },
    
    // ============================================
    // CATEGORY: Forms & Inbound
    // ============================================
    {
        id: "form-submission-triage",
        name: "Web Form AI Auto-Responder",
        description: "Processes new form submissions, parses intent using Varuni, archives spam, and routes legitimate leads.",
        category: "Forms & Inbound",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "FORM_SUBMITTED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Form Filled", triggerType: "FORM_SUBMITTED" } },
            { id: "varuni-1", type: "varuni", position: { x: 50 + gapX, y: startY }, data: { label: "Extract Intent", model: "gpt-4o-mini", systemPrompt: "Classify form text tightly as SUPPORT, SALES, or SPAM.", contextFields: [{ name: "text", value: "{{Trigger.text}}" }], outputVariable: "form_intent" } },
            { id: "cond-1", type: "condition", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Is Spam?", conditions: [{ field: "form_intent", operator: "equals", value: "SPAM" }] } },
            { id: "update-true", type: "updateRecord", position: { x: 50 + (gapX * 3), y: startY - 100 }, data: { label: "Archive Submission", objectType: "crm_FormSubmissions", fields: [{ field: "Status", value: "ARCHIVED" }] } },
            { id: "assign-false", type: "action", position: { x: 50 + (gapX * 3), y: startY + 100 }, data: { label: "Assign Form to SDR", actionType: "assign_owner", assignMode: "ROUND_ROBIN", roundRobinPool: "sdr-vanguards" } },
            { id: "email-false", type: "action", position: { x: 50 + (gapX * 4), y: startY + 100 }, data: { label: "Send Auto-Reply", actionType: "send_email", templateId: "tpl_welcome", recipient: "{{Trigger.extracted_email}}" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "varuni-1", type: "interactive" },
            { id: "e2", source: "varuni-1", target: "cond-1", type: "interactive" },
            { id: "e3", source: "cond-1", target: "update-true", sourceHandle: "true", type: "interactive" },
            { id: "e4", source: "cond-1", target: "assign-false", sourceHandle: "false", type: "interactive" },
            { id: "e5", source: "assign-false", target: "email-false", type: "interactive" }
        ]
    },
    {
        id: "form-to-case",
        name: "Support Form to Case Pipeline",
        description: "Catches submissions bound for the 'Support' form, directly spins up a Case, and alerts L1 Support.",
        category: "Forms & Inbound",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "FORM_SUBMITTED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Support Form", triggerType: "FORM_SUBMITTED", filterConditions: [{ field: "form_id", operator: "equals", value: "form_support_v2" }] } },
            { id: "create-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Provision New Case", operation: "CREATE", objectType: "crm_Cases", fields: [{ field: "Subject", value: "Inbound: {{Trigger.extracted_name}}" }, { field: "Description", value: "{{Trigger.text}}" }, { field: "Priority", value: "MEDIUM" }] } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Alert Triage Pool", actionType: "assign_owner", assignMode: "ROLE", specificRole: "L1_SUPPORT" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "create-1", type: "interactive" },
            { id: "e2", source: "create-1", target: "notify-1", type: "interactive" }
        ]
    },
    {
        id: "form-to-account",
        name: "Form to Account Auto-Provisioning",
        description: "Creates a new full Account directly from a form if it contains a valid name and email.",
        category: "Forms & Inbound",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "FORM_SUBMITTED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Form Filled", triggerType: "FORM_SUBMITTED" } },
            { id: "cond-1", type: "condition", position: { x: 50 + gapX, y: startY }, data: { label: "Valid Email?", conditions: [{ field: "extracted_email", operator: "contains", value: "@" }] } },
            { id: "create-1", type: "updateRecord", position: { x: 50 + (gapX * 2), y: startY - 50 }, data: { label: "Provision Account", operation: "CREATE", objectType: "crm_Accounts", fields: [{ field: "Name", value: "{{Trigger.extracted_name}} {{Trigger.extracted_company}}" }, { field: "Website", value: "{{Trigger.extracted_company}}" }, { field: "Type", value: "Prospect" }] } },
            { id: "create-2", type: "updateRecord", position: { x: 50 + (gapX * 3), y: startY - 50 }, data: { label: "Provision Contact", operation: "CREATE", objectType: "crm_Contacts", fields: [{ field: "Name", value: "{{Trigger.extracted_name}}" }, { field: "Email", value: "{{Trigger.extracted_email}}" }, { field: "AccountId", value: "{{create-1.id}}" }] } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "cond-1", type: "interactive" },
            { id: "e2", source: "cond-1", target: "create-1", sourceHandle: "true", type: "interactive" },
            { id: "e3", source: "create-1", target: "create-2", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Sales & Opportunities
    // ============================================
    {
        id: "dealroom-automation",
        name: "Automated DealRoom Setup",
        description: "Spins up a secure DealRoom container with an AI-generated welcome message when a Deal progresses to Negotiation.",
        category: "Sales & Opportunities",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "RECORD_UPDATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Stage -> Negotiation", triggerType: "RECORD_UPDATED", objectType: "crm_Opportunities", filterConditions: [{ field: "Stage", operator: "equals", value: "Negotiation" }] } },
            { id: "varuni-1", type: "varuni", position: { x: 50 + gapX, y: startY }, data: { label: "Write Welcome Message", model: "claude-sonnet", systemPrompt: "Draft a concise, warm 3-sentence welcome message for the new client DealRoom. Emphasize partnership.", outputVariable: "welcome_message" } },
            { id: "dealroom-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Create DealRoom", actionType: "create_deal_room", message: "{{welcome_message}}" } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Notify Client via Email", actionType: "send_email", triggerTarget: "Contact", templateId: "tpl_dealroom_entry" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "varuni-1", type: "interactive" },
            { id: "e2", source: "varuni-1", target: "dealroom-1", type: "interactive" },
            { id: "e3", source: "dealroom-1", target: "notify-1", type: "interactive" }
        ]
    },
    {
        id: "tier-3-approval",
        name: "Tier 3 Quote Approval",
        description: "Requires unanimous approval for massive Quote discounts, escalating to C-Suite if stalled.",
        category: "Sales & Opportunities",
        flow_type: "APPROVAL_CHAIN",
        trigger_type: "RECORD_CREATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "High Risk Quote Created", triggerType: "RECORD_CREATED", objectType: "crm_Quotes", filterConditions: [{ field: "Discount", operator: "greater_than", value: "30" }] } },
            { id: "approval-1", type: "approval", position: { x: 50 + gapX, y: startY }, data: { label: "Director Approval", approverType: "ROLE", approverRole: "VP_SALES", approvalMode: "UNANIMOUS", timeoutHours: 24, timeoutAction: "escalate", escalationTarget: "C-SUITE" } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Approve Quote", objectType: "crm_Quotes", fields: [{ field: "Status", value: "APPROVED" }] } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Alert Rep", actionType: "notify", recipientRole: "{{Trigger.createdBy}}", notifyTitle: "Quote Approved" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "approval-1", type: "interactive" },
            { id: "e2", source: "approval-1", target: "update-1", type: "interactive" },
            { id: "e3", source: "update-1", target: "notify-1", type: "interactive" }
        ]
    },
    {
        id: "pipeline-cleanup",
        name: "Automated Pipeline Cleanup",
        description: "Runs weekly to flag Deals that haven't moved in 30 days and alerts the managers.",
        category: "Sales & Opportunities",
        flow_type: "SCHEDULED",
        trigger_type: "SCHEDULED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Run Every Friday", triggerType: "SCHEDULED", schedule: "0 17 * * 5" } },
            { id: "query-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Find Stale Deals", operation: "GET", objectType: "crm_Opportunities", maxRecords: 100 } },
            { id: "loop-1", type: "loop", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Loop Results", listVariable: "query-1.records" } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Flag At Risk", objectType: "crm_Opportunities", fields: [{ field: "Status", value: "At Risk" }] } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 4), y: startY }, data: { label: "Alert Account Owner", actionType: "notify", notifyTitle: "Stale Deal Warning" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "query-1", type: "interactive" },
            { id: "e2", source: "query-1", target: "loop-1", type: "interactive" },
            { id: "e3", source: "loop-1", target: "update-1", type: "interactive" },
            { id: "e4", source: "update-1", target: "notify-1", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Support & Service
    // ============================================
    {
        id: "sla-breach-escalation",
        name: "Case SLA Breach Escalation",
        description: "Immediately escalates breached cases to Super Admins and updates tracking fields.",
        category: "Support & Service",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "CASE_ESCALATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Case Escalated", triggerType: "CASE_ESCALATED" } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Bump Priority Top", objectType: "crm_Cases", fields: [{ field: "priority", value: "CRITICAL" }] } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Flash Slack Channel", actionType: "call_webhook", method: "POST", url: "https://hooks.slack.com/services/support-swat" } },
            { id: "sms-1", type: "action", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "SMS Manager", actionType: "send_sms", targetPhone: "+10000000000" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "update-1", type: "interactive" },
            { id: "e2", source: "update-1", target: "notify-1", type: "interactive" },
            { id: "e3", source: "notify-1", target: "sms-1", type: "interactive" }
        ]
    },
    {
        id: "post-resolution-survey",
        name: "Post-Resolution Feedback Loop",
        description: "Waits 2 days after closing a Support Case, then issues an automated survey email. Reopens if score is terrible.",
        category: "Support & Service",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "RECORD_UPDATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Case Marked Closed", triggerType: "RECORD_UPDATED", objectType: "crm_Cases", filterConditions: [{ field: "status", operator: "equals", value: "CLOSED" }] } },
            { id: "delay-1", type: "delay", position: { x: 50 + gapX, y: startY }, data: { label: "Wait 2 Days", duration: 2, unit: "days" } },
            { id: "email-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Fire Survey Link", actionType: "send_email", templateId: "tpl_satisfaction" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "delay-1", type: "interactive" },
            { id: "e2", source: "delay-1", target: "email-1", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Messaging & Campaigns
    // ============================================
    {
        id: "ai-message-triage",
        name: "Inbound Message AI Triage",
        description: "Whenever a reply is received on an outreach item, Varuni reads the intent and logs an activity if interested.",
        category: "Messaging & Campaigns",
        flow_type: "AUTO_FLOW",
        trigger_type: "OUTREACH_REPLIED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Reply Received", triggerType: "OUTREACH_REPLIED" } },
            { id: "varuni-1", type: "varuni", position: { x: 50 + gapX, y: startY }, data: { label: "Classify Sentiment", model: "claude-haiku", systemPrompt: "Classify email body as HOT, WARM, COLD, or UNSUBSCRIBE.", outputVariable: "sentiment" } },
            { id: "cond-1", type: "condition", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Is Interested?", conditions: [{ field: "sentiment", operator: "in", value: "HOT, WARM" }] } },
            { id: "log-true", type: "action", position: { x: 50 + (gapX * 3), y: startY - 100 }, data: { label: "Generate Task", actionType: "log_activity", activityType: "Call", description: "URGENT priority response needed!" } },
            { id: "optout-false", type: "action", position: { x: 50 + (gapX * 3), y: startY + 100 }, data: { label: "Skip", actionType: "log_activity", activityType: "Note", description: "Not interested or cold." } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "varuni-1", type: "interactive" },
            { id: "e2", source: "varuni-1", target: "cond-1", type: "interactive" },
            { id: "e3", source: "cond-1", target: "log-true", sourceHandle: "true", type: "interactive" },
            { id: "e4", source: "cond-1", target: "optout-false", sourceHandle: "false", type: "interactive" }
        ]
    },
    {
        id: "missed-call-sms",
        name: "Missed Call Auto-SMS",
        description: "Creates an SMS action if a call activity is logged as 'Missed'.",
        category: "Messaging & Campaigns",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "RECORD_CREATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Call Logged", triggerType: "RECORD_CREATED", objectType: "crm_Tasks", filterConditions: [{ field: "outcome", operator: "equals", value: "MISSED" }] } },
            { id: "delay-1", type: "delay", position: { x: 50 + gapX, y: startY }, data: { label: "Wait 15 Minutes", duration: 15, unit: "minutes" } },
            { id: "sms-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Shoot Apology Text", actionType: "send_sms", targetPhone: "{{Trigger.contact_phone}}" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "delay-1", type: "interactive" },
            { id: "e2", source: "delay-1", target: "sms-1", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Finance, Subscriptions & Invoices
    // ============================================
    {
        id: "invoice-collection",
        name: "Overdue Invoice Dunning",
        description: "Waits 3 days after an invoice is overdue, locks down subscriptions, and generates a collection task.",
        category: "Finance, Subscriptions & Invoices",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "INVOICE_OVERDUE",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Invoice Overdue", triggerType: "INVOICE_OVERDUE" } },
            { id: "delay-1", type: "delay", position: { x: 50 + gapX, y: startY }, data: { label: "3 Day Grace", duration: 3, unit: "days" } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Suspend Sub", objectType: "crm_Subscriptions", fields: [{ field: "Status", value: "SUSPENDED" }] } },
            { id: "log-1", type: "action", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Assign to Collections", actionType: "assign_owner", assignMode: "ROLE", specificRole: "BILLING" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "delay-1", type: "interactive" },
            { id: "e2", source: "delay-1", target: "update-1", type: "interactive" },
            { id: "e3", source: "update-1", target: "log-1", type: "interactive" }
        ]
    },
    {
        id: "subscription-churn-recovery",
        name: "Subscription Churn Recovery",
        description: "Flags large expiring subscriptions/contracts 14 days out and triggers priority executive reach out.",
        category: "Finance, Subscriptions & Invoices",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "CONTRACT_EXPIRING",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Contract Pending Expire", triggerType: "CONTRACT_EXPIRING", daysBefore: 14 } },
            { id: "cond-1", type: "condition", position: { x: 50 + gapX, y: startY }, data: { label: "ARR > $50K?", conditions: [{ field: "amount", operator: "greater_than", value: "50000" }] } },
            { id: "task-1", type: "action", position: { x: 50 + (gapX * 2), y: startY - 50 }, data: { label: "Log Priority Task", actionType: "log_activity", activityType: "Call", description: "Reach out immediately. High flight risk." } },
            { id: "assign-1", type: "action", position: { x: 50 + (gapX * 3), y: startY - 50 }, data: { label: "Assign Exec Sponsor", actionType: "assign_owner", assignMode: "ROLE", specificRole: "VP_SALES" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "cond-1", type: "interactive" },
            { id: "e2", source: "cond-1", target: "task-1", sourceHandle: "true", type: "interactive" },
            { id: "e3", source: "task-1", target: "assign-1", type: "interactive" }
        ]
    },
    {
        id: "daily-invoice-sync",
        name: "Nightly Invoice Ledger Sync",
        description: "Runs nightly via webhook to external Quickbooks or ERP software to push new records.",
        category: "Finance, Subscriptions & Invoices",
        flow_type: "SCHEDULED",
        trigger_type: "SCHEDULED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Daily 11 PM", triggerType: "SCHEDULED", schedule: "0 23 * * *" } },
            { id: "query-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Query Paid Invoices", operation: "GET", objectType: "crm_BillingInvoice", filterConditions: [{ field: "payment_status", operator: "equals", value: "PAID" }] } },
            { id: "webhook-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Push ERP Webhook", actionType: "call_webhook", method: "POST", url: "https://finance-api.internal.org/sync" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "query-1", type: "interactive" },
            { id: "e2", source: "query-1", target: "webhook-1", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Inventory & Products
    // ============================================
    {
        id: "low-stock-alert",
        name: "Low Inventory Blackout Warning",
        description: "Senses when product stock dips below threshold and immediately suspends web checkout while pinging ops.",
        category: "Inventory & Products",
        flow_type: "EVENT_DRIVEN",
        trigger_type: "RECORD_UPDATED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Stock Hits Critical", triggerType: "RECORD_UPDATED", objectType: "crm_Products", filterConditions: [{ field: "stock", operator: "less_than", value: "5" }] } },
            { id: "update-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Deactivate Sales", objectType: "crm_Products", fields: [{ field: "active", value: "false" }] } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Alert Fulfilment", actionType: "notify", recipientRole: "OPERATIONS" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "update-1", type: "interactive" },
            { id: "e2", source: "update-1", target: "notify-1", type: "interactive" }
        ]
    },

    // ============================================
    // CATEGORY: Internal Operations & Reports
    // ============================================
    {
        id: "weekly-snapshot-sync",
        name: "Weekly Performance Snapshot Email",
        description: "Extracts an opportunity pipeline query every Monday, has Varuni write an executive summary, and broadcasts it.",
        category: "Internal Operations & Reports",
        flow_type: "SCHEDULED",
        trigger_type: "SCHEDULED",
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 50, y: startY }, data: { label: "Mon 7 AM", triggerType: "SCHEDULED", schedule: "0 7 * * 1" } },
            { id: "query-1", type: "updateRecord", position: { x: 50 + gapX, y: startY }, data: { label: "Fetch Won Deals", operation: "GET", objectType: "crm_Opportunities", filterConditions: [{ field: "Stage", operator: "equals", value: "Closed Won" }] } },
            { id: "varuni-1", type: "varuni", position: { x: 50 + (gapX * 2), y: startY }, data: { label: "Auto-Summarize", model: "claude-sonnet", systemPrompt: "Write a high-energy executive summary praising the team for these closed deals.", contextFields: [{ name: "data", value: "{{query-1.records}}" }], outputVariable: "exec_summary" } },
            { id: "notify-1", type: "action", position: { x: 50 + (gapX * 3), y: startY }, data: { label: "Email C-Suite", actionType: "send_email", recipient: "leadership@company.com" } }
        ],
        edges: [
            { id: "e1", source: "trigger-1", target: "query-1", type: "interactive" },
            { id: "e2", source: "query-1", target: "varuni-1", type: "interactive" },
            { id: "e3", source: "varuni-1", target: "notify-1", type: "interactive" }
        ]
    }
];
