import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Groups:");
    const logs = await prisma.crm_AiUsageLog.groupBy({
        by: ["model_used"],
        _count: { model_used: true }
    });
    console.log("crm_AiUsageLog:");
    console.log(JSON.stringify(logs, null, 2));

    try {
        const chatLogs = await prisma.chat_Messages.groupBy({
            by: ["model"],
            _count: { model: true }
        });
        console.log("chat_Messages:");
        console.log(JSON.stringify(chatLogs, null, 2));
    } catch(e) { console.log(e); }
}
main();
