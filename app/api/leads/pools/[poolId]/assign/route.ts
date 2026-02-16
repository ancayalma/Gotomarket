import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { safeContactDisplayName, normalizeName } from "@/lib/scraper/normalize";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * POST /api/leads/pools/[poolId]/assign
 * Assigns selected candidates to team members by converting them to Leads
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ poolId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { poolId } = await params;
    const body = await req.json();
    const { assignments } = body; // Array of { candidateId, userId }

    if (!assignments || !Array.isArray(assignments)) {
      return new NextResponse("Invalid assignments data", { status: 400 });
    }

    // Check if user is admin (primary DB flags)
    const userFlags = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true }
    });
    const isAdmin = !!(userFlags?.is_admin || userFlags?.is_account_admin);

    // Verify pool ownership or admin access
    const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
      where: { id: poolId },
      select: { user: true }
    });

    if (!pool) {
      return new NextResponse("Pool not found", { status: 404 });
    }

    // Only pool owner or admin can assign leads from this pool
    if (pool.user !== session.user.id && !isAdmin) {
      return new NextResponse("You don't have permission to assign leads from this pool", { status: 403 });
    }

    // Validate assignments: non-admins can only assign to themselves
    if (!isAdmin) {
      const invalidAssignments = assignments.filter((a: any) => a.userId !== session.user.id);
      if (invalidAssignments.length > 0) {
        return new NextResponse("You can only assign leads to yourself. Only admins can assign to other users.", { status: 403 });
      }
    }

    const results = [];

    for (const assignment of assignments) {
      const { candidateId, userId } = assignment;

      // Get the candidate with contacts
      const candidate = await (prismadbCrm as any).crm_Lead_Candidates.findUnique({
        where: { id: candidateId },
        include: {
          contacts: true,
        },
      });

      if (!candidate) {
        continue;
      }

      // Create a Lead for each contact in the candidate
      for (const contact of candidate.contacts) {
        // Check if lead already exists via mapping
        const existing = await (prismadbCrm as any).crm_Contact_Candidate_Leads.findFirst({
          where: { candidate: contact.id },
        });

        if (existing) {
          // Update assignment if needed
          await (prismadbCrm as any).crm_Leads.update({
            where: { id: existing.lead },
            data: { assigned_to: userId },
          });
          continue;
        }

        // Check if Account already exists (by domain or name)
        let accountId = null;
        const domain = candidate.domain || (candidate.homepageUrl ? new URL(candidate.homepageUrl).hostname : null);

        if (domain) {
          const existingAccount = await (prismadbCrm as any).crm_Accounts.findFirst({
            where: {
              OR: [
                { website: { contains: domain } },
                { email: { contains: domain } } // rudimentary check
              ]
            }
          });
          if (existingAccount) accountId = existingAccount.id;
        }

        if (!accountId && candidate.companyName) {
          const existingAccount = await (prismadbCrm as any).crm_Accounts.findFirst({
            where: { name: candidate.companyName }
          });
          if (existingAccount) accountId = existingAccount.id;
        }

        if (!accountId) {
          // Create new Account
          const newAccount = await (prismadbCrm as any).crm_Accounts.create({
            data: {
              name: candidate.companyName || "Unknown Company",
              description: candidate.description,
              industry: candidate.industry,
              website: candidate.homepageUrl,
              team_id: (await getCurrentUserTeamId())?.teamId, // Assign to current team
              status: "Active",
              assigned_to: userId,
              createdBy: session.user.id
            }
          });
          accountId = newAccount.id;
        }

        // Create Contact linked to Account
        // Check if contact exists?
        let contactId = null;
        const existingContact = await (prismadbCrm as any).crm_Contacts.findFirst({
          where: { email: contact.email }
        });

        if (existingContact) {
          contactId = existingContact.id;
          // Link to account if not linked?
          if (!existingContact.account_id) {
            await (prismadbCrm as any).crm_Contacts.update({
              where: { id: contactId },
              data: { account_id: accountId }
            });
          }
        } else {
          const parts = (contact.fullName || "").split(" ");
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ") || "";

          const newContact = await (prismadbCrm as any).crm_Contacts.create({
            data: {
              first_name: firstName,
              last_name: lastName,
              email: contact.email,
              mobile_phone: contact.phone,
              job_title: contact.title,
              account_id: accountId,
              status: true,
              assigned_to: userId,
              created_by: session.user.id
            }
          });
          contactId = newContact.id;
        }

        // Update Candidate with Account Link
        await (prismadbCrm as any).crm_Lead_Candidates.update({
          where: { id: candidateId },
          data: {
            accountsIDs: accountId,
            status: "CONVERTED"
          }
        });

        results.push({ candidateId, contactId, accountId });
      }
    }

    return NextResponse.json({
      success: true,
      assigned: results.length,
      results
    }, { status: 200 });
  } catch (error) {
    console.error("[LEADS_POOL_ASSIGN]", error);
    return new NextResponse("Failed to assign candidates", { status: 500 });
  }
}
