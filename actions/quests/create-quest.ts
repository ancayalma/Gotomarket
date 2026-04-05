"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";
import { checkTeamFeature, checkTeamLimit } from "@/lib/subscription";
import { calculateSprintDates, DurationPreset } from "./calculate-sprint-dates";

export async function createQuest(data: {
    title: string;
    description?: string;
    quest_type: string;
    target_count: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    qp_reward: number;
    xp_reward?: number;
    duration_preset: DurationPreset;
    starts_at?: string | Date;
    ends_at?: string | Date;
    is_recurring?: boolean;
    is_team_wide?: boolean;
    assigned_users?: string[];
    icon?: string;
    color?: string;
    badge_name?: string;
    badge_dna?: any;
    status?: "DRAFT" | "ACTIVE";
}): Promise<{ success: boolean; questId?: string; error?: string }> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId || !teamInfo?.userId) {
            return { success: false, error: "NOT_AUTHENTICATED" };
        }

        // Role check — only admins+ can create
        const role = teamInfo.teamRole as string;
        if (!["SUPER_ADMIN", "OWNER", "ADMIN", "PLATFORM_ADMIN"].includes(role)) {
            return { success: false, error: "INSUFFICIENT_PERMISSIONS" };
        }

        // Plan gating
        const { ObjectId } = require("mongodb");
        const teamCollection = await dbAdapter.getNativeCollection("Team");
        const team = await teamCollection.findOne({ _id: new ObjectId(teamInfo.teamId) });
        if (!team) return { success: false, error: "TEAM_NOT_FOUND" };

        const teamForCheck = {
            subscription_plan: team.subscription_plan || "FREE",
            assigned_plan: team.assigned_plan || null,
            module_overrides: team.module_overrides || [],
        };
        const hasFeature = checkTeamFeature(teamForCheck, "quests");
        if (!hasFeature) {
            return { success: false, error: "PLAN_UPGRADE_REQUIRED" };
        }

        // Check active quest limit
        const questCollection = await dbAdapter.getNativeCollection("Quest");
        const activeCount = await questCollection.countDocuments({
            team_id: new ObjectId(teamInfo.teamId),
            status: "ACTIVE",
        });

        const withinLimit = checkTeamLimit(teamForCheck, "max_active_quests" as any, activeCount);
        if (!withinLimit && data.status === "ACTIVE") {
            return { success: false, error: "QUEST_LIMIT_REACHED" };
        }

        // Calculate sprint dates
        let starts_at: Date | null = null;
        let ends_at: Date | null = null;

        if (data.duration_preset === "CUSTOM") {
            starts_at = data.starts_at ? new Date(data.starts_at) : new Date();
            ends_at = data.ends_at ? new Date(data.ends_at) : null;
        } else if (data.duration_preset !== "OPEN_ENDED") {
            const sprintDates = await calculateSprintDates(data.duration_preset);
            starts_at = sprintDates.starts_at;
            ends_at = sprintDates.ends_at;
        } else {
            starts_at = new Date();
        }

        // Default QP by difficulty
        const defaultQP: Record<string, number> = {
            EASY: 50,
            MEDIUM: 100,
            HARD: 200,
            LEGENDARY: 500,
        };

        const questDoc = {
            title: data.title,
            description: data.description || null,
            icon: data.icon || "Sword",
            color: data.color || "amber",
            quest_type: data.quest_type,
            target_count: data.target_count,
            target_field: null,
            difficulty: data.difficulty,
            qp_reward: data.qp_reward || defaultQP[data.difficulty] || 100,
            xp_reward: data.xp_reward || 10,
            badge_name: data.badge_name || null,
            badge_dna: data.badge_dna || null,
            duration_preset: data.duration_preset,
            status: data.status || "DRAFT",
            starts_at,
            ends_at,
            is_recurring: data.is_recurring || false,
            recurrence_preset: data.is_recurring ? data.duration_preset : null,
            created_by: new ObjectId(teamInfo.userId),
            team_id: new ObjectId(teamInfo.teamId),
            is_team_wide: data.is_team_wide !== false,
            assigned_users: (data.assigned_users || []).map((id: string) => new ObjectId(id)),
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await questCollection.insertOne(questDoc);

        return { success: true, questId: result.insertedId.toString() };
    } catch (error) {
        console.error("[CREATE_QUEST]", error);
        return { success: false, error: "INTERNAL_ERROR" };
    }
}
