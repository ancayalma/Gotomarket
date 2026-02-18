import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";

const commitSchema = z.object({
    poolName: z.string().min(1),
    poolDescription: z.string().optional(),
    accounts: z.array(z.object({
        name: z.string().min(1),
        type: z.string().optional(),
        location: z.string().optional(),
        domain: z.string().optional(),
        email: z.string().optional(),
    })),
    contacts: z.array(z.object({
        fullName: z.string().min(1),
        title: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        accountName: z.string().optional(), // Used to link contact to account during import
    }))
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const json = await req.json();
        const parsed = commitSchema.safeParse(json);
        if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

        const { poolName, poolDescription, accounts, contacts } = parsed.data;
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        // 1. Create the List (Pool)
        const pool = await (prismadbCrm as any).crm_Lead_Pools.create({
            data: {
                name: poolName,
                description: poolDescription,
                user: session.user.id,
                team_id: teamId,
                status: "ACTIVE",
            }
        });

        let createdAccountsCount = 0;
        let updatedAccountsCount = 0;
        let createdContactsCount = 0;
        let updatedContactsCount = 0;

        const accountMap = new Map<string, string>(); // name -> id

        // 2. Process Accounts
        for (const acc of accounts) {
            const name = acc.name.trim();
            const domain = acc.domain?.toLowerCase().trim();

            // Dedupe check: Name or Domain
            let existingAccount = await (prismadbCrm as any).crm_Accounts.findFirst({
                where: {
                    OR: [
                        { name: { equals: name, mode: "insensitive" } },
                        ...(domain ? [{ website: { contains: domain, mode: "insensitive" } }] : [])
                    ]
                }
            });

            let accountId: string;
            if (existingAccount) {
                // Update existing
                await (prismadbCrm as any).crm_Accounts.update({
                    where: { id: existingAccount.id },
                    data: {
                        type: acc.type || existingAccount.type,
                        billing_city: acc.location || existingAccount.billing_city,
                        website: acc.domain || existingAccount.website,
                        email: acc.email || existingAccount.email,
                    }
                });
                accountId = existingAccount.id;
                updatedAccountsCount++;
            } else {
                // Create new
                const created = await (prismadbCrm as any).crm_Accounts.create({
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

            // Create Lead Candidate for organizing in List
            await (prismadbCrm as any).crm_Lead_Candidates.create({
                data: {
                    pool: pool.id,
                    companyName: name,
                    domain: domain,
                    industry: acc.type,
                    accountsIDs: accountId,
                    dedupeKey: domain || name.toLowerCase(),
                    v: 0
                }
            });
        }

        // 3. Process Contacts
        for (const con of contacts) {
            const email = con.email?.toLowerCase().trim();
            const phoneRaw = con.phone?.trim();
            const { normalized: phone } = phoneNormalizer.normalizePhone(phoneRaw, { preferUS: true });

            // Find Account link
            const linkedAccountId = con.accountName ? accountMap.get(con.accountName.toLowerCase()) : null;

            // Dedupe check: Email or Phone
            let existingContact = await (prismadbCrm as any).crm_Contacts.findFirst({
                where: {
                    OR: [
                        ...(email ? [{ email: { equals: email, mode: "insensitive" } }] : []),
                        ...(phone ? [{ mobile_phone: phone }] : [])
                    ]
                }
            });

            let contactId: string;
            if (existingContact) {
                await (prismadbCrm as any).crm_Contacts.update({
                    where: { id: existingContact.id },
                    data: {
                        position: con.title || existingContact.position,
                        accountsIDs: linkedAccountId || existingContact.accountsIDs,
                    }
                });
                contactId = existingContact.id;
                updatedContactsCount++;
            } else {
                const names = con.fullName.split(" ");
                const firstName = names[0];
                const lastName = names.slice(1).join(" ") || "Contact";

                const created = await (prismadbCrm as any).crm_Contacts.create({
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
                contactId = created.id;
                createdContactsCount++;
            }

            // Note: In your schema, Contact Candidates link to Lead Candidates
            // So we find the Lead Candidate we just created for the Account
            if (con.accountName) {
                const leadCand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                    where: { pool: pool.id, companyName: con.accountName }
                });
                if (leadCand) {
                    await (prismadbCrm as any).crm_Contact_Candidates.create({
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

        return NextResponse.json({
            success: true,
            poolId: pool.id,
            stats: {
                accounts: { created: createdAccountsCount, updated: updatedAccountsCount },
                contacts: { created: createdContactsCount, updated: updatedContactsCount }
            }
        });

    } catch (error: any) {
        console.error("[ACCOUNTS_IMPORT_COMMIT]", error);
        return new NextResponse(error.message || "Failed to commit import", { status: 500 });
    }
}
