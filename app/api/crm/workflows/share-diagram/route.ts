import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const body = await req.json();
        const { recipientEmail, diagramName, diagramCode, senderName } = body;

        if (!recipientEmail || !diagramCode) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 0 auto; padding: 40px 24px; }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { font-size: 24px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px 0; }
        .header p { font-size: 14px; color: #94a3b8; margin: 0; }
        .badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .code-block { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; overflow-x: auto; }
        .code-block pre { margin: 0; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; line-height: 1.6; color: #94a3b8; white-space: pre-wrap; word-break: break-word; }
        .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #1e293b; }
        .footer p { font-size: 12px; color: #475569; margin: 4px 0; }
        .cta { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 16px; }
        .note { background: #1e293b; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 13px; color: #cbd5e1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">FlowState Visual Editor</span>
            <h1>${diagramName || "Workflow Diagram"}</h1>
            <p>Shared by ${senderName || "a team member"} via BasaltCRM</p>
        </div>

        <div class="note">
            📋 Paste the Mermaid code below into the <strong>Visual Editor</strong> in your CRM to view the interactive diagram, or use any Mermaid-compatible renderer.
        </div>

        <div class="code-block">
            <pre>${diagramCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </div>

        <div class="footer">
            <p>Sent from <strong>BasaltCRM</strong> FlowState</p>
            <p>© ${new Date().getFullYear()} BasaltHQ. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        await sendEmail({
            to: recipientEmail,
            subject: `📊 Workflow Diagram: ${diagramName || "Shared Diagram"} — BasaltCRM`,
            text: `${senderName || "A team member"} shared a workflow diagram with you.\n\nDiagram: ${diagramName || "Untitled"}\n\nMermaid Code:\n${diagramCode}\n\nPaste this code into the FlowState Visual Editor in your CRM to view it.`,
            html: htmlContent,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[SHARE_DIAGRAM_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
