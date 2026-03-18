import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword } from "@/lib/password-utils";
import { logActivityInternal } from "@/actions/audit";
import sendEmail from "@/lib/sendmail";
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, username, email, language, password, confirmPassword,
      companyName, planId, avatar, billingCycle = "monthly",
      paymentMethod = "card", wallet, termsAccepted, turnstile_token
    } = body;

    // Validate required fields
    if (!name || !email || !language || !password || !confirmPassword || !companyName || !planId) {
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

    // SOC2 Consent Requirement
    if (!termsAccepted) {
      return new NextResponse("You must accept the Terms of Service and Privacy Policy.", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Password does not match", { status: 400 });
    }

    // NIST 800-63B Alignment: Length over complexity.
    if (!password || password.length < 8) {
      return new NextResponse(
        "Password must be at least 8 characters long. We recommend a long passphrase.",
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return new NextResponse("Password too long (max 128 characters).", { status: 400 });
    }

    // ... (rest of validation) ...
    // Check if user already exists
    const checkexisting = await prismadb.users.findFirst({
      where: {
        email: email,
      },
    });

    if (checkexisting) {
      return new NextResponse("User already exist", { status: 409 });
    }

    // Check if team slug exists (simple slugify)
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const checkSlug = await prismadb.team.findUnique({
      where: { slug }
    });

    if (checkSlug) {
      return new NextResponse("Company name already taken (slug collision). Please choose another.", { status: 409 });
    }

    // Fetch the selected plan
    let selectedPlan: any;
    if (planId === "enterprise-contact") {
      selectedPlan = await prismadb.plan.findFirst({
        where: { slug: "ENTERPRISE" }
      });

      if (!selectedPlan) {
        selectedPlan = {
          id: "enterprise-placeholder",
          name: "Enterprise",
          slug: "ENTERPRISE",
          price: 0,
          features: ["all"]
        };
      }
    } else {
      selectedPlan = await prismadb.plan.findUnique({
        where: { id: planId }
      });
    }

    if (!selectedPlan) {
      return new NextResponse("Invalid Plan selected", { status: 400 });
    }

    const isFree = selectedPlan.price === 0 || selectedPlan.slug === "FREE";

    // Block non-free plans & Enterprise since payment flow is not ready
    if (planId === "enterprise-contact" || !isFree) {
      try {
        await sendEmail({
          to: "sysadm@basalthq.com, sales@basalthq.com",
          subject: `Interest in ${selectedPlan.name} Plan`,
          text: `User ${name} (${email}) from company ${companyName} tried to register for the ${selectedPlan.name} plan.`,
          html: `<p>User <strong>${name}</strong> (${email}) from company <strong>${companyName}</strong> tried to register for the <strong>${selectedPlan.name}</strong> plan.</p><p>As payment flows are disabled, their account was not created.</p>`
        });
      } catch (err) {
        systemLogger.error("[Register] Failed to send plan interest email", err);
      }
      return new NextResponse("We are currently limiting new paid signups. Our team has been notified of your interest and will contact you shortly.", { status: 400 });
    }

    let initialStatus: string = "ACTIVE"; // If we only allow free, it's always ACTIVE

    let finalPrice = selectedPlan.price;
    if (!isFree && billingCycle === "annual") {
      if (paymentMethod === "crypto" && wallet) {
        finalPrice = (selectedPlan.price * 12) * 0.75;
      } else {
        finalPrice = (selectedPlan.price * 12) * 0.80;
      }
    }

    const hashedPassword = await hashPassword(password);

    let avatarUrl = avatar;
    if (avatar && avatar.startsWith("data:image")) {
      try {
        const { getBlobServiceClient } = await import("@/lib/s3-storage");
        const container = process.env.BLOB_STORAGE_CONTAINER;
        if (container) {
          const serviceClient = getBlobServiceClient();
          const containerClient = serviceClient.getContainerClient(container);

          const base64Data = avatar.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const mimeType = avatar.split(";")[0].split(":")[1];
          const extension = mimeType.split("/")[1] || "png";
          const key = `avatars / public / ${Date.now()}_${Math.random().toString(36).substring(7)}.${extension} `;

          const blobClient = containerClient.getBlockBlobClient(key);
          await blobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType },
          });
          avatarUrl = blobClient.url;
          systemLogger.error("[Register] Avatar uploaded successfully:", avatarUrl);
        }
      } catch (uploadError) {
        systemLogger.error("[Register] Avatar upload failed:", uploadError);
        // Fallback to null or keep original if it was a URL
      }
    }

    const user = await (prismadb.users as any).create({
      data: {
        name,
        username,
        email,
        avatar: avatarUrl,
        userLanguage: "en",
        password: hashedPassword,
        userStatus: initialStatus === "PENDING" ? "PENDING" : "ACTIVE",
        is_admin: false,
        is_account_admin: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });

    // Create Team
    const team = await prismadb.team.create({
      data: {
        name: companyName,
        slug: slug,
        owner_id: user.id,
        plan_id: selectedPlan.id,
        status: initialStatus === "PENDING" ? "PENDING" : "ACTIVE",
        members: {
          connect: { id: user.id }
        }
      }
    });

    // Update User with Team ID (and role)
    await prismadb.users.update({
      where: { id: user.id },
      data: {
        team_id: team.id,
        team_role: "OWNER"
      }
    });

    // 3. Optional: Create initial subscription record
    // This allows the billing dashboard to show their status immediately
    const sub = await prismadb.crm_Subscriptions.create({
      data: {
        tenant_id: team.id,
        customer_email: user.email,
        customer_wallet: wallet,
        plan_name: selectedPlan.name,
        amount: finalPrice,
        billing_day: new Date().getDate(),
        interval: billingCycle,
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + (billingCycle === "annual" ? 12 : 1))),
        status: initialStatus === "PENDING" ? "OVERDUE" : "ACTIVE", // Overdue if payment required
        last_charge_status: initialStatus === "PENDING" ? "PENDING_FIRST_PAYMENT" : "SYSTEM_FREE_TIER",
        discount_applied: billingCycle === "annual"
      }
    });

    // 4. Auto-trigger SES email verification (PLATFORM_SES) for the new team owner
    // The user's registration email is used — AWS SES sends a verification link immediately.
    // When they click it, their team is verified and can send outreach without any Settings page visit.
    try {
      const { verifyEmailIdentity } = await import("@/lib/aws/ses-verify");

      // Create the TeamEmailConfig record with PLATFORM_SES
      await prismadb.teamEmailConfig.create({
        data: {
          team_id: team.id,
          purpose: "GENERAL",
          provider: "PLATFORM_SES",
          from_email: email,
          from_name: companyName,
          verification_status: "PENDING",
        }
      });

      // Trigger the SES verification email (uses platform system credentials)
      await verifyEmailIdentity(email);
      systemLogger.error(`[Register] SES verification triggered for ${email} (Team: ${team.id})`);
    } catch (sesError) {
      // Non-blocking — registration still succeeds if SES trigger fails
      systemLogger.error("[Register] Auto SES verification failed (non-fatal):", sesError);
    }

    let paymentUrl = null;
    let activeInvoiceId = null;

    if (!isFree) {
      // 4. Generate Surge Payment Link for Paid Plans
      try {
        const { createSurgeCheckoutSession } = await import("@/lib/surge");

        const invoice = await prismadb.invoices.create({
          data: {
            team_id: team.id,
            assigned_user_id: user.id,
            invoice_number: `REG - ${Date.now()} `,
            invoice_amount: finalPrice.toString(),
            invoice_currency: "USD",
            description: `Registration: ${selectedPlan.name} (${billingCycle})`,
            status: "UNPAID",
            payment_status: "UNPAID",
            invoice_file_mimeType: "application/pdf",
            invoice_file_url: ""
          }
        });

        const checkout = await createSurgeCheckoutSession(team.id, invoice);
        if (checkout) {
          paymentUrl = checkout.url;
          activeInvoiceId = invoice.id;

          // Update invoice with surge details
          await prismadb.invoices.update({
            where: { id: invoice.id },
            data: {
              surge_payment_id: checkout.id,
              surge_payment_link: checkout.url,
              payment_status: "PENDING"
            }
          });
        }
      } catch (surgeError) {
        systemLogger.error("[Register] Surge link generation failed:", surgeError);
      }
    }

    // Send Emails
    const sendFrom = process.env.EMAIL_FROM || "sales@basalthq.com";

    // Notify sysadm and sales that a new team was spawned
    try {
      await sendEmail({
        to: "sysadm@basalthq.com, sales@basalthq.com",
        subject: `New Team Created: ${team.name} (${selectedPlan.name})`,
        text: `A new team has been spawned.\n\nTeam Name: ${team.name}\nTeam ID: ${team.id}\nPlan: ${selectedPlan.name}\nOwner: ${user.name} (${user.email})`,
        html: `<p>A new team has been spawned.</p>
               <ul>
                 <li><strong>Team Name:</strong> ${team.name}</li>
                 <li><strong>Team ID:</strong> ${team.id}</li>
                 <li><strong>Plan:</strong> ${selectedPlan.name}</li>
                 <li><strong>Owner:</strong> ${user.name} (${user.email})</li>
               </ul>`
      });
    } catch (emailErr) {
      systemLogger.error("[Register] Failed to send new team notification email", emailErr);
    }

    // ... (Email logic remains same)

    return NextResponse.json({
      ...user,
      teamId: team.id,
      requiresPayment: !isFree,
      paymentUrl,
      invoiceId: activeInvoiceId,
      amount: finalPrice.toString()
    });

  } catch (error) {
    systemLogger.error("[USERS_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  if (!session || !session.user) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  // Return just the current authenticated user context (lightweight for popup)
  return NextResponse.json({ user: session.user });
}
