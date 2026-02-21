import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { Separator } from "@/components/ui/separator";
import { BasicView } from "./components/BasicView";

import { getContact } from "@/actions/crm/get-contact";
import { getOpportunitiesFullByContactId } from "@/actions/crm/get-opportunities-with-includes-by-contactId";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getDocumentsByContactId } from "@/actions/documents/get-documents-by-contactId";
import { getAccountsByContactId } from "@/actions/crm/get-accounts-by-contactId";

import AccountsView from "../../components/AccountsView";
import OpportunitiesView from "../../components/OpportunitiesView";
import DocumentsView from "../../components/DocumentsView";
import { LeadTimeline } from "../../leads/[leadId]/components/LeadTimeline";
import { History, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { RelocateEntityDialog } from "@/components/admin/RelocateEntityDialog";

const ContactViewPage = async (props: any) => {
  const params = await props.params;
  const { contactId } = params;
  const currentUserInfo = await getCurrentUserTeamId();

  // Permission Logic
  const session = await getServerSession(authOptions);
  let permissions: string[] = [];
  let isSuperAdmin = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true, team_id: true, department_id: true, assigned_modules: true }
    });
    isSuperAdmin = user?.team_role === 'SUPER_ADMIN' || user?.team_role === 'OWNER' || user?.team_role === 'PLATFORM_ADMIN';

    if (isSuperAdmin) {
      permissions = ['*'];
    } else if (user) {
      if (user.assigned_modules && user.assigned_modules.length > 0) {
        permissions = user.assigned_modules;
      } else {
        const contextId = user.department_id || user.team_id;
        const scope = user.department_id ? 'DEPARTMENT' : 'ORGANIZATION';
        if (contextId && user.team_role) {
          permissions = await getEffectiveRoleModules(contextId, user.team_role, scope);
        }
      }
    }
  }

  const hasAccess = (perm: string) => isSuperAdmin || permissions.includes('*') || permissions.includes(perm);

  const contact = await getContact(contactId);
  const crmDataPromise = getAllCrmData();

  // Conditionally fetch data
  const opportunities = hasAccess('contacts.detail.opportunities') ? await getOpportunitiesFullByContactId(contactId) : [];
  const documents = hasAccess('contacts.detail.documents') ? await getDocumentsByContactId(contactId) : [];
  const accounts = hasAccess('contacts.view') ? await getAccountsByContactId(contactId) : [];

  const crmData = await crmDataPromise;

  if (!contact) return <div>Contact not found</div>;

  return (
    <Container
      title={`Contact: ${contact?.first_name} ${contact?.last_name}`}
      description={"Everything you need to know about this contact"}
      action={
        <RelocateEntityDialog
          entityId={contactId}
          entityType="CONTACT"
          entityName={`${contact?.first_name} ${contact?.last_name}`}
          isGlobalAdmin={!!currentUserInfo?.isGlobalAdmin}
        />
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
        {/* Left Sidebar: Contact Info */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Info size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Contact Information</h3>
          </div>
          {hasAccess('contacts.detail.info') && <BasicView data={contact} />}
        </div>

        {/* Right Main Content: Tabs */}
        <div className="xl:col-span-8">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6 mb-6">
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              >
                Activity
              </TabsTrigger>
              {hasAccess('accounts.view') && (
                <TabsTrigger
                  value="accounts"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Accounts ({accounts?.length || 0})
                </TabsTrigger>
              )}
              {hasAccess('contacts.detail.opportunities') && (
                <TabsTrigger
                  value="opportunities"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Opportunities ({opportunities?.length || 0})
                </TabsTrigger>
              )}
              {hasAccess('contacts.detail.documents') && (
                <TabsTrigger
                  value="documents"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                >
                  Documents ({documents?.length || 0})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <History size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Communication History</h3>
              </div>
              <LeadTimeline
                contactId={contactId}
                leadEmail={contact?.email || ""}
                leadName={`${contact?.first_name} ${contact?.last_name}`}
              />
            </TabsContent>

            {hasAccess('accounts.view') && (
              <TabsContent value="accounts" className="animate-in fade-in-50 duration-500">
                <AccountsView data={accounts} crmData={crmData} />
              </TabsContent>
            )}

            {hasAccess('contacts.detail.opportunities') && (
              <TabsContent value="opportunities" className="animate-in fade-in-50 duration-500">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Opportunities
                  </h3>
                  <OpportunitiesView data={opportunities} crmData={crmData} />
                </div>
              </TabsContent>
            )}

            {hasAccess('contacts.detail.documents') && (
              <TabsContent value="documents" className="animate-in fade-in-50 duration-500">
                <DocumentsView data={documents} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </Container>
  );
};

export default ContactViewPage;
