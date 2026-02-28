import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyEmailIdentity, getIdentityVerificationStatus, deleteEmailIdentity } from "@/lib/aws/ses-verify";

export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id: params.teamId }
    });

    if (!config) {
        return NextResponse.json(null);
    }

    // Proactively check status if it was pending
    if ((config.provider === "AWS_SES" || config.provider === "PLATFORM_SES") && config.verification_status === "PENDING") {
        // PLATFORM_SES uses system env credentials (no team-level keys)
        const creds = config.provider === "AWS_SES" && config.aws_access_key_id && config.aws_secret_access_key
            ? { accessKeyId: config.aws_access_key_id, secretAccessKey: config.aws_secret_access_key, region: config.aws_region }
            : undefined; // undefined = fallback to system env

        const currentStatus = await getIdentityVerificationStatus(config.from_email, creds);

        if (currentStatus !== "PENDING") {
            const updated = await prismadb.teamEmailConfig.update({
                where: { id: config.id },
                data: { verification_status: currentStatus }
            });
            return NextResponse.json({
                ...updated,
                aws_access_key_id: updated.aws_access_key_id ? "HasValue" : null,
                aws_secret_access_key: updated.aws_secret_access_key ? "HasValue" : null,
                resend_api_key: updated.resend_api_key ? "HasValue" : null
            });
        }
    }

    // Mask sensitive data before returning
    return NextResponse.json({
        ...config,
        aws_access_key_id: config.aws_access_key_id ? "HasValue" : null,
        aws_secret_access_key: config.aws_secret_access_key ? "HasValue" : null,
        resend_api_key: config.resend_api_key ? "HasValue" : null
    });
}

export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
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

    if (!from_email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    try {
        // Fetch existing config to merge keys if not provided
        const existingConfig = await prismadb.teamEmailConfig.findUnique({
            where: { team_id: params.teamId }
        });

        const finalAwsKey = aws_access_key_id || existingConfig?.aws_access_key_id;
        const finalAwsSecret = aws_secret_access_key || existingConfig?.aws_secret_access_key;
        const finalResendKey = resend_api_key || existingConfig?.resend_api_key;



        // Verification Logic
        const finalSendgridKey = sendgrid_api_key || existingConfig?.sendgrid_api_key;
        const finalMailgunKey = mailgun_api_key || existingConfig?.mailgun_api_key;
        const finalPostmarkToken = postmark_api_token || existingConfig?.postmark_api_token;
        const finalSmtpPassword = smtp_password || existingConfig?.smtp_password;



        let verificationStatus = "PENDING";

        // Verification Logic
        if (provider === "PLATFORM_SES") {
            // Use the platform's own SES credentials (from env vars)
            const triggerVerification = !existingConfig || existingConfig.from_email !== from_email || existingConfig.provider !== "PLATFORM_SES";

            if (triggerVerification) {
                await verifyEmailIdentity(from_email); // no creds = uses system env
            } else {
                const status = await getIdentityVerificationStatus(from_email); // no creds = uses system env
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
            // Google OAuth connections are verified by the authentication flow itself
            verificationStatus = "VERIFIED";
        }

        // Save Config - Using separate update/create for better MongoDB reliability
        let config;

        const updateData = {
            provider,
            from_email,
            from_name,
            aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : undefined,
            aws_secret_access_key: provider === "AWS_SES" ? finalAwsSecret : undefined,
            aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : undefined,
            resend_api_key: provider === "RESEND" ? finalResendKey : undefined,
            sendgrid_api_key: provider === "SENDGRID" ? finalSendgridKey : undefined,
            mailgun_api_key: provider === "MAILGUN" ? finalMailgunKey : undefined,
            mailgun_domain: provider === "MAILGUN" ? mailgun_domain : undefined,
            mailgun_region: provider === "MAILGUN" ? (mailgun_region || "us") : undefined,
            postmark_api_token: provider === "POSTMARK" ? finalPostmarkToken : undefined,
            smtp_host: provider === "SMTP" ? smtp_host : undefined,
            smtp_port: provider === "SMTP" ? parseInt(String(smtp_port)) : undefined,
            smtp_user: provider === "SMTP" ? smtp_user : undefined,
            smtp_password: provider === "SMTP" ? finalSmtpPassword : undefined,
            verification_status: verificationStatus,
        };

        console.log(`[EmailConfig] Saving for team ${params.teamId}`, { provider, from_email, isNew: !existingConfig });

        if (existingConfig) {
            config = await prismadb.teamEmailConfig.update({
                where: { id: existingConfig.id },
                data: updateData
            });
        } else {
            config = await prismadb.teamEmailConfig.create({
                data: {
                    team_id: params.teamId,
                    provider,
                    from_email,
                    from_name,
                    aws_access_key_id: provider === "AWS_SES" ? finalAwsKey : null,
                    aws_secret_access_key: provider === "AWS_SES" ? finalAwsSecret : null,
                    aws_region: provider === "AWS_SES" ? (aws_region || "us-east-1") : "us-east-1",
                    resend_api_key: provider === "RESEND" ? finalResendKey : null,
                    sendgrid_api_key: provider === "SENDGRID" ? finalSendgridKey : null,
                    mailgun_api_key: provider === "MAILGUN" ? finalMailgunKey : null,
                    mailgun_domain: mailgun_domain || null,
                    mailgun_region: mailgun_region || "us",
                    postmark_api_token: provider === "POSTMARK" ? finalPostmarkToken : null,
                    smtp_host: smtp_host || null,
                    smtp_port: smtp_port ? parseInt(String(smtp_port)) : null,
                    smtp_user: smtp_user || null,
                    smtp_password: provider === "SMTP" ? finalSmtpPassword : null,
                    verification_status: verificationStatus,
                }
            });
        }

        return NextResponse.json({
            ...config,
            aws_access_key_id: config.aws_access_key_id ? "HasValue" : null,
            aws_secret_access_key: config.aws_secret_access_key ? "HasValue" : null,
            resend_api_key: config.resend_api_key ? "HasValue" : null
        });
    } catch (error: any) {
        console.error("Email Config Error Details:", {
            error: error.message,
            stack: error.stack,
            teamId: params.teamId
        });
        return NextResponse.json({ error: error.message || "Failed to set config" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id: params.teamId }
    });

    if (!config) {
        return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    try {
        if (config.provider === "PLATFORM_SES") {
            // Use system env credentials
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

    return new NextResponse(null, { status: 204 });
}
