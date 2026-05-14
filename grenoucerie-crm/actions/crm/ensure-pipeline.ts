import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

interface CandidateData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
}

interface PipelineResult {
  leadId: string;
  accountId: string;
  contactId: string;
}

/**
 * Ensures a Lead, Account, and Contact exist for a pool candidate when
 * an outreach email is sent. Groups contacts under company-name accounts.
 * For individuals without a company, uses their full name as account name.
 *
 * Idempotent: won't duplicate if called again for the same email.
 */
export async function ensureLeadAndAccountForCandidate(
  candidate: CandidateData,
  userId: string,
  teamId: string,
  campaignId?: string,
  poolId?: string
): Promise<PipelineResult | null> {
  if (!candidate.email) return null;

  const email = candidate.email.toLowerCase().trim();
  const firstName = candidate.firstName?.trim() || "";
  const lastName = candidate.lastName?.trim() || "Unknown";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const company = candidate.company?.trim() || "";

  try {
    // ─── 1. Find or create Lead ─────────────────────────────────────────
    let lead = await prismadb.crm_Leads.findFirst({
      where: { email, team_id: teamId },
      select: { id: true, accountsIDs: true },
    });

    if (!lead) {
      lead = await prismadb.crm_Leads.create({
        data: {
          firstName: firstName || undefined,
          lastName,
          email,
          company: company || undefined,
          jobTitle: candidate.jobTitle || undefined,
          phone: candidate.phone || undefined,
          assigned_to: userId,
          team_id: teamId,
          status: "CONTACTED",
          pipeline_stage: "Engage_AI" as any,
          outreach_status: "SENT" as any,
          lead_source: "Outreach Campaign",
          campaign: campaignId || undefined,
        },
      });

      systemLogger.info(
        `[ENSURE_PIPELINE] Created lead: id=${lead.id}, email=${email}`
      );
    }

    // ─── 2. Find or create Account ──────────────────────────────────────
    // Use company name if available, otherwise use individual's full name
    const accountName = company || fullName || `Lead ${lead.id}`;
    let account = await prismadb.crm_Accounts.findFirst({
      where: { name: accountName, team_id: teamId },
      select: { id: true },
    });

    if (!account) {
      account = await prismadb.crm_Accounts.create({
        data: {
          v: 1,
          name: accountName,
          email: email,
          status: "Active",
          type: company ? "Prospect" : "Individual",
          assigned_to: userId,
          createdBy: userId,
          team_id: teamId,
        } as any,
      });

      systemLogger.info(
        `[ENSURE_PIPELINE] Created account: id=${account.id}, name="${accountName}"`
      );
    }

    // Link lead to account if not already linked
    if (!lead.accountsIDs) {
      await prismadb.crm_Leads.update({
        where: { id: lead.id },
        data: { accountsIDs: account.id },
      });
    }

    // ─── 3. Find or create Contact ──────────────────────────────────────
    let contact = await prismadb.crm_Contacts.findFirst({
      where: { email, team_id: teamId },
      select: { id: true },
    });

    if (!contact) {
      const tags: string[] = [`leadId:${lead.id}`];
      if (poolId) tags.push(`poolId:${poolId}`);
      if (campaignId) tags.push(`campaignId:${campaignId}`);

      contact = await prismadb.crm_Contacts.create({
        data: {
          v: 1,
          first_name: firstName || undefined,
          last_name: lastName,
          email,
          position: candidate.jobTitle || undefined,
          mobile_phone: candidate.phone || undefined,
          assigned_to: userId,
          accountsIDs: account.id,
          type: "Prospect",
          tags,
          team_id: teamId,
        },
      });

      systemLogger.info(
        `[ENSURE_PIPELINE] Created contact: id=${contact.id}, email=${email}`
      );
    } else {
      // Ensure contact is linked to the account
      await prismadb.crm_Contacts.update({
        where: { id: contact.id },
        data: {
          accountsIDs: account.id,
          assigned_to: userId,
        },
      }).catch(() => { /* Already linked, ignore */ });
    }

    // ─── 4. Log activity ────────────────────────────────────────────────
    await prismadb.crm_Lead_Activities.create({
      data: {
        lead: lead.id,
        user: userId,
        type: "pipeline_created",
        metadata: {
          accountId: account.id,
          contactId: contact.id,
          campaignId,
          poolId,
          source: "outreach_send",
        } as any,
      },
    });

    return {
      leadId: lead.id,
      accountId: account.id,
      contactId: contact.id,
    };
  } catch (err: any) {
    systemLogger.error(
      `[ENSURE_PIPELINE] Failed for ${email}: ${err?.message}`
    );
    return null;
  }
}
