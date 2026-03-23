import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";
import { SES } from "@aws-sdk/client-ses";
import { SNSClient, CreateTopicCommand, SubscribeCommand, DeleteTopicCommand } from "@aws-sdk/client-sns";

const SES_REGION = process.env.AWS_REGION || "us-west-2";
const ACTIVE_RULE_SET_NAME = "AmazonConnectEnabledRuleSet-DO-NOT-DELETE";
const WEBHOOK_ENDPOINT = `${process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com"}/api/email/inbound`;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "867344432514";

function getAwsCredentials() {
    return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    };
}

/**
 * POST /api/teams/[teamId]/email-config/reply-domain
 * Set up a custom reply domain for outreach reply-to routing.
 * Steps: verify domain in SES → create SNS topic → subscribe webhook → create receipt rule
 */
export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const rawDomain = (body.domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();

    if (!rawDomain || !rawDomain.includes(".")) {
        return NextResponse.json({ error: "Valid domain required (e.g. reply.acmecorp.com)" }, { status: 400 });
    }

    try {
        // Ensure team exists and user belongs to it
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true, is_admin: true, is_account_admin: true }
        });

        if (!user || (user.team_id !== params.teamId && !user.is_admin)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const credentials = getAwsCredentials();
        const ses = new SES({ region: SES_REGION, credentials });
        const sns = new SNSClient({ region: SES_REGION, credentials });

        // 1. Verify the reply domain in SES
        systemLogger.info(`[REPLY_DOMAIN] Verifying domain: ${rawDomain}`);
        await ses.verifyDomainIdentity({ Domain: rawDomain });

        // 2. Create SNS topic for this team's reply domain
        const topicName = `crm-reply-${params.teamId.substring(0, 12)}-${rawDomain.replace(/\./g, "-")}`;
        const topicResult = await sns.send(new CreateTopicCommand({ Name: topicName }));
        const topicArn = topicResult.TopicArn;

        if (!topicArn) throw new Error("Failed to create SNS topic");

        // 3. Subscribe the CRM webhook to the topic
        await sns.send(new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: "https",
            Endpoint: WEBHOOK_ENDPOINT,
        }));

        // 4. Create SES receipt rule in the active rule set
        const ruleName = `crm-reply-${params.teamId.substring(0, 12)}`;
        await ses.createReceiptRule({
            RuleSetName: ACTIVE_RULE_SET_NAME,
            Rule: {
                Name: ruleName,
                Enabled: true,
                TlsPolicy: "Optional",
                Recipients: [rawDomain],
                Actions: [{
                    SNSAction: {
                        TopicArn: topicArn,
                        Encoding: "UTF-8",
                    }
                }],
                ScanEnabled: true,
            },
        });

        // 5. Store config in TeamEmailConfig (INBOUND purpose)
        const existingConfig = await prismadb.teamEmailConfig.findUnique({
            where: { team_id_purpose: { team_id: params.teamId, purpose: "INBOUND" } }
        });

        const replyData = {
            reply_domain: rawDomain,
            reply_domain_status: "PENDING_MX",
            reply_sns_topic_arn: topicArn,
            reply_receipt_rule: ruleName,
        };

        if (existingConfig) {
            await prismadb.teamEmailConfig.update({
                where: { id: existingConfig.id },
                data: replyData as any,
            });
        } else {
            await prismadb.teamEmailConfig.create({
                data: {
                    team_id: params.teamId,
                    purpose: "INBOUND",
                    provider: "PLATFORM_SES",
                    from_email: `inbound@${rawDomain}`,
                    verification_status: "VERIFIED",
                    ...replyData,
                } as any,
            });
        }

        systemLogger.info(`[REPLY_DOMAIN] Setup complete for ${rawDomain} (team: ${params.teamId})`);

        return NextResponse.json({
            success: true,
            domain: rawDomain,
            status: "PENDING_MX",
            mxRecord: {
                type: "MX",
                name: rawDomain,
                value: `inbound-smtp.${SES_REGION}.amazonaws.com`,
                priority: 10,
            },
            message: `Reply domain ${rawDomain} is set up. Add the MX record to your DNS to start receiving replies.`,
        });

    } catch (error: any) {
        systemLogger.error("[REPLY_DOMAIN_POST]", error);
        return NextResponse.json({ error: error.message || "Failed to set up reply domain" }, { status: 500 });
    }
}

/**
 * GET /api/teams/[teamId]/email-config/reply-domain
 * Get current reply domain configuration and check MX verification status.
 */
export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id_purpose: { team_id: params.teamId, purpose: "INBOUND" } }
    });

    if (!config?.reply_domain) {
        return NextResponse.json({ domain: null, status: null });
    }

    // If PENDING_MX, check if MX record has propagated by querying SES identity status
    if (config.reply_domain_status === "PENDING_MX") {
        try {
            const ses = new SES({ region: SES_REGION, credentials: getAwsCredentials() });
            const result = await ses.getIdentityVerificationAttributes({
                Identities: [config.reply_domain]
            });
            const attr = result.VerificationAttributes?.[config.reply_domain];
            if (attr?.VerificationStatus === "Success") {
                await prismadb.teamEmailConfig.update({
                    where: { id: config.id },
                    data: {
                        reply_domain_status: "VERIFIED",
                        reply_domain_verified_at: new Date(),
                    } as any,
                });
                return NextResponse.json({
                    domain: config.reply_domain,
                    status: "VERIFIED",
                    topicArn: config.reply_sns_topic_arn,
                });
            }
        } catch (err: any) {
            systemLogger.warn(`[REPLY_DOMAIN] Failed to check SES status: ${err.message}`);
        }
    }

    return NextResponse.json({
        domain: config.reply_domain,
        status: config.reply_domain_status,
        topicArn: config.reply_sns_topic_arn,
        verifiedAt: config.reply_domain_verified_at,
        mxRecord: config.reply_domain_status !== "VERIFIED" ? {
            type: "MX",
            name: config.reply_domain,
            value: `inbound-smtp.${SES_REGION}.amazonaws.com`,
            priority: 10,
        } : undefined,
    });
}

/**
 * DELETE /api/teams/[teamId]/email-config/reply-domain
 * Clean up reply domain SES resources.
 */
export async function DELETE(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const config = await prismadb.teamEmailConfig.findUnique({
            where: { team_id_purpose: { team_id: params.teamId, purpose: "INBOUND" } }
        });

        if (!config?.reply_domain) {
            return NextResponse.json({ error: "No reply domain configured" }, { status: 404 });
        }

        const credentials = getAwsCredentials();
        const ses = new SES({ region: SES_REGION, credentials });
        const sns = new SNSClient({ region: SES_REGION, credentials });

        // Remove SES receipt rule
        if (config.reply_receipt_rule) {
            try {
                await ses.deleteReceiptRule({
                    RuleSetName: ACTIVE_RULE_SET_NAME,
                    RuleName: config.reply_receipt_rule as string,
                });
            } catch (e: any) {
                systemLogger.warn(`[REPLY_DOMAIN] Failed to delete receipt rule: ${e.message}`);
            }
        }

        // Delete SNS topic
        if (config.reply_sns_topic_arn) {
            try {
                await sns.send(new DeleteTopicCommand({ TopicArn: config.reply_sns_topic_arn as string }));
            } catch (e: any) {
                systemLogger.warn(`[REPLY_DOMAIN] Failed to delete SNS topic: ${e.message}`);
            }
        }

        // Remove domain identity from SES
        try {
            await ses.deleteIdentity({ Identity: config.reply_domain });
        } catch (e: any) {
            systemLogger.warn(`[REPLY_DOMAIN] Failed to delete SES identity: ${e.message}`);
        }

        // Clear DB fields
        await prismadb.teamEmailConfig.update({
            where: { id: config.id },
            data: {
                reply_domain: null,
                reply_domain_status: null,
                reply_sns_topic_arn: null,
                reply_receipt_rule: null,
                reply_domain_verified_at: null,
            } as any,
        });

        systemLogger.info(`[REPLY_DOMAIN] Cleaned up reply domain for team ${params.teamId}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        systemLogger.error("[REPLY_DOMAIN_DELETE]", error);
        return NextResponse.json({ error: error.message || "Failed to remove reply domain" }, { status: 500 });
    }
}
