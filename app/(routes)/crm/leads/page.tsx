import { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";
import LeadsManagerTabs from "./components/LeadsManagerTabs";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
    <div className="h-full w-full">
      <LeadsManagerTabs leads={leads as any} crmData={crmData} isMember={isMember} />
    </div>
  );
};

export default LeadsPage;
