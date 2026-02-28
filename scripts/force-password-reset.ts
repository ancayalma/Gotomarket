import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import sendEmail from "../lib/sendmail";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting mandatory password reset campaign...");

    const users = await prisma.users.findMany({
        select: {
            id: true,
            email: true,
            name: true,
        },
    });

    console.log(`Found ${users.length} users. Processing...`);

    for (const user of users) {
        try {
            // 1. Flag user for mandatory password change
            await prisma.users.update({
                where: { id: user.id },
                data: { mustChangePassword: true },
            });

            // 2. Send notification email
            const appName = process.env.NEXT_PUBLIC_APP_NAME || "BasaltCRM";
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com";

            await sendEmail({
                from: process.env.EMAIL_FROM || "security@basalthq.com",
                to: user.email,
                subject: `[ACTION REQUIRED] Security Update: Mandatory Password Reset for ${appName}`,
                text: `Hi ${user.name || "User"},\n\nAs part of our commitment to SOC2 compliance and platform security, we have updated our password complexity requirements.\n\nYour account has been flagged for a mandatory password reset. The next time you log in to ${appUrl}, you will be prompted to choose a new password that meets our new security standards (8+ characters, uppercase, lowercase, numeric, and special character).\n\nIf you have any questions, please contact our security team.\n\nBest regards,\nThe ${appName} Security Team`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ef4444;">Security Update Required</h2>
            <p>Hi ${user.name || "User"},</p>
            <p>As part of our commitment to <strong>SOC2 compliance</strong> and platform security, we have updated our password complexity requirements.</p>
            <p>Your account has been flagged for a <strong>mandatory password reset</strong>.</p>
            <p>The next time you log in to <a href="${appUrl}">${appName}</a>, you will be prompted to choose a new password that meets our new security standards:</p>
            <ul style="background: #f9fafb; padding: 15px; border-radius: 8px; list-style-position: inside;">
              <li>At least 8 characters long</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (!@#$%^&*)</li>
            </ul>
            <p>Thank you for helping us keep your data secure.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #666;">
              Best regards,<br>
              The ${appName} Security Team
            </p>
          </div>
        `,
            });

            console.log(`✅ Processed: ${user.email}`);
        } catch (error) {
            console.error(`❌ Failed: ${user.email}`, error);
        }
    }

    console.log("🏁 Campaign completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
