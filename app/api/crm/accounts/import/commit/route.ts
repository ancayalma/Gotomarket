import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm as prismadb } from "@/lib/prisma-crm";
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
        additional_emails: z.array(z.string()).optional(),
        dedupeKey: z.string().optional(),
    })),
    contacts: z.array(z.object({
        fullName: z.string().min(1),
        title: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        accountName: z.string().optional(),
        candidateKey: z.string().optional(),
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

        // 1. Process everything in a transaction for atomicity
        const result = await (prismadb as any).$transaction(async (tx: any) => {
            // 1a. Create the List (Pool)
            const pool = await tx.crm_Lead_Pools.create({
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

            const accountMapByDedupe = new Map<string, string>();
            const accountMapByName = new Map<string, string>();

            // 2. Process Accounts
            for (const acc of accounts) {
                const name = acc.name.trim();
                const domain = acc.domain?.toLowerCase().trim();
                const dedupeKey = acc.dedupeKey || domain || name.toLowerCase();

                const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

                let existingAccount = await tx.crm_Accounts.findFirst({
                    where: {
                        team_id: teamId,
                        OR: [
                            { name: { equals: escapeRegExp(name), mode: "insensitive" } },
                            ...(domain ? [{ website: { equals: escapeRegExp(domain), mode: "insensitive" } }] : [])
                        ]
                    }
                });

                let accountId: string;
                if (existingAccount) {
                    await tx.crm_Accounts.update({
                        where: { id: existingAccount.id },
                        data: {
                            website: domain || existingAccount.website,
                            additional_emails: { set: acc.additional_emails || [] },
                            updatedBy: session.user.id,
                        }
                    });
                    accountId = existingAccount.id;
                    updatedAccountsCount++;
                } else {
                    // Try to find a Global Company to pre-populate data
                    let globalId = null;
                    let inferredIndustry = null;
                    if (domain) {
                        const global = await tx.crm_Global_Companies.findUnique({ where: { domain } });
                        if (global) {
                            globalId = global.id;
                            inferredIndustry = global.industry;
                        }
                    }

                    const created = await tx.crm_Accounts.create({
                        data: {
                            name,
                            website: domain,
                            industry: inferredIndustry,
                            company_id: globalId,
                            additional_emails: acc.additional_emails || [],
                            status: "Active",
                            v: 0,
                            createdBy: session.user.id,
                            team_id: teamId,
                        }
                    });
                    accountId = created.id;
                    createdAccountsCount++;
                }

                accountMapByDedupe.set(dedupeKey, accountId);
                accountMapByName.set(name.toLowerCase(), accountId);

                // Create Lead Candidate
                await tx.crm_Lead_Candidates.create({
                    data: {
                        pool: pool.id,
                        companyName: name,
                        domain: domain,
                        accountsIDs: accountId,
                        additional_emails: acc.additional_emails || [],
                        dedupeKey: dedupeKey,
                        v: 0
                    }
                });
            }

            // 3. Process Contacts
            for (const con of contacts) {
                const email = con.email?.toLowerCase().trim();
                const phoneRaw = con.phone?.trim();
                const { normalized: phone } = phoneNormalizer.normalizePhone(phoneRaw, { preferUS: true });

                const linkedAccountId = (con.candidateKey ? accountMapByDedupe.get(con.candidateKey) : null)
                    || (con.accountName ? accountMapByName.get(con.accountName.toLowerCase()) : null);

                const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

                let existingContact = await tx.crm_Contacts.findFirst({
                    where: {
                        team_id: teamId,
                        OR: [
                            ...(email ? [{ email: { equals: escapeRegExp(email), mode: "insensitive" } }] : []),
                            ...(phone ? [{ mobile_phone: phone }] : [])
                        ]
                    }
                });

                let contactId: string;
                if (existingContact) {
                    await tx.crm_Contacts.update({
                        where: { id: existingContact.id },
                        data: {
                            position: con.title || existingContact.position,
                            accountsIDs: linkedAccountId || existingContact.accountsIDs,
                            updatedBy: session.user.id,
                        }
                    });
                    contactId = existingContact.id;
                    updatedContactsCount++;
                } else {
                    const names = con.fullName.split(" ");
                    const firstName = names[0];
                    const lastName = names.slice(1).join(" ") || "Contact";

                    const created = await tx.crm_Contacts.create({
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

                const candLookupKey = con.candidateKey || (con.accountName ? con.accountName.toLowerCase() : null);
                if (candLookupKey) {
                    const leadCand = await tx.crm_Lead_Candidates.findFirst({
                        where: { pool: pool.id, OR: [{ dedupeKey: candLookupKey }, { companyName: con.accountName }] }
                    });
                    if (leadCand) {
                        await tx.crm_Contact_Candidates.create({
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

            return {
                poolId: pool.id,
                stats: {
                    accounts: { created: createdAccountsCount, updated: updatedAccountsCount },
                    contacts: { created: createdContactsCount, updated: updatedContactsCount }
                }
            };
        });

        return NextResponse.json({
            success: true,
            poolId: result.poolId,
            stats: result.stats
        });


    } catch (error: any) {
        console.error("[ACCOUNTS_IMPORT_COMMIT]", error);
        return new NextResponse(error.message || "Failed to commit import", { status: 500 });
    }
}
