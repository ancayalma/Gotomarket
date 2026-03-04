import sendEmail from "@/lib/sendmail";

export async function sendSmsSetupInstructions(userEmail: string, userName: string, planName: string, appUrl: string) {
    const subject = `Action Required: Setup your SMS configuration for ${planName} Plan`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2c3e50;">Welcome to your new ${planName} Plan! 🎉</h2>
        <p>Hi ${userName || "there"},</p>
        <p>Thank you for upgrading! Your account has been provisioned with new features, including the ability to perform programmatic SMS outreach.</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #f97316;">Action Required: SMS 10DLC Registration</h3>
            <p>To comply with U.S. telecom carrier regulations (10DLC) and ensure maximum delivery rates for your text messages, you need to register your brand.</p>
            <p><strong>Until you complete this step, SMS outreach will remain disabled on your account.</strong></p>
        </div>

        <h3>How to activate your SMS capabilities:</h3>
        <ol style="line-height: 1.6;">
            <li>Log in to your <strong>BasaltCRM</strong> dashboard.</li>
            <li>Navigate to <strong>Admin > SMS Configuration</strong>.</li>
            <li>Fill out your <em>Legal Business Name</em>, <em>EIN (Tax ID)</em>, and contact details.</li>
            <li>Click <strong>Submit Registration</strong>.</li>
        </ol>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/admin/sms-config" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Admin Panel</a>
        </div>

        <p>Our compliance team will review your application and assign a dedicated sending number for your team. This usually takes 24-48 hours. The status badge will turn "Approved" when it's ready!</p>

        <p>If you don't plan on using the SMS feature, you can safely ignore this email.</p>

        <p style="color: #666;">
            Best regards,<br>
            <strong>The BasaltCRM Compliance Team</strong><br>
            <a href="mailto:support@basalthq.com" style="color: #f97316;">support@basalthq.com</a>
        </p>
    </div>
    `;

    try {
        await sendEmail({
            to: userEmail,
            subject,
            text: `Please set up your SMS Configuration in your BasaltCRM Team Settings to activate text messaging for your ${planName} Plan.`,
            html,
        });
        console.log(`[SMS Setup Email] Sent SMS setup instructions to ${userEmail}`);
    } catch (error) {
        console.error(`[SMS Setup Email] Failed to send to ${userEmail}:`, error);
    }
}
