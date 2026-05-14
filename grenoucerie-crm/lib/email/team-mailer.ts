import { prismadb } from "@/lib/prisma";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Resend } from "resend";
import sendSystemEmail from "@/lib/sendmail";
import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import { sendViaGmail } from "@/lib/gmail";
import { decryptSecret } from "@/lib/encryption";

interface EmailOptions {
    from?: string; // Optional override, otherwise uses config.from_email
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    attachments?: {
        filename: string;
        content: any;
        contentType?: string;
    }[];
    senderId?: string; // Required for GOOGLE_GMAIL provider
}

export async function sendTeamEmail(teamId: string, options: EmailOptions, purpose: "GENERAL" | "OUTREACH" | "INBOUND" = "GENERAL"): Promise<string | null> {
    // 1. Fetch Config for the requested purpose, fallback to GENERAL
    let config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id_purpose: { team_id: teamId, purpose } }
    });

    // Fallback to GENERAL if purpose-specific config not found
    if (!config && purpose !== "GENERAL") {
        config = await prismadb.teamEmailConfig.findUnique({
            where: { team_id_purpose: { team_id: teamId, purpose: "GENERAL" } }
        });
    }

    // 2. Strict Requirement for Team Configuration
    // To protect the system SES reputation, mass outreach/client emails MUST use the team's own service.
    if (!config || (config.verification_status !== "VERIFIED" && config.verification_status !== "SUCCESS")) {
        const errorMsg = `[TeamEmail] Team ${teamId} has not configured a verified email service. Outreach prevented to protect system reputation.`;
        console.error(errorMsg);
        throw new Error("Email service not configured or verified for this team. Please set up your custom mail service in Team Settings.");
    }

    const fromAddress = `"${config.from_name || config.from_email}" <${config.from_email}>`;

    // 3a. PLATFORM_SES (uses the platform's own SES credentials)
    if (config.provider === "PLATFORM_SES") {
        try {
            const msgId = await sendSystemEmail({
                ...options,
                from: options.from || fromAddress,
            });
            console.log(`[TeamEmail] Sent via PLATFORM_SES (Team: ${teamId}, From: ${config.from_email}, MsgId: ${msgId})`);
            return msgId;
        } catch (error) {
            console.error("[TeamEmail] PLATFORM_SES Send Failed:", error);
            throw error;
        }
    }

    // 3b. AWS SES (team's own credentials)
    if (config.provider === "AWS_SES") {
        if (!config.aws_access_key_id || !config.aws_secret_access_key) {
            console.error("[TeamEmail] Missing AWS Credentials");
            return sendSystemEmail(options);
        }

        const ses = new aws.SES({
            apiVersion: "2010-12-01",
            region: config.aws_region || "us-east-1",
            credentials: {
                accessKeyId: config.aws_access_key_id,
                secretAccessKey: decryptSecret(config.aws_secret_access_key) || config.aws_secret_access_key,
            }
        });

        const transporter = nodemailer.createTransport({
            SES: { ses, aws },
        } as any);

        try {
            const result = await transporter.sendMail({
                from: options.from || fromAddress,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                replyTo: options.replyTo,
                attachments: options.attachments,
            });
            const msgId = result.messageId?.replace(/[<>]/g, "").trim() || null;
            console.log(`[TeamEmail] Sent via AWS SES (Team: ${teamId}, MsgId: ${msgId})`);
            return msgId;
        } catch (error) {
            console.error("[TeamEmail] AWS SES Send Failed:", error);
            throw error;
        }
    }

    // 4. RESEND
    if (config.provider === "RESEND") {
        if (!config.resend_api_key) {
            console.error("[TeamEmail] Missing Resend API Key");
            return sendSystemEmail(options);
        }

        const resend = new Resend(decryptSecret(config.resend_api_key) || config.resend_api_key);

        try {
            const { data, error } = await resend.emails.send({
                from: options.from || fromAddress,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                replyTo: options.replyTo,
                attachments: options.attachments?.map(a => ({
                    filename: a.filename,
                    content: a.content, // Resend expects buffer or string
                })),
            });

            if (error) {
                console.error("[TeamEmail] Resend API Error:", error);
                throw new Error(error.message);
            }

            console.log(`[TeamEmail] Sent via Resend (Team: ${teamId}, ID: ${data?.id})`);
            return data?.id || null;
        } catch (error) {
            console.error("[TeamEmail] Resend Send Failed:", error);
            throw error;
        }
    }

    // 5. GOOGLE GMAIL (OAuth)
    if (config.provider as string === "GOOGLE_GMAIL") {
        if (!options.senderId) {
            console.error("[TeamEmail] GOOGLE_GMAIL requires a senderId (userId)");
            throw new Error("Email provider is Google Gmail but no user ID was provided for authentication.");
        }

        try {
            const messageId = await sendViaGmail(
                options.senderId,
                options.to,
                options.subject,
                options.html || options.text,
                options.text
            );

            if (!messageId) {
                throw new Error("Failed to send message via Google OAuth. Please ensure your Google account is connected with proper permissions.");
            }

            console.log(`[TeamEmail] Sent via Google Gmail OAuth (User: ${options.senderId}, Team: ${teamId})`);
            return messageId || null;
        } catch (error) {
            console.error("[TeamEmail] Google Gmail Send Failed:", error);
            throw error;
        }
    }

    // Fallback if provider unknown
    return await sendSystemEmail(options);
}
