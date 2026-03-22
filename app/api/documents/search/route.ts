import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchDocuments } from "@/lib/document-rag";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/documents/search
 *
 * Semantic search across ingested documents.
 * Body: {
 *   query: string;
 *   documentIds?: string[];  // Scope to specific docs
 *   teamId?: string;         // Or scope to a team
 *   topK?: number;           // Number of results (default 5)
 *   minScore?: number;       // Minimum similarity threshold (default 0.1)
 * }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    if (!body.query || typeof body.query !== "string") {
      return new NextResponse("Query is required", { status: 400 });
    }

    const results = await searchDocuments(body.query, {
      documentIds: body.documentIds,
      teamId: body.teamId,
      topK: body.topK,
      minScore: body.minScore,
    });

    return NextResponse.json({
      success: true,
      results,
      totalResults: results.length,
    });
  } catch (error: any) {
    systemLogger.error("[DOC_SEARCH_POST]", error?.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
