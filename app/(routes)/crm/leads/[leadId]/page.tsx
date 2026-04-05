import { getLead } from "@/actions/crm/get-lead";
import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import { LeadTimeline } from "./components/LeadTimeline";
import { LeadScore } from "../components/LeadScore";
import { Separator } from "@/components/ui/separator";
import { History, Info } from "lucide-react";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { RelocateEntityDialog } from "@/components/admin/RelocateEntityDialog";
import { LearnLink } from "@/components/ui/LearnLink";
import { DeleteLeadButton } from "../components/DeleteLeadButton";

interface LeadDetailPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

const LeadDetailPage = async (props: LeadDetailPageProps) => {
  const params = await props.params;
  const { leadId } = params;
  const currentUserInfo = await getCurrentUserTeamId();
  const lead: any = await getLead(leadId);

  if (!lead) return <div>Lead not found</div>;

  return (
    <Container
      title={`${lead?.firstName} ${lead?.lastName}`}
      description={lead?.company || "Lead Details"}
      action={
        <div className="flex items-center gap-2">
          <RelocateEntityDialog
            entityId={leadId}
            entityType="LEAD"
            entityName={`${lead?.firstName} ${lead?.lastName}`}
            isGlobalAdmin={!!currentUserInfo?.isGlobalAdmin}
          />
          {(currentUserInfo?.isGlobalAdmin || currentUserInfo?.isAdmin) && (
             <DeleteLeadButton leadId={leadId} />
          )}
          <LeadScore leadData={lead} />
        </div>
      }
    >
      <LearnLink
        tab="lead-detail"
        overviewTitle="Lead Intelligence"
        overviewWhat="The core profile for an unverified prospect. It pulls together their scraped background info, AI-generated lead scores, and communication history."
        overviewWhy="Before a contact is officially 'qualified' and turned into an Account/Contact, they live here so you can determine their actual value without muddying up your main sales pipeline."
        overviewHow="Review their AI confidence score, check the event timeline on the right for recent interactions, or directly execute an Outreach Sequence."
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
        {/* Left Column: Details (4/12 or 5/12) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Info size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Lead Information</h3>
          </div>
          <BasicView data={lead} />
        </div>

        {/* Right Column: Timeline (7/12 or 8/12) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <History size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Activity Timeline</h3>
          </div>
          <LeadTimeline
            leadId={leadId}
            leadEmail={lead?.email || ""}
            leadName={`${lead?.firstName} ${lead?.lastName}`}
          />
        </div>
      </div>
    </Container>
  );
};

export default LeadDetailPage;
