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
        <Card className="bg-[#09090b] border-[#27272a]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">Detailed Usage Report</Title>
                    <Subtitle className="text-tremor-content dark:text-dark-tremor-content">Complete breakdown by team and department.</Subtitle>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search entities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-[#18181b] border-[#27272a] text-zinc-300 h-9 transition-all focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-white">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#18181b] border-[#27272a] text-zinc-300">
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
                            <DropdownMenuSeparator className="bg-[#27272a]" />
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
                            className="text-zinc-500 hover:text-zinc-300 text-xs"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="mt-4 w-full text-left">
                    <thead className="border-b border-tremor-border dark:border-dark-tremor-border">
                        <tr>
                            <th className="py-2 pr-4 pl-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-xs uppercase tracking-wider">Entity Name</th>
                            <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-xs uppercase tracking-wider">Requests</th>
                            <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-xs uppercase tracking-wider">Prompt</th>
                            <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-xs uppercase tracking-wider">Output</th>
                            <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-xs uppercase tracking-wider">Total Tokens</th>
                            <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id} className="border-b border-tremor-border dark:border-dark-tremor-border hover:bg-[#18181b]/50 transition-colors group">
                                <td className="py-3 pl-4 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">
                                            {item.name}
                                        </span>
                                        {item.team_type === 'DEPARTMENT' && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-zinc-800/50 text-zinc-400 border border-zinc-700 rounded uppercase tracking-widest">Dept</span>
                                        )}
                                        {item.id === basaltTeamId && (
                                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded uppercase tracking-widest">Internal</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-right font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong text-sm">{item.requestCount.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-mono text-tremor-content dark:text-dark-tremor-content text-sm">{item.promptTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-mono text-tremor-content dark:text-dark-tremor-content text-sm">{item.completionTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right font-bold font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong text-sm">{item.totalTokens.toLocaleString()}</td>
                                <td className="py-3 pr-4 text-right">
                                    {item.id !== unknownTeamId && (
                                        <Link href={`/partners/ai-usage/${item.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-indigo-500/10 hover:text-indigo-400">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
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
