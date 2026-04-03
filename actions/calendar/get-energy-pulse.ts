
import { prismadb } from "@/lib/prisma";
import { generateText } from "ai";
import { getAiSdkModel, logAiUsage } from "@/lib/varuni";
import { format } from "date-fns";

export async function getEnergyPulse(userId: string) {
    if (!userId) throw new Error("Unauthorized");

    const today = new Date();
    const todayStart = new Date(new Date(today).setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(today).setHours(23, 59, 59, 999));

    try {
        const tasks = await (prismadb as any).tasks.findMany({
            where: {
                OR: [
                    { user: userId },
                    { createdBy: userId }
                ],
                dueDateAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        });

        const activeTasks = tasks.filter((t: any) => t.taskStatus !== "COMPLETE" && t.taskStatus !== "CANCELLED");
        const highPriorityCount = activeTasks.filter((t: any) => t.priority === "high" || t.priority === "critical").length;
        const totalCount = activeTasks.length;

        // Simple load calculation
        let loadPercent = Math.min((totalCount * 10) + (highPriorityCount * 15), 100);
        let status = loadPercent > 80 ? "CRITICAL OVERLOAD" : loadPercent > 50 ? "HEAVY MANEUVERS" : "OPERATIONAL STABILITY";

        const taskList = activeTasks.map((t: any) => ({ title: t.title, priority: t.priority }));

        const prompt = `
            You are "Antigravity", an elite AI operations officer.
            Analyze my current mission load for today (${format(new Date(), "yyyy-MM-dd")}).
            
            Load Data:
            - Total Active Missions: ${totalCount}
            - High-Intensity Engagements: ${highPriorityCount}
            - Current Stress Indicator: ${status} (${loadPercent}%)
            
            Mission List: ${JSON.stringify(taskList)}
            
            Provide a 1-sentence "Energy Forecast" (e.g., "Missions peak at 2 PM; prepare for energy dip").
            Then, suggest 1 proactive action (e.g., "Consider rescheduling the low-priority 'Check emails' to tomorrow").
            
            Format: { "forecast": "...", "suggestion": "...", "loadPercent": ${loadPercent}, "status": "${status}" }
        `;

        const { model, modelId, teamId } = await getAiSdkModel(userId);
        const { text, usage } = await generateText({
            model,
            prompt,
        });

        await logAiUsage({ teamId, userId, service: "general", model: modelId || "unknown",
            usage: { promptTokens: (usage as any)?.promptTokens || 0, completionTokens: (usage as any)?.completionTokens || 0 },
            description: "Calendar energy pulse" });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { forecast: text, suggestion: "Maintain current trajectory.", loadPercent, status };
    } catch (error) {
        console.error("Energy Pulse Error:", error);
        return { forecast: "Pulse offline. Maintain focus.", suggestion: "Continue current missions.", loadPercent: 0, status: "OFFLINE" };
    }
}
