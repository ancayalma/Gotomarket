import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTeamEmail } from "@/lib/email/team-mailer";

export async function POST(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { to, purpose } = await req.json();
        if (!to) return NextResponse.json({ error: "Recipient email required" }, { status: 400 });

        const emailPurpose = (purpose || "GENERAL").toUpperCase() as "GENERAL" | "OUTREACH" | "INBOUND";

        await sendTeamEmail(params.teamId, {
            to,
            subject: `BasaltCRM Test Email (${emailPurpose})`,
            text: `This is a test email from your BasaltCRM ${emailPurpose.toLowerCase()} email configuration.`,
            html: `<h1>BasaltCRM Test Email</h1><p>Congratulations! Your <strong>${emailPurpose}</strong> email configuration is working correctly.</p><p>Sent via BasaltCRM Team Mailer.</p>`,
        }, emailPurpose);

        return NextResponse.json({ success: true, message: "Test email sent successfully" });
    } catch (error: any) {
        console.error("Test email failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
