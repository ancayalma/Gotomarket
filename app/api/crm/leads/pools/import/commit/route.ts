import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";

type ContactInput = {
  dedupeKey: string;
  candidateKey?: string;
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  existingId?: string | null;
};

const commitSchema = z.object({
  poolName: z.string().min(1).optional(),
  poolDescription: z.string().optional(),
  poolId: z.string().optional(),
  accounts: z.array(z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    location: z.string().optional(),
    domain: z.string().optional(),
    email: z.string().optional(),
  })).optional(),
  contacts: z.array(z.object({
    fullName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    accountName: z.string().optional(),
  })).optional(),
  // Compatibility with old Leads import structure if needed
  creates: z.object({
    candidates: z.array(z.any()),
    contacts: z.array(z.any()),
  }).optional(),
  updates: z.object({
    candidates: z.array(z.any()),
    contacts: z.array(z.any()),
  }).optional(),
});

async function ensureCandidateId(poolId: string, key?: string, contact?: any): Promise<string> {
  let dedupeKey = (key || "").trim().toLowerCase();
  if (!dedupeKey && contact?.email) {
    const parts = contact.email.toLowerCase().split("@");
    if (parts.length === 2) dedupeKey = parts[1];
  }
  if (!dedupeKey) dedupeKey = `import:${contact?.fullName || 'unknown'}`;

  const existing = await (prismadb.crm_Lead_Candidates as any).findFirst({
    where: { pool: poolId, dedupeKey },
    select: { id: true },
  });
  if (existing?.id) return existing.id;

  const created = await (prismadb.crm_Lead_Candidates as any).create({
    data: {
      pool: poolId,
      dedupeKey,
      domain: dedupeKey.includes(".") ? dedupeKey : undefined,
      description: "Auto-created stub from import",
      v: 0,
    },
    select: { id: true },
  });
  return created.id;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const parsed = commitSchema.safeParse(json);
    if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

    const { poolName, poolDescription, poolId, accounts, contacts } = parsed.data;
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    let targetPoolId: string;
    if (poolId) {
      targetPoolId = poolId;
    } else {
      const created = await (prismadb.crm_Lead_Pools as any).create({
        data: {
          name: poolName || "New Import",
          description: poolDescription,
          user: session.user.id,
          team_id: teamId,
          status: "ACTIVE",
          v: 0,
        },
        select: { id: true },
      });
      targetPoolId = created.id;
    }

    let createdAccountsCount = 0;
    let updatedAccountsCount = 0;
    let createdContactsCount = 0;
    let updatedContactsCount = 0;

    const accountMap = new Map<string, string>();

    // Process Accounts
    if (accounts) {
      for (const acc of accounts) {
        const name = acc.name.trim();
        const domain = acc.domain?.toLowerCase().trim();

        let existingAccount = await (prismadb.crm_Accounts as any).findFirst({
          where: {
            team_id: teamId,
            OR: [
              { name: { equals: name, mode: "insensitive" } },
              ...(domain ? [{ website: { contains: domain, mode: "insensitive" } }] : [])
            ]
          }
        });

        let accountId: string;
        if (existingAccount) {
          await (prismadb.crm_Accounts as any).update({
            where: { id: existingAccount.id },
            data: {
              type: acc.type || existingAccount.type,
              billing_city: acc.location || existingAccount.billing_city,
              website: acc.domain || existingAccount.website,
              email: acc.email || existingAccount.email,
              updatedBy: session.user.id,
            }
          });
          accountId = existingAccount.id;
          updatedAccountsCount++;
        } else {
          const created = await (prismadb.crm_Accounts as any).create({
            data: {
              name,
              type: acc.type || "Analyst",
              billing_city: acc.location,
              website: acc.domain,
              email: acc.email,
              status: "Active",
              v: 0,
              createdBy: session.user.id,
              team_id: teamId,
            }
          });
          accountId = created.id;
          createdAccountsCount++;
        }
        accountMap.set(name.toLowerCase(), accountId);

        await (prismadb.crm_Lead_Candidates as any).create({
          data: {
            pool: targetPoolId,
            companyName: name,
            domain: domain,
            industry: acc.type,
            accountsIDs: accountId,
            dedupeKey: domain || name.toLowerCase(),
            v: 0
          }
        });
      }
    }

    // Process Contacts
    if (contacts) {
      for (const con of contacts) {
        const email = con.email?.toLowerCase().trim();
        const phoneRaw = con.phone?.trim();
        const { normalized: phone } = phoneNormalizer.normalizePhone(phoneRaw, { preferUS: true });

        const linkedAccountId = con.accountName ? accountMap.get(con.accountName.toLowerCase()) : null;

        let existingContact = await (prismadb.crm_Contacts as any).findFirst({
          where: {
            team_id: teamId,
            OR: [
              ...(email ? [{ email: { equals: email, mode: "insensitive" } }] : []),
              ...(phone ? [{ mobile_phone: phone }] : [])
            ]
          }
        });

        if (existingContact) {
          await (prismadb.crm_Contacts as any).update({
            where: { id: existingContact.id },
            data: {
              position: con.title || existingContact.position,
              accountsIDs: linkedAccountId || existingContact.accountsIDs,
              updatedBy: session.user.id,
            }
          });
          updatedContactsCount++;
        } else {
          const names = con.fullName.split(" ");
          const firstName = names[0];
          const lastName = names.slice(1).join(" ") || "Contact";

          await (prismadb.crm_Contacts as any).create({
            data: {
              first_name: firstName,
              last_name: lastName,
              email: email,
              mobile_phone: phone,
              position: con.title,
              accountsIDs: linkedAccountId,
              createdBy: session.user.id,
              team_id: teamId,
              v: 0
            }
          });
          createdContactsCount++;
        }

        if (con.accountName) {
          const leadCand = await (prismadb.crm_Lead_Candidates as any).findFirst({
            where: { pool: targetPoolId, companyName: con.accountName }
          });
          if (leadCand) {
            await (prismadb.crm_Contact_Candidates as any).create({
              data: {
                leadCandidate: leadCand.id,
                fullName: con.fullName,
                title: con.title,
                email: email,
                phone: phone,
                dedupeKey: email || con.fullName.toLowerCase(),
                v: 0
              }
            });
          }
        }
      }
    }

    return NextResponse.json({
      poolId: targetPoolId,
      stats: {
        accounts: { created: createdAccountsCount, updated: updatedAccountsCount },
        contacts: { created: createdContactsCount, updated: updatedContactsCount }
      }
    });

  } catch (error: any) {
    console.error("[IMPORT_COMMIT]", error);
    return new NextResponse(error.message || "Failed to commit import", { status: 500 });
  }
}
