
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Delete AWS models that are not public/standard 3-5
    const deleted = await prisma.aiModel.deleteMany({
        where: {
            provider: "AWS",
            NOT: {
                modelId: {
                    in: [
                        "anthropic.claude-3-5-sonnet-20240620-v1:0",
                        "anthropic.claude-3-5-opus-20240620-v1:0",
                        "anthropic.claude-3-5-haiku-20240620-v1:0"
                    ]
                }
            }
        }
    });
    console.log(`Deleted ${deleted.count} old/placeholder AWS models`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
