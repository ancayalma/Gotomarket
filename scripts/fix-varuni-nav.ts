import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function updateStructureUrls(items: any[]): any[] {
    if (!items || !Array.isArray(items)) return items;
    return items.map(item => {
        const newItem = { ...item };
        
        // Fix the href if it equals /openai or /openAi
        if (newItem.href && newItem.href.toLowerCase().includes("openai")) {
            console.log(`🔍 Discovered matched href: ${newItem.href}`);
            newItem.href = "/varuni";
        }

        // Recursively fix children
        if (newItem.children && Array.isArray(newItem.children)) {
            newItem.children = updateStructureUrls(newItem.children);
        }
        
        return newItem;
    });
}

async function main() {
    console.log("🚀 Starting Surgical Navigation URL Fix...");

    // Find all navigation configs
    const configs = await prisma.navigationConfig.findMany();
    console.log(`📊 Found ${configs.length} navigation configs.`);

    let updatedCount = 0;

    for (const config of configs) {
        if (!config.structure) continue;
        
        // Prisma stores JSON arrays weirdly sometimes, handling parsing if stringified
        let structureObj = config.structure;
        let isString = false;
        
        if (typeof structureObj === "string") {
            try { structureObj = JSON.parse(structureObj); isString = true; } catch (e) {}
        }
        
        if (!Array.isArray(structureObj)) continue;
        
        const stringifiedBefore = JSON.stringify(structureObj);
        
        // Deep copy and update
        const newStructure = updateStructureUrls(structureObj);
        
        const stringifiedAfter = JSON.stringify(newStructure);
        
        // If there was a change, update the database
        if (stringifiedBefore !== stringifiedAfter) {
            let updatePayload = newStructure;
            if (isString) {
                updatePayload = stringifiedAfter as any;
            }
            
            await prisma.navigationConfig.update({
                where: { id: config.id },
                data: {
                    structure: updatePayload as any,
                    updatedAt: new Date()
                }
            });
            updatedCount++;
            console.log(`✅ Updated Config ID -> ${config.id}`);
        }
    }

    console.log(`\n🏁 Operation complete! Successfully updated ${updatedCount} affected configurations.`);
}

main()
    .catch((e) => {
        console.error("❌ Fix failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
