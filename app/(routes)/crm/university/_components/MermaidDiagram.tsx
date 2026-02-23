"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
    chart: string;
    mobileChart?: string;
    compact?: boolean;
    className?: string;
}

/**
 * Extract mermaid diagram blocks from input.
 * Handles: full markdown docs with ```mermaid fences, single fenced blocks, and clean code.
 * Always returns an array of diagram strings.
 */
function extractMermaidBlocks(input: string): string[] {
    const trimmed = input.trim();

    // Case 1: Contains ```mermaid fenced blocks — extract ALL of them
    const fenceRegex = /```mermaid\s*\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let match;
    while ((match = fenceRegex.exec(trimmed)) !== null) {
        matches.push(match[1].trim());
    }
    if (matches.length > 0) {
        return matches;
    }

    // Case 2: Wrapped in a single ``` ... ``` (no "mermaid" keyword)
    const singleFence = trimmed.match(/^```(?:mermaid)?\s*\n([\s\S]*?)```$/m);
    if (singleFence) {
        return [singleFence[1].trim()];
    }

    // Case 3: Already clean mermaid code
    return [trimmed];
}

// ─── Multi-Page Markdown Parsing ─────────────────────────────────────────────

export type DiagramPage = {
    pageNumber: number;
    title: string;
    description: string;
    mermaidCode: string;
    notes: string;
};

/**
 * Parse a full markdown document into structured DiagramPages.
 * Each page corresponds to a ## heading section that contains a ```mermaid block.
 * Extracts: title, description (italic intro), mermaid code, and notes (logic breakdown).
 */
export function parseMarkdownToPages(markdown: string): DiagramPage[] {
    const trimmed = markdown.trim();

    // Quick check: does this look like a markdown doc with mermaid blocks?
    if (!trimmed.includes('```mermaid')) {
        // Single clean diagram — no page structure
        return [{
            pageNumber: 1,
            title: '',
            description: '',
            mermaidCode: trimmed,
            notes: '',
        }];
    }

    // Split by level-2 headings (## ), keeping the heading with its section
    const sections = trimmed.split(/(?=^## )/m);
    const pages: DiagramPage[] = [];
    let pageNum = 1;

    for (const section of sections) {
        // Only process sections that contain a mermaid block
        const mermaidMatch = section.match(/```mermaid\s*\n([\s\S]*?)```/);
        if (!mermaidMatch) continue;

        // Extract title from ## heading
        const titleMatch = section.match(/^## (.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : `Page ${pageNum}`;

        // Extract description — italic text (*...*) between the title and the mermaid block
        const beforeMermaid = section.substring(0, section.indexOf('```mermaid'));
        const descMatch = beforeMermaid.match(/\*([^*]+)\*/);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract notes — everything after the closing ``` of the mermaid block
        const mermaidEnd = section.indexOf('```', section.indexOf('```mermaid') + 10) + 3;
        const afterMermaid = section.substring(mermaidEnd).trim();
        // Clean up notes: remove trailing --- separators
        const notes = afterMermaid.replace(/\n---\s*$/, '').trim();

        pages.push({
            pageNumber: pageNum++,
            title,
            description,
            mermaidCode: mermaidMatch[1].trim(),
            notes,
        });
    }

    // Fallback: if markdown has mermaid blocks but no ## sections
    if (pages.length === 0) {
        const blocks = extractMermaidBlocks(trimmed);
        return blocks.map((code, i) => ({
            pageNumber: i + 1,
            title: `Diagram ${i + 1}`,
            description: '',
            mermaidCode: code,
            notes: '',
        }));
    }

    return pages;
}

export function MermaidDiagram({ chart, mobileChart, compact, className }: MermaidDiagramProps) {
    const [desktopSvgs, setDesktopSvgs] = useState<string[]>([]);
    const [mobileSvgs, setMobileSvgs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const renderCharts = async () => {
            if (typeof window === "undefined") return;

            try {
                const mermaid = (await import("mermaid")).default;

                // Dark theme compatible
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    themeVariables: {
                        primaryColor: "#3b82f6",
                        primaryTextColor: "#e2e8f0",
                        primaryBorderColor: "#60a5fa",
                        lineColor: "#64748b",
                        secondaryColor: "#1e3a5f",
                        tertiaryColor: "#1a2e3b",
                        background: "transparent",
                        mainBkg: "transparent",
                        nodeBorder: "#475569",
                        clusterBkg: "rgba(15, 23, 42, 0.4)",
                        clusterBorder: "rgba(71, 85, 105, 0.4)",
                        titleColor: "#94a3b8",
                        edgeLabelBackground: "transparent",
                        fontSize: "16px",
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                    },
                    flowchart: {
                        htmlLabels: true,
                        curve: "basis",
                        padding: compact ? 14 : 28,
                        nodeSpacing: compact ? 40 : 80,
                        rankSpacing: compact ? 220 : 120,
                        useMaxWidth: true,
                    },
                    securityLevel: 'loose',
                });

                // Extract all diagram blocks from input
                const desktopBlocks = extractMermaidBlocks(chart);
                const renderedDesktop: string[] = [];

                for (let i = 0; i < desktopBlocks.length; i++) {
                    const id = `mermaid-desktop-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
                    try {
                        const { svg } = await mermaid.render(id, desktopBlocks[i]);
                        renderedDesktop.push(svg);
                    } catch (blockErr: any) {
                        console.warn(`Mermaid block ${i + 1} failed:`, blockErr?.message);
                        renderedDesktop.push(
                            `<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">Diagram ${i + 1} failed to render: ${blockErr?.message || "Unknown error"}</div>`
                        );
                    }
                }
                setDesktopSvgs(renderedDesktop);

                // Render mobile versions if provided
                if (mobileChart) {
                    const mobileBlocks = extractMermaidBlocks(mobileChart);
                    const renderedMobile: string[] = [];

                    for (let i = 0; i < mobileBlocks.length; i++) {
                        const id = `mermaid-mobile-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
                        try {
                            const { svg } = await mermaid.render(id, mobileBlocks[i]);
                            renderedMobile.push(svg);
                        } catch {
                            // Mobile fallback — skip silently, desktop will be used
                        }
                    }
                    setMobileSvgs(renderedMobile);
                }

                setError(null);
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                setError(err?.message || "Failed to render diagram");
            } finally {
                setIsLoading(false);
            }
        };

        renderCharts();
    }, [chart, mobileChart, compact]);

    if (isLoading) {
        return (
            <div className="w-full h-20 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                <p className="font-semibold">Diagram Error</p>
                <p className="text-xs mt-1">{error}</p>
            </div>
        );
    }

    const isMulti = desktopSvgs.length > 1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "w-full",
                className
            )}
        >
            {/* Desktop: render all charts */}
            <div className={cn(
                "hidden md:block [&_svg]:w-full [&_svg]:max-w-full [&_svg]:h-auto",
                isMulti && "space-y-6"
            )}>
                {desktopSvgs.map((svg, i) => (
                    <div key={i} className={cn(
                        "flex justify-center items-center",
                        isMulti && i > 0 && "pt-6 border-t border-white/5"
                    )}>
                        <div
                            className="w-full flex justify-center items-center"
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    </div>
                ))}
            </div>

            {/* Mobile: vertical charts or scrollable horizontal fallback */}
            <div className={cn(
                "block md:hidden",
                isMulti && "space-y-4"
            )}>
                {mobileSvgs.length > 0 ? (
                    mobileSvgs.map((svg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex justify-center items-center [&_svg]:w-full [&_svg]:max-w-full [&_svg]:h-auto",
                                isMulti && i > 0 && "pt-4 border-t border-white/5"
                            )}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    ))
                ) : (
                    desktopSvgs.map((svg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "overflow-x-auto [&_svg]:min-w-[600px] [&_svg]:h-auto",
                                isMulti && i > 0 && "pt-4 border-t border-white/5"
                            )}
                            dangerouslySetInnerHTML={{ __html: svg }}
                        />
                    ))
                )}
            </div>
        </motion.div>
    );
}

// ==========================================
// DESKTOP CHARTS - HORIZONTAL (LR)
// ==========================================

export const CRM_FLOW_DIAGRAM = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '13px', 'clusterBkg': 'rgba(15, 23, 42, 0.3)', 'clusterBorder': '#334155' }}}%%
graph LR
    subgraph Discovery [" 1-3. Strategize & Discover "]
        direction LR
        CAMPAIGN["Campaign Created"]:::adminNode --> WIZARD["LeadGen Wizard"]:::systemNode
        WIZARD --> ACC_LIST["Accounts & Lists"]:::dataNode
    end

    subgraph Outreach [" 4-6. Engage & Discover "]
        direction LR
        ACC_LIST --> ENGAGE["Outreach (Member)"]:::memberNode
        ENGAGE --> CONTACTS["Contacts Discovery"]:::dataNode
        CONTACTS --> LEAD_PROMO["Promoted to Lead"]:::conversionNode
    end

    subgraph Pipeline [" 7-10. Qualify & Deliver "]
        direction LR
        LEAD_PROMO --> OPP["Opportunity (Qualify)"]:::pipelineNode
        OPP --> CLOSING["Quote ➜ Contract ➜ Invoice"]:::financeNode
        CLOSING --> PROJECT["Project (Close Won)"]:::successNode
    end

    %% Enrichment happens throughout
    PROJECT -.-> ENRICH["Account Enrichment"]:::enrichNode
    ENRICH -.-> ACC_LIST

    classDef adminNode fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    classDef systemNode fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
    classDef dataNode fill:#0f172a,stroke:#475569,stroke-width:1px,color:#94a3b8
    classDef memberNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    classDef conversionNode fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
    classDef pipelineNode fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    classDef financeNode fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff
    classDef successNode fill:#064e3b,stroke:#10b981,stroke-width:3px,color:#dcfce7
    classDef enrichNode fill:#1e293b,stroke:#94a3b8,stroke-dasharray: 5 5,color:#94a3b8
`;

// Desktop: Two HORIZONTAL rows stacked vertically
export const CONVERSION_FLOW_DIAGRAM = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '13px', 'clusterBkg': 'rgba(30, 41, 59, 0.5)', 'clusterBorder': '#334155' }}}%%
graph TB
    subgraph Step_Discovery[" Lead Discovery "]
        direction LR
        L1["LeadGen Wizard"] --> A1["Accounts"]
        L1 --> LISTS["Lists"]
    end
    
    subgraph Step_Conversion[" Conversion Path "]
        direction LR
        C1["Contact"] --> CONV{{"Promote"}} --> LE["Lead"]
        LE --> Q1["Opportunity"]
    end

    subgraph Step_Fulfillment[" Revenue & Delivery "]
        direction LR
        O2["Opportunity"] --> WIN{{"Close Won"}} --> P1["Project"]
    end

    style L1 fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style CONV fill:#831843,stroke:#ec4899,color:#fce7f3
    style WIN fill:#064e3b,stroke:#10b981,color:#dcfce7
`;

// ==========================================
// MOBILE CHARTS - VERTICAL (TB)
// ==========================================

export const CRM_FLOW_DIAGRAM_MOBILE = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '11px' }}}%%
graph TB
    CAMPAIGN["1. Campaign Created"]:::adminNode --> WIZARD["2. LeadGen Wizard"]:::systemNode
    WIZARD --> ACC_LIST["3. Accounts & Lists"]:::dataNode
    
    ACC_LIST --> ENGAGE["4. Outreach (Member)"]:::memberNode
    ENGAGE --> CONTACTS["5. Contacts Discovery"]:::dataNode
    CONTACTS --> LEAD_PROMO["6. Promoted to Lead"]:::conversionNode
    
    LEAD_PROMO --> OPP["7. Opportunity (Qualify)"]:::pipelineNode
    OPP --> CLOSING["8. Quote & Contract"]:::financeNode
    CLOSING --> INVOICE["9. Invoice Sent"]:::financeNode
    INVOICE --> PROJECT["10. Project (Close Won)"]:::successNode

    classDef adminNode fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    classDef systemNode fill:#312e81,stroke:#6366f1,color:#c7d2fe
    classDef dataNode fill:#0f172a,stroke:#475569,color:#94a3b8
    classDef memberNode fill:#064e3b,stroke:#10b981,color:#dcfce7
    classDef conversionNode fill:#831843,stroke:#ec4899,color:#fce7f3
    classDef pipelineNode fill:#78350f,stroke:#f59e0b,color:#fef3c7
    classDef financeNode fill:#4c1d95,stroke:#8b5cf6,color:#e9d5ff
    classDef successNode fill:#064e3b,stroke:#10b981,color:#dcfce7
`;

export const CONVERSION_FLOW_DIAGRAM_MOBILE = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '12px' }}}%%
graph TB
    WIZARD["Wizard"] --> ACCS["Accounts"]
    ACCS --> PROM["Promote Contact"]
    PROM --> LEAD["Lead"]
    LEAD --> OPP["Opportunity"]
    OPP --> CLOSE["Close Won"]
    CLOSE --> PROJ["Project"]

    style WIZARD fill:#1e3a5f,stroke:#3b82f6
    style PROM fill:#831843,stroke:#ec4899
    style PROJ fill:#064e3b,stroke:#10b981
`;

export default MermaidDiagram;
