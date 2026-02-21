"use client";

import { useSession } from "next-auth/react";
import ForcePasswordChangeModal from "@/components/modals/ForcePasswordChangeModal";

export default function ForcePasswordChangeCheck() {
    const { data: session } = useSession();

    // Check if the session user has the mustChangePassword flag set
    // This is injected into the session via our modified lib/auth.ts
    const mustChange = session?.user?.mustChangePassword === true;

    return <ForcePasswordChangeModal isOpen={mustChange} />;
}
