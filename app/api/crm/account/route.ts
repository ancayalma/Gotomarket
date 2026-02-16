import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

//Create new account route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const body = await req.json();
    const {
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    const existingAccount = await (prismadb.crm_Accounts as any).findFirst({
      where: {
        team_id: teamId,
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          ...(email ? [{ email: { equals: email, mode: "insensitive" } }] : []),
          ...(office_phone ? [{ office_phone: { equals: office_phone, mode: "insensitive" } }] : []),
        ],
      },
    });

    if (existingAccount) {
      // Merge: Update existing account with new data if current fields are empty
      const updatedAccount = await (prismadb.crm_Accounts as any).update({
        where: { id: existingAccount.id },
        data: {
          office_phone: existingAccount.office_phone || office_phone,
          website: existingAccount.website || website,
          fax: existingAccount.fax || fax,
          company_id: existingAccount.company_id || company_id,
          vat: existingAccount.vat || vat,
          email: existingAccount.email || email,
          billing_street: existingAccount.billing_street || billing_street,
          billing_postal_code: existingAccount.billing_postal_code || billing_postal_code,
          billing_city: existingAccount.billing_city || billing_city,
          billing_state: existingAccount.billing_state || billing_state,
          billing_country: existingAccount.billing_country || billing_country,
          shipping_street: existingAccount.shipping_street || shipping_street,
          shipping_postal_code: existingAccount.shipping_postal_code || shipping_postal_code,
          shipping_city: existingAccount.shipping_city || shipping_city,
          shipping_state: existingAccount.shipping_state || shipping_state,
          shipping_country: existingAccount.shipping_country || shipping_country,
          description: existingAccount.description || description,
          annual_revenue: existingAccount.annual_revenue || annual_revenue,
          member_of: existingAccount.member_of || member_of,
          industry: existingAccount.industry || industry,
          updatedBy: session.user.id,
        },
      });
      return NextResponse.json({ newAccount: updatedAccount }, { status: 200 });
    }

    const newAccount = await (prismadb.crm_Accounts as any).create({
      data: {
        v: 0,
        team_id: teamId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        name,
        office_phone,
        website,
        fax,
        company_id,
        vat,
        email,
        billing_street,
        billing_postal_code,
        billing_city,
        billing_state,
        billing_country,
        shipping_street,
        shipping_postal_code,
        shipping_city,
        shipping_state,
        shipping_country,
        description,
        assigned_to,
        status: "Active",
        annual_revenue,
        member_of,
        industry,
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[NEW_ACCOUNT_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update account route
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      id,
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    const newAccount = await (prismadb.crm_Accounts as any).update({
      where: {
        id,
      },
      data: {
        v: 0,
        updatedBy: session.user.id,
        name,
        office_phone,
        website,
        fax,
        company_id,
        vat,
        email,
        billing_street,
        billing_postal_code,
        billing_city,
        billing_state,
        billing_country,
        shipping_street,
        shipping_postal_code,
        shipping_city,
        shipping_state,
        shipping_country,
        description,
        assigned_to,
        status: status,
        annual_revenue,
        member_of,
        industry,
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[UPDATE_ACCOUNT_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//GET all accounts route
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    // If no team, return empty? 
    // Or allow seeing all if System Admin? For now default to strict team isolation.
    const where: any = {};
    if (teamInfo?.teamId) {
      where.team_id = teamInfo.teamId;
    } else {
      // Fallback: If no team, maybe return nothing?
      // Or if admin?
      // Let's return nothing if no team to be safe.
      // Unless admin... let's stick to team_id check.
      // If team_id is missing on user, they see nothing.
      return NextResponse.json([], { status: 200 });
    }

    const accounts = await (prismadb.crm_Accounts as any).findMany({
      where: {
        ...where,
        NOT: [
          { name: { startsWith: "Email -" } },
          { name: { startsWith: "Meeting" } },
          { name: { startsWith: "Call" } },
          { name: { startsWith: "Amazon SES" } },
          { name: { startsWith: "Project Documents" } },
        ]
      }
    });

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.log("[ACCOUNTS_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
