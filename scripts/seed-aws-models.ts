
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // 1. Create or Update AWS Provider
    const awsProvider = await prisma.aiProviderRegistry.upsert({
        where: { slug: "AWS" },
        update: {
            name: "AWS Bedrock",
            sdkType: "BEDROCK",
            isActive: true,
            color: "text-orange-500",
            gradient: "from-orange-500/20 to-yellow-500/20",
        },
        create: {
            slug: "AWS",
            name: "AWS Bedrock",
            sdkType: "BEDROCK",
            isActive: true,
            color: "text-orange-500",
            gradient: "from-orange-500/20 to-yellow-500/20",
        }
    });

    console.log("AWS Provider created/updated");

    // 2. Add requested models to AWS Provider with CORRECT Bedrock identifiers
    const models = [
        { name: "Claude Sonnet 3.5 (v2)", modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0" },
        { name: "Claude Sonnet 3.5 (v1)", modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0" },
        { name: "Claude Haiku 3.5", modelId: "anthropic.claude-3-5-haiku-20241022-v1:0" },
        { name: "Claude Opus 3.0", modelId: "anthropic.claude-3-opus-20240229-v1:0" },
    ];

    for (const modelData of models) {
        const existing = await prisma.aiModel.findFirst({
            where: { modelId: modelData.modelId, provider: "AWS" }
        });

        if (existing) {
            await prisma.aiModel.update({
                where: { id: existing.id },
                data: { name: modelData.name, isActive: true }
            });
            console.log(`Updated model: ${modelData.name}`);
        } else {
            await prisma.aiModel.create({
                data: {
                    name: modelData.name,
                    modelId: modelData.modelId,
                    provider: "AWS",
                    isActive: true,
                    inputPrice: 0.003,
                    outputPrice: 0.015,
                    maxContext: 200000
                }
            });
            console.log(`Created model: ${modelData.name}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
