import React, { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getAccounts } from "@/actions/crm/get-accounts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Components
import AccountsManagerTabs from "./components/AccountsManagerTabs";

export const dynamic = "force-dynamic";

type AccountsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const AccountsPage = async ({ searchParams }: AccountsPageProps) => {
  const sp = searchParams ? await searchParams : undefined;
  const tabParam = sp?.tab;
  let tab = typeof tabParam === "string" ? tabParam : Array.isArray(tabParam) ? tabParam[0] ?? "accounts" : "accounts";
  if (tab === "pools") {
    return redirect("/lists");
  }

  const session = await getServerSession(authOptions);
  let isMember = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true }
    });

    if (user?.team_role === "MEMBER") {
      isMember = true;
      if (tab !== "accounts") {
        return redirect("/crm/accounts?tab=accounts");
      }
    }
  }

  // Load data for 'accounts' tab primarily
  const crmData = tab === "accounts" ? await getAllCrmData() : null;
  const accounts = tab === "accounts" ? await getAccounts() : null;

  const getTabInfo = (currentTab: string) => {
    switch (currentTab) {
      case "pools":
        return {
          title: "Lists",
          description: "Manage lead lists and pools"
        };
      case "wizard":
        return {
          title: "LeadGen Wizard",
          description: "Generate new accounts using AI"
        };
      case "settings":
        return {
          title: "Settings",
          description: "Configure your account preferences"
        };
      case "accounts":
      default:
        return {
          title: "Accounts",
          description: "Everything you need to know about your accounts"
        };
    }
  };

  const { title, description } = getTabInfo(tab);

  return (
    <div className="h-full w-full">
      <AccountsManagerTabs
        accounts={accounts || []}
        crmData={crmData}
        isMember={isMember}
        defaultTab={tab as "accounts" | "wizard" | "settings" | "pools"}
      />
    </div>
  );
};

export default AccountsPage;
