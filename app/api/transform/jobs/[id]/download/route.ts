import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        // For local unauthenticated tracking
        // const session = await getServerSession(authOptions);

        const job = await (prismadb as any).crm_Transform_Jobs.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!job || !job.resultData) {
            return new NextResponse("Job data not found", { status: 404 });
        }

        const data = job.resultData as any;
        const buffer = Buffer.from(data.base64, "base64");

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": data.mimeType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${data.fileName?.replace(/\.[^/.]+$/, "")}_extracted${data.extension || ""}"`,
            },
        });
    } catch (error: any) {
        console.error("[JOB_DOWNLOAD_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
