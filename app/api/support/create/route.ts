import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message, source, turnstile_token } = body;

        // Verify Captcha
        if (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
            if (!turnstile_token) {
                return new NextResponse("Captcha missing", { status: 400 });
            }

            const formData = new URLSearchParams();
            formData.append('secret', process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
            formData.append('response', turnstile_token);

            const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: formData,
            });

            const outcome = await captchaRes.json();
            if (!outcome.success) {
                return new NextResponse("Captcha validation failed", { status: 400 });
            }
        }

        if (!name || !email || !message) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // @ts-ignore
        const ticket = await prismadb.supportTicket.create({
            data: {
                name,
                email,
                subject: subject || "No Subject",
                message,
                source: source || "UNKNOWN",
                status: "NEW"
            }
        });

        // Log system activity (optional, but good for tracking)
        // Ignoring to keep it simple or maybe logging as system?
        // Let's just return success.

        return NextResponse.json(ticket);
    } catch (error) {
        systemLogger.error("[SUPPORT_CREATE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
