import { NextResponse } from "next/server";
import sendEmail from "@/lib/sendmail";
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, company, size, seats, interest, comments, turnstile_token } = body;

        if (!name || !email || !company) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

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

        const interestsStr = Array.isArray(interest) ? interest.join(", ") : interest || "None specified";

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #06b6d4;">New Enterprise Inquiry</h2>
                <p>A new prospect has requested enterprise access from the pricing page.</p>
                <hr style="border-top: 1px solid #eaeaea; my-4;" />
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${name}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${email}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Company:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${company}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Size:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${size || 'Not stated'}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Expected CRM Seats:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${seats || 'Not stated'}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;"><strong>Interests:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">${interestsStr}</td></tr>
                </table>
                <h4 style="margin-top: 20px;">Additional Comments:</h4>
                <p style="background-color: #f9fafb; padding: 12px; border-radius: 4px; font-style: italic;">${comments || 'None'}</p>
            </div>
        `;

        await sendEmail({
            to: "sysadm@basalthq.com, sales@basalthq.com",
            subject: `Enterprise Lead: ${company} (${name})`,
            text: `New Enterprise Request from ${name} (${email}) at ${company}. Interests: ${interestsStr}. Seats: ${seats}.`,
            html: htmlContent
        });

        return new NextResponse("Success", { status: 200 });

    } catch (error) {
        systemLogger.error("[ENTERPRISE_CONTACT_POST] Error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
