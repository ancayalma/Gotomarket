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
import { History, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { RelocateEntityDialog } from "@/components/admin/RelocateEntityDialog";

interface AccountDetailPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

const AccountDetailPage = async (props: AccountDetailPageProps) => {
  const params = await props.params;
  const { accountId } = params;
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
            </TabsList>

            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-500">
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

            <TabsContent value="contacts" className="animate-in fade-in-50 duration-500">
              <ContactsView data={contacts} crmData={crmData} accountId={accountId} />
            </TabsContent>

            <TabsContent value="tasks" className="animate-in fade-in-50 duration-500">
              <AccountsTasksView data={tasks} account={account} />
            </TabsContent>

            <TabsContent value="sales" className="space-y-8 animate-in fade-in-50 duration-500">
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
              <ContractsView
                data={contracts}
                crmData={crmData}
                accountId={accountId}
              />
            </TabsContent>

            <TabsContent value="documents" className="animate-in fade-in-50 duration-500">
              <DocumentsView data={documents} />
            </TabsContent>
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
