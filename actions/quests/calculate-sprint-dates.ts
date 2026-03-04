// Sprint Duration Calculator — utility module (NOT a server action)
// Consumed by create-quest.ts and other server actions internally.

/**
 * Sprint Duration Calculator
 * Converts preset IDs to concrete start/end dates.
 * All presets: WEEKEND_SPRINT, WEEKLY_SPRINT, BIWEEKLY, MONTHLY, QUARTERLY,
 *              STRONG_START, STRONG_FINISH, CUSTOM, OPEN_ENDED
 */

export type DurationPreset =
    | "WEEKEND_SPRINT"
    | "WEEKLY_SPRINT"
    | "BIWEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "STRONG_START"
    | "STRONG_FINISH"
    | "CUSTOM"
    | "OPEN_ENDED";

export interface SprintDates {
    starts_at: Date;
    ends_at: Date | null;
    label: string;
    durationDays: number | null;
}

export const DURATION_PRESETS: { id: DurationPreset; label: string; icon: string; description: string }[] = [
    { id: "WEEKEND_SPRINT", label: "Weekend Blitz", icon: "Flame", description: "Fri 5pm - Sun 11:59pm" },
    { id: "WEEKLY_SPRINT", label: "Weekly Sprint", icon: "Zap", description: "7-day sprint (Mon - Sun)" },
    { id: "BIWEEKLY", label: "Bi-Weekly", icon: "BarChart3", description: "14-day challenge" },
    { id: "MONTHLY", label: "Monthly Mission", icon: "Calendar", description: "Full calendar month" },
    { id: "QUARTERLY", label: "Quarterly Quest", icon: "Trophy", description: "3-month campaign" },
    { id: "STRONG_START", label: "Strong Start", icon: "Rocket", description: "1st - 4th of the month" },
    { id: "STRONG_FINISH", label: "Strong Finish", icon: "Target", description: "28th - 31st of the month" },
    { id: "CUSTOM", label: "Custom Duration", icon: "Settings", description: "Pick exact dates" },
    { id: "OPEN_ENDED", label: "No Deadline", icon: "Infinity", description: "Runs until manually closed" },
];

export async function calculateSprintDates(
    preset: DurationPreset,
    referenceDate?: Date
): Promise<SprintDates> {
    const now = referenceDate || new Date();

    switch (preset) {
        case "WEEKEND_SPRINT": {
            // Snap to next upcoming Friday at 5pm
            const friday = new Date(now);
            const day = friday.getDay();
            const daysUntilFriday = day <= 5 ? (5 - day) : (7 - day + 5);
            friday.setDate(friday.getDate() + (daysUntilFriday === 0 && now.getHours() >= 17 ? 7 : daysUntilFriday));
            friday.setHours(17, 0, 0, 0);
            const sunday = new Date(friday);
            sunday.setDate(sunday.getDate() + 2);
            sunday.setHours(23, 59, 59, 999);
            return { starts_at: friday, ends_at: sunday, label: "Weekend Blitz", durationDays: 3 };
        }

        case "WEEKLY_SPRINT": {
            // Starts next Monday 12:00am, ends Sunday 11:59pm
            const monday = new Date(now);
            const day = monday.getDay();
            const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : (8 - day);
            monday.setDate(monday.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
            monday.setHours(0, 0, 0, 0);
            // If today is Monday and we haven't passed midnight, start today
            if (day === 1 && now.getHours() < 12) {
                monday.setDate(now.getDate());
            }
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            return { starts_at: monday, ends_at: sunday, label: "Weekly Sprint", durationDays: 7 };
        }

        case "BIWEEKLY": {
            // 14 days from next Monday
            const monday = new Date(now);
            const day = monday.getDay();
            const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : (8 - day);
            monday.setDate(monday.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
            monday.setHours(0, 0, 0, 0);
            if (day === 1 && now.getHours() < 12) {
                monday.setDate(now.getDate());
            }
            const end = new Date(monday);
            end.setDate(end.getDate() + 13);
            end.setHours(23, 59, 59, 999);
            return { starts_at: monday, ends_at: end, label: "Bi-Weekly Challenge", durationDays: 14 };
        }

        case "MONTHLY": {
            // 1st to last day of current/next month
            let year = now.getFullYear();
            let month = now.getMonth();
            // If we're past the 5th, start next month
            if (now.getDate() > 5) {
                month += 1;
                if (month > 11) { month = 0; year += 1; }
            }
            const start = new Date(year, month, 1, 0, 0, 0, 0);
            const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
            const days = end.getDate();
            return { starts_at: start, ends_at: end, label: "Monthly Mission", durationDays: days };
        }

        case "QUARTERLY": {
            // Quarter blocks: Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec
            const quarter = Math.floor(now.getMonth() / 3);
            let startMonth = quarter * 3;
            let year = now.getFullYear();
            // If we're past the first month of the quarter, start next quarter
            if (now.getMonth() > startMonth) {
                startMonth += 3;
                if (startMonth > 11) { startMonth = 0; year += 1; }
            }
            const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
            const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return { starts_at: start, ends_at: end, label: "Quarterly Quest", durationDays: days };
        }

        case "STRONG_START": {
            // 1st - 4th of the current or next month
            let year = now.getFullYear();
            let month = now.getMonth();
            if (now.getDate() > 4) {
                month += 1;
                if (month > 11) { month = 0; year += 1; }
            }
            const start = new Date(year, month, 1, 0, 0, 0, 0);
            const end = new Date(year, month, 4, 23, 59, 59, 999);
            return { starts_at: start, ends_at: end, label: "Strong Start", durationDays: 4 };
        }

        case "STRONG_FINISH": {
            // 28th - last day of current or next month
            let year = now.getFullYear();
            let month = now.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            if (now.getDate() > 28) {
                month += 1;
                if (month > 11) { month = 0; year += 1; }
            }
            const targetLastDay = new Date(year, month + 1, 0).getDate();
            const start = new Date(year, month, 28, 0, 0, 0, 0);
            const end = new Date(year, month, targetLastDay, 23, 59, 59, 999);
            return { starts_at: start, ends_at: end, label: "Strong Finish", durationDays: targetLastDay - 27 };
        }

        case "OPEN_ENDED": {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return { starts_at: start, ends_at: null, label: "No Deadline", durationDays: null };
        }

        case "CUSTOM":
        default: {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return { starts_at: start, ends_at: null, label: "Custom Duration", durationDays: null };
        }
    }
}
