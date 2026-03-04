export type WidgetItem = {
    id: string;
    isVisible: boolean;
};

export const defaultWidgets: WidgetItem[] = [
    // --- SEGMENT 1: THE REVENUE & HEALTH METRICS ---
    { id: "actual_revenue", isVisible: true },
    { id: "unrealized_revenue", isVisible: true },
    { id: "projected_revenue", isVisible: true },
    { id: "active_users", isVisible: true },
    { id: "active_pipeline", isVisible: true },
    { id: "my_schedule", isVisible: true },
    { id: "system_uptime", isVisible: true },
    { id: "system_health", isVisible: true },
    { id: "response_time", isVisible: true },
    { id: "conversion_rate", isVisible: false },
    { id: "avg_deal_size", isVisible: false },

    { id: "divider-1", isVisible: true },

    // --- SEGMENT 2: OPERATIONAL VIEWS ---
    { id: "leads", isVisible: false },
    { id: "tasks", isVisible: false },
    { id: "projects", isVisible: false },
    { id: "messages", isVisible: false },

    { id: "divider-2", isVisible: true },

    { id: "personal_pipeline", isVisible: true },
    { id: "team_pipeline", isVisible: true },

    // --- SEGMENT 3: HUB GRID & EXTENDED ---
    { id: "crm_entities_grid", isVisible: true },

    // --- SEGMENT 4: INTELLIGENCE & ANALYTICS ---
    { id: "win_rate", isVisible: false },
    { id: "lead_velocity", isVisible: false },
    { id: "invoice_aging", isVisible: false },
    { id: "meeting_efficiency", isVisible: false },
    { id: "ai_savings", isVisible: false },
    { id: "leaderboard", isVisible: false },
    { id: "lead_sources", isVisible: false },
    { id: "deal_forecast", isVisible: false },
    { id: "activity_heatmap", isVisible: false },
    { id: "customer_churn", isVisible: false },
    { id: "ticket_volume", isVisible: false },
    { id: "sales_cycle_length", isVisible: false },
    { id: "high_priority_tasks", isVisible: false },
    { id: "pending_approvals", isVisible: false },
    { id: "unread_messages", isVisible: false },

    // Hidden/Optional Operations & Analytics
    { id: "team_activity", isVisible: false },
    { id: "recent_files", isVisible: false },
    { id: "revenue_pacing", isVisible: false },
    { id: "outreach_roi", isVisible: false },
    { id: "lead_pools", isVisible: false },
    { id: "lead_wizard", isVisible: false },
    { id: "ai_insights", isVisible: false },
    { id: "ai_daily_pulse", isVisible: true },
    { id: "neural_engagement_pulse", isVisible: true },
];
