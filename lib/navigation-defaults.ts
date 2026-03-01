
import {
    Home, Users, Target, Radio, FileText, Phone, Package, Headset, Megaphone, Wand2, FormInput, Building2, Contact, Folder, CheckSquare, FileCheck, FileBarChart, UserCog, Zap, Shield, CheckCircle2, Wrench, GraduationCap, Globe, Mail, ServerIcon, MessageSquare, Calendar, List, Settings, LayoutDashboard
} from "lucide-react";

export type NavItemType = "item" | "group" | "separator";

export interface NavPermission {
    module?: string;
    feature?: string;
    minRole?: "MEMBER" | "ADMIN" | "PLATFORM_ADMIN" | "PARTNER_ADMIN"; // ADMIN = isNonMember in current logic
}

export interface NavItem {
    id: string;
    type: NavItemType;
    label: string;
    iconName?: string;
    href?: string;
    children?: NavItem[];
    permissions?: NavPermission;
    isSystem?: boolean; // If true, can't be deleted?
    badge?: string; // e.g. "serviceBadge"
    hidden?: boolean;
    isPremium?: boolean; // If true, shows lock icon if user doesn't have permission
}

export const DEFAULT_NAV_STRUCTURE: NavItem[] = [
    // 1. HOME
    {
        id: "nav_home",
        type: "item",
        label: "Dashboard",
        iconName: "Home",
        href: "/dashboard"
    },

    // 2. MARKETING HUB
    {
        id: "group_marketing",
        type: "group",
        label: "Marketing Hub",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_accounts",
                type: "item",
                label: "Accounts",
                iconName: "Building2",
                href: "/crm/accounts",
                children: [
                    { id: "sub_accounts_all", type: "item", label: "All Accounts", href: "/crm/accounts?tab=accounts", iconName: "Building2" },
                    { id: "sub_accounts_wizard", type: "item", label: "LeadGen Wizard", href: "/crm/accounts?tab=wizard", iconName: "Wand2" }
                ]
            },
            {
                id: "nav_contacts",
                type: "item",
                label: "Contacts",
                iconName: "Contact",
                href: "/crm/contacts"
            },
            {
                id: "nav_lists",
                type: "item",
                label: "Lists",
                iconName: "List",
                href: "/lists",
                permissions: { minRole: "ADMIN" }
            },
            {
                id: "nav_campaigns",
                type: "item",
                label: "Campaigns",
                iconName: "Megaphone",
                href: "/campaigns",
                permissions: { minRole: "ADMIN" }
            },
            {
                id: "nav_forms",
                type: "item",
                label: "Forms",
                iconName: "FormInput",
                href: "/messages/forms",
                permissions: { module: "messages", feature: "messages" }
            },
            {
                id: "nav_calendar",
                type: "item",
                label: "Calendar",
                iconName: "Calendar",
                href: "/crm/calendar",
                permissions: { minRole: "ADMIN" }
            }
        ]
    },

    // 3. SALES HUB
    {
        id: "group_sales",
        type: "group",
        label: "Sales Hub",
        children: [

            {
                id: "nav_command",
                type: "item",
                label: "Command",
                iconName: "Radio",
                href: "/crm/sales-command"
            },
            {
                id: "nav_leads",
                type: "item",
                label: "Leads",
                iconName: "Users",
                href: "/crm/leads"
            },
            {
                id: "nav_deals",
                type: "item",
                label: "Deals",
                iconName: "Target",
                href: "/crm/opportunities",
                children: [
                    { id: "sub_deals_pipeline", type: "item", label: "Pipeline View", href: "/crm/opportunities" },
                    { id: "sub_deals_closed", type: "item", label: "Won / Lost", href: "/crm/opportunities?view=closed" }
                ]
            },
            {
                id: "nav_projects",
                type: "item",
                label: "Projects",
                iconName: "ServerIcon",
                href: "/projects",
                permissions: { module: "projects", feature: "projects" }
            },
            {
                id: "nav_dialer",
                type: "item",
                label: "Dialer",
                iconName: "Phone",
                href: "/crm/dialer"
            },
            {
                id: "nav_quotes",
                type: "item",
                label: "Quotes",
                iconName: "FileText",
                href: "/crm/quotes"
            },
            {
                id: "nav_insights",
                type: "item",
                label: "Insights",
                iconName: "Zap",
                href: "/crm/insights",
                badge: "new"
            }
        ]
    },

    // 4. SERVICE HUB
    {
        id: "group_service",
        type: "group",
        label: "Service Hub",
        children: [
            {
                id: "nav_service",
                type: "item",
                label: "Service",
                iconName: "Headset",
                href: "/crm/cases",
                badge: "serviceBadge",
                children: [
                    { id: "sub_service_workspace", type: "item", label: "Agent Workspace", href: "/crm/cases" },
                    { id: "sub_service_queue", type: "item", label: "Case Queue", href: "/crm/cases?view=queue" },
                    { id: "sub_service_kb", type: "item", label: "Knowledge Base", href: "/crm/cases?view=kb" }
                ]
            },
            {
                id: "nav_messages",
                type: "item",
                label: "Messages",
                iconName: "MessageSquare",
                href: "/messages",
                permissions: { module: "messages" },
                children: [
                    { id: "sub_messages_inbox", type: "item", label: "Inbox", href: "/messages", iconName: "Mail" },
                    { id: "sub_messages_forms", type: "item", label: "Forms", href: "/messages/forms", iconName: "FormInput" }
                ]
            }
        ]
    },

    // 5. INSIGHTS & FINANCE
    {
        id: "group_management",
        type: "group",
        label: "Finance",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_invoices",
                type: "item",
                label: "Invoices",
                iconName: "FileCheck",
                href: "/invoice",
                permissions: { module: "invoice" }
            },
            {
                id: "nav_reports",
                type: "item",
                label: "Reports",
                iconName: "FileBarChart",
                href: "/reports",
                permissions: { module: "reports", feature: "reports" },
                isPremium: true
            },
            {
                id: "nav_staff",
                type: "item",
                label: "Staff",
                iconName: "UserCog",
                href: "/employees",
                permissions: { module: "employee", feature: "employee" },
                children: [
                    { id: "sub_staff_all", type: "item", label: "All Staff", href: "/employees", iconName: "Users" },
                    { id: "sub_staff_kpis", type: "item", label: "KPI Tracking", href: "/employees?tab=kpis", iconName: "FileBarChart" },
                    { id: "sub_staff_evals", type: "item", label: "Evaluations", href: "/employees?tab=evals", iconName: "FileCheck" }
                ]
            }
        ]
    },

    // 6. OPERATIONS
    {
        id: "group_operations",
        type: "group",
        label: "Operations",
        children: [
            {
                id: "nav_contracts",
                type: "item",
                label: "Contracts",
                iconName: "FileText",
                href: "/crm/contracts"
            },
            {
                id: "nav_products",
                type: "item",
                label: "Products",
                iconName: "Package",
                href: "/crm/products"
            }
        ]
    },

    // 7. AUTOMATION
    {
        id: "group_automation",
        type: "group",
        label: "Automation",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_approvals",
                type: "item",
                label: "Approvals",
                iconName: "CheckCircle2",
                href: "/crm/approvals"
            },
            {
                id: "nav_flows",
                type: "item",
                label: "Flows",
                iconName: "Zap",
                href: "/crm/workflows",
                children: [
                    { id: "sub_flows_all", type: "item", label: "All Workflows", href: "/crm/workflows" },
                    { id: "sub_flows_editor", type: "item", label: "Visual Editor", href: "/crm/workflows?view=editor" }
                ]
            },
            {
                id: "nav_guards",
                type: "item",
                label: "Guards",
                iconName: "Shield",
                href: "/crm/validation-rules"
            }
        ]
    },

    // 8. SYSTEM
    {
        id: "group_system",
        type: "group",
        label: "System",
        permissions: { minRole: "ADMIN" },
        children: [
            {
                id: "nav_admin",
                type: "item",
                label: "Admin",
                iconName: "Wrench",
                href: "/admin",
                children: [
                    { id: "sub_admin_overview", type: "item", label: "Overview", href: "/admin?tab=overview", iconName: "LayoutDashboard" },
                    { id: "sub_admin_depts", type: "item", label: "Departments", href: "/admin?tab=departments", iconName: "Building2" },
                    { id: "sub_admin_users", type: "item", label: "Users", href: "/admin", iconName: "Users" }
                ]
            },
            {
                id: "nav_learn",
                type: "item",
                label: "Learn",
                iconName: "GraduationCap",
                href: "/crm/university"
            },
            {
                id: "nav_audit",
                type: "item",
                label: "Audit Logs",
                iconName: "Shield",
                href: "/settings/audit-logs",
                permissions: { minRole: "ADMIN" }
            },
            {
                id: "nav_platform",
                type: "item",
                label: "Platform",
                iconName: "Globe",
                href: "/partners",
                permissions: { minRole: "PLATFORM_ADMIN" },
                children: [
                    { id: "sub_platform_team", type: "item", label: "Team Management", href: "/partners" },
                    { id: "sub_platform_keys", type: "item", label: "System Keys", href: "/partners/ai-system-config" },
                    { id: "sub_platform_pricing", type: "item", label: "Model Pricing", href: "/partners/ai-pricing" },
                    { id: "sub_platform_email", type: "item", label: "System Email", href: "/partners/email-system-config" },
                    { id: "sub_platform_plans", type: "item", label: "Manage Plans", href: "/partners/plans" }
                ]
            }
        ]
    }

];
