
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEnergyPulse } from "@/actions/calendar/get-energy-pulse";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pulse = await getEnergyPulse(session.user.id);
        return NextResponse.json(pulse);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
