"use client";

import { useSession } from "next-auth/react";
import ForcePasswordChangeModal from "@/components/modals/ForcePasswordChangeModal";

interface Props {
    serverFlag?: boolean;
}

export default function ForcePasswordChangeCheck({ serverFlag }: Props) {
    const { data: session } = useSession();

    // Use server-side flag (authoritative) OR client-side session flag as fallback
    const mustChange = serverFlag === true || session?.user?.mustChangePassword === true;

    return <ForcePasswordChangeModal isOpen={mustChange} />;
}
