import { NextRequest, NextResponse } from "next/server";
import { getBlobServiceClient } from "@/lib/s3-storage";

/**
 * GET /api/media/:key
 * Public image proxy for S3 objects. Streams the file back with proper content-type
 * and aggressive caching. Used for email-rendered images (banners, logos, signatures)
 * that can't use presigned URLs or private S3 objects.
 */
export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = keyParts.join("/");

    if (!key || key.includes("..")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const serviceClient = getBlobServiceClient();

    // Generate a short-lived presigned URL and fetch the object
    const presignedUrl = await serviceClient.getPresignedUrl(key, 300);

    const s3Res = await fetch(presignedUrl);
    if (!s3Res.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_MAP[ext] || s3Res.headers.get("content-type") || "application/octet-stream";
    const body = await s3Res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // 1 year — file keys include timestamps
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    console.error("[MEDIA_PROXY]", e?.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
