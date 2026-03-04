
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- Providers ---");
    const providers = await prisma.aiProviderRegistry.findMany();
    providers.forEach(p => console.log(`${p.slug}: ${p.name} (sdkType: ${p.sdkType})`));

    console.log("\n--- All Models ---");
    const models = await prisma.aiModel.findMany();
    models.forEach(m => console.log(`${m.provider}: ${m.name} (${m.modelId})`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
