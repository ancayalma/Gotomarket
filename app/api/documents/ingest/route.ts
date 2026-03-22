import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ingestDocument } from "@/lib/document-rag";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/documents/ingest
 *
 * Triggers document ingestion for RAG (text extraction, chunking, embedding).
 * Body: { documentId: string } or { documentIds: string[] }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const ids: string[] = body.documentIds || (body.documentId ? [body.documentId] : []);

    if (ids.length === 0) {
      return new NextResponse("No document IDs provided", { status: 400 });
    }

    const results: Array<{ documentId: string; status: string; chunks?: number; textLength?: number; error?: string }> = [];

    for (const docId of ids) {
      try {
        const result = await ingestDocument(docId, body.teamId);
        results.push({
          documentId: docId,
          status: "ingested",
          chunks: result.chunksCreated,
          textLength: result.textLength,
        });
      } catch (err: any) {
        systemLogger.warn(`[DOC_INGEST] Failed for ${docId}: ${err?.message}`);
        results.push({
          documentId: docId,
          status: "error",
          error: err?.message || "Ingestion failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalIngested: results.filter((r) => r.status === "ingested").length,
    });
  } catch (error: any) {
    systemLogger.error("[DOC_INGEST_POST]", error?.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
