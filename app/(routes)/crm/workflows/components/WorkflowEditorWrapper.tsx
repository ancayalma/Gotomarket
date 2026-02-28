"use client";

import dynamic from "next/dynamic";

export const WorkflowEditorWrapper = dynamic(
    () => import("./WorkflowEditor").then(mod => mod.WorkflowEditor),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Loading FlowState Editor…</p>
                </div>
            </div>
        ),
    }
);
