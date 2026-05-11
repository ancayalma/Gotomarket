import { prismadb } from "./lib/prisma";

async function run() {
  console.log("Starting test...");
  try {
    const whereClause: any = {};
    
    console.log("Fetching leads...");
    const leads = await prismadb.crm_Leads.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, company: true, email: true, status: true, assigned_to: true }
    });
    console.log("Leads success:", leads.length);

    console.log("Fetching contacts...");
    const contacts = await (prismadb.crm_Contacts as any).findMany({
      where: whereClause,
      select: { id: true, first_name: true, last_name: true, email: true, status: true, assigned_to: true }
    });
    console.log("Contacts success:", contacts.length);

    console.log("Fetching opportunities...");
    const opportunities = await prismadb.crm_Opportunities.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        expected_revenue: true,
        assigned_to: true,
        assigned_to_user: { select: { avatar: true, name: true } },
      }
    });
    console.log("Opportunities success:", opportunities.length);

    console.log("All passed!");
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
