import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyDomainIdentity, getIdentityVerificationStatus } from "@/lib/aws/ses-verify";
import sendEmail from "@/lib/sendmail";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

// POST: Request domain verification (Enterprise / Individual_Pro only)
export async function POST(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { domain } = body;

    if (!domain || !domain.includes(".")) {
        return NextResponse.json({ error: "Valid domain required (e.g. acmecorp.com)" }, { status: 400 });
    }

    // Strip protocol/paths if user accidentally pasted a URL
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();

    try {
        // 1. Verify the team has an eligible plan
        const team = await prismadb.team.findUnique({
            where: { id: params.teamId },
            select: {
                id: true,
                name: true,
                slug: true,
                subscription_plan: true,
                assigned_plan: { select: { slug: true, name: true } }
            }
        });

        if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

        // Check plan eligibility — only INDIVIDUAL_PRO, ENTERPRISE, EXEMPT, TESTING
        const planSlug = team.assigned_plan?.slug || team.subscription_plan;
        const eligiblePlans = ["INDIVIDUAL_PRO", "ENTERPRISE", "EXEMPT", "TESTING"];
        if (!eligiblePlans.includes(planSlug)) {
            return NextResponse.json({
                error: "Domain verification is available on Individual Pro and Enterprise plans. Please upgrade to access this feature."
            }, { status: 403 });
        }

        // 2. Trigger SES domain verification (uses platform credentials)
        const result = await verifyDomainIdentity(cleanDomain);

        // 3. Build DNS records for the team to configure
        const dnsRecords = result.dkimTokens.map((token: string) => ({
            type: "CNAME",
            name: `${token}._domainkey.${cleanDomain}`,
            value: `${token}.dkim.amazonses.com`
        }));

        // 4. Update TeamEmailConfig with domain info
        const existingConfig = await prismadb.teamEmailConfig.findUnique({
            where: { team_id: params.teamId }
        });

        const domainData = {
            custom_domain: cleanDomain,
            domain_verification_token: result.verificationToken || null,
            domain_dkim_tokens: result.dkimTokens,
            domain_status: "PENDING_APPROVAL",
            domain_requested_at: new Date(),
        };

        if (existingConfig) {
            await prismadb.teamEmailConfig.update({
                where: { id: existingConfig.id },
                data: domainData
            });
        } else {
            await prismadb.teamEmailConfig.create({
                data: {
                    team_id: params.teamId,
                    provider: "PLATFORM_SES",
                    from_email: `noreply@${cleanDomain}`,
                    ...domainData,
                }
            });
        }

        // 5. SOC2 Audit Log
        await logActivityInternal(
            session.user.id,
            "DOMAIN_VERIFICATION_REQUEST",
            "Email Configuration",
            `Requested domain verification for ${cleanDomain}`,
            params.teamId
        );

        // 6. Notify BasaltHQ Admin Team
        const adminNotificationEmail = process.env.SES_FROM_ADDRESS || process.env.EMAIL_FROM || "admin@basalthq.com";
        try {
            await sendEmail({
                to: adminNotificationEmail,
                subject: `🔔 Domain Verification Request: ${cleanDomain}`,
                text: `Team "${team.name}" (${team.slug}) has requested domain verification for ${cleanDomain}.\n\nTeam ID: ${team.id}\nPlan: ${planSlug}\nRequested by: ${session.user.email || session.user.name}\n\nDNS Records to share with the team:\n\n${dnsRecords.map((r: any) => `${r.type}: ${r.name} → ${r.value}`).join("\n")}\n\nPlease review and share these DNS records with the team.`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px;">
                        <h2 style="color: #6366f1;">🔔 Domain Verification Request</h2>
                        <p><strong>Team:</strong> ${team.name} (${team.slug})</p>
                        <p><strong>Domain:</strong> ${cleanDomain}</p>
                        <p><strong>Plan:</strong> ${planSlug}</p>
                        <p><strong>Requested by:</strong> ${session.user.email || session.user.name}</p>
                        <p><strong>Team ID:</strong> <code>${team.id}</code></p>
                        <h3 style="margin-top: 24px;">DNS Records to Share</h3>
                        <table style="border-collapse: collapse; width: 100%;">
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Type</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Name</th>
                                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Value</th>
                            </tr>
                            ${dnsRecords.map((r: any) => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${r.type}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 12px;">${r.name}</td>
                                    <td style="padding: 8px; border: 1px solid #e5e7eb; font-size: 12px;">${r.value}</td>
                                </tr>
                            `).join("")}
                        </table>
                        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
                            Please share these DNS records with the team so they can configure their domain.
                            Once the records propagate, SES will automatically verify the domain.
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            systemLogger.error("[DomainVerification] Failed to send admin notification:", emailError);
        }

        return NextResponse.json({
            success: true,
            domain: cleanDomain,
            status: "PENDING_APPROVAL",
            dnsRecords,
            message: "Your domain verification request has been submitted. Our team will review it and share the DNS records with you shortly."
        });

    } catch (error: any) {
        systemLogger.error("[DOMAIN_VERIFICATION_POST]", error);
        return NextResponse.json({ error: error.message || "Failed to initiate domain verification" }, { status: 500 });
    }
}

// GET: Check domain verification status
export async function GET(req: Request, props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await prismadb.teamEmailConfig.findUnique({
        where: { team_id: params.teamId }
    });

    if (!config?.custom_domain) {
        return NextResponse.json({ domain: null, status: null });
    }

    // If DNS_PENDING, proactively check SES
    if (config.domain_status === "DNS_PENDING") {
        const status = await getIdentityVerificationStatus(config.custom_domain);
        if (status === "SUCCESS") {
            await prismadb.teamEmailConfig.update({
                where: { id: config.id },
                data: { domain_status: "VERIFIED" }
            });
            return NextResponse.json({ domain: config.custom_domain, status: "VERIFIED", dkimTokens: config.domain_dkim_tokens });
        }
    }

    return NextResponse.json({
        domain: config.custom_domain,
        status: config.domain_status,
        dkimTokens: config.domain_dkim_tokens,
        requestedAt: config.domain_requested_at
    });
}
