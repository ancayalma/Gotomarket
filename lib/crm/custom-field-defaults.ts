/**
 * Custom Field Definitions for CRM Accounts
 * 
 * These define the shape of team-level custom fields that can be added to accounts.
 * Each field specifies which tab it appears on in the Account Detail view.
 */

export type CustomFieldType = "text" | "textarea" | "number" | "date" | "select" | "url" | "currency" | "email" | "phone";

export interface CustomFieldOption {
    label: string;
    value: string;
}

export interface CustomFieldDefinition {
    key: string;          // Unique identifier (snake_case)
    label: string;        // Display label
    type: CustomFieldType;
    tab: string;          // Tab name in account detail view
    placeholder?: string;
    required?: boolean;
    options?: CustomFieldOption[]; // For 'select' type
    description?: string; // Help text below the field
    order?: number;       // Sort order within its tab
    isCollection?: boolean; // If true, this tab represents an array of objects
}

export interface CustomFieldTemplatePack {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    color: string; // Tailwind color class
    fields: CustomFieldDefinition[];
}

// ---------------------------------------------------------------------------
// Default Template Packs
// ---------------------------------------------------------------------------

export const CUSTOM_FIELD_TEMPLATE_PACKS: CustomFieldTemplatePack[] = [
    {
        id: "purchase_history",
        name: "Purchase History",
        description: "Track past purchases, order values, and buying patterns",
        icon: "ShoppingCart",
        color: "emerald",
        fields: [
            {
                key: "previous_purchases",
                label: "Previous Purchases",
                type: "textarea",
                tab: "Purchase History",
                placeholder: "List past purchases, order numbers, product lines...",
                description: "Log past purchases, subscriptions, or order history for this account",
                order: 1,
            },
            {
                key: "purchase_amount",
                label: "Total Purchase Value",
                type: "currency",
                tab: "Purchase History",
                placeholder: "0.00",
                description: "Historical total purchase value in USD",
                order: 2,
            },
            {
                key: "last_purchase_date",
                label: "Last Purchase Date",
                type: "date",
                tab: "Purchase History",
                description: "Date of the most recent purchase",
                order: 3,
            },
        ],
    },
    {
        id: "manual_outreach",
        name: "Manual Outreach",
        description: "Document manual calls, emails, and in-person meetings",
        icon: "PhoneOutgoing",
        color: "blue",
        fields: [
            {
                key: "outreach_notes",
                label: "Outreach Notes",
                type: "textarea",
                tab: "Manual Outreach",
                placeholder: "Key takeaways from the conversation...",
                description: "Notes from the most recent manual outreach activity",
                order: 1,
            },
            {
                key: "outreach_date",
                label: "Last Outreach Date",
                type: "date",
                tab: "Manual Outreach",
                description: "When the last manual contact was made",
                order: 2,
            },
            {
                key: "outreach_method",
                label: "Outreach Method",
                type: "select",
                tab: "Manual Outreach",
                description: "Channel used for the latest outreach",
                options: [
                    { label: "Phone Call", value: "call" },
                    { label: "Email", value: "email" },
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "In-Person", value: "in_person" },
                    { label: "Video Call", value: "video" },
                    { label: "SMS", value: "sms" },
                ],
                order: 3,
            },
            {
                key: "outreach_outcome",
                label: "Outreach Outcome",
                type: "select",
                tab: "Manual Outreach",
                description: "Result of the latest outreach attempt",
                options: [
                    { label: "Interested", value: "interested" },
                    { label: "Not Interested", value: "not_interested" },
                    { label: "Follow Up Needed", value: "follow_up" },
                    { label: "No Response", value: "no_response" },
                    { label: "Meeting Scheduled", value: "meeting_scheduled" },
                    { label: "Deal in Progress", value: "deal_in_progress" },
                ],
                order: 4,
            },
        ],
    },
    {
        id: "competitive_intel",
        name: "Competitive Intel",
        description: "Track competitive landscape and displacement opportunities",
        icon: "Swords",
        color: "red",
        fields: [
            {
                key: "competitor_name",
                label: "Primary Competitor",
                type: "text",
                tab: "Competitive Intel",
                placeholder: "Salesforce, HubSpot, etc.",
                description: "The primary competitor this account is currently using or evaluating",
                order: 1,
            },
            {
                key: "competitor_product",
                label: "Competitor Product",
                type: "text",
                tab: "Competitive Intel",
                placeholder: "Product/tier they use...",
                description: "Competitor's specific product or plan the account is on",
                order: 2,
            },
            {
                key: "competitive_notes",
                label: "Competitive Notes",
                type: "textarea",
                tab: "Competitive Intel",
                placeholder: "Pain points, switching triggers, contract dates...",
                description: "Intel about the account's relationship with competitors",
                order: 3,
            },
            {
                key: "displacement_likelihood",
                label: "Displacement Likelihood",
                type: "select",
                tab: "Competitive Intel",
                description: "How likely are they to switch from the competitor",
                options: [
                    { label: "Very High", value: "very_high" },
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                    { label: "Locked In", value: "locked" },
                ],
                order: 4,
            },
        ],
    },
    {
        id: "renewals",
        name: "Renewals & Contracts",
        description: "Monitor contract renewals and subscription lifecycle",
        icon: "CalendarClock",
        color: "amber",
        fields: [
            {
                key: "contract_renewal_date",
                label: "Contract Renewal Date",
                type: "date",
                tab: "Renewals",
                description: "When the current contract is up for renewal",
                order: 1,
            },
            {
                key: "contract_value",
                label: "Contract Value",
                type: "currency",
                tab: "Renewals",
                placeholder: "0.00",
                description: "Annual contract value (ACV)",
                order: 2,
            },
            {
                key: "renewal_likelihood",
                label: "Renewal Likelihood",
                type: "select",
                tab: "Renewals",
                description: "Estimated likelihood of contract renewal",
                options: [
                    { label: "Certain", value: "certain" },
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "At Risk", value: "at_risk" },
                    { label: "Churning", value: "churning" },
                ],
                order: 3,
            },
            {
                key: "renewal_notes",
                label: "Renewal Notes",
                type: "textarea",
                tab: "Renewals",
                placeholder: "Expansion opportunities, blockers, stakeholder changes...",
                description: "Context for the renewal decision",
                order: 4,
            },
        ],
    },
    {
        id: "customer_health",
        name: "Customer Health",
        description: "Track satisfaction, engagement, and overall account health",
        icon: "HeartPulse",
        color: "violet",
        fields: [
            {
                key: "satisfaction_score",
                label: "Satisfaction Score",
                type: "number",
                tab: "Customer Health",
                placeholder: "1-10",
                description: "NPS, CSAT, or custom satisfaction score (1-10 scale)",
                order: 1,
            },
            {
                key: "health_status",
                label: "Health Status",
                type: "select",
                tab: "Customer Health",
                description: "Overall account health assessment",
                options: [
                    { label: "Thriving", value: "thriving" },
                    { label: "Healthy", value: "healthy" },
                    { label: "Neutral", value: "neutral" },
                    { label: "Declining", value: "declining" },
                    { label: "Critical", value: "critical" },
                ],
                order: 2,
            },
            {
                key: "health_notes",
                label: "Health Notes",
                type: "textarea",
                tab: "Customer Health",
                placeholder: "User adoption trends, support ticket patterns, executive sentiment...",
                description: "Qualitative assessment of account health and engagement",
                order: 3,
            },
            {
                key: "last_review_date",
                label: "Last Business Review",
                type: "date",
                tab: "Customer Health",
                description: "Date of the most recent QBR or check-in meeting",
                order: 4,
            },
        ],
    },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Get unique tab names from a set of field definitions */
export function getCustomFieldTabs(definitions: CustomFieldDefinition[]): string[] {
    const tabs = new Set<string>();
    definitions.forEach(d => tabs.add(d.tab));
    return Array.from(tabs);
}

/** Group field definitions by tab name */
export function groupFieldsByTab(definitions: CustomFieldDefinition[]): Record<string, CustomFieldDefinition[]> {
    const groups: Record<string, CustomFieldDefinition[]> = {};
    definitions.forEach(d => {
        if (!groups[d.tab]) groups[d.tab] = [];
        groups[d.tab].push(d);
    });
    // Sort within each group by order
    Object.values(groups).forEach(fields => fields.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)));
    return groups;
}

/** Merge new template fields into existing definitions, avoiding duplicate keys */
export function mergeTemplateFields(
    existing: CustomFieldDefinition[],
    templateFields: CustomFieldDefinition[]
): CustomFieldDefinition[] {
    const existingKeys = new Set(existing.map(f => f.key));
    const newFields = templateFields.filter(f => !existingKeys.has(f.key));
    return [...existing, ...newFields];
}
