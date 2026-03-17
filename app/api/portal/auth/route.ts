import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { v4 as uuid } from "uuid";

/**
 * Self-Service Portal API
 * 
 * POST /api/portal/auth — Authenticate portal user (by email + token or generate invite)
 * GET  /api/portal/cases?token=xxx — List cases for portal user
 * POST /api/portal/cases — Create case from portal
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "login") {
            const { email, token } = body;

            if (token) {
                // Token-based login
                const portalToken = await prismadb.crm_Portal_Token.findUnique({
                    where: { token },
                    include: {
                        contact: { select: { firstName: true, lastName: true, email: true } },
                    },
                });

                if (!portalToken || !portalToken.is_active) {
                    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
                }

                if (portalToken.expires_at && portalToken.expires_at < new Date()) {
                    return NextResponse.json({ error: "Token expired" }, { status: 401 });
                }

                // Update login tracking
                await prismadb.crm_Portal_Token.update({
                    where: { id: portalToken.id },
                    data: {
                        last_login: new Date(),
                        login_count: { increment: 1 },
                    },
                });

                return NextResponse.json({
                    success: true,
                    contact: portalToken.contact,
                    permissions: portalToken.permissions,
                    token: portalToken.token,
                });
            }

            if (email) {
                // Email-based lookup
                const contact = await prismadb.crm_Contacts.findFirst({
                    where: { email },
                    select: { id: true, firstName: true, lastName: true, email: true },
                });

                if (!contact) {
                    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
                }

                // Check for existing portal token
                let portalToken = await prismadb.crm_Portal_Token.findFirst({
                    where: { contact_id: contact.id, is_active: true },
                });

                if (!portalToken) {
                    // TODO: In production, send a magic link email instead
                    return NextResponse.json({
                        error: "No portal access. Contact your administrator.",
                    }, { status: 403 });
                }

                return NextResponse.json({
                    success: true,
                    contact,
                    permissions: portalToken.permissions,
                    token: portalToken.token,
                });
            }

            return NextResponse.json({ error: "Email or token required" }, { status: 400 });
        }

        if (action === "invite") {
            // Generate portal access for a contact (admin action)
            const { contact_id, permissions, expires_days } = body;

            if (!contact_id) {
                return NextResponse.json({ error: "contact_id required" }, { status: 400 });
            }

            const token = uuid();
            const expiresAt = expires_days
                ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000)
                : null;

            const contact = await prismadb.crm_Contacts.findUnique({
                where: { id: contact_id },
                select: { id: true, account: true },
            });

            const portalToken = await prismadb.crm_Portal_Token.create({
                data: {
                    contact_id,
                    account_id: (contact?.account as any)?.id || null,
                    token,
                    permissions: permissions || ["view_cases", "create_cases", "view_knowledge"],
                    expires_at: expiresAt,
                },
            });

            return NextResponse.json({
                token: portalToken.token,
                portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal?token=${portalToken.token}`,
                expires_at: expiresAt,
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[PORTAL_AUTH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
