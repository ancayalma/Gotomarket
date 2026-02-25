import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";

const isValidId = (id: any) => typeof id === "string" && id.length === 24;

//Create route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      assigned_to,
      assigned_account,
      birthday_day,
      birthday_month,
      birthday_year,
      description,
      email,
      personal_email,
      first_name,
      last_name,
      office_phone,
      mobile_phone,
      website,
      status,
      social_twitter,
      social_facebook,
      social_linkedin,
      social_skype,
      social_instagram,
      social_youtube,
      social_tiktok,
      type,
    } = body;

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // Helper to escape regex special characters for case-insensitive search on MongoDB
    const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const existingContact = await (prismadb.crm_Contacts as any).findFirst({
      where: {
        assigned_team: isValidId(teamId) ? { id: teamId } : undefined,
        OR: [
          ...(email ? [{ email: { equals: escapeRegExp(email), mode: "insensitive" } }] : []),
          ...(mobile_phone ? [{ mobile_phone: { equals: mobile_phone } }] : []),
          ...(office_phone ? [{ office_phone: { equals: office_phone } }] : []),
        ],
      },
    });

    if (existingContact) {
      // Merge: Update existing contact with new data if current fields are empty
      const updatedContact = await (prismadb.crm_Contacts as any).update({
        where: { id: existingContact.id },
        data: {
          first_name: existingContact.first_name || first_name,
          last_name: existingContact.last_name || last_name,
          description: existingContact.description || description,
          personal_email: existingContact.personal_email || personal_email,
          office_phone: existingContact.office_phone || office_phone,
          mobile_phone: existingContact.mobile_phone || mobile_phone,
          website: existingContact.website || website,
          social_twitter: existingContact.social_twitter || social_twitter,
          social_facebook: existingContact.social_facebook || social_facebook,
          social_linkedin: existingContact.social_linkedin || social_linkedin,
          social_skype: existingContact.social_skype || social_skype,
          social_instagram: existingContact.social_instagram || social_instagram,
          social_youtube: existingContact.social_youtube || social_youtube,
          social_tiktok: existingContact.social_tiktok || social_tiktok,
          updatedBy: userId,
        },
      });
      return NextResponse.json({ newContact: updatedContact }, { status: 200 });
    }

    const newContact = await (prismadb.crm_Contacts as any).create({
      data: {
        v: 0,
        assigned_team: isValidId(teamId) ? { connect: { id: teamId } } : undefined,
        createdBy: userId,
        updatedBy: userId,
        ...(assigned_account !== null && assigned_account !== undefined
          ? {
            assigned_accounts: {
              connect: {
                id: assigned_account,
              },
            },
          }
          : {}),
        assigned_to_user: {
          connect: {
            id: assigned_to,
          },
        },
        birthday: (birthday_day && birthday_month && birthday_year)
          ? birthday_day + "/" + birthday_month + "/" + birthday_year
          : null,
        description,
        email,
        personal_email,
        first_name,
        last_name,
        office_phone,
        mobile_phone,
        website,
        status,
        social_twitter,
        social_facebook,
        social_linkedin,
        social_skype,
        social_instagram,
        social_youtube,
        social_tiktok,
        type,
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject: `New contact ${first_name} ${last_name} has been added to the system and assigned to you.`,
        text: `New contact ${first_name} ${last_name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/contacts/${newContact.id}`,
      });
    }

    return NextResponse.json({ newContact }, { status: 200 });
  } catch (error) {
    console.log("[NEW_CONTACT_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update route
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      id,
      assigned_account,
      assigned_to,
      birthday_day,
      birthday_month,
      birthday_year,
      description,
      email,
      personal_email,
      first_name,
      last_name,
      office_phone,
      mobile_phone,
      website,
      status,
      social_twitter,
      social_facebook,
      social_linkedin,
      social_skype,
      social_instagram,
      social_youtube,
      social_tiktok,
      type,
    } = body;

    console.log(assigned_account, "assigned_account");

    const newContact = await prismadb.crm_Contacts.update({
      where: {
        id,
      },
      data: {
        v: 0,
        updatedBy: userId,
        //Update assigned_accountsIDs only if assigned_account is not empty
        ...(assigned_account !== null && assigned_account !== undefined
          ? {
            assigned_accounts: {
              connect: {
                id: assigned_account,
              },
            },
          }
          : {}),
        assigned_to_user: {
          connect: {
            id: assigned_to,
          },
        },
        birthday: (birthday_day && birthday_month && birthday_year)
          ? birthday_day + "/" + birthday_month + "/" + birthday_year
          : null,
        description,
        email,
        personal_email,
        first_name,
        last_name,
        office_phone,
        mobile_phone,
        website,
        status,
        social_twitter,
        social_facebook,
        social_linkedin,
        social_skype,
        social_instagram,
        social_youtube,
        social_tiktok,
        type,
      },
    });

    /*     if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject:
          notifyRecipient.userLanguage === "en"
            ? `New contact ${first_name} ${last_name} has been added to the system and assigned to you.`
            : `Nový kontakt ${first_name} ${last_name} byla přidána do systému a přidělena vám.`,
        text:
          notifyRecipient.userLanguage === "en"
            ? `New contact ${first_name} ${last_name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/contacts/${newContact.id}`
            : `Nový kontakt ${first_name} ${last_name} byla přidán do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/contact/${newContact.id}`,
      });
    } */

    return NextResponse.json({ newContact }, { status: 200 });
  } catch (error) {
    console.log("UPDATE_CONTACT_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
