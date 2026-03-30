import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { Separator } from "@/components/ui/separator";
import { BasicView } from "./components/BasicView";
import { AddressesView } from "./components/AddressesView";
import { BasicViewActions } from "../../components/BasicViewActions";
import { getAccount } from "@/actions/crm/get-account";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunitiesFullByAccountId } from "@/actions/crm/get-opportunities-with-includes-by-accountId";
import { getContactsByAccountId } from "@/actions/crm/get-contacts-by-accountId";
import { getLeadsByAccountId } from "@/actions/crm/get-leads-by-accountId";
import { getDocumentsByAccountId } from "@/actions/documents/get-documents-by-accountId";
import { getContractsByAccountId } from "@/actions/crm/get-contracts";
import { getAccountsTasks } from "@/actions/crm/account/get-tasks";
import { getLead } from "@/actions/crm/get-lead";

import OpportunitiesView from "../../components/OpportunitiesView";
import LeadsView from "../../components/LeadsView";
import ContactsView from "../../components/ContactsView";
import DocumentsView from "../../components/DocumentsView";

import {
  Documents,
  crm_Accounts,
  crm_Accounts_Tasks,
  crm_Contacts,
  crm_Contracts,
  crm_Leads,
  crm_Opportunities,
} from "@prisma/client";

import AccountsTasksView from "./components/TasksView";
import ContractsView from "../../components/ContractsView";
import { LeadTimeline } from "../../leads/[leadId]/components/LeadTimeline";
import { BasicView as LeadBasicView } from "../../leads/[leadId]/components/BasicView";
import { History, Info, Shield, GitBranch, Mail } from "lucide-react";
import EntitlementPanel from "../components/EntitlementPanel";
import AccountHierarchyPanel from "../components/AccountHierarchyPanel";
import { AccountOutreachTab } from "./components/OutreachTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { RelocateEntityDialog } from "@/components/admin/RelocateEntityDialog";
import { LearnLink } from "@/components/ui/LearnLink";

import { notFound } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import { CustomFieldsTab } from "./components/CustomFieldsTab";
import { getCustomFieldTabs, type CustomFieldDefinition } from "@/lib/crm/custom-field-defaults";

interface AccountDetailPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

const AccountDetailPage = async (props: AccountDetailPageProps) => {
  const params = await props.params;
  const { accountId } = params;

  // Guard: if accountId is not a valid MongoDB ObjectID, bail early
  // This prevents route collisions (e.g. /crm/accounts/lists) from crashing Prisma
  if (!/^[a-f0-9]{24}$/i.test(accountId)) return notFound();

  const currentUserInfo = await getCurrentUserTeamId();
  const account: crm_Accounts | null = await getAccount(accountId);
  const opportunities: crm_Opportunities[] =
    await getOpportunitiesFullByAccountId(accountId);
  const contacts: crm_Contacts[] = await getContactsByAccountId(accountId);
  const contracts: crm_Contracts[] = await getContractsByAccountId(accountId);
  const leads: crm_Leads[] = await getLeadsByAccountId(accountId);
  const documents: Documents[] = await getDocumentsByAccountId(accountId);
  const tasks: crm_Accounts_Tasks[] = await getAccountsTasks(accountId);
  const crmData = await getAllCrmData();

  // Fetch custom field definitions from the team
  let customFieldDefs: CustomFieldDefinition[] = [];
  if (currentUserInfo?.teamId) {
    const team = await prismadb.team.findUnique({
      where: { id: currentUserInfo.teamId },
      select: { custom_field_definitions: true },
    });
    customFieldDefs = ((team as any)?.custom_field_definitions as CustomFieldDefinition[]) || [];
  }
  const customFieldTabs = getCustomFieldTabs(customFieldDefs);
  const customFieldValues: Record<string, any> = (account as any)?.custom_fields || {};

  /*
  // Existing calls might fail or return empty if accountId is actually a leadId, but shouldn't crash.
  // We handle the case where account is null below.
  */

  if (!account) {
    const lead: any = await getLead(accountId);
    if (lead) {
      // Render Lead View inline (copied layout from LeadDetailPage)
      return (
        <Container
          title={`Lead: ${lead?.firstName || ""} ${lead?.lastName || ""}`}
          description={lead?.company || "Lead Details"}
          action={
            <div className="flex items-center gap-2">
              <RelocateEntityDialog
                entityId={accountId}
                entityType="LEAD"
                entityName={`${lead?.firstName} ${lead?.lastName}`}
                isGlobalAdmin={!!currentUserInfo?.isGlobalAdmin}
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
            <div className="xl:col-span-5 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                  <Info size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Lead Information</h3>
              </div>
              <LeadBasicView data={lead} />
            </div>

            <div className="xl:col-span-7 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <History size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Activity Timeline</h3>
              </div>
              <LeadTimeline
                leadId={accountId}
                leadEmail={lead?.email || ""}
                leadName={`${lead?.firstName} ${lead?.lastName}`}
              />
            </div>
          </div>
        </Container>
      );
    }
    return <div>Account/Lead not found</div>;
  }

  return (
    <Container
      title={`Account: ${account?.name}`}
      description={"Everything you need to know about sales potential"}
      action={
        <div className="flex items-center gap-2">
          <RelocateEntityDialog
            entityId={accountId}
            entityType="ACCOUNT"
            entityName={account?.name || "Account"}
            isGlobalAdmin={!!currentUserInfo?.isGlobalAdmin}
          />
        </div>
      }
    >

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
        {/* Left Sidebar: Account Info & Documents */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Info size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Account Information</h3>
          </div>
          <BasicView data={account} />
        </div>

        {/* Right Main Content: Tabs for Activity, Contacts, Tasks, Sales */}
        <div className="xl:col-span-8">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 mb-6">
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="outreach"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Outreach
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Contacts ({contacts?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Tasks ({tasks?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Sales & Leads
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Contracts ({contracts?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Documents ({documents?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="entitlements"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Entitlements
              </TabsTrigger>
              <TabsTrigger
                value="hierarchy"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Hierarchy
              </TabsTrigger>
              {customFieldTabs.map(tabName => (
                <TabsTrigger
                  key={`custom_${tabName}`}
                  value={`custom_${tabName}`}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  {tabName}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Account Communication History"
                overviewWhat="A centralized timeline of every email, SMS, and call log exchanged with this specific company."
                overviewWhy="Maintaining a shared memory of customer interactions prevents team overlap and ensures that anyone picking up the account has full context of previous conversations."
                overviewHow="Scan the timeline to see recent engagement. Click on any event to see the full content of the message or the call recording associated with it."
              />
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <History size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Communication History</h3>
              </div>
              <LeadTimeline
                accountId={accountId}
                leadEmail={account?.email || ""}
                leadName={account?.name || ""}
              />
            </TabsContent>

            <TabsContent value="outreach" className="space-y-6 animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Campaign Outreach History"
                overviewWhat="Every outreach email, SMS, and LinkedIn message sent to contacts at this company through automated campaigns."
                overviewWhy="Provides complete visibility into what messaging this account has received, which campaigns drove engagement, and what stage each touchpoint is at."
                overviewHow="Expand any item to see the full email content, open/click tracking, reply sentiment, and error details. Use the stats bar to gauge overall engagement."
              />
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Mail size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Campaign Outreach</h3>
              </div>
              <AccountOutreachTab accountId={accountId} />
            </TabsContent>

            <TabsContent value="contacts" className="animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Key Stakeholders & Contacts"
                overviewWhat="The directory of all individuals associated with this account, including their roles, seniority, and direct contact details."
                overviewWhy="B2B sales involve multiple decision-makers. This tab allows you to identify champions, gatekeepers, and economic buyers within the organization."
                overviewHow="Use the search bar to find a specific person, or click 'Add Contact' to associate a new team member with this company footprint."
              />
              <ContactsView data={contacts} crmData={crmData} accountId={accountId} />
            </TabsContent>

            <TabsContent value="tasks" className="animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Operational Task Queue"
                overviewWhat="A collaborative checklist of todos, follow-ups, and internal administrative work specific to this account."
                overviewWhy="Keeps the sales cycle moving by ensuring that follow-up promises and internal prerequisites are tracked and assigned to a specific team member."
                overviewHow="Check off completed tasks to clear the queue, or click 'New Task' to assign a new action item to yourself or a colleague."
              />
              <AccountsTasksView data={tasks} account={account} />
            </TabsContent>

            <TabsContent value="sales" className="space-y-8 animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Sales Pipeline & Lead Health"
                overviewWhat="The revenue-focused view tracking both active sales opportunities and raw leads associated with this company."
                overviewWhy="Provides a clear picture of the current and potential financial value of the account, helping you prioritize high-value negotiations."
                overviewHow="Monitor the 'Opportunity Stage' to see deal progression. Use the Leads section to identify new expansion potential within the same organization."
              />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Opportunities
                </h3>
                <OpportunitiesView
                  data={opportunities}
                  crmData={crmData}
                  accountId={accountId}
                />
              </div>
              <Separator className="bg-white/5" />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Leads
                </h3>
                <LeadsView data={leads} crmData={crmData} />
              </div>
            </TabsContent>

            <TabsContent value="contracts" className="animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Executed Agreements & Legal"
                overviewWhat="The secure vault for all legally binding contracts, MSAs, and NDAs signed by this account."
                overviewWhy="Centralizing legal documents ensures that sales teams can quickly verify active terms, expiration dates, and previous commitments without digging through legal archives."
                overviewHow="Click on a contract to view the PDF or e-signature status. Use the 'New Contract' wizard to generate a new agreement for signing."
              />
              <ContractsView
                data={contracts}
                crmData={crmData}
                accountId={accountId}
              />
            </TabsContent>

            <TabsContent value="documents" className="animate-in fade-in-50 duration-500">
              <LearnLink
                tab="account-detail"
                overviewTitle="Document Repository"
                overviewWhat="A general-purpose storage area for sales decks, technical specifications, and non-contractual files."
                overviewWhy="Sharing a common workspace for collateral ensures that everyone on the account team is using the latest version of presentations and technical docs."
                overviewHow="Drag and drop files to upload. Use the search bar to find specific assets or sort by upload date to see the latest additions."
              />
              <DocumentsView data={documents} />
            </TabsContent>

            <TabsContent value="entitlements" className="animate-in fade-in-50 duration-500">
              <EntitlementPanel accountId={accountId} />
            </TabsContent>

            <TabsContent value="hierarchy" className="animate-in fade-in-50 duration-500">
              <AccountHierarchyPanel accountId={accountId} />
            </TabsContent>

            {customFieldTabs.map(tabName => (
              <TabsContent key={`custom_${tabName}`} value={`custom_${tabName}`} className="animate-in fade-in-50 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                    <Info size={14} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">{tabName}</h3>
                </div>
                <CustomFieldsTab
                  accountId={accountId}
                  definitions={customFieldDefs}
                  values={customFieldValues}
                  tabName={tabName}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Filling the space below Tabs */}
          <div className="mt-8 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <Info size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Location & Headquarters</h3>
              </div>
            </div>
            <AddressesView data={account} />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default AccountDetailPage;
