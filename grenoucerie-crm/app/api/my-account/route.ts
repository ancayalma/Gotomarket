import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getCurrentUserTeamId } from "@/lib/team-utils";

//Endpoint: /api/my-account

//Endpoint for adding my account data
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
      }
    );
  }

  const body = await req.json();

  const {
    company_name,
    is_person,
    email,
    email_accountant,
    phone_prefix,
    phone,
    mobile_prefix,
    mobile,
    fax_prefix,
    fax,
    website,
    street,
    city,
    state,
    zip,
    country,
    country_code,
    billing_street,
    billing_city,
    billing_state,
    billing_zip,
    billing_country,
    billing_country_code,
    currency,
    currency_symbol,
    VAT_number,
    TAX_number,
    bank_name,
    bank_account,
    bank_code,
    bank_IBAN,
    bank_SWIFT,
  } = body;

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) {
    return NextResponse.json({ message: "No active team found" }, { status: 400 });
  }

  await prismadb.myAccount.create({
    data: {
      v: 0,
      team_id: teamInfo.teamId,
      company_name,
      is_person,
      email,
      email_accountant,
      phone_prefix,
      phone,
      mobile_prefix,
      mobile,
      fax_prefix,
      fax,
      website,
      street,
      city,
      state,
      zip,
      country,
      country_code,
      billing_street,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      billing_country_code,
      currency,
      currency_symbol,
      VAT_number,
      TAX_number,
      bank_name,
      bank_account,
      bank_code,
      bank_IBAN,
      bank_SWIFT,
    },
  });

  return NextResponse.json({ message: "PUT" }, { status: 200 });
}
//Endpoint for updating my account
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
      }
    );
  }

  const body = await req.json();
  console.log(body, "body");

  if (!body.id) {
    return NextResponse.json(
      { message: "Misssing ID in body, ID is required" },
      {
        status: 400,
      }
    );
  }

  const {
    id,
    company_name,
    is_person,
    email,
    email_accountant,
    phone_prefix,
    phone,
    mobile_prefix,
    mobile,
    fax_prefix,
    fax,
    website,
    street,
    city,
    state,
    zip,
    country,
    country_code,
    billing_street,
    billing_city,
    billing_state,
    billing_zip,
    billing_country,
    billing_country_code,
    currency,
    currency_symbol,
    VAT_number,
    TAX_number,
    bank_name,
    bank_account,
    bank_code,
    bank_IBAN,
    bank_SWIFT,
  } = body;

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) {
    return NextResponse.json({ message: "No active team found" }, { status: 400 });
  }

  // Ensure the user has the right to update this account by adding team_id check (or skip if global admin)
  const whereClause: any = { id: id };
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  try {
    const existingAccount = await prismadb.myAccount.findFirst({
      where: whereClause,
    });

    if (!existingAccount) {
      return NextResponse.json({ message: "Account not found or access denied" }, { status: 404 });
    }

    await prismadb.myAccount.update({
      where: { id: id },
      data: {
        company_name,
        is_person,
        email,
        email_accountant,
        phone_prefix,
        phone,
        mobile_prefix,
        mobile,
        fax_prefix,
        fax,
        website,
        street,
        city,
        state,
        zip,
        country,
        country_code,
        billing_street,
        billing_city,
        billing_state,
        billing_zip,
        billing_country,
        billing_country_code,
        currency,
        currency_symbol,
        VAT_number,
        TAX_number,
        bank_name,
        bank_account,
        bank_code,
        bank_IBAN,
        bank_SWIFT,
      },
    });

    return NextResponse.json({ message: "PUT" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating account" }, { status: 500 });
  }
}
