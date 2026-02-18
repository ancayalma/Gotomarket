"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AccountsView from "../../components/AccountsView";
import LeadGenWizardPage from "./LeadGenWizard";
import SettingsTabs from "./SettingsTabs";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewAccountForm } from "./NewAccountForm"; // Assuming this is exported from NewAccountForm.tsx in the same dir
import { LayoutList, Wand2, Settings, Plus, Building2, List } from "lucide-react";
import DashboardCard from "../../dashboard/_components/DashboardCard";
import AccountLists from "./AccountLists";

type Props = {
    accounts: any[];
    crmData: any;
    defaultTab?: "accounts" | "wizard" | "settings" | "pools";
    isMember?: boolean;
};

export default function AccountsManagerTabs({ accounts, crmData, defaultTab = "accounts", isMember = false }: Props) {
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
            permission: "accounts.view" // Placeholder permission logic 
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
        {
            id: "settings",
            title: "Settings",
            description: "Configure account preferences",
            icon: Settings,
            color: "from-gray-500/20 to-slate-500/20",
            iconColor: "text-gray-400",
            permission: "accounts.settings"
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
        <div className="w-full h-full flex flex-col p-4 md:p-6">
            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 flex-shrink-0 pb-4 pt-4 -mt-2">
                {visibleCards.map((card) => {
                    let variant: "info" | "violet" | "warning" | "default" = "default";
                    if (card.id === "accounts") variant = "info";
                    if (card.id === "pools") variant = "warning";
                    if (card.id === "wizard") variant = "violet";
                    if (card.id === "settings") variant = "default";

                    return (
                        <DashboardCard
                            key={card.id}
                            icon={card.icon}
                            label={card.title}
                            description={card.description}
                            variant={variant}
                            hideIcon={true}
                            onClick={() => setActiveTab(card.id as any)}
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
                                onFinish={() => { }} // Optional: might want to refetch or close modal
                            />
                        </div>
                    </RightViewModal>
                )}
            </div>

            {/* Tab Content */}
            <Tabs value={activeTab} className="w-full relative flex flex-col flex-1">
                <TabsContent value="accounts" className="flex-1 mt-0">
                    <AccountsView crmData={crmData} data={accounts} />
                </TabsContent>
                {!isMember && (
                    <>
                        <TabsContent value="wizard" className="flex-1 mt-0">
                            <LeadGenWizardPage />
                        </TabsContent>
                        <TabsContent value="pools" className="flex-1 mt-0">
                            <AccountLists />
                        </TabsContent>
                        <TabsContent value="settings" className="flex-1 mt-0">
                            <SettingsTabs />
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
