import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBlobServiceClient } from "@/lib/s3-storage";
import { systemLogger } from "@/lib/logger";

// POST /api/blobs/signed-url
// Returns a time-limited signed URL for an S3 object. Accepts JSON body:
// { key?: string, url?: string, ttlSeconds?: number }
// SOC2 Update: Transitioned from Azure SAS to S3 Presigned URLs.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const key: string | undefined = body?.key;
    const urlStr: string | undefined = body?.url;
    const ttlSeconds: number = Math.max(60, Math.min(7 * 24 * 3600, Number(body?.ttlSeconds) || 3600));

    // Determine path/key from key or URL
    let objectKey: string | undefined = key;
    if (!objectKey && urlStr) {
      try {
        const u = new URL(urlStr);
        // S3 URLs are typically: https://bucket.s3.region.endpoint/key
        // or https://endpoint/bucket/key (path-style)
        // Let's extract everything after the bucket name/endpoint
        const s3BucketName = process.env.S3_BUCKET_NAME || "basaltcrm";
        const parts = u.pathname.split("/").filter(Boolean);

        if (parts.length > 0) {
          // Check if first part is the bucket name (common in path-style)
          if (parts[0] === s3BucketName) {
            objectKey = parts.slice(1).join("/");
          } else {
            // Otherwise assume the whole path is the key
            objectKey = parts.join("/");
          }
        }
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    }

    if (!objectKey) {
      return NextResponse.json({ error: "Missing key or url" }, { status: 400 });
    }

    const service = getBlobServiceClient();
    const signedUrl = await service.getPresignedUrl(objectKey, ttlSeconds);

    return NextResponse.json({ url: signedUrl, key: objectKey }, { status: 200 });
  } catch (e: any) {
    systemLogger.error("[S3_SIGNED_URL_POST]", e);
    return NextResponse.json({ error: e?.message || "Internal Error" }, { status: 500 });
  }
}
