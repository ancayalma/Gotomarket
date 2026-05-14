import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";
import { systemLogger } from "@/lib/logger";

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
    additional_emails: z.array(z.string()).optional(),
  })).optional(),
  contacts: z.array(z.object({
    fullName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    accountName: z.string().optional(),
  })).optional(),
  creates: z.object({
    candidates: z.array(z.any()),
    contacts: z.array(z.any()),
  }).optional(),
  updates: z.object({
    candidates: z.array(z.any()),
    contacts: z.array(z.any()),
  }).optional(),
});

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

    // --- 1. Identify all unique identifiers for batch lookup ---
    const allCandidates = [
      ...(parsed.data.creates?.candidates || []),
      ...(parsed.data.updates?.candidates || []),
      ...(accounts || [])
    ];
    const allContacts = [
      ...(contacts || []),
      ...(parsed.data.creates?.contacts || []),
      ...(parsed.data.updates?.contacts || [])
    ];

    const accountNames = new Set<string>();
    const accountDomains = new Set<string>();
    const contactEmails = new Set<string>();
    const contactPhones = new Set<string>();

    allCandidates.forEach(c => {
      if (c.companyName || c.name) accountNames.add((c.companyName || c.name).trim().toLowerCase());
      if (c.domain) accountDomains.add(c.domain.trim().toLowerCase());
    });

    allContacts.forEach(c => {
      if (c.email) contactEmails.add(c.email.trim().toLowerCase());
      if (c.phone) {
        const { normalized } = phoneNormalizer.normalizePhone(c.phone, { preferUS: true });
        if (normalized) contactPhones.add(normalized);
      }
    });

    const escapeRegExp = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // --- 2. Batch Databases Queries (The "10/10" win) ---
    const [existingAccounts, existingContacts] = await Promise.all([
      (prismadb.crm_Accounts as any).findMany({
        where: {
          team_id: teamId,
          OR: [
            { name: { in: Array.from(accountNames).map(n => escapeRegExp(n)), mode: "insensitive" } },
            { website: { in: Array.from(accountDomains).map(d => escapeRegExp(d)), mode: "insensitive" } }
          ]
        }
      }),
      (prismadb.crm_Contacts as any).findMany({
        where: {
          team_id: teamId,
          OR: [
            { email: { in: Array.from(contactEmails).map(e => escapeRegExp(e)), mode: "insensitive" } },
            { mobile_phone: { in: Array.from(contactPhones) } }
          ]
        }
      })
    ]);

    // Index them in memory for O(1) loop lookups
    const accountCache = new Map<string, any>();
    existingAccounts.forEach((acc: any) => {
      accountCache.set(acc.name.toLowerCase(), acc);
      if (acc.website) accountCache.set(acc.website.toLowerCase(), acc);
    });

    const contactCache = new Map<string, any>();
    existingContacts.forEach((con: any) => {
      if (con.email) contactCache.set(con.email.toLowerCase(), con);
      if (con.mobile_phone) contactCache.set(con.mobile_phone, con);
    });

    // --- 3. Process Business Logic (Using Cache) ---
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

    const accountMap = new Map<string, string>(); // input_key -> db_id

    // Helper to find account in cache
    const findAccount = (name?: string, domain?: string) => {
      if (domain && accountCache.has(domain.toLowerCase())) return accountCache.get(domain.toLowerCase());
      if (name && accountCache.has(name.toLowerCase())) return accountCache.get(name.toLowerCase());
      return null;
    };

    // Helper to find contact in cache
    const findContact = (email?: string, phone?: string) => {
      if (email && contactCache.has(email.toLowerCase())) return contactCache.get(email.toLowerCase());
      if (phone) {
        const { normalized } = phoneNormalizer.normalizePhone(phone, { preferUS: true });
        if (normalized && contactCache.has(normalized)) return contactCache.get(normalized);
      }
      return null;
    };

    // Process Candidates/Accounts
    for (const cand of allCandidates) {
      const name = (cand.companyName || cand.name || "").trim();
      const domain = (cand.domain || "").trim();
      const dedupeKey = cand.dedupeKey || domain || name.toLowerCase();

      if (accountMap.has(dedupeKey)) continue;

      const existing = findAccount(name, domain);
      let accountId: string;

      if (existing) {
        const allEmails = Array.from(new Set([...(existing.additional_emails || []), ...(cand.additional_emails || [])]));
        const primaryEmail = existing.email || cand.accountEmail || allEmails[0] || null;
        const additionalEmails = allEmails.filter((e: string) => e !== primaryEmail);

        // Compose billing address from components
        const billingParts = [cand.billingStreet, cand.billingCity, cand.billingState, cand.billingPostalCode, cand.billingCountry].filter(Boolean);
        const billingAddress = billingParts.length > 0 ? billingParts.join(', ') : undefined;
        // Compose shipping address from components
        const shippingParts = [cand.shippingStreet, cand.shippingCity, cand.shippingState, cand.shippingPostalCode, cand.shippingCountry].filter(Boolean);
        const shippingAddress = shippingParts.length > 0 ? shippingParts.join(', ') : undefined;

        await (prismadb.crm_Accounts as any).update({
          where: { id: existing.id },
          data: {
            website: domain || existing.website,
            email: primaryEmail,
            additional_emails: { set: additionalEmails },
            office_phone: cand.accountPhone || existing.office_phone,
            fax: cand.fax || existing.fax,
            billing_street: cand.billingStreet || existing.billing_street,
            billing_city: cand.billingCity || existing.billing_city,
            billing_state: cand.billingState || existing.billing_state,
            billing_postal_code: cand.billingPostalCode || existing.billing_postal_code,
            billing_country: cand.billingCountry || existing.billing_country,
            shipping_street: cand.shippingStreet || existing.shipping_street,
            shipping_city: cand.shippingCity || existing.shipping_city,
            shipping_state: cand.shippingState || existing.shipping_state,
            shipping_postal_code: cand.shippingPostalCode || existing.shipping_postal_code,
            shipping_country: cand.shippingCountry || existing.shipping_country,
            description: (() => {
              const base = cand.description || existing.description || '';
              const socials = [
                cand.accountLinkedin && `LinkedIn: ${cand.accountLinkedin}`,
                cand.accountTwitter && `Twitter: ${cand.accountTwitter}`,
                cand.accountFacebook && `Facebook: ${cand.accountFacebook}`,
                cand.accountInstagram && `Instagram: ${cand.accountInstagram}`,
              ].filter(Boolean).join(' | ');
              return socials ? (base ? `${base}\n${socials}` : socials) : base || undefined;
            })(),
            annual_revenue: cand.revenue || existing.annual_revenue,
            employees: cand.employeeCount || existing.employees,
            vat: cand.vat || existing.vat,
            company_id: cand.companyId || existing.company_id,
            updatedBy: session.user.id,
          }
        });
        accountId = existing.id;
        updatedAccountsCount++;
      } else {
        const candidateEmails = cand.additional_emails || [];
        const primaryEmail = cand.accountEmail || candidateEmails[0] || null;
        const additionalEmails = cand.accountEmail ? candidateEmails : candidateEmails.slice(1);

        const created = await (prismadb.crm_Accounts as any).create({
          data: {
            name,
            website: domain,
            email: primaryEmail,
            additional_emails: additionalEmails,
            office_phone: cand.accountPhone || null,
            fax: cand.fax || null,
            type: cand.accountType || "Prospect",
            status: cand.accountStatus || "Active",
            // Billing address
            billing_street: cand.billingStreet || null,
            billing_city: cand.billingCity || null,
            billing_state: cand.billingState || null,
            billing_postal_code: cand.billingPostalCode || null,
            billing_country: cand.billingCountry || null,
            // Shipping address
            shipping_street: cand.shippingStreet || null,
            shipping_city: cand.shippingCity || null,
            shipping_state: cand.shippingState || null,
            shipping_postal_code: cand.shippingPostalCode || null,
            shipping_country: cand.shippingCountry || null,
            // Financials
            annual_revenue: cand.revenue || null,
            employees: cand.employeeCount || null,
            vat: cand.vat || null,
            company_id: cand.companyId || null,
            // Social → stored in description (crm_Accounts has no social columns)
            description: (() => {
              const base = cand.description || '';
              const socials = [
                cand.accountLinkedin && `LinkedIn: ${cand.accountLinkedin}`,
                cand.accountTwitter && `Twitter: ${cand.accountTwitter}`,
                cand.accountFacebook && `Facebook: ${cand.accountFacebook}`,
                cand.accountInstagram && `Instagram: ${cand.accountInstagram}`,
              ].filter(Boolean).join(' | ');
              return socials ? (base ? `${base}\n${socials}` : socials) : (base || null);
            })(),
            v: 0,
            createdBy: session.user.id,
            team_id: teamId,
          }
        });
        accountId = created.id;
        createdAccountsCount++;
      }
      accountMap.set(dedupeKey, accountId);
      if (name) accountMap.set(name.toLowerCase(), accountId);

      // Create Lead Candidate record
      await (prismadb.crm_Lead_Candidates as any).create({
        data: {
          pool: targetPoolId,
          companyName: name,
          domain: domain || undefined,
          industry: cand.industry || cand.type,
          accountsIDs: accountId,
          additional_emails: cand.additional_emails || [],
          dedupeKey: dedupeKey,
          v: 0
        }
      });
    }

    // Process Contacts
    for (const con of allContacts) {
      const email = con.email?.toLowerCase().trim();
      const phoneRaw = con.phone?.trim();
      const { normalized: phone } = phoneNormalizer.normalizePhone(phoneRaw, { preferUS: true });

      const linkedAccountId = (con.candidateKey ? accountMap.get(con.candidateKey) : null)
        || (con.accountName ? accountMap.get(con.accountName.toLowerCase()) : null);

      const existing = findContact(email, phone);

      if (existing) {
        await (prismadb.crm_Contacts as any).update({
          where: { id: existing.id },
          data: {
            position: [con.title, con.department].filter(Boolean).join(' — ') || existing.position,
            accountsIDs: linkedAccountId || existing.accountsIDs,
            mobile_phone: con.mobilePhone || phone || existing.mobile_phone,
            office_phone: con.officePhone || existing.office_phone,
            personal_email: con.personalEmail || existing.personal_email,
            social_linkedin: con.linkedinUrl || existing.social_linkedin,
            social_twitter: con.contactTwitter || existing.social_twitter,
            social_facebook: con.contactFacebook || existing.social_facebook,
            social_instagram: con.contactInstagram || existing.social_instagram,
            social_skype: con.contactSkype || existing.social_skype,
            birthday: con.birthday || existing.birthday,
            website: con.contactWebsite || existing.website,
            description: con.contactDescription || existing.description,
            updatedBy: session.user.id,
          }
        });
        updatedContactsCount++;
      } else {
        const firstName = con.firstName || (con.fullName ? con.fullName.split(" ")[0] : "");
        const lastName = con.lastName || (con.fullName ? con.fullName.split(" ").slice(1).join(" ") : "") || "Contact";

        await (prismadb.crm_Contacts as any).create({
          data: {
            first_name: firstName,
            last_name: lastName,
            email: email,
            mobile_phone: con.mobilePhone || phone || null,
            office_phone: con.officePhone || null,
            personal_email: con.personalEmail || null,
            position: [con.title, con.department].filter(Boolean).join(' — ') || null,
            accountsIDs: linkedAccountId,
            social_linkedin: con.linkedinUrl || null,
            social_twitter: con.contactTwitter || null,
            social_facebook: con.contactFacebook || null,
            social_instagram: con.contactInstagram || null,
            social_skype: con.contactSkype || null,
            birthday: con.birthday || null,
            website: con.contactWebsite || null,
            description: con.contactDescription || null,
            createdBy: session.user.id,
            team_id: teamId,
            v: 0
          }
        });
        createdContactsCount++;
      }

      // Ensure Contact Candidate Record links correctly
      const candLookupKey = con.candidateKey || (con.accountName ? con.accountName.toLowerCase() : null);
      if (candLookupKey) {
        const leadCand = await (prismadb.crm_Lead_Candidates as any).findFirst({
          where: { pool: targetPoolId, OR: [{ dedupeKey: candLookupKey }, { companyName: con.accountName }] }
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

    const totalProcessed = createdAccountsCount + updatedAccountsCount + createdContactsCount + updatedContactsCount;
    if (totalProcessed > 0) {
      const xpToAward = 5 + Math.floor(totalProcessed / 20);
      import("@/actions/quests/add-raw-xp")
        .then((m) => m.addRawXP({ userId: session.user.id, xpAmount: xpToAward, reason: `Data Import (${totalProcessed} records)` }))
        .catch((e) => systemLogger.warn(`[IMPORT_GAMIFICATION] Failed to award XP: ${e?.message}`));
    }

    return NextResponse.json({
      poolId: targetPoolId,
      created: {
        candidates: createdAccountsCount,
        contacts: createdContactsCount,
      },
      updated: {
        candidates: updatedAccountsCount,
        contacts: updatedContactsCount,
      }
    });

  } catch (error: any) {
    systemLogger.error("[IMPORT_COMMIT_BATCH]", error);
    return new NextResponse(error.message || "Failed to commit import", { status: 500 });
  }
}
