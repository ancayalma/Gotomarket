import { PrismaClient } from "@prisma/client";
import { DEFAULT_NAV_STRUCTURE } from "../lib/navigation-defaults";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Navigation Data Migration...");

    // 1. Log current stats
    const totalConfigs = await prisma.navigationConfig.count();
    const teamDefaultConfigs = await prisma.navigationConfig.count({
        where: { user_id: null }
    });

    console.log(`📊 Found ${totalConfigs} total configs, ${teamDefaultConfigs} team defaults.`);

    if (teamDefaultConfigs === 0) {
        console.log("⚠️ No team default configs found. Attempting to seed for all existing teams...");
        const teams = await prisma.team.findMany({ select: { id: true } });
        console.log(`📡 Found ${teams.length} teams.`);

        for (const team of teams) {
            await prisma.navigationConfig.upsert({
                where: {
                    // Note: NavigationConfig doesn't have a unique constraint on team_id if user_id is null in many databases,
                    // but our schema shows @@index([team_id, user_id]).
                    // If we can't find a unique way to target it, we'll just create it.
                    id: 'temp-id' // upsert usually needs a unique field
                },
                //@ts-ignore - bypassing unique check if necessary or adjusting logic
                create: {
                    team_id: team.id,
                    structure: DEFAULT_NAV_STRUCTURE as any
                },
                update: {
                    structure: DEFAULT_NAV_STRUCTURE as any
                }
            });
        }
    } else {
        // 2. Perform the update
        const result = await (prisma as any).navigationConfig.updateMany({
            where: {
                user_id: null
            },
            data: {
                structure: DEFAULT_NAV_STRUCTURE as any,
                updatedAt: new Date()
            }
        });
        console.log(`✅ Successfully updated ${result.count} team default configurations.`);
    }

    console.log("🏁 Migration complete.");
}

main()
    .catch((e) => {
        console.error("❌ Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
