import { PrismaClient } from '@prisma/client';
async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Testing create...');
        const created = await (prisma as any).pageView.create({
            data: { path: '/_test_diag', userAgent: 'diagnostic-script', ipHash: 'test123' }
        });
        console.log('Created:', created.id);
        await (prisma as any).pageView.delete({ where: { id: created.id } });
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();