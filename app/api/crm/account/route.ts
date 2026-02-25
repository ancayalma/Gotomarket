import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

const isValidId = (id: any) => typeof id === "string" && id.length === 24;

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

    const accountCount = await (prismadb.crm_Accounts as any).count({
      where: { assigned_team: isValidId(teamId) ? { id: teamId } : undefined }
    });
    const generatedCompanyId = `BSLT-${(accountCount + 1).toString().padStart(4, "0")}`;

    const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    let finalIndustryId = industry || null;
    if (industry && industry.trim() !== "") {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(industry);
      if (!isObjectId) {
        const existingIndustry = await (prismadb.crm_Industry_Type as any).findFirst({
          where: { name: { equals: escapeRegExp(industry), mode: "insensitive" } }
        });
        if (existingIndustry) {
          finalIndustryId = existingIndustry.id;
        } else {
          const newIndustry = await (prismadb.crm_Industry_Type as any).create({
            data: { name: industry, v: 0 }
          });
          finalIndustryId = newIndustry.id;
        }
      }
    } else {
      finalIndustryId = null;
    }

    const searchOrConditions: any[] = [
      { name: { equals: name } }
    ];

    if (email && email.trim() !== "") {
      searchOrConditions.push({ email: { equals: email } });
    }

    if (office_phone && office_phone.trim() !== "") {
      searchOrConditions.push({ office_phone: { equals: office_phone } });
    }

    const existingAccount = await (prismadb.crm_Accounts as any).findFirst({
      where: {
        assigned_team: isValidId(teamId) ? { id: teamId } : undefined,
        OR: searchOrConditions,
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
          company_id: existingAccount.company_id || generatedCompanyId,
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
          industry: existingAccount.industry || finalIndustryId,
          updatedBy: session.user.id,
        },
      });
      return NextResponse.json({ newAccount: updatedAccount }, { status: 200 });
    }

    const newAccount = await (prismadb.crm_Accounts as any).create({
      data: {
        v: 0,
        assigned_team: isValidId(teamId) ? { connect: { id: teamId } } : undefined,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        name,
        office_phone,
        website,
        fax,
        company_id: generatedCompanyId,
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
        industry: finalIndustryId,
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

    const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    let finalIndustryId = industry || null;
    if (industry && industry.trim() !== "") {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(industry);
      if (!isObjectId) {
        const existingIndustry = await (prismadb.crm_Industry_Type as any).findFirst({
          where: { name: { equals: escapeRegExp(industry), mode: "insensitive" } }
        });
        if (existingIndustry) {
          finalIndustryId = existingIndustry.id;
        } else {
          const newIndustry = await (prismadb.crm_Industry_Type as any).create({
            data: { name: industry, v: 0 }
          });
          finalIndustryId = newIndustry.id;
        }
      }
    } else {
      finalIndustryId = null;
    }

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
        industry: finalIndustryId,
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
      where: where
    });

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.log("[ACCOUNTS_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
