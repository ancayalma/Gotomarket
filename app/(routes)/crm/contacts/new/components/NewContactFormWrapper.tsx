"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { NewContactForm } from "../../components/NewContactForm";

export function NewContactFormWrapper({ accounts, users }: { accounts: any[], users: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountId = searchParams.get("accountId") || undefined;

    return (
        <NewContactForm
            accounts={accounts}
            users={users}
            accountId={accountId}
            onFinish={() => router.push("/crm/contacts")}
        />
    );
}
