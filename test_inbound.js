const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmails() {
  try {
    const thread = await prisma.crm_Email_Thread.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(thread, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
checkEmails();
