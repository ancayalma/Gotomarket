"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useGreeting } from "@/app/hooks/use-greeting";

export default function WelcomeMessage() {
    const { data: session } = useSession();
    const greeting = useGreeting();

    // Get first name safely or fallback to email username
    const userName = session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "there";

    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4">
                {greeting}, {userName}
            </h1>
            <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                This is your Command Center.
            </p>
        </div>
    );
}
