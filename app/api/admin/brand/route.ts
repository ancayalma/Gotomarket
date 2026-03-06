import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
        });

        if (!user?.team_id) {
            return new NextResponse("Team Error", { status: 403 });
        }

        const brand = await prismadb.teamBrandIdentity.findUnique({
            where: { team_id: user.team_id }
        });

        return NextResponse.json(brand || {});

    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
        });

        if (!user?.team_id) {
            return new NextResponse("Team Error", { status: 403 });
        }

        const data = await req.json();

        const updatedBrand = await prismadb.teamBrandIdentity.upsert({
            where: {
                team_id: user.team_id
            },
            update: {
                ...data,
                setup_completed: true // Whenever they save here, it marks setup as completed
            },
            create: {
                team_id: user.team_id,
                ...data,
                setup_completed: true
            }
        });

        return NextResponse.json(updatedBrand);

    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
