
import { prismadbCrm } from "../lib/prisma-crm";

async function linkContactsToPools() {
    console.log("🚀 STARTING CONTACT LINKAGE RECOVERY...");

    // 1. Fetch all candidates that don't have many (or any) contact candidates
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        include: { contacts: true }
    });
    console.log(`Processing ${candidates.length} candidates...`);

    let linkedCount = 0;
    let skipped = 0;

    for (const cand of candidates) {
        if (!cand.accountsIDs) {
            skipped++;
            continue;
        }

        // Find contacts associated with this account
        const contacts = await (prismadbCrm as any).crm_Contacts.findMany({
            where: { accountsIDs: cand.accountsIDs }
        });

        for (const contact of contacts) {
            const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            const existing = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
                where: {
                    leadCandidate: cand.id,
                    fullName: fullName
                }
            });

            if (!existing) {
                await (prismadbCrm as any).crm_Contact_Candidates.create({
                    data: {
                        leadCandidate: cand.id,
                        fullName: fullName,
                        email: contact.email,
                        phone: contact.mobile_phone || contact.office_phone,
                        title: contact.position,
                        v: 1,
                        status: "NEW",
                        dedupeKey: `recovery_contact_${contact.id}_${cand.id}`
                    }
                });
                linkedCount++;
            }
        }
    }

    console.log(`✅ Contact Linkage Summary:`);
    console.log(`New contact candidates linked: ${linkedCount}`);
    console.log(`Candidates skipped (no account): ${skipped}`);
}

linkContactsToPools().catch(console.error);
