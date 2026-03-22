const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDebug() {
  try {
    const thread = await prisma.crm_Email_Thread.findFirst({
      where: { subject: "SNS DEBUG PAYLOAD" },
      orderBy: { createdAt: 'desc' }
    });
    console.log("DB RESULT:");
    console.log(JSON.stringify(thread, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDebug();
