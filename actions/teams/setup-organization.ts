"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function setupOrganization(companyName: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Slugify company name
        let slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        // Ensure slug is not empty
        if (!slug) slug = "company-" + Math.random().toString(36).substring(7);

        let existing = await prismadb.team.findUnique({ where: { slug } });
        let counter = 1;

        // Try to generate unique slug if colliding
        while (existing && counter < 10) {
            slug = `${slug}-${counter}`;
            existing = await prismadb.team.findUnique({ where: { slug } });
            counter++;
        }

        if (existing) {
            return { error: "Company name already taken (slug collision). Please choose another." };
        }

        // Default to FREE plan
        const freePlan = await prismadb.plan.findFirst({ where: { slug: "FREE" } });
        if (!freePlan) {
            return { error: "System configuration error: Free plan not found." };
        }

        // Create the team and associate the owner
        const team = await prismadb.team.create({
            data: {
                name: companyName,
                slug,
                plan_id: freePlan.id,
                owner_id: user.id,
                status: "ACTIVE",
                members: {
                    connect: { id: user.id }
                }
            }
        });

        // Update the user's team ID and role
        await prismadb.users.update({
            where: { id: user.id },
            data: {
                team_id: team.id,
                team_role: "OWNER"
            }
        });

        // Optional: create SES email config (ignore failures)
        try {
            const { verifyEmailIdentity } = await import("@/lib/aws/ses-verify");
            await prismadb.teamEmailConfig.create({
                data: {
                    team_id: team.id,
                    purpose: "GENERAL",
                    provider: "PLATFORM_SES",
                    from_email: user.email,
                    from_name: companyName,
                    verification_status: "PENDING",
                }
            });
            await verifyEmailIdentity(user.email);
        } catch (err) {
            // Non-blocking
        }

        // Revalidate roots to pick up the new team
        revalidatePath("/");
        revalidatePath("/setup");

        // Force a session refresh event by sending a success flag to the client
        return { success: true, newTeamId: team.id };
    } catch (error) {
        console.error("[SETUP_ORGANIZATION]", error);
        return { error: "An unexpected error occurred while setting up your organization." };
    }
}
