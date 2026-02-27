import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { logActivityInternal } from "@/actions/audit";
import sendEmail from "@/lib/sendmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, language, password, confirmPassword, companyName, planId, avatar, billingCycle = "monthly", paymentMethod = "card", wallet } = body;

    // Validate required fields
    if (!name || !email || !language || !password || !confirmPassword || !companyName || !planId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Password does not match", { status: 400 });
    }

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
      // Find or Mock Enterprise
      selectedPlan = await prismadb.plan.findFirst({
        where: { slug: "ENTERPRISE" }
      });

      if (!selectedPlan) {
        // Fallback mock for Enterprise if not in DB
        selectedPlan = {
          id: "enterprise-placeholder",
          name: "Enterprise",
          slug: "ENTERPRISE",
          price: 0, // Contact Sales = 0 for now in system, or handled as PENDING
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

    // Determine Price and Status
    // If Plan is Free (price 0) -> ACTIVE
    // If Plan is Paid -> PENDING
    const isFree = selectedPlan.price === 0 || selectedPlan.slug === "FREE";
    const initialStatus = isFree ? "ACTIVE" : "PENDING";

    // Calculate Price based on Cycle and Payment Method
    let finalPrice = selectedPlan.price;
    if (!isFree && billingCycle === "annual") {
      if (paymentMethod === "crypto" && wallet) {
        finalPrice = (selectedPlan.price * 12) * 0.75;
      } else {
        finalPrice = (selectedPlan.price * 12) * 0.80;
      }
    }

    const hashedPassword = await hash(password, 12);

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
          const key = `avatars/public/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

          const blobClient = containerClient.getBlockBlobClient(key);
          await blobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType },
          });
          avatarUrl = blobClient.url;
          console.log("[Register] Avatar uploaded successfully:", avatarUrl);
        }
      } catch (uploadError) {
        console.error("[Register] Avatar upload failed:", uploadError);
        // Fallback to null or keep original if it was a URL
      }
    }

    const user = await prismadb.users.create({
      data: {
        name,
        username,
        email,
        avatar: avatarUrl,
        userLanguage: "en",
        password: hashedPassword,
        userStatus: initialStatus === "PENDING" ? "PENDING" : "ACTIVE",
        is_admin: false, // Default to false
        is_account_admin: true, // They are the owner of their account/team
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
            invoice_number: `REG-${Date.now()}`,
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
        console.error("[Register] Surge link generation failed:", surgeError);
      }
    }

    // Send Emails
    const sendFrom = process.env.EMAIL_FROM || "sales@basalthq.com";

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
    console.log("[USERS_POST]", error);
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
