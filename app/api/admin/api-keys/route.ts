import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.isAdmin || !teamInfo.teamId) {
            return new NextResponse("Forbidden - Must be an admin", { status: 403 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return new NextResponse("Missing title/name for API key", { status: 400 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Verify plan status
        const team = await prismadb.team.findUnique({
            where: { id: user.teamId as string },
            select: { slug: true, subscription_plan: true, assigned_plan: { select: { slug: true } } }
        });

        if (!team) return new NextResponse("Team not found", { status: 404 });

        const activePlan = team.assigned_plan?.slug || team.subscription_plan || "FREE";
        const isExempt = team.slug === "basalthq";
        if (!isExempt && activePlan.toUpperCase() === "FREE") {
            return new NextResponse("API generation requires an active plan.", { status: 402 });
        }

        // Generate a cryptographically secure random key
        // Format: sk_live_[32 random hex chars]
        const rawKeyContent = crypto.randomBytes(16).toString('hex');
        const prefix = "sk_live_";
        const rawSecretKey = `${prefix}${rawKeyContent}`;

        // Hash the full key. We ONLY store the hash.
        const salt = await bcrypt.genSalt(10);
        const hashedKey = await bcrypt.hash(rawSecretKey, salt);

        // the prefix identifier is used for UI so the user knows which key it is (sk_live_abc)
        const keyIdentifier = rawSecretKey.substring(0, 12);

        const newApiKey = await prismadb.crm_ApiKeys.create({
            data: {
                tenant_id: teamInfo.teamId,
                name: name,
                key_prefix: keyIdentifier,
                key_hash: hashedKey,
                status: "ACTIVE",
                created_by: user.id
            }
        });

        // We MUST return the plainTextKey ONLY this once.
        return NextResponse.json({
            ...newApiKey,
            plainTextKey: rawSecretKey
        });

    } catch (error) {
        console.error("[API_KEY_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
