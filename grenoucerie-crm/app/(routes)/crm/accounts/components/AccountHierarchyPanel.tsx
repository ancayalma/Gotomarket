"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronRight, ChevronDown, GitBranch } from "lucide-react";
import { getAccountHierarchy, AccountHierarchyNode } from "@/actions/crm/get-account-hierarchy";
import Link from "next/link";

interface AccountHierarchyPanelProps {
    accountId: string;
}

function HierarchyNode({ node, currentAccountId, depth = 0 }: {
    node: AccountHierarchyNode;
    currentAccountId: string;
    depth?: number;
}) {
    const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
    const isCurrent = node.id === currentAccountId;
    const hasChildren = node.children.length > 0;

    return (
        <div className={`${depth > 0 ? "ml-4 border-l border-white/10 pl-3" : ""}`}>
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition cursor-pointer
                    ${isCurrent ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-white/5 text-muted-foreground"}`}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />
                ) : (
                    <div className="w-3" />
                )}
                <Building2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                <Link
                    href={`/crm/accounts/${node.id}`}
                    className={`truncate hover:underline ${isCurrent ? "font-semibold text-white" : ""}`}
                    onClick={e => e.stopPropagation()}
                >
                    {node.name}
                </Link>
                {node.type && <span className="text-[10px] text-muted-foreground shrink-0">{node.type}</span>}
                {hasChildren && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{node.childCount}</span>}
            </div>

            {isExpanded && hasChildren && (
                <div className="mt-0.5">
                    {node.children.map(child => (
                        <HierarchyNode key={child.id} node={child} currentAccountId={currentAccountId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AccountHierarchyPanel({ accountId }: AccountHierarchyPanelProps) {
    const [hierarchy, setHierarchy] = useState<{ root: AccountHierarchyNode; currentAccountId: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAccountHierarchy(accountId);
            setHierarchy(data);
            setLoading(false);
        })();
    }, [accountId]);

    // Show empty state if no hierarchy exists
    if (!loading && (!hierarchy || (hierarchy.root.childCount === 0 && hierarchy.root.id === accountId))) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <h3 className="font-semibold text-white mb-1">No Account Hierarchy</h3>
                <p className="text-sm max-w-sm mx-auto">
                    This account has no parent or child relationships. Link a parent account or add subsidiaries to build a hierarchy tree.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 animate-pulse">
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-4 w-48 bg-white/10 rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Account Hierarchy</h3>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                {hierarchy && <HierarchyNode node={hierarchy.root} currentAccountId={hierarchy.currentAccountId} />}
            </div>
        </div>
    );
}
