import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { renderOutreachTemplate, type OutreachRenderProps } from "@/lib/outreach/outreach-templates";
import { resolveIconUrl, inferIconFromResource } from "@/lib/outreach/outreach-icons";

/**
 * POST /api/outreach/preview/template
 * Body: { templateId: string, brandId?: string, props?: Partial<OutreachRenderProps> }
 *
 * Returns rendered HTML for the given template.
 * If brandId is provided, fetches real brand assets (color, logo, signature, resources).
 */

const DEFAULT_PREVIEW_BODY = `Hi Alex,

I came across Meridian Ventures and was impressed by your portfolio's focus on enterprise SaaS infrastructure. Your recent investment in cloud-native observability caught my attention — it aligns closely with what we're building.

We've developed a next-generation platform that addresses the critical gap between real-time data ingestion and actionable insights. Our early customers include three Fortune 500 companies, and we've seen 340% quarter-over-quarter growth in pipeline.

I'd love to share how our approach differs from existing solutions and explore whether there's alignment with your thesis. Would you be open to a 20-minute conversation next week?

Looking forward to connecting,
Jordan Mitchell`;

const DEFAULT_PREVIEW_RESOURCES = [
    { id: "website", label: "Visit Website", href: "#", type: "primary" as const, icon: "globe", enabled: true },
    { id: "calendar", label: "Schedule a Call", href: "#", type: "primary" as const, icon: "calendar", enabled: true },
    { id: "linkedin", label: "Connect on LinkedIn", href: "#", type: "secondary" as const, icon: "link", enabled: true },
];

const DEFAULT_SIGNATURE = '<div style="font-size:13px;color:#6b7280;"><strong>Jordan Mitchell</strong><br/>Head of Business Development<br/>Acme Corp</div>';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json().catch(() => ({}));
        const templateId = body.templateId || "minimal";

        // Fetch brand data if brandId is provided
        let brandColor = "#F54029";
        let brandLogoUrl: string | undefined;
        let brandCompanyName: string | undefined;
        let brandSignature: string | undefined;
        let brandResources: any[] | undefined;

        if (body.brandId) {
            try {
                const brand = await prismadb.crm_Outreach_Brands.findFirst({
                    where: {
                        id: body.brandId,
                        user_id: session.user.id,
                    },
                    select: {
                        primary_brand_color: true,
                        logo_url: true,
                        company_name: true,
                        signature_html: true,
                        resource_links: true,
                    },
                });
                if (brand?.primary_brand_color) brandColor = brand.primary_brand_color;
                if (brand?.logo_url) brandLogoUrl = brand.logo_url;
                if (brand?.company_name) brandCompanyName = brand.company_name;
                if (brand?.signature_html) brandSignature = brand.signature_html;
                if (brand?.resource_links && Array.isArray(brand.resource_links)) {
                    brandResources = brand.resource_links as any[];
                }
            } catch { }
        }

        const baseUrl = process.env.NEXTAUTH_URL || "";

        const brandColorHex = (body.props?.brand?.accentColor || brandColor || "#1f2937").replace("#", "");

        // Resolve icon names to self-hosted SVG URLs
        const rawResources = body.props?.resources || brandResources || DEFAULT_PREVIEW_RESOURCES;
        const resolvedResources = rawResources.map((r: any) => {
            const iconName = r.icon || inferIconFromResource(r);
            const isPrimary = r.type === "primary";
            const colorParam = isPrimary ? "ffffff" : brandColorHex;
            return {
                ...r,
                iconUrl: resolveIconUrl(iconName, baseUrl, colorParam) || r.iconUrl,
                iconName,
            };
        });

        const props: OutreachRenderProps = {
            subjectPreview: body.props?.subjectPreview || "Exploring Partnership Opportunities",
            bodyText: body.props?.bodyText || DEFAULT_PREVIEW_BODY,
            resources: resolvedResources,
            signatureHtml: body.props?.signatureHtml || brandSignature || DEFAULT_SIGNATURE,
            brand: {
                accentColor: body.props?.brand?.accentColor || brandColor,
                secondaryColor: body.props?.brand?.secondaryColor || undefined,
                primaryText: body.props?.brand?.primaryText || "#1f2937",
                logoUrl: body.props?.brand?.logoUrl || brandLogoUrl,
                logoAlt: body.props?.brand?.logoAlt || brandCompanyName || "Logo",
            },
            templateOptions: body.props?.templateOptions || undefined,
        };

        const html = await renderOutreachTemplate(templateId, props);

        return NextResponse.json({ html }, { status: 200 });
    } catch (error) {
        console.error("[OUTREACH_PREVIEW_TEMPLATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
// Force HMR reload for template engine
