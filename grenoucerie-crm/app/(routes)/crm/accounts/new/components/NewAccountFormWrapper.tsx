"use client";

import { useRouter } from "next/navigation";
import { NewAccountForm } from "../../components/NewAccountForm";
import type { CustomFieldDefinition } from "@/lib/crm/custom-field-defaults";

export function NewAccountFormWrapper({ industries, users, customFieldDefs }: { industries: any[], users: any[], customFieldDefs: CustomFieldDefinition[] }) {
    const router = useRouter();

    return (
        <NewAccountForm
            industries={industries}
            users={users}
            customFieldDefs={customFieldDefs}
            onFinish={() => router.push("/crm/accounts")}
        />
    );
}
