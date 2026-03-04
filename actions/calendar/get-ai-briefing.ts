
import { prismadb } from "@/lib/prisma";
import { generateText } from "ai";
import { getAiSdkModel } from "@/lib/openai";
import { format } from "date-fns";

export async function getAIDailyBriefing(userId: string) {
    if (!userId) throw new Error("Unauthorized");

    const today = new Date();
    const todayStart = new Date(new Date(today).setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date(today).setHours(23, 59, 59, 999));

    try {
        // Fetch tasks for today using 'tasks' model
        // Note: Using (prismadb as any).tasks to handle case sensitivity in client if needed
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
            },
            include: {
                assigned_section: true,
            }
        });

        if (tasks.length === 0) {
            return {
                summary: "You're all caught up! No tasks scheduled for today. This might be a good time to focus on prospecting or long-term strategy.",
                highValueAlerts: []
            };
        }

        // Prepare prompt for AI
        const taskList = tasks.map((t: any) => ({
            title: t.title,
            priority: t.priority,
            status: t.taskStatus,
            project: t.assigned_section?.title,
        }));

        const prompt = `
            You are an elite CRM executive assistant. 
            Analyze the following tasks for today (${format(new Date(), "yyyy-MM-dd")}) and provide a concise "Daily Pulse" summary.
            
            Tasks: ${JSON.stringify(taskList)}
            
            Focus on:
            1. Priority distribution.
            2. Strategic advice on how to tackle the day.
            
            Keep it professional, encouraging, and under 150 words.
            Respond in JSON format: { "summary": "...", "highValueAlerts": ["...", "..."] }
        `;

        const { model } = await getAiSdkModel(userId);
        const { text } = await generateText({
            model,
            prompt,
        });

        // Try to parse JSON from the response if it's wrapped in markers or just raw
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const content = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, highValueAlerts: [] };

        return {
            summary: content.summary || text,
            highValueAlerts: content.highValueAlerts || []
        };
    } catch (error) {
        console.error("AI Briefing Error:", error);
        return {
            summary: "Your daily briefing is being prepared. Focus on your scheduled tasks to maintain momentum.",
            highValueAlerts: []
        };
    }
}
