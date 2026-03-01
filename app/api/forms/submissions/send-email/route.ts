import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import sendEmail from "@/lib/sendmail";
import { generateSubmissionPdf } from "@/lib/pdf-utils";
import { systemLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        systemLogger.error("[Send Email API] Received request");
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.warn("[Send Email API] Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            systemLogger.error("[Send Email API] Failed to parse request body:", e);
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }
        const { submissionId, to, subject, body: emailBody, includePdf } = body;
        systemLogger.error(`[Send Email API] To: ${to}, Subject: ${subject}, Include PDF: ${!!includePdf}`);

        if (!to || !subject || !emailBody) {
            systemLogger.error("[Send Email API] Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let submission = null;
        if (submissionId) {
            submission = await (prismadb as any).formSubmission.findUnique({
                where: { id: submissionId },
                include: { form: true }
            });
            if (!submission) {
                systemLogger.error(`[Send Email API] Submission ${submissionId} not found`);
                return NextResponse.json({ error: "Submission not found" }, { status: 404 });
            }
        }

        const attachments = [];
        if (includePdf && submission) {
            systemLogger.error("[Send Email API] Generating PDF...");
            const pdfBuffer = await generateSubmissionPdf(submission);
            attachments.push({
                filename: `submission-${submissionId}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf"
            });
            systemLogger.error("[Send Email API] PDF generated and attached");
        }

        // Send the email
        await sendEmail({
            to,
            from: process.env.EMAIL_FROM,
            subject,
            text: emailBody,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="white-space: pre-wrap;">${emailBody}</div>
                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #888;">Sent from Crecoin CRM</p>
            </div>`,
            attachments
        });

        systemLogger.error("[Send Email API] Process completed successfully");
        return NextResponse.json({ success: true, message: "Email sent" });
    } catch (error: any) {
        systemLogger.error("[Send Email API] Critical Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
    }
}
