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

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Omit resultData to keep polling lightweight
        const { resultData, ...jobMetadata } = job;
        
        return NextResponse.json(jobMetadata);
    } catch (error: any) {
        console.error("[JOB_POLL_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
