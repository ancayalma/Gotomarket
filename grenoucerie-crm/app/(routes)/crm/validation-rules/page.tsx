import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getValidationRules } from "@/actions/crm/validation-rules";
import { ValidationRulesClient } from "./components/ValidationRulesClient";
import { Shield } from "lucide-react";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export const metadata = {
    title: "Guard Rules | CRM Settings",
    description: "Define formula-based guard rules to enforce data quality"
};

export default async function ValidationRulesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as { team_id?: string }).team_id;
    const rules = await getValidationRules(teamId || "");

    return (
        <div className="flex flex-col">
            <UpgradeGate featureId="validation_rules" title="Guard Rules Locked" description="Formula-based validation rules require a Scale plan or higher.">
            <LearnLink
                tab="validation-rules"
                overviewTitle="Data Governance Guard"
                overviewWhat="The central terminal for defining logic-based restrictions and format requirements for CRM data entry."
                overviewWhy="Maintaining high data integrity depends on consistent input. Guard Rules prevent 'dirty data' from entering the system by enforcing business logic (e.g., preventing a deal from closing without a valid quote) at the point of entry."
                overviewHow="Create new rules using the Formula Builder. You can define triggers for specific fields and custom error messages that populate in the UI when a user attempts to save record data that violates your business constraints."
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">
                            Guard Rules
                        </h1>
                        <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                            Enforce data quality with formula-based field validation
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 pb-36 md:pb-6">
                <Suspense fallback={<div>Loading rules...</div>}>
                    <ValidationRulesClient rules={rules} teamId={teamId || ""} />
                </Suspense>
            </div>
            </UpgradeGate>
        </div>
    );
}
