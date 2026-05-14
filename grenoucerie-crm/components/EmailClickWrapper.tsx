"use client";

import * as React from "react";
import { useState } from "react";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { EmailComposeSheet } from "@/components/EmailComposeSheet";

interface EmailClickWrapperProps {
    email: string | null;
    contactName?: string;
    accountName?: string;
}

export function EmailClickWrapper({ email, contactName, accountName }: EmailClickWrapperProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!email) {
        return <span className="text-sm text-muted-foreground">No email</span>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title={email || ""}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group cursor-pointer max-w-[180px] overflow-hidden"
            >
                <span className="truncate">{email}</span>
                <EnvelopeClosedIcon className="group-hover:scale-110 transition-transform shrink-0" />
            </button>

            <EmailComposeSheet
                open={isOpen}
                onOpenChange={setIsOpen}
                defaultTo={email}
                contactName={contactName}
                accountName={accountName}
            />
        </>
    );
}
