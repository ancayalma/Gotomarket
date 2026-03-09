"use server";

import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { consumeLeadGenCredits } from "@/lib/scraper/credits";
import { visitWebsiteForAgent, executeToolCall } from "@/lib/scraper/agentic-scraper";
import { z } from "zod";

export async function manualAgentEnrichment(
  candidateId: string,
  userId: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const db: any = prismadbCrm;
  const mainDb: any = prismadb;

  // 1. Fetch Candidate
  const candidate = await db.crm_Lead_Candidates.findUnique({
    where: { id: candidateId }
  });

  if (!candidate || !candidate.domain) {
    return { success: false, message: "Candidate or domain not found." };
  }

  // 2. Fetch User and Team to verify plan/credits
  const user = await mainDb.users.findUnique({
    where: { id: userId },
    select: { team_id: true, is_admin: true, is_account_admin: true, assigned_role: { select: { name: true } } }
  });

  if (!user?.team_id) {
    return { success: false, message: "User has no team association." };
  }

  const isPlatformAdmin = user.assigned_role?.name === "SuperAdmin" || user.is_admin || user.is_account_admin;

  // 3. Consume Credits
  // We explicitly charge 5 credits for this deep manual search
  if (!isPlatformAdmin) {
    try {
      await consumeLeadGenCredits(user.team_id, 5);
    } catch (e: any) {
      return { success: false, message: e.message || "Insufficient AI Credits for deep research." };
    }
  }

  try {
    // 4. Scrape Data using Agentic Engine
    const pool = await db.crm_Lead_Pools.findUnique({
      where: { id: candidate.pool },
      select: { id: true, icpConfig: true }
    });
    const icp = pool?.icpConfig || {};

    const url = `https://${candidate.domain}`;
    const siteData = await visitWebsiteForAgent(url, userId, icp);

    if (siteData.error) {
      throw new Error(siteData.error);
    }

    // 5. Build Save Args and Execute
    // The "save_company" hook will natively run enrichCompanyDataWithAI to summarize description
    const saveArgs = {
      domain: candidate.domain,
      companyName: candidate.companyName || siteData.title || candidate.domain,
      description: siteData.description || "",
      industry: candidate.industry || "",
      techStack: siteData.techStack || [],
      contacts: siteData.contacts || [],
    };

    const context = {
      jobId: "MANUAL_ENRICHMENT",
      poolId: candidate.pool,
      userId: userId,
      icp: icp,
      logs: [] // don't track background logs since there is no running job
    };

    const saveResult = await executeToolCall("save_company", saveArgs, context);

    if (!saveResult.success) {
      throw new Error(saveResult.error || "Failed to save deep research data. This might be a blocklisted directory.");
    }

    return { 
      success: true, 
      message: `Enrichment complete. Successfully charged 5 LeadGen Credits.`,
      data: {
         contactsCreated: saveResult.contactsCreated || 0,
      }
    };
  } catch (error: any) {
    // Note: If you wanted, you could refund the credits here if it completely fails.
    console.error("[Manual Enrichment Error]", error);
    return { success: false, message: error.message || "An unexpected error occurred during deep enrichment." };
  }
}
