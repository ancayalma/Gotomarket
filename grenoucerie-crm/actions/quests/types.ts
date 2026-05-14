/**
 * Shared Quest types used across server actions and UI components.
 * NOT a "use server" file — just type definitions.
 */

export interface QuestWithProgress {
    _id: string;
    id: string;
    title: string;
    description?: string;
    icon: string;
    color: string;
    quest_type: string;
    target_count: number;
    target_field?: string;
    difficulty: string;
    qp_reward: number;
    xp_reward: number;
    badge_name?: string;
    badge_dna?: any;
    duration_preset?: string;
    status: string;
    starts_at?: Date | string;
    ends_at?: Date | string;
    is_recurring: boolean;
    recurrence_preset?: string;
    created_by: string;
    team_id: string;
    is_team_wide: boolean;
    assigned_users: string[];
    created_at: Date | string;
    updated_at: Date | string;
    // Aggregated
    progress?: {
        current_count: number;
        is_completed: boolean;
        completed_at?: Date | string;
        qp_awarded: number;
    };
    team_progress?: {
        total_participants: number;
        accepted_count: number;
        completed_count: number;
    };
}
