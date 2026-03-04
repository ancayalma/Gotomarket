
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { generateText } from "ai";
import { getAiSdkModel } from "@/lib/openai";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { leadId, opportunityId } = await req.json();

        let context = "";
        let targetName = "";

        if (leadId) {
            const lead = await (prismadb as any).crm_Leads.findUnique({
                where: { id: leadId },
                include: {
                    lead_activities: {
                        take: 5,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            if (lead) {
                targetName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
                context = `Lead: ${targetName}\nCompany: ${lead.company}\nStatus: ${lead.status}\nRecent Activities: ${lead.lead_activities.map((a: any) => a.description).join(", ")}`;
            }
        } else if (opportunityId) {
            const opportunity = await (prismadb as any).crm_Opportunities.findUnique({
                where: { id: opportunityId },
                include: {
                    assigned_account: true,
                    assigned_sales_stage: true
                }
            });
            if (opportunity) {
                targetName = opportunity.name || "Opportunity";
                context = `Opportunity: ${targetName}\nAccount: ${opportunity.assigned_account?.name}\nSales Stage: ${opportunity.assigned_sales_stage?.name}\nBudget: ${opportunity.budget}\nExpected Revenue: ${opportunity.expected_revenue}`;
            }
        }

        if (!context) {
            return new NextResponse("Record not found", { status: 404 });
        }

        const prompt = `
            You are an elite CRM executive assistant preparing me for a high-stakes mission (meeting).
            I am about to meet with/discuss: ${targetName}.
            
            Context:
            ${context}
            
            Based on this context, provide:
            1. A 2-sentence "Intelligence Summary" of who they are and where we stand.
            2. 3 "Tactical Advice" bullet points for the upcoming interaction.
            3. A "Critical Mission Alert" if there's any red flag or high-value detail I must not miss.
            
            Keep the tone professional, sharp, and focused on ROI.
            Respond in JSON format: { "summary": "...", "advice": ["...", "...", "..."], "alert": "..." }
        `;

        const { model } = await getAiSdkModel(session.user.id);
        const { text } = await generateText({
            model,
            prompt,
        });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const content = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, advice: [], alert: "" };

        return NextResponse.json(content);
    } catch (error: any) {
        console.error("Record Briefing Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
