"use client";

import { useState, useMemo } from "react";
import { Card, Title, Subtitle } from "@tremor/react";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamUsageData {
    id: string;
    name: string;
    team_type: string;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestCount: number;
}

interface AiUsageReportTableProps {
    data: TeamUsageData[];
    basaltTeamId: string;
    unknownTeamId: string;
}

export const AiUsageReportTable = ({ data, basaltTeamId, unknownTeamId }: AiUsageReportTableProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showOrgs, setShowOrgs] = useState(true);
    const [showDepts, setShowDepts] = useState(true);
    const [showZeroUsage, setShowZeroUsage] = useState(false);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Search filter
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Type filter
            const matchesType = (item.team_type === 'ORGANIZATION' && showOrgs) ||
                (item.team_type === 'DEPARTMENT' && showDepts);

            // Usage filter
            const matchesUsage = showZeroUsage || item.totalTokens > 0;

            return matchesSearch && matchesType && matchesUsage;
        });
    }, [data, searchQuery, showOrgs, showDepts, showZeroUsage]);

    return (
        <Card className="bg-card border-border/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <Title className="text-foreground">Detailed Usage Report</Title>
                    <Subtitle className="text-muted-foreground">Complete breakdown by team and department.</Subtitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search entities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-accent/5 border-border/50 text-foreground h-9 transition-colors focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-accent/10 border-border/50 text-muted-foreground hover:text-foreground">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuLabel>Entity Types</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                                checked={showOrgs}
                                onCheckedChange={setShowOrgs}
                            >
                                Organizations
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={showDepts}
                                onCheckedChange={setShowDepts}
                            >
                                Departments
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuLabel>Usage Status</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                                checked={showZeroUsage}
                                onCheckedChange={setShowZeroUsage}
                            >
                                Show Zero Usage
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchQuery || !showOrgs || !showDepts || showZeroUsage) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setShowOrgs(true);
                                setShowDepts(true);
                                setShowZeroUsage(false);
                            }}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="mt-4 w-full text-left">
                    <thead className="border-b border-border/50">
                        <tr>
                            <th className="py-2 pr-4 pl-4 font-semibold text-foreground text-xs uppercase tracking-wider">Entity Name</th>
                            <th className="py-2 pr-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider">Requests</th>
                            <th className="py-2 pr-4 font-semibold text-teal-500 text-right text-xs uppercase tracking-wider">Prompt</th>
                            <th className="py-2 pr-4 font-semibold text-fuchsia-500 text-right text-xs uppercase tracking-wider">Output</th>
                            <th className="py-2 pr-4 font-semibold text-foreground text-right text-xs uppercase tracking-wider">Total Tokens</th>
                            <th className="py-2 pr-4 font-semibold text-foreground text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors group">
                                <td className="py-3 pl-4 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-medium">
                                            {item.name}
                                        </span>
                                        {item.team_type === 'DEPARTMENT' && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-accent/20 text-muted-foreground border border-border/30 rounded uppercase tracking-widest">Dept</span>
                                        )}
                                        {item.id === basaltTeamId && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-widest">Internal</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-right font-mono text-foreground text-sm">{item.requestCount.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-mono text-teal-400/80 text-sm">{item.promptTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-mono text-fuchsia-400/80 text-sm">{item.completionTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-bold font-mono text-foreground text-sm">{item.totalTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right">
                                    {item.id !== unknownTeamId && (
                                        <Link href={`/platform/ai-usage/${item.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground font-medium">
                                    No records found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
