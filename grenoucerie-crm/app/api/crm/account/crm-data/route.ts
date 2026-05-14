import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { systemLogger } from "@/lib/logger";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const industries = await prismadb.crm_Industry_Type.findMany({
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ industries });
    } catch (error) {
        systemLogger.error("[CRM_DATA_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
