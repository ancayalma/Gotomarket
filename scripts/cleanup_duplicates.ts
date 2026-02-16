
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mergeAccounts() {
    console.log("--- MERGING ACCOUNTS ---");
    const accounts = await prisma.crm_Accounts.findMany();

    // Group by normalized name
    const groups: Record<string, any[]> = {};

    for (const acc of accounts) {
        // Normalize name: remove "DIRECT DIRECT", "DIRECT", trim, and case-insensitive comparison
        // Use regex with word boundaries to avoid catching "Directory", etc.
        let normalizedName = acc.name
            .replace(/\bDIRECT DIRECT\b/gi, "")
            .replace(/\bDIRECT\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!normalizedName) normalizedName = acc.name.trim(); // fallback if name was JUST "DIRECT"

        const key = normalizedName.toLowerCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push(acc);
    }

    for (const [key, group] of Object.entries(groups)) {
        // Sort by createdAt to keep the oldest one
        group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const target = group[0];
        const duplicates = group.slice(1);

        // Normalize target name regardless of if it has duplicates
        let finalName = target.name
            .replace(/\bDIRECT DIRECT\b/gi, "")
            .replace(/\bDIRECT\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        if (!finalName) finalName = target.name;

        if (finalName !== target.name) {
            console.log(`Cleaning up name for account "${target.name}" -> "${finalName}"`);
            await prisma.crm_Accounts.update({
                where: { id: target.id },
                data: { name: finalName }
            });
        }

        if (duplicates.length > 0) {
            console.log(`Merging ${duplicates.length} accounts into "${finalName}" (${target.id})`);

            for (const dupe of duplicates) {
                // 1. Contacts
                await prisma.crm_Contacts.updateMany({
                    where: { accountsIDs: dupe.id },
                    data: { accountsIDs: target.id }
                });

                // 2. Leads
                await prisma.crm_Leads.updateMany({
                    where: { accountsIDs: dupe.id },
                    data: { accountsIDs: target.id }
                });

                // 3. Opportunities
                await prisma.crm_Opportunities.updateMany({
                    where: { account: dupe.id },
                    data: { account: target.id }
                });

                // 4. Invoices
                await prisma.invoices.updateMany({
                    where: { assigned_account_id: dupe.id },
                    data: { assigned_account_id: target.id }
                });

                // 5. Contracts
                await prisma.crm_Contracts.updateMany({
                    where: { account: dupe.id },
                    data: { account: target.id }
                });

                // 6. Tasks
                await prisma.crm_Accounts_Tasks.updateMany({
                    where: { account: dupe.id },
                    data: { account: target.id }
                });

                // 7. Documents (Array of IDs)
                const docs = await prisma.documents.findMany({
                    where: { accountsIDs: { has: dupe.id } }
                });

                for (const doc of docs) {
                    const newAccountIDs = doc.accountsIDs.filter(id => id !== dupe.id);
                    if (!newAccountIDs.includes(target.id)) {
                        newAccountIDs.push(target.id);
                    }
                    await prisma.documents.update({
                        where: { id: doc.id },
                        data: { accountsIDs: newAccountIDs }
                    });
                }

                // 8. Delete the duplicate
                await prisma.crm_Accounts.delete({
                    where: { id: dupe.id }
                });
            }
        }
    }
}

async function mergeContacts() {
    console.log("\n--- MERGING CONTACTS ---");
    const contacts = await prisma.crm_Contacts.findMany();

    const groups: Record<string, any[]> = {};
    for (const c of contacts) {
        if (!c.email) continue;
        const key = c.email.toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
    }

    for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
            group.sort((a, b) => new Date(a.cratedAt || a.updatedAt || 0).getTime() - new Date(b.cratedAt || b.updatedAt || 0).getTime());
            const target = group[0];
            const duplicates = group.slice(1);

            console.log(`Merging ${duplicates.length} contacts into "${target.email}" (${target.id})`);

            for (const dupe of duplicates) {
                // Update Opportunities (connected_contacts array)
                const opps = await prisma.crm_Opportunities.findMany({
                    where: { connected_contacts: { has: dupe.id } }
                });
                for (const opp of opps) {
                    const newContacts = opp.connected_contacts.filter(id => id !== dupe.id);
                    if (!newContacts.includes(target.id)) newContacts.push(target.id);
                    await prisma.crm_Opportunities.update({
                        where: { id: opp.id },
                        data: { connected_contacts: newContacts }
                    });
                }

                // Update Documents (contactsIDs array)
                const docs = await prisma.documents.findMany({
                    where: { contactsIDs: { has: dupe.id } }
                });
                for (const doc of docs) {
                    const newContacts = doc.contactsIDs.filter(id => id !== dupe.id);
                    if (!newContacts.includes(target.id)) newContacts.push(target.id);
                    await prisma.documents.update({
                        where: { id: doc.id },
                        data: { contactsIDs: newContacts }
                    });
                }

                await prisma.crm_Contacts.delete({ where: { id: dupe.id } });
            }
        }
    }
}

async function mergeLeads() {
    console.log("\n--- MERGING LEADS ---");
    const leads = await prisma.crm_Leads.findMany();

    const groups: Record<string, any[]> = {};
    for (const l of leads) {
        if (!l.email) continue;
        const key = l.email.toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(l);
    }

    for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
            group.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            const target = group[0];
            const duplicates = group.slice(1);

            console.log(`Merging ${duplicates.length} leads into "${target.email}" (${target.id})`);

            for (const dupe of duplicates) {
                // Update lead maps
                await prisma.crm_Lead_Pools_Leads.updateMany({
                    where: { lead: dupe.id },
                    data: { lead: target.id }
                });

                await prisma.crm_Contact_Candidate_Leads.updateMany({
                    where: { lead: dupe.id },
                    data: { lead: target.id }
                });

                await prisma.crm_Lead_Activities.updateMany({
                    where: { lead: dupe.id },
                    data: { lead: target.id }
                });

                await prisma.crm_Outreach_Items.updateMany({
                    where: { lead: dupe.id },
                    data: { lead: target.id }
                });

                await prisma.crm_Portal_Recipient.updateMany({
                    where: { lead: dupe.id },
                    data: { lead: target.id }
                });

                await prisma.crm_Leads.delete({ where: { id: dupe.id } });
            }
        }
    }
}

async function main() {
    await mergeAccounts();
    await mergeContacts();
    await mergeLeads();
    console.log("\n--- CLEANUP COMPLETE ---");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
