"use client";

import React, { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AccountsView from "../../components/AccountsView";
import LeadGenWizardPage from "./LeadGenWizard";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewAccountForm } from "./NewAccountForm";
import { Wand2, Plus, Building2, List } from "lucide-react";
import DashboardCard from "../../dashboard/_components/DashboardCard";
import { useRouter } from "next/navigation";

type Props = {
    accounts: any[];
    crmData: any;
    defaultTab?: "accounts" | "wizard" | "pools";
    isMember?: boolean;
};

export default function AccountsManagerTabs({ accounts, crmData, defaultTab = "accounts", isMember = false }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Define Cards
    const navCards = [
        {
            id: "accounts",
            title: "All Accounts",
            description: "Manage your company accounts",
            icon: Building2,
            color: "from-blue-500/20 to-indigo-500/20",
            iconColor: "text-blue-400",
            permission: "accounts.view"
        },
        {
            id: "pools",
            title: "Lists",
            description: "Manage lead lists and pools",
            icon: List,
            color: "from-orange-500/20 to-red-500/20",
            iconColor: "text-orange-400",
            permission: "accounts.lists"
        },
        {
            id: "wizard",
            title: "LeadGen Wizard",
            description: "Generate new accounts with AI",
            icon: Wand2,
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-400",
            permission: "accounts.wizard"
        },
    ];

    const addAccountCard = {
        title: "Add Account",
        description: "Create a new account manually",
        icon: Plus,
        color: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-400",
    };

    // Filter visible cards based on checks (simplified for now)
    const visibleCards = isMember
        ? navCards.filter(c => c.id === "accounts")
        : navCards;

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 min-w-0 overflow-y-auto overflow-x-hidden">
            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 pb-4 pt-4 -mt-2 w-full">
                {visibleCards.map((card) => {
                    let variant: "info" | "violet" | "warning" | "default" = "default";
                    if (card.id === "accounts") variant = "info";
                    if (card.id === "pools") variant = "warning";
                    if (card.id === "wizard") variant = "violet";

                    return (
                        <DashboardCard
                            key={card.id}
                            icon={card.icon}
                            label={card.title}
                            description={card.description}
                            variant={variant}
                            hideIcon={true}
                            onClick={() => {
                                if (card.id === "pools") {
                                    router.push("/lists");
                                } else {
                                    setActiveTab(card.id as any);
                                }
                            }}
                            className={activeTab === card.id ? "ring-2 ring-primary border-primary/50 bg-accent/10" : ""}
                            labelClassName="text-sm md:text-base"
                            descriptionClassName="text-[10px] md:text-xs"
                        />
                    );
                })}

                {/* Add Account Card with Modal */}
                {!isMember && (
                    <RightViewModal
                        customTrigger
                        label={
                            <DashboardCard
                                icon={addAccountCard.icon}
                                label={addAccountCard.title}
                                description={addAccountCard.description}
                                variant="success"
                                hideIcon={true}
                                labelClassName="text-sm md:text-base"
                                descriptionClassName="text-[10px] md:text-xs"
                            />
                        }
                        title="Create New Account"
                        description="Fill out the form below to add a new account."
                        width="w-[800px]"
                    >
                        <div className="h-full overflow-y-auto p-1">
                            <NewAccountForm
                                industries={crmData?.industries || []}
                                users={crmData?.users || []}
                                onFinish={() => { }}
                            />
                        </div>
                    </RightViewModal>
                )}
            </div>

            {/* Tab Content */}
            <Tabs value={activeTab} className="w-full relative flex flex-col flex-1 min-w-0">
                <TabsContent value="accounts" className="flex-1 mt-0 w-full min-w-0">
                    <AccountsView crmData={crmData} data={accounts} />
                </TabsContent>
                {!isMember && (
                    <>
                        <TabsContent value="wizard" className="flex-1 mt-0">
                            <LeadGenWizardPage />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
