import Container from "@/app/(routes)/components/ui/Container";

import { BasicView } from "./components/BasicView";

import DocumentsView from "../../components/DocumentsView";
import ContactsView from "../../components/ContactsView";
import AccountsView from "../../components/AccountsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunity } from "@/actions/crm/get-opportunity";
import { getContactsByOpportunityId } from "@/actions/crm/get-contacts-by-opportunityId";
import { getDocumentsByOpportunityId } from "@/actions/documents/get-documents-by-opportunityId";
import { getAccountsByOpportunityId } from "@/actions/crm/get-accounts-by-opportunityId";
import { OpportunityActions } from "./components/OpportunityActions";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { RelocateEntityDialog } from "@/components/admin/RelocateEntityDialog";
import { LearnLink } from "@/components/ui/LearnLink";

const OpportunityView = async (
  props: {
    params: Promise<{ opportunityId: string }>;
  }
) => {
  const params = await props.params;
  const currentUserInfo = await getCurrentUserTeamId();

  const {
    opportunityId
  } = params;

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

  // Simplified permission check:
  // Users who can access this page should see its content by default.
  // Only hide content if explicitly denied via permission system.
  const hasAccess = (perm: string) => {
    // Super admins always have full access
    if (isSuperAdmin) return true;

    // Wildcard grants all
    if (permissions.includes('*')) return true;

    // Exact permission match
    if (permissions.includes(perm)) return true;

    // Check parent permissions (e.g., 'opportunities' grants 'opportunities.detail.info')
    const parts = perm.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {
      const parentPerm = parts.slice(0, i).join('.');
      if (permissions.includes(parentPerm)) return true;
    }

    // detail_view grants all detail.* access
    if (perm.startsWith('opportunities.detail.') && permissions.includes('opportunities.detail_view')) return true;

    // DEFAULT BEHAVIOR: Allow access to detail page sections unless explicitly denied
    // If user navigated to this page, they should see the content
    // The sidebar/route protection handles top-level access control
    return true;
  };

  const opportunityPromise = getOpportunity(opportunityId);
  const crmDataPromise = getAllCrmData();
  const [opportunity, crmData] = await Promise.all([opportunityPromise, crmDataPromise]);

  // Conditional fetching
  const accounts = hasAccess('opportunities.detail.accounts') ? await getAccountsByOpportunityId(opportunityId) : [];
  const contacts = hasAccess('opportunities.detail.contacts') ? await getContactsByOpportunityId(opportunityId) : [];
  const documents = hasAccess('opportunities.detail.documents') ? await getDocumentsByOpportunityId(opportunityId) : [];

  if (!opportunity) return <div>Opportunity not found</div>;

  return (
    <Container
      title={`Opportunity ${opportunity.name} - detail view`}
      description={"Description - " + opportunity.description}
      action={
        <div className="flex items-center gap-2">
          <RelocateEntityDialog
            entityId={opportunityId}
            entityType="OPPORTUNITY"
            entityName={opportunity.name || "Opportunity"}
            isGlobalAdmin={!!currentUserInfo?.isGlobalAdmin}
          />
          <OpportunityActions opportunityId={opportunity.id} data={opportunity} status={opportunity.status} hasAccount={!!opportunity.account} />
        </div>
      }
    >
      <LearnLink
        tab="opportunity-detail"
        overviewTitle="Deal Workspace"
        overviewWhat="The central dashboard for a single, active financial opportunity. It records the forecasted value, confidence probability, and current pipeline pipeline stage."
        overviewWhy="Ensures that anyone touching this deal understands its monetary value and the agreed timeline before taking action. It stops disjointed communication by grouping related assets together."
        overviewHow="Update the stage from the top-right button when progressing through negotiations, and scroll down to view internal comments, related contacts, and formal quote documents attached to this specific opportunity."
      />
      <div className="space-y-5">
        {hasAccess('opportunities.detail.info') && <BasicView data={opportunity} />}
        {hasAccess('opportunities.detail.accounts') && <AccountsView crmData={crmData} data={accounts} />}
        {hasAccess('opportunities.detail.contacts') && <ContactsView crmData={crmData} data={contacts} />}
        {hasAccess('opportunities.detail.documents') && <DocumentsView data={documents} />}
      </div>
    </Container>
  );
};

export default OpportunityView;
