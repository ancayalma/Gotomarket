import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyEmailIdentity, getIdentityVerificationStatus, deleteEmailIdentity } from "@/lib/aws/ses-verify";
import { logActivityInternal } from "@/actions/audit";
import { encryptSecret, decryptSecret } from "@/lib/encryption";
import { systemLogger } from "@/lib/logger";

const VALID_PURPOSES = ["GENERAL", "OUTREACH", "INBOUND"] as const;

function maskConfig(config: any) {
    return {
        ...config,
        aws_access_key_id: config.aws_access_key_id ? "HasValue" : null,
        aws_secret_access_key: config.aws_secret_access_key ? "HasValue" : null,
        resend_api_key: config.resend_api_key ? "HasValue" : null,
        sendgrid_api_key: config.sendgrid_api_key ? "HasValue" : null,
        mailgun_api_key: config.mailgun_api_key ? "HasValue" : null,
        postmark_api_token: config.postmark_api_token ? "HasValue" : null,
        smtp_password: config.smtp_password ? "HasValue" : null,
    };
}

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const purpose = url.searchParams.get("purpose")?.toUpperCase();

    // If a specific purpose is requested, return single config
    if (purpose && VALID_PURPOSES.includes(purpose as any)) {
        const config = await prismadb.teamEmailConfig.findUnique({
            where: { team_id_purpose: { team_id: params.teamId, purpose } }
        });

        if (!config) return NextResponse.json(null);

        // Proactively check SES verification status
        if ((config.provider === "AWS_SES" || config.provider === "PLATFORM_SES") && config.verification_status === "PENDING") {
            const creds = config.provider === "AWS_SES" && config.aws_access_key_id && config.aws_secret_access_key
                ? { accessKeyId: config.aws_access_key_id, secretAccessKey: decryptSecret(config.aws_secret_access_key) || config.aws_secret_access_key, region: config.aws_region }
                : undefined;

            const currentStatus = await getIdentityVerificationStatus(config.from_email, creds);
            if (currentStatus !== "PENDING") {
                const updated = await prismadb.teamEmailConfig.update({
                    where: { id: config.id },
                    data: { verification_status: currentStatus }
                });
                return NextResponse.json(maskConfig(updated));
            }
        }

        return NextResponse.json(maskConfig(config));
    }

    // No purpose specified — return all configs for the team
    const configs = await prismadb.teamEmailConfig.findMany({
        where: { team_id: params.teamId }
    });

    // Proactively check pending SES configs
    const results = [];
    for (const config of configs) {
        if ((config.provider === "AWS_SES" || config.provider === "PLATFORM_SES") && config.verification_status === "PENDING") {
            try {
                const creds = config.provider === "AWS_SES" && config.aws_access_key_id && config.aws_secret_access_key
                    ? { accessKeyId: config.aws_access_key_id, secretAccessKey: decryptSecret(config.aws_secret_access_key) || config.aws_secret_access_key, region: config.aws_region }
                    : undefined;

                const currentStatus = await getIdentityVerificationStatus(config.from_email, creds);
                if (currentStatus !== "PENDING") {
                    const updated = await prismadb.teamEmailConfig.update({
                        where: { id: config.id },
                        data: { verification_status: currentStatus }
                    });
                    results.push(maskConfig(updated));
                    continue;
                }
            } catch (err) {
                // Non-fatal — just return current status
            }
        }
        results.push(maskConfig(config));
    }

    return NextResponse.json(results);
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
        purpose = "GENERAL",
        provider = "AWS_SES",
        from_email,
        from_name,
        aws_access_key_id,
        aws_secret_access_key,
        aws_region,
        resend_api_key,
        sendgrid_api_key,
        mailgun_api_key,
        mailgun_domain,
        mailgun_region,
        postmark_api_token,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password
    } = body;

    const normalizedPurpose = (purpose || "GENERAL").toUpperCase();
    if (!VALID_PURPOSES.includes(normalizedPurpose as any)) {
        return NextResponse.json({ error: "Invalid purpose. Must be GENERAL, OUTREACH, or INBOUND." }, { status: 400 });
    }

    if (!from_email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    try {
        // Fetch existing config for this purpose to merge keys if not provided
        const existingConfig = await prismadb.teamEmailConfig.findUnique({
            where: { team_id_purpose: { team_id: params.teamId, purpose: normalizedPurpose } }
        });

        const finalAwsKey = aws_access_key_id || existingConfig?.aws_access_key_id;
        const finalAwsSecret = aws_secret_access_key || existingConfig?.aws_secret_access_key;
        const finalResendKey = resend_api_key || existingConfig?.resend_api_key;
        const finalSendgridKey = sendgrid_api_key || existingConfig?.sendgrid_api_key;
        const finalMailgunKey = mailgun_api_key || existingConfig?.mailgun_api_key;
        const finalPostmarkToken = postmark_api_token || existingConfig?.postmark_api_token;
        const finalSmtpPassword = smtp_password || existingConfig?.smtp_password;

        let verificationStatus = "PENDING";

        // Verification Logic
        if (provider === "PLATFORM_SES") {
            const triggerVerification = !existingConfig || existingConfig.from_email !== from_email || existingConfig.provider !== "PLATFORM_SES";
            if (triggerVerification) {
                await verifyEmailIdentity(from_email);
            } else {
                const status = await getIdentityVerificationStatus(from_email);
                if (status === "SUCCESS") verificationStatus = "VERIFIED";
            }
        } else if (provider === "AWS_SES") {
            if (!finalAwsKey || !finalAwsSecret) return NextResponse.json({ error: "AWS Credentials required" }, { status: 400 });
            const triggerVerification = !existingConfig || existingConfig.from_email !== from_email || existingConfig.provider !== "AWS_SES";
            if (triggerVerification) {
                await verifyEmailIdentity(from_email, { accessKeyId: finalAwsKey, secretAccessKey: finalAwsSecret, region: aws_region || "us-east-1" });
            } else {
                const status = await getIdentityVerificationStatus(from_email, { accessKeyId: finalAwsKey, secretAccessKey: finalAwsSecret, region: aws_region || "us-east-1" });
                if (status === "SUCCESS") verificationStatus = "VERIFIED";
            }
        } else if (provider === "RESEND") {
            if (!finalResendKey) return NextResponse.json({ error: "Resend API Key required" }, { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "SENDGRID") {
            if (!finalSendgridKey) return NextResponse.json({ error: "SendGrid API Key required" }, { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "MAILGUN") {
            if (!finalMailgunKey || !mailgun_domain) return NextResponse.json({ error: "Mailgun Config required" }, { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "POSTMARK") {
            if (!finalPostmarkToken) return NextResponse.json({ error: "Postmark Token required" }, { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "SMTP") {
            if (!smtp_host || !smtp_port || !smtp_user || !finalSmtpPassword) return NextResponse.json({ error: "SMTP Config required" }, { status: 400 });
            verificationStatus = "VERIFIED";
        } else if (provider === "GOOGLE_GMAIL") {
            verificationStatus = "VERIFIED";
        }

        // Save Config
        let config;

        const updateData = {
            provider,
            from_email,
            from_name,
            aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : undefined,
            aws_secret_access_key: provider === "AWS_SES" ? encryptSecret(finalAwsSecret) : undefined,
            aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : undefined,
            resend_api_key: provider === "RESEND" ? encryptSecret(finalResendKey) : undefined,
            sendgrid_api_key: provider === "SENDGRID" ? encryptSecret(finalSendgridKey) : undefined,
            mailgun_api_key: provider === "MAILGUN" ? encryptSecret(finalMailgunKey) : undefined,
            mailgun_domain: provider === "MAILGUN" ? mailgun_domain : undefined,
            mailgun_region: provider === "MAILGUN" ? (mailgun_region || "us") : undefined,
            postmark_api_token: provider === "POSTMARK" ? encryptSecret(finalPostmarkToken) : undefined,
            smtp_host: provider === "SMTP" ? smtp_host : undefined,
            smtp_port: provider === "SMTP" ? parseInt(String(smtp_port)) : undefined,
            smtp_user: provider === "SMTP" ? smtp_user : undefined,
            smtp_password: provider === "SMTP" ? encryptSecret(finalSmtpPassword) : undefined,
            verification_status: verificationStatus,
        };

        systemLogger.error(`[EmailConfig] Saving for team ${params.teamId} (purpose: ${normalizedPurpose})`, { provider, from_email, isNew: !existingConfig });

        if (existingConfig) {
            config = await prismadb.teamEmailConfig.update({
                where: { id: existingConfig.id },
                data: updateData
            });
        } else {
            config = await prismadb.teamEmailConfig.create({
                data: {
                    team_id: params.teamId,
                    purpose: normalizedPurpose,
                    provider,
                    from_email,
                    from_name,
                    aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : null,
                    aws_secret_access_key: provider === "AWS_SES" ? encryptSecret(finalAwsSecret) : null,
                    aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : "us-east-1",
                    resend_api_key: provider === "RESEND" ? encryptSecret(finalResendKey) : null,
                    sendgrid_api_key: provider === "SENDGRID" ? encryptSecret(finalSendgridKey) : null,
                    mailgun_api_key: provider === "MAILGUN" ? encryptSecret(finalMailgunKey) : null,
                    mailgun_domain: mailgun_domain || null,
                    mailgun_region: mailgun_region || "us",
                    postmark_api_token: provider === "POSTMARK" ? encryptSecret(finalPostmarkToken) : null,
                    smtp_host: smtp_host || null,
                    smtp_port: smtp_port ? parseInt(String(smtp_port)) : null,
                    smtp_user: smtp_user || null,
                    smtp_password: provider === "SMTP" ? encryptSecret(finalSmtpPassword) : null,
                    verification_status: verificationStatus,
                }
            });
        }

        return NextResponse.json(maskConfig(config));
    } catch (error: any) {
        console.error("Email Config Error Details:", {
            error: error.message,
            stack: error.stack,
            teamId: params.teamId
        });

        await logActivityInternal(session.user.id, "UPDATE", "TeamEmailConfig", `Updated email config for team ${params.teamId} (provider: ${provider}, purpose: ${normalizedPurpose})`, params.teamId);
        return NextResponse.json({ error: error.message || "Failed to set config" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const purpose = (url.searchParams.get("purpose") || "GENERAL").toUpperCase();

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id_purpose: { team_id: params.teamId, purpose } }
    });

    if (!config) {
        return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    try {
        if (config.provider === "PLATFORM_SES") {
            await deleteEmailIdentity(config.from_email);
        } else if (config.provider === "AWS_SES" && config.aws_access_key_id && config.aws_secret_access_key) {
            await deleteEmailIdentity(config.from_email, {
                accessKeyId: config.aws_access_key_id,
                secretAccessKey: config.aws_secret_access_key,
                region: config.aws_region
            });
        }
    } catch (error) {
        console.error("Failed to delete identity", error);
    }

    await prismadb.teamEmailConfig.delete({
        where: { id: config.id }
    });

    await logActivityInternal(session.user.id, "DELETE", "TeamEmailConfig", `Deleted email config for team ${params.teamId} (provider: ${config.provider}, purpose: ${purpose})`, params.teamId);
    return new NextResponse(null, { status: 204 });
}
