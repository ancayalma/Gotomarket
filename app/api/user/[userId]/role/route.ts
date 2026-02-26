import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/actions/audit";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        const body = await req.json();
        const { team_role } = body;

        if (!team_role) {
            return new NextResponse("Role is required", { status: 400 });
        }

        const caller = await prismadb.users.findFirst({
            where: { email: session.user.email }
        });

        if (!caller) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        // Only PLATFORM_ADMIN can assign PLATFORM_ADMIN role
        if (team_role === "PLATFORM_ADMIN" && caller.team_role !== "PLATFORM_ADMIN") {
            return new NextResponse("Unauthorized to assign PLATFORM_ADMIN", { status: 403 });
        }

        // Also prevent non-admins from changing roles
        if (caller.team_role !== "PLATFORM_ADMIN" && caller.team_role !== "SUPER_ADMIN" && caller.team_role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Validate role enum if necessary, but Prisma will catch invalid values if strictly typed
        // Allowed: "ADMIN" | "MEMBER" | "VIEWER"

        const updateData: any = {
            team_role,
        };

        if (team_role === "PLATFORM_ADMIN") {
            updateData.is_admin = true;
            updateData.is_account_admin = true;
        }

        const user = await prismadb.users.update({
            where: {
                id: params.userId,
            },
            data: updateData,
        });

        await logActivity(
            "Updated User Role",
            "User Management",
            `Updated role for ${user.email} to ${team_role}`
        );

        return NextResponse.json(user);
    } catch (error) {
        console.log("[USER_ROLE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
