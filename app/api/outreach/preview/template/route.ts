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

        // Fetch the user's saved signature from their profile
        let userSignature: string | undefined;
        try {
            const user = await prismadb.users.findUnique({
                where: { id: session.user.id },
                select: { signature_html: true },
            });
            if (user?.signature_html) userSignature = user.signature_html as string;
        } catch { }

        // Use client-provided baseUrl (window.location.origin) for absolute icon URLs
        const reqUrl = new URL(req.url);
        const baseUrl = body.baseUrl || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || reqUrl.origin;

        const signatureSource = body.signatureSource || "brand";
        const finalSignature = signatureSource === "user" 
            ? (userSignature || brandSignature || DEFAULT_SIGNATURE)
            : (brandSignature || userSignature || DEFAULT_SIGNATURE);

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

        // Resolve bannerImageUrl to a presigned URL if it's an S3 URL
        let resolvedTemplateOptions = body.props?.templateOptions || undefined;
        if (resolvedTemplateOptions?.bannerImageUrl) {
            const bannerUrl = resolvedTemplateOptions.bannerImageUrl;
            if (bannerUrl.includes(".s3.") || bannerUrl.includes("cloud.ovh.us")) {
                try {
                    const { getBlobServiceClient } = await import("@/lib/s3-storage");
                    const s3 = getBlobServiceClient();
                    const bucketName = process.env.S3_BUCKET_NAME || "basaltcrm";
                    const urlObj = new URL(bannerUrl);
                    const pathParts = urlObj.pathname.split("/").filter(Boolean);
                    const key = pathParts[0] === bucketName ? pathParts.slice(1).join("/") : pathParts.join("/");
                    const signedUrl = await s3.getPresignedUrl(key, 604800); // 7 days
                    resolvedTemplateOptions = { ...resolvedTemplateOptions, bannerImageUrl: signedUrl };
                } catch (e) { console.error("[TEMPLATE_PREVIEW] Failed to sign banner URL:", e); }
            }
        }

        const props: OutreachRenderProps = {
            subjectPreview: body.props?.subjectPreview || "Exploring Partnership Opportunities",
            bodyText: body.props?.bodyText || DEFAULT_PREVIEW_BODY,
            resources: resolvedResources,
            signatureHtml: body.props?.signatureHtml || finalSignature,
            brand: {
                accentColor: body.props?.brand?.accentColor || brandColor,
                secondaryColor: body.props?.brand?.secondaryColor || undefined,
                primaryText: body.props?.brand?.primaryText || "#1f2937",
                logoUrl: body.props?.brand?.logoUrl || brandLogoUrl,
                logoAlt: body.props?.brand?.logoAlt || brandCompanyName || "Logo",
            },
            templateOptions: resolvedTemplateOptions,
        };

        const html = await renderOutreachTemplate(templateId, props);

        return NextResponse.json({ html }, { status: 200 });
    } catch (error) {
        console.error("[OUTREACH_PREVIEW_TEMPLATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
// Force HMR reload for template engine
