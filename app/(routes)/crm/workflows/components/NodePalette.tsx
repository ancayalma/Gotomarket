"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
    Clock,
    Mail,
    MessageSquare,
    CheckSquare,
    Bell,
    GitBranch,
    Database,
    Repeat,
    CheckCircle2,
    FileEdit,
    Shield,
    StickyNote,
    Image as ImageIcon,
    FileCode,
    Sparkles,
    Zap,
    FileText,
    UserPlus,
    AlertTriangle,
    Calendar,
    Globe,
    Trash2,
    Search,
    LayoutGrid,
    UserCheck,
    ArrowRightLeft,
    BookOpen,
    Handshake,
    BarChart3,
    Send,
    Receipt,
    BadgeDollarSign,
    Trophy,
    Webhook,
} from "lucide-react";

interface NodePaletteProps {
    onAddNode: (type: string, label: string, initialData?: Record<string, unknown>) => void;
}

interface PaletteItem {
    type: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    initialData?: Record<string, unknown>;
}

interface PaletteCategory {
    title: string;
    items: PaletteItem[];
}

const nodeCategories: PaletteCategory[] = [
    {
        title: "Triggers",
        items: [
            {
                type: "trigger",
                label: "Form Submitted",
                description: "When a form receives a submission",
                icon: FileText,
                color: "text-orange-500",
                initialData: { triggerType: "FORM_SUBMITTED", objectType: "crm_FormSubmissions" },
            },
            {
                type: "trigger",
                label: "Lead Created",
                description: "When a new lead is created",
                icon: UserPlus,
                color: "text-orange-500",
                initialData: { triggerType: "LEAD_CREATED", objectType: "crm_Leads" },
            },
            {
                type: "trigger",
                label: "Record Created",
                description: "When any CRM record is created",
                icon: Database,
                color: "text-orange-500",
                initialData: { triggerType: "RECORD_CREATED" },
            },
            {
                type: "trigger",
                label: "Record Updated",
                description: "When any CRM record is modified",
                icon: FileEdit,
                color: "text-orange-400",
                initialData: { triggerType: "RECORD_UPDATED" },
            },
            {
                type: "trigger",
                label: "Record Deleted",
                description: "When a CRM record is removed",
                icon: Trash2,
                color: "text-orange-400",
                initialData: { triggerType: "RECORD_DELETED" },
            },
            {
                type: "trigger",
                label: "Case Created",
                description: "When a support case is opened",
                icon: AlertTriangle,
                color: "text-orange-500",
                initialData: { triggerType: "CASE_CREATED", objectType: "crm_Cases" },
            },
            {
                type: "trigger",
                label: "Case Escalated",
                description: "SLA breached or escalation increased",
                icon: AlertTriangle,
                color: "text-rose-500",
                initialData: { triggerType: "CASE_ESCALATED", objectType: "crm_Cases" },
            },
            {
                type: "trigger",
                label: "Deal Won",
                description: "Opportunity closes as won",
                icon: Trophy,
                color: "text-emerald-500",
                initialData: { triggerType: "DEAL_WON", objectType: "crm_Opportunities" },
            },
            {
                type: "trigger",
                label: "Deal Lost",
                description: "Opportunity closes as lost",
                icon: Handshake,
                color: "text-rose-500",
                initialData: { triggerType: "DEAL_LOST", objectType: "crm_Opportunities" },
            },
            {
                type: "trigger",
                label: "Outreach Replied",
                description: "Email/SMS receives a reply",
                icon: Send,
                color: "text-orange-400",
                initialData: { triggerType: "OUTREACH_REPLIED", objectType: "crm_Outreach_Items" },
            },
            {
                type: "trigger",
                label: "Contract Expiring",
                description: "Contract end date approaching",
                icon: FileText,
                color: "text-amber-500",
                initialData: { triggerType: "CONTRACT_EXPIRING", objectType: "crm_Contracts" },
            },
            {
                type: "trigger",
                label: "Subscription Renewed",
                description: "Recurring billing cycle fires",
                icon: BadgeDollarSign,
                color: "text-emerald-400",
                initialData: { triggerType: "SUBSCRIPTION_RENEWED", objectType: "crm_Subscriptions" },
            },
            {
                type: "trigger",
                label: "Invoice Overdue",
                description: "Invoice payment is past due",
                icon: Receipt,
                color: "text-rose-500",
                initialData: { triggerType: "INVOICE_OVERDUE", objectType: "crm_BillingInvoice" },
            },
            {
                type: "trigger",
                label: "Scheduled",
                description: "Run on a cron schedule",
                icon: Calendar,
                color: "text-blue-400",
                initialData: { triggerType: "SCHEDULED" },
            },
            {
                type: "trigger",
                label: "Webhook",
                description: "External system trigger",
                icon: Webhook,
                color: "text-cyan-500",
                initialData: { triggerType: "MANUAL" },
            },
            {
                type: "trigger",
                label: "Approval Response",
                description: "When approval is accepted/rejected",
                icon: CheckCircle2,
                color: "text-orange-400",
                initialData: { triggerType: "APPROVAL_RESPONSE" },
            },
        ],
    },
    {
        title: "Flow Control",
        items: [
            {
                type: "condition",
                label: "Decision",
                description: "If / Else branch",
                icon: GitBranch,
                color: "text-amber-500",
            },
            {
                type: "delay",
                label: "Wait",
                description: "Pause before next step",
                icon: Clock,
                color: "text-blue-500",
            },
            {
                type: "loop",
                label: "Loop",
                description: "Iterate over collection",
                icon: Repeat,
                color: "text-indigo-500",
            },
        ],
    },
    {
        title: "Actions",
        items: [
            {
                type: "action",
                label: "Send Email",
                description: "Send an email",
                icon: Mail,
                color: "text-green-500",
                initialData: { actionType: "send_email" },
            },
            {
                type: "action",
                label: "Send SMS",
                description: "Send a text message",
                icon: MessageSquare,
                color: "text-green-500",
                initialData: { actionType: "send_sms" },
            },
            {
                type: "action",
                label: "Create Task",
                description: "Create a task for team",
                icon: CheckSquare,
                color: "text-green-500",
                initialData: { actionType: "create_task" },
            },
            {
                type: "action",
                label: "Notify",
                description: "Send notification",
                icon: Bell,
                color: "text-green-500",
                initialData: { actionType: "notify" },
            },
            {
                type: "action",
                label: "Convert Lead",
                description: "Lead → Opportunity + Contact + Account",
                icon: ArrowRightLeft,
                color: "text-cyan-400",
                initialData: { actionType: "convert_lead" },
            },
            {
                type: "action",
                label: "Assign Owner",
                description: "Change record owner",
                icon: UserCheck,
                color: "text-violet-400",
                initialData: { actionType: "assign_owner" },
            },
            {
                type: "action",
                label: "Update Field",
                description: "Quick field update",
                icon: FileEdit,
                color: "text-sky-400",
                initialData: { actionType: "update_field" },
            },
            {
                type: "action",
                label: "Create DealRoom",
                description: "Generate a DealRoom from contract",
                icon: Handshake,
                color: "text-teal-400",
                initialData: { actionType: "create_deal_room" },
            },
            {
                type: "action",
                label: "Log Activity",
                description: "Log a lead/contact activity",
                icon: BookOpen,
                color: "text-amber-400",
                initialData: { actionType: "log_activity" },
            },
        ],
    },
    {
        title: "Data",
        items: [
            {
                type: "updateRecord",
                label: "Create Record",
                description: "Create a new record",
                icon: Database,
                color: "text-cyan-500",
                initialData: { operation: "CREATE" },
            },
            {
                type: "updateRecord",
                label: "Update Record",
                description: "Modify existing record",
                icon: FileEdit,
                color: "text-cyan-500",
                initialData: { operation: "UPDATE" },
            },
            {
                type: "updateRecord",
                label: "Get Records",
                description: "Query records",
                icon: Search,
                color: "text-slate-400",
                initialData: { operation: "GET" },
            },
            {
                type: "updateRecord",
                label: "Delete Record",
                description: "Remove a record",
                icon: Trash2,
                color: "text-rose-500",
                initialData: { operation: "DELETE" },
            },
        ],
    },
    {
        title: "Integrations",
        items: [
            {
                type: "action",
                label: "HTTP Request",
                description: "Call an external API",
                icon: Globe,
                color: "text-violet-500",
                initialData: { actionType: "call_webhook" },
            },
        ],
    },
    {
        title: "AI Agent",
        items: [
            {
                type: "varuni",
                label: "Varuni Execution",
                description: "Run an AI operation",
                icon: Sparkles,
                color: "text-cyan-400",
            },
        ],
    },
    {
        title: "Screens & Approvals",
        items: [
            {
                type: "screen",
                label: "Screen",
                description: "Collect user input",
                icon: LayoutGrid,
                color: "text-purple-500",
            },
            {
                type: "approval",
                label: "Approval",
                description: "Submit for approval",
                icon: CheckCircle2,
                color: "text-rose-500",
            },
        ],
    },
    {
        title: "Visuals & Assets",
        items: [
            {
                type: "note",
                label: "Sticky Note",
                description: "Add a text annotation",
                icon: StickyNote,
                color: "text-amber-500",
                initialData: { type: "note" },
            },
            {
                type: "image",
                label: "Image Asset",
                description: "Embed an image URL",
                icon: ImageIcon,
                color: "text-blue-400",
                initialData: { type: "image" },
            },
            {
                type: "svg",
                label: "SVG Vector",
                description: "Paste SVG code",
                icon: FileCode,
                color: "text-cyan-400",
                initialData: { type: "svg" },
            },
        ],
    },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
    const [search, setSearch] = useState("");

    const filteredCategories = nodeCategories
        .map((cat) => ({
            ...cat,
            items: cat.items.filter(
                (item) =>
                    item.label.toLowerCase().includes(search.toLowerCase()) ||
                    item.description.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((cat) => cat.items.length > 0);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="pb-3 pt-2 shrink-0">
                <div className="text-xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-none py-1 flex items-center gap-2 whitespace-nowrap overflow-visible">
                    <Shield className="h-4 w-4 text-orange-500 shrink-0" />
                    Steps
                </div>
                <div className="text-xs text-muted-foreground mt-1 mb-2">
                    Drag or click to add to canvas
                </div>
                <Input
                    placeholder="Search nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-xs bg-black/30 border-white/10 focus:border-cyan-500/50"
                />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-4 px-4 pb-12 space-y-4 pr-2 hover:custom-scrollbar">
                {filteredCategories.map((category, catIdx) => (
                    <div key={category.title}>
                        {catIdx > 0 && <Separator className="mb-3 bg-white/5" />}
                        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1.5 px-1 font-mono">
                            {category.title}
                            <span className="ml-1.5 text-muted-foreground/40">{category.items.length}</span>
                        </div>
                        <div className="space-y-1">
                            {category.items.map((option, index) => {
                                const Icon = option.icon;
                                return (
                                    <Button
                                        key={`${option.type}-${option.label}-${index}`}
                                        variant="ghost"
                                        size="sm"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("application/reactflow", option.type);
                                            e.dataTransfer.setData("application/reactflow-label", option.label);
                                            e.dataTransfer.setData(
                                                "application/reactflow-data",
                                                JSON.stringify(option.initialData || {})
                                            );
                                            e.dataTransfer.effectAllowed = "move";
                                        }}
                                        className="w-full justify-start gap-3 h-auto py-2 px-3 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all rounded-xl relative group overflow-hidden cursor-grab active:cursor-grabbing"
                                        onClick={() => onAddNode(option.type, option.label, option.initialData)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                                        <div className={`p-1.5 rounded-lg bg-black/40 ring-1 ring-white/10 ${option.color.replace('text-', 'bg-').replace('400', '400/10').replace('500', '500/10')}`}>
                                            <Icon className={`h-3.5 w-3.5 shrink-0 ${option.color}`} />
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="text-xs font-bold text-white/90 tracking-wide text-wrap leading-tight mb-0.5">{option.label}</div>
                                            <div className="text-[10px] text-muted-foreground/60 leading-tight text-wrap">
                                                {option.description}
                                            </div>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {filteredCategories.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 text-center py-8">
                        No nodes match &quot;{search}&quot;
                    </div>
                )}
            </div>
        </div>
    );
}
