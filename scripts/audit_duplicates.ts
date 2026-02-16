
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- DUPLICATE AUDIT START ---");

    // 1. Audit Accounts
    const accounts = await prisma.crm_Accounts.findMany();
    const accountUsage: Record<string, string[]> = {}; // name -> ids
    const emailUsage: Record<string, string[]> = {}; // email -> ids

    accounts.forEach((acc) => {
        const name = acc.name.trim();
        if (!accountUsage[name]) accountUsage[name] = [];
        accountUsage[name].push(acc.id);

        if (acc.email) {
            const email = acc.email.toLowerCase().trim();
            if (!emailUsage[email]) emailUsage[email] = [];
            emailUsage[email].push(acc.id);
        }
    });

    console.log("\n[ACCOUNTS] Duplicate Names:");
    Object.entries(accountUsage).forEach(([name, ids]) => {
        if (ids.length > 1) {
            console.log(`- "${name}": ${ids.length} records (${ids.join(", ")})`);
        }
    });

    console.log("\n[ACCOUNTS] Duplicate Emails:");
    Object.entries(emailUsage).forEach(([email, ids]) => {
        if (ids.length > 1) {
            console.log(`- "${email}": ${ids.length} records (${ids.join(", ")})`);
        }
    });

    // 2. Audit Contacts
    const contacts = await prisma.crm_Contacts.findMany();
    const contactEmailUsage: Record<string, string[]> = {};

    contacts.forEach((contact) => {
        if (contact.email) {
            const email = contact.email.toLowerCase().trim();
            if (!contactEmailUsage[email]) contactEmailUsage[email] = [];
            contactEmailUsage[email].push(contact.id);
        }
    });

    console.log("\n[CONTACTS] Duplicate Emails:");
    Object.entries(contactEmailUsage).forEach(([email, ids]) => {
        if (ids.length > 1) {
            console.log(`- "${email}": ${ids.length} records (${ids.join(", ")})`);
        }
    });

    // 3. Audit Leads
    const leads = await prisma.crm_Leads.findMany();
    const leadEmailUsage: Record<string, string[]> = {};

    leads.forEach((lead) => {
        if (lead.email) {
            const email = lead.email.toLowerCase().trim();
            if (!leadEmailUsage[email]) leadEmailUsage[email] = [];
            leadEmailUsage[email].push(lead.id);
        }
    });

    console.log("\n[LEADS] Duplicate Emails:");
    Object.entries(leadEmailUsage).forEach(([email, ids]) => {
        if (ids.length > 1) {
            console.log(`- "${email}": ${ids.length} records (${ids.join(", ")})`);
        }
    });

    // 4. Specifically look for "DIRECT"
    const directMatches = accounts.filter(a => a.name.includes("DIRECT"));
    console.log(`\n[DIRECT] Accounts containing "DIRECT": ${directMatches.length}`);
    directMatches.forEach(a => console.log(`- ID: ${a.id} | Name: "${a.name}"`));

    console.log("\n--- DUPLICATE AUDIT END ---");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
