import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiSdkModel, logAiUsage } from "@/lib/varuni";
import { generateObject } from "ai";
import { z } from "zod";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

/**
 * AI-Powered Import Intelligence Analysis
 * 
 * Takes the scan results (headers, sample data, detected mappings) and asks the
 * AI to provide:
 * 1. A data quality score with reasoning
 * 2. Smart mapping suggestions for unmapped columns
 * 3. Pattern detection insights (duplicates, formatting issues, enrichment opportunities)
 * 4. A natural language summary of what the import contains
 */

const analysisSchema = z.object({
    dataQualityScore: z.number().min(0).max(100).describe("Overall data quality score 0-100"),
    dataQualityGrade: z.enum(["A+", "A", "B+", "B", "C+", "C", "D", "F"]).describe("Letter grade for data quality"),
    summary: z.string().describe("2-3 sentence natural language summary of the dataset — what kind of data this is, what industry it appears to target, and how usable it is"),
    insights: z.array(z.object({
        type: z.enum(["success", "warning", "critical", "suggestion"]),
        title: z.string(),
        detail: z.string(),
    })).describe("Array of actionable insights about the data"),
    mappingSuggestions: z.array(z.object({
        csvHeader: z.string(),
        suggestedField: z.string(),
        reason: z.string(),
    })).describe("AI-suggested field mappings for currently unmapped columns"),
    enrichmentOpportunities: z.array(z.string()).describe("List of potential enrichment actions the user could take after import, e.g. 'Domain lookup from company email', 'LinkedIn profile discovery'"),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await req.json();
        const { headers, sampleRows, mappings, totalRows } = body;

        if (!headers || !sampleRows || !mappings) {
            return new NextResponse("Missing required scan data", { status: 400 });
        }

        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId || null;

        // Get AI model from DB config
        const { model, modelId, teamId: resolvedTeamId } = await getAiSdkModel(
            { userId: session.user.id, teamId: teamId || undefined },
            "analysis"
        );

        // Build the analysis prompt
        const mappedFields = mappings.filter((m: any) => m.crmField);
        const unmappedFields = mappings.filter((m: any) => !m.crmField);

        const prompt = `You are a CRM data analyst. Analyze this CSV/Excel import dataset and provide intelligence insights.

## Dataset Overview
- Total Rows: ${totalRows}
- Total Columns: ${headers.length}
- Mapped Columns: ${mappedFields.length}
- Unmapped Columns: ${unmappedFields.length}

## Column Headers
${headers.join(", ")}

## Current Mappings (auto-detected)
${mappedFields.map((m: any) => `"${m.csvHeader}" → ${m.crmFieldLabel || m.crmField} (${m.confidence}% confidence)`).join("\n")}

## Unmapped Columns
${unmappedFields.map((m: any) => `"${m.csvHeader}" — samples: ${m.sampleValues?.join(", ") || "none"}`).join("\n") || "None — all columns mapped."}

## Sample Data (first ${Math.min(sampleRows.length, 5)} rows)
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

## Instructions
1. Score the data quality (0-100) based on completeness, consistency, and usability for CRM purposes
2. Provide a concise natural language summary of the dataset
3. Generate actionable insights (formatting issues, potential duplicates, missing critical fields, data patterns)
4. For any unmapped columns, suggest the best CRM field mapping with reasoning
5. Suggest enrichment opportunities (what additional data could be obtained from what's provided)

Available CRM fields for mapping suggestions:
Account: companyName, domain, industry, description, homepageUrl, techStack, location, employeeCount, revenue
Contact: fullName, firstName, lastName, title, email, additionalEmails, phone, additionalPhones, linkedinUrl`;

        const { object: analysis, usage } = await generateObject({
            model,
            schema: analysisSchema,
            prompt,
        });

        // Log AI usage for billing
        await logAiUsage({
            teamId: resolvedTeamId,
            userId: session.user.id,
            service: "analysis",
            model: modelId,
            usage: {
                promptTokens: (usage as any)?.promptTokens || 0,
                completionTokens: (usage as any)?.completionTokens || 0,
            },
            description: `Import Intelligence analysis for ${totalRows} rows, ${headers.length} columns`,
        });

        return NextResponse.json(analysis);

    } catch (error: any) {
        systemLogger.error("[IMPORT_ANALYZE]", error);
        return NextResponse.json(
            {
                dataQualityScore: 0,
                dataQualityGrade: "F" as const,
                summary: "AI analysis unavailable. You can still proceed with the import using the auto-detected mappings.",
                insights: [{
                    type: "warning" as const,
                    title: "AI Analysis Unavailable",
                    detail: error?.message?.includes("Insufficient AI tokens")
                        ? "Your team has run out of AI tokens. Contact your admin to add more."
                        : "Could not complete AI analysis. The import wizard will still work with auto-detected mappings.",
                }],
                mappingSuggestions: [],
                enrichmentOpportunities: [],
            },
            { status: 200 }
        );
    }
}
