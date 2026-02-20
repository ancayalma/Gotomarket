
import { prismadbCrm } from "../lib/prisma-crm";

async function auditIso() {
    const poolId = "699792e83e5cb6e1f2525326";
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        where: { pool: poolId },
        include: { assigned_accounts: { include: { contacts: true } } }
    });
    console.log("ISO Loop Audit:");
    candidates.slice(0, 20).forEach((c: any) => {
        const acc = c.assigned_accounts;
        const email = acc?.email || acc?.additional_emails?.[0] || acc?.contacts?.[0]?.email;
        console.log(`${c.companyName} | ${email || 'MISSING'}`);
    });
}

auditIso().catch(console.error);
