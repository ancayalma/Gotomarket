
import { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";
import LeadsManagerTabs from "./components/LeadsManagerTabs";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LearnLink } from "@/components/ui/LearnLink";

export const dynamic = "force-dynamic";

type LeadsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const LeadsPage = async ({ searchParams }: LeadsPageProps) => {
  const session = await getServerSession(authOptions);
  let isMember = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true }
    });

    if (user?.team_role === "MEMBER") {
      isMember = true;
    }
  }

  const crmData = await getAllCrmData();
  const leads = await getLeads();

  return (
    <div className="h-full w-full px-4 md:px-6 lg:px-8 pb-36 md:pb-4">
      <LearnLink
        tab="leads"
        overviewTitle="Lead Intelligence"
        overviewWhat="The central staging ground for potential prospects before they become official Opportunities or active Contacts."
        overviewWhy="Allows you to vet, score, and nurture raw contacts before cluttering up the main database or your official pipeline forecasts."
        overviewHow="From here you can launch multi-channel campaign sequences, manually convert highly qualified leads, or view their latest interactions."
      />
      <LeadsManagerTabs leads={leads as any} crmData={crmData} isMember={isMember} />
    </div>
  );
};

export default LeadsPage;
