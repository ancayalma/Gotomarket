/**
 * Report Email Delivery Engine
 * 
 * Sends scheduled reports via email. Called by the scheduler tick endpoint.
 * Renders report data to HTML or CSV and sends via the existing sendmail system.
 */

import { prismadb } from "@/lib/prisma";
import sendEmail from "@/lib/sendmail";
import { systemLogger } from "@/lib/logger";

// ── Cron matching helper ────────────────────────────────────────────────────
function shouldRunNow(cron: string, timezone: string): boolean {
    try {
        const now = new Date();
        // Convert to the target timezone
        const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        const minute = tzDate.getMinutes();
        const hour = tzDate.getHours();
        const dayOfMonth = tzDate.getDate();
        const month = tzDate.getMonth() + 1;
        const dayOfWeek = tzDate.getDay(); // 0 = Sunday

        const [cronMin, cronHour, cronDom, cronMonth, cronDow] = cron.split(" ");

        return (
            matchField(cronMin, minute) &&
            matchField(cronHour, hour) &&
            matchField(cronDom, dayOfMonth) &&
            matchField(cronMonth, month) &&
            matchField(cronDow, dayOfWeek)
        );
    } catch {
        return false;
    }
}

function matchField(field: string, value: number): boolean {
    if (field === "*") return true;

    // Handle comma-separated values: "1,15" or "1,4,7,10"
    if (field.includes(",")) {
        return field.split(",").some(v => parseInt(v.trim()) === value);
    }

    // Handle ranges: "1-5"
    if (field.includes("-")) {
        const [start, end] = field.split("-").map(Number);
        return value >= start && value <= end;
    }

    // Handle step: "*/5"
    if (field.startsWith("*/")) {
        const step = parseInt(field.slice(2));
        return value % step === 0;
    }

    return parseInt(field) === value;
}

// ── Main delivery function ──────────────────────────────────────────────────
export async function deliverScheduledReports(): Promise<{ sent: number; errors: number }> {
    const scheduledReports = await prismadb.savedReport.findMany({
        where: {
            schedule_enabled: true,
            schedule_cron: { not: null },
        },
        include: {
            user: { select: { name: true, email: true, team_id: true } },
        },
    });

    let sent = 0;
    let errors = 0;

    for (const report of scheduledReports) {
        if (!report.schedule_cron || report.schedule_recipients.length === 0) continue;

        const timezone = report.schedule_timezone || "America/Chicago";

        // Check if this cron should run right now
        if (!shouldRunNow(report.schedule_cron, timezone)) continue;

        // Avoid double-sends: check if we already sent within the last 55 minutes
        if (report.schedule_last_sent) {
            const lastSent = new Date(report.schedule_last_sent).getTime();
            const now = Date.now();
            if (now - lastSent < 55 * 60 * 1000) continue;
        }

        try {
            const format = report.schedule_format || "HTML";
            const reportContent = await renderReportContent(report, format);

            for (const recipient of report.schedule_recipients) {
                const emailData: any = {
                    to: recipient,
                    subject: `📊 Scheduled Report: ${report.name}`,
                    text: `Your scheduled report "${report.name}" is attached.`,
                };

                if (format === "HTML") {
                    emailData.html = reportContent;
                } else {
                    // CSV or PDF as attachment
                    emailData.html = `<p>Your scheduled report <strong>"${report.name}"</strong> is attached.</p><p style="color:#666;font-size:12px;">Sent by BasaltCRM on ${new Date().toLocaleDateString()}</p>`;
                    emailData.attachments = [
                        {
                            filename: `${report.name.replace(/[^a-zA-Z0-9]/g, "_")}.${format.toLowerCase()}`,
                            content: reportContent,
                            contentType: format === "CSV" ? "text/csv" : "application/pdf",
                        },
                    ];
                }

                await sendEmail(emailData);
            }

            // Update last sent time
            await prismadb.savedReport.update({
                where: { id: report.id },
                data: { schedule_last_sent: new Date() },
            });

            sent++;
            systemLogger.info(`[REPORT_DELIVERY] Sent "${report.name}" to ${report.schedule_recipients.length} recipient(s).`);
        } catch (err: any) {
            errors++;
            systemLogger.error(`[REPORT_DELIVERY] Failed to deliver "${report.name}":`, err);
        }
    }

    return { sent, errors };
}

// ── Report rendering ────────────────────────────────────────────────────────
async function renderReportContent(report: any, format: string): Promise<string> {
    // The report config contains the query parameters (object type, filters, columns, etc.)
    const config = report.config || {};
    const objectType = config.objectType || "crm_Opportunities";

    // Execute the report query
    const model = (prismadb as any)[objectType];
    if (!model) {
        throw new Error(`Unknown object type: ${objectType}`);
    }

    const where: any = {};
    if (config.filters) {
        for (const filter of config.filters) {
            where[filter.field] = filter.operator === "equals"
                ? filter.value
                : { [filter.operator]: filter.value };
        }
    }

    // Add team scoping
    if (report.user?.team_id) {
        where.team_id = report.user.team_id;
    }

    const records = await model.findMany({
        where,
        take: 500, // Safety limit for email
        orderBy: config.orderBy ? { [config.orderBy]: config.orderDirection || "desc" } : undefined,
    });

    const columns = config.columns || Object.keys(records[0] || {}).slice(0, 8);

    if (format === "CSV") {
        return renderCSV(records, columns);
    }

    return renderHTMLTable(report.name, records, columns);
}

function renderCSV(records: any[], columns: string[]): string {
    const header = columns.join(",");
    const rows = records.map(r =>
        columns.map(c => {
            const val = r[c];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(",")
    );
    return [header, ...rows].join("\n");
}

function renderHTMLTable(reportName: string, records: any[], columns: string[]): string {
    const headerCells = columns.map(c => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${c.replace(/_/g, " ")}</th>`).join("");

    const bodyRows = records.slice(0, 100).map((r, idx) => {
        const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
        const cells = columns.map(c => {
            let val = r[c];
            if (val instanceof Date) val = val.toLocaleDateString();
            else if (val === null || val === undefined) val = "—";
            return `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;">${val}</td>`;
        }).join("");
        return `<tr style="background:${bg};">${cells}</tr>`;
    }).join("");

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:20px;background:#f3f4f6;">
    <div style="max-width:800px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:24px 32px;">
            <h1 style="margin:0;color:white;font-size:20px;font-weight:700;">📊 ${reportName}</h1>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Generated ${new Date().toLocaleDateString()} · ${records.length} records</p>
        </div>
        <div style="padding:0;">
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:#f8fafc;">${headerCells}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
            ${records.length > 100 ? `<p style="padding:12px 24px;color:#6b7280;font-size:12px;text-align:center;">Showing first 100 of ${records.length} records. Log in to view all.</p>` : ""}
        </div>
        <div style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">Sent by BasaltCRM · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#3b82f6;">Open Dashboard</a></p>
        </div>
    </div>
</body>
</html>`;
}
