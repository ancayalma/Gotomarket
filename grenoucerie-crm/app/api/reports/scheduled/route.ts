import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// ── Cron presets for user-friendly selection ─────────────────────────────────
export const SCHEDULE_PRESETS = {
    "daily_9am": { label: "Daily at 9:00 AM", cron: "0 9 * * *" },
    "weekdays_9am": { label: "Weekdays at 9:00 AM", cron: "0 9 * * 1-5" },
    "weekly_monday": { label: "Weekly on Monday at 9:00 AM", cron: "0 9 * * 1" },
    "weekly_friday": { label: "Weekly on Friday at 5:00 PM", cron: "0 17 * * 5" },
    "biweekly": { label: "Every 2 Weeks on Monday", cron: "0 9 1,15 * *" },
    "monthly_first": { label: "Monthly on the 1st at 9:00 AM", cron: "0 9 1 * *" },
    "quarterly": { label: "Quarterly (Jan, Apr, Jul, Oct 1st)", cron: "0 9 1 1,4,7,10 *" },
} as const;

/**
 * POST /api/reports/scheduled
 * Create or update a report schedule.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { reportId, schedule_enabled, schedule_cron, schedule_recipients, schedule_format, schedule_timezone } = body;

        if (!reportId) {
            return new NextResponse("reportId is required", { status: 400 });
        }

        // Verify ownership
        const report = await prismadb.savedReport.findFirst({
            where: { id: reportId, userId: session.user.id },
        });

        if (!report) {
            return new NextResponse("Report not found", { status: 404 });
        }

        // Validate recipients
        if (schedule_enabled && (!schedule_recipients || schedule_recipients.length === 0)) {
            return new NextResponse("At least one recipient is required", { status: 400 });
        }

        // Validate cron
        if (schedule_enabled && !schedule_cron) {
            return new NextResponse("Schedule cron expression is required", { status: 400 });
        }

        const updated = await prismadb.savedReport.update({
            where: { id: reportId },
            data: {
                schedule_enabled: schedule_enabled ?? false,
                schedule_cron: schedule_cron || null,
                schedule_recipients: schedule_recipients || [],
                schedule_format: schedule_format || "HTML",
                schedule_timezone: schedule_timezone || "America/Chicago",
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[REPORT_SCHEDULE_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * GET /api/reports/scheduled
 * List all scheduled reports for the current user.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const reports = await prismadb.savedReport.findMany({
            where: {
                userId: session.user.id,
                schedule_enabled: true,
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("[REPORT_SCHEDULE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
