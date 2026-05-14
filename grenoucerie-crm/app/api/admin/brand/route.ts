import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// Plans that support multiple brands
const MULTI_BRAND_PLANS = ["ENTERPRISE", "EXEMPT", "SCALE"];

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            include: { assigned_team: { select: { subscription_plan: true, parent_id: true } } },
        });

        if (!user?.team_id) {
            return new NextResponse("Team Error", { status: 403 });
        }

        const targetTeamId = user.assigned_team?.parent_id || user.team_id;

        const plan = String(user.assigned_team?.subscription_plan || "FREE");
        const isMultiBrand = MULTI_BRAND_PLANS.includes(plan);

        if (isMultiBrand) {
            // Enterprise/Exempt: Return all brands for this team
            const brands = await prismadb.teamBrandIdentity.findMany({
                where: { team_id: targetTeamId },
                orderBy: [{ is_default: "desc" }, { createdAt: "asc" }],
            });
            return NextResponse.json({ brands, multiBrand: true, plan });
        } else {
            // Standard plans: Return single default brand (backward compatible)
            const brand = await prismadb.teamBrandIdentity.findFirst({
                where: { team_id: targetTeamId, is_default: true },
            });
            return NextResponse.json(brand || {});
        }

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
            include: { assigned_team: { select: { subscription_plan: true, parent_id: true } } },
        });

        if (!user?.team_id) {
            return new NextResponse("Team Error", { status: 403 });
        }

        const targetTeamId = user.assigned_team?.parent_id || user.team_id;

        const data = await req.json();
        const { brandId, ...brandData } = data;

        if (brandId) {
            // Update existing brand by ID
            const updatedBrand = await prismadb.teamBrandIdentity.update({
                where: { id: brandId },
                data: {
                    ...brandData,
                    setup_completed: true,
                },
            });
            return NextResponse.json(updatedBrand);
        } else {
            // Upsert the default brand (standard plan behavior)
            // For multi-brand: if brand_label is provided and it's a NEW brand, create it
            const plan = String(user.assigned_team?.subscription_plan || "FREE");
            const isMultiBrand = MULTI_BRAND_PLANS.includes(plan);

            if (isMultiBrand && brandData.brand_label && brandData._createNew) {
                // Creating a new non-default brand
                delete brandData._createNew;
                const newBrand = await prismadb.teamBrandIdentity.create({
                    data: {
                        team_id: targetTeamId,
                        ...brandData,
                        is_default: false,
                        setup_completed: true,
                    },
                });
                return NextResponse.json(newBrand);
            }

            // Standard upsert for default brand
            const existing = await prismadb.teamBrandIdentity.findFirst({
                where: { team_id: targetTeamId, is_default: true },
            });

            if (existing) {
                const updatedBrand = await prismadb.teamBrandIdentity.update({
                    where: { id: existing.id },
                    data: {
                        ...brandData,
                        setup_completed: true,
                    },
                });
                return NextResponse.json(updatedBrand);
            } else {
                const newBrand = await prismadb.teamBrandIdentity.create({
                    data: {
                        team_id: targetTeamId,
                        ...brandData,
                        is_default: true,
                        setup_completed: true,
                    },
                });
                return NextResponse.json(newBrand);
            }
        }

    } catch (error) {
        console.error("[BRAND_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            include: { assigned_team: { select: { subscription_plan: true, parent_id: true } } },
        });

        if (!user?.team_id) {
            return new NextResponse("Team Error", { status: 403 });
        }

        const targetTeamId = user.assigned_team?.parent_id || user.team_id;

        const plan = String(user.assigned_team?.subscription_plan || "FREE");
        if (!MULTI_BRAND_PLANS.includes(plan)) {
            return new NextResponse("Multi-brand not available on your plan", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get("id");
        if (!brandId) {
            return new NextResponse("Brand ID required", { status: 400 });
        }

        // Prevent deleting the default brand
        const brand = await prismadb.teamBrandIdentity.findUnique({
            where: { id: brandId },
        });

        if (!brand || brand.team_id !== targetTeamId) {
            return new NextResponse("Brand not found", { status: 404 });
        }

        if (brand.is_default) {
            return new NextResponse("Cannot delete the default brand", { status: 400 });
        }

        await prismadb.teamBrandIdentity.delete({
            where: { id: brandId },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
