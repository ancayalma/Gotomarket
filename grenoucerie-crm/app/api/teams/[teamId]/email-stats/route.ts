import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Fetch last 10 sent items for this team
        // We assume sent items map to campaigns owned by the team or user
        // Since we don't have direct team_id on Outreach_Items, we link via User or Campaign
        // Campaign has team_id.
        // Let's filter items where campaign -> team_id matches

        const items = await prismadb.crm_Outreach_Items.findMany({
            where: {
                status: "SENT",
                assigned_campaign: {
                    team_id: params.teamId
                }
            },
            take: 10,
            orderBy: {
                sentAt: 'desc'
            },
            select: {
                id: true,
                subject: true,
                status: true,
                sentAt: true,
                createdAt: true,
                candidate_email: true,
                candidate_name: true,
                candidate_company: true,
                assigned_lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true
                    }
                }
            }
        });

        // Map to simpler format, with fallback for pool candidates without a lead record
        const mapped = (items as any[]).map(item => {
            const lead = item.assigned_lead || {
                firstName: item.candidate_name?.split(' ')[0] || '',
                lastName: item.candidate_name?.split(' ').slice(1).join(' ') || '',
                email: item.candidate_email || 'Unknown',
                company: item.candidate_company || '',
            };
            return {
                id: item.id,
                lead,
                subject: item.subject,
                sentAt: item.sentAt || item.createdAt,
                status: item.status
            };
        });

        return NextResponse.json(mapped);

    } catch (error: any) {
        console.error("Failed to fetch email stats", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
