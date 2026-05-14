"use client";

import { useSession } from "next-auth/react";
import EmailVerificationModal from "@/components/modals/EmailVerificationModal";

interface Props {
    serverFlag?: boolean;
}

export default function EmailVerificationCheck({ serverFlag }: Props) {
    const { data: session } = useSession();

    // Show the verification modal when the user's email is NOT SES-verified
    const needsVerification = serverFlag === false;

    return (
        <EmailVerificationModal
            isOpen={needsVerification}
            userEmail={session?.user?.email || undefined}
        />
    );
}
