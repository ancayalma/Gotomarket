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
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { to } = await req.json();
        if (!to) return new NextResponse("Recipient email required", { status: 400 });

        await sendTeamEmail(params.teamId, {
            to,
            subject: "BasaltCRM Test Email",
            text: "This is a test email from your BasaltCRM team configuration.",
            html: "<h1>BasaltCRM Test Email</h1><p>Congratulations! Your team email configuration is working correctly.</p><p>Sent via BasaltCRM Team Mailer.</p>",
        });

        return NextResponse.json({ success: true, message: "Test email sent successfully" });
    } catch (error: any) {
        console.error("Test email failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
