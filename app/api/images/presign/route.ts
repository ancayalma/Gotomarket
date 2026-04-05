import { NextRequest, NextResponse } from "next/server";
import { getBlobServiceClient } from "@/lib/s3-storage";
import { systemLogger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    try {
        const urlParams = new URL(req.url);
        const url = urlParams.searchParams.get("url");

        if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

        if (url.includes("s3") || url.includes("ovh.us")) {
            const client = getBlobServiceClient();
            const key = new URL(url).pathname.substring(1);
            const presigned = await client.getPresignedUrl(key);
            return NextResponse.redirect(presigned);
        }

        return NextResponse.redirect(url);
    } catch (e) {
        systemLogger.error("[IMAGE_PRESIGN_PROXY_ERROR]", e);
        return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    }
}
