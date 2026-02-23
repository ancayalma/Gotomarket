"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import {
    Trash2,
    Target,
    Users,
    UserPlus,
    Calendar,
    Building2,
    Mail,
    Phone,
    ExternalLink,
    FileText,
    X,
    ChevronRight,
    Plus,
    Palette,
    MoreVertical,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImportLeadsDialog from "../../crm/accounts/components/ImportLeadsDialog";
import ImportAccountsDialog from "../../crm/accounts/components/ImportAccountsDialog";
import FirstContactWizard from "@/components/modals/FirstContactWizard";
import RestrictedAccessModal from "@/components/modals/RestrictedAccessModal";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { EnhancedDateFilter } from "@/components/date-filter/EnhancedDateFilter";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AssignPoolMembersModal from "../../crm/accounts/components/AssignPoolMembersModal";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeadPool = {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    color?: string;
    latestJob?: {
        id: string;
        status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
        startedAt?: string;
        finishedAt?: string;
        counters?: Record<string, number>;
        queryTemplates?: string[];
    } | null;
    candidatesCount: number;
    contactsCount: number;
    icpConfig?: any;
};

type PoolsResponse = {
    pools: LeadPool[];
};

export default function ListsView() {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);
    const [icpModalPool, setIcpModalPool] = useState<LeadPool | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { data, error, isLoading, mutate } = useSWR<PoolsResponse>("/api/crm/leads/pools", fetcher, {
        refreshInterval: (data) => {
            const hasActiveJob = data?.pools?.some(p =>
                p.latestJob?.status === "RUNNING" || p.latestJob?.status === "QUEUED"
            );
            return hasActiveJob ? 5000 : 30000;
        },
    });
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardLeadIds, setWizardLeadIds] = useState<string[]>([]);
    const [loadingOutreach, setLoadingOutreach] = useState<string | null>(null);
    const [assignModalPool, setAssignModalPool] = useState<LeadPool | null>(null);
    const [poolToDelete, setPoolToDelete] = useState<{ id: string, name: string } | null>(null);
    const [restrictedPool, setRestrictedPool] = useState<string | null>(null);

    const [buttonSets, setButtonSets] = useState<Record<string, { sets: any[] }>>({});
    const [selectedButtonSet, setSelectedButtonSet] = useState<Record<string, string>>({});

    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) {
            setViewMode("card");
        }
    }, [isMobile]);

    // Cache version check 
    useEffect(() => {
        const checkCacheVersion = async () => {
            try {
                const res = await fetch("/api/cache-version");
                if (!res.ok) return;
                const { version } = await res.json();
                const storedVersion = sessionStorage.getItem("poolsCacheVersion");
                if (storedVersion && version !== storedVersion) {
                    globalMutate(() => true, undefined, { revalidate: true });
                }
                sessionStorage.setItem("poolsCacheVersion", version);
            } catch (e) { }
        };
        checkCacheVersion();
        const interval = setInterval(checkCacheVersion, 60000);
        return () => clearInterval(interval);
    }, []);

    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    const filteredPools = data?.pools?.filter(p => {
        // Search filter
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Date filter
        if (dateRange.from || dateRange.to) {
            if (!p.createdAt) return false;
            const createdAt = new Date(p.createdAt);

            if (dateRange.from && dateRange.to) {
                return createdAt >= dateRange.from && createdAt <= dateRange.to;
            }
            if (dateRange.from) {
                return createdAt >= dateRange.from;
            }
            if (dateRange.to) {
                return createdAt <= dateRange.to;
            }
        }

        return true;
    });

    const startFirstContact = async (poolId: string) => {
        try {
            setLoadingOutreach(poolId);
            const res = await fetch(`/api/crm/leads/pools/${encodeURIComponent(poolId)}/leads?mine=true`);

            if (res.status === 403) {
                const pool = data?.pools?.find(p => p.id === poolId);
                setRestrictedPool(pool?.name || "this list");
                return;
            }

            if (!res.ok) throw new Error(await res.text());
            const j = await res.json();
            const ids: string[] = Array.isArray(j?.leads) ? (j.leads as any[]).filter(l => !!l.email).map(l => l.id) : [];
            setWizardLeadIds(ids);
            setWizardOpen(true);
        } catch (e) {
            alert("An error occurred while loading outreach leads");
        } finally {
            setLoadingOutreach(null);
        }
    };

    const onDeletePool = async (poolId: string) => {
        setDeleting(poolId);
        try {
            const res = await fetch(`/api/crm/leads/pools?poolId=${poolId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete pool");
            mutate();
            setPoolToDelete(null);
        } catch (error) {
            alert("Failed to delete pool");
        } finally {
            setDeleting(null);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "SUCCESS": return "text-green-600 bg-green-50 dark:bg-green-950";
            case "RUNNING": return "text-blue-600 bg-blue-50 dark:bg-blue-950";
            case "FAILED": return "text-red-600 bg-red-50 dark:bg-red-950";
            case "QUEUED": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
            default: return "text-gray-600 bg-gray-50 dark:bg-gray-950";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search lists..."
                            className="pl-3 bg-card/50 backdrop-blur-sm border-white/10 !text-left placeholder:!text-left"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <EnhancedDateFilter
                        onFilterChange={(range: { from: Date | undefined; to: Date | undefined }) => setDateRange(range)}
                        storageKey="crm-lists-view-date-filter"
                        initialType="all-time"
                        className="w-full md:w-auto"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <ImportAccountsDialog onImportComplete={() => mutate()} />
                    <ImportLeadsDialog pools={data?.pools ?? []} onCommitted={() => mutate()} />
                    <Button
                        onClick={() => router.push("/crm/accounts?tab=wizard")}
                        className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New List (Wizard)
                    </Button>
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            <Separator className="bg-white/5" />

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : filteredPools?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card/50 backdrop-blur-sm rounded-xl border border-white/5 border-dashed">
                    {searchQuery ? "No lists matching your search." : "No lists found. Create one with the Lead Gen Wizard or Import Accounts."}
                </div>
            ) : (
                <div className="space-y-4">
                    {viewMode === "table" ? (
                        <div className="rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-white/5">
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Name</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Accounts</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Contacts</TableHead>
                                        <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Created</TableHead>
                                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPools?.map((pool) => (
                                        <TableRow key={pool.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-medium">
                                                <div className="font-bold">{pool.name}</div>
                                                {pool.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{pool.description}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {pool.latestJob && (
                                                    <Badge variant="secondary" className={`${getStatusColor(pool.latestJob.status)} border-none text-[10px] font-bold`}>
                                                        {pool.latestJob.status}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-bold text-emerald-500">{pool.candidatesCount}</TableCell>
                                            <TableCell className="font-bold text-blue-500">{pool.contactsCount}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {pool.createdAt ? new Date(pool.createdAt).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
                                                        onClick={() => router.push(`/crm/accounts/lists/${pool.id}`)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                        onClick={() => setPoolToDelete({ id: pool.id, name: pool.name })}
                                                        disabled={deleting === pool.id}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPools?.map((pool) => (
                                <Card key={pool.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all group bg-card/50 backdrop-blur-sm border border-white/5">
                                    <div className="h-1.5 w-full" style={{ backgroundColor: pool.color || "#6366f1" }} />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg font-bold tracking-tight">{pool.name}</CardTitle>
                                                <CardDescription className="line-clamp-1 text-xs">
                                                    {pool.description || "No description provided."}
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Manage List</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setAssignModalPool(pool)}><UserPlus className="w-4 h-4 mr-2" /> Assign Members</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/documents?poolId=${pool.id}`)}><FileText className="w-4 h-4 mr-2" /> Manage Documents</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setIcpModalPool(pool)}><Target className="w-4 h-4 mr-2" /> View ICP</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-500" onClick={() => setPoolToDelete({ id: pool.id, name: pool.name })} disabled={deleting === pool.id}>
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-bold uppercase tracking-wider">
                                                {pool.candidatesCount} Accounts
                                            </Badge>
                                            {pool.latestJob && (
                                                <Badge variant="outline" className={`${getStatusColor(pool.latestJob.status)} border-none text-[10px] font-bold uppercase tracking-wider ${pool.latestJob.status === 'RUNNING' ? 'animate-pulse' : ''}`}>
                                                    {pool.latestJob.status}
                                                    {pool.latestJob.status === "RUNNING" && pool.latestJob.counters && (
                                                        <span className="ml-1 opacity-80 normal-case font-medium">
                                                            ({pool.latestJob.counters.companiesFound || 0} Found, {pool.latestJob.counters.contactsCreated || 0} Contacts)
                                                        </span>
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                        {pool.latestJob?.queryTemplates?.[0] && (
                                            <p className="text-[10px] text-muted-foreground mt-3 italic line-clamp-2">
                                                "{pool.latestJob.queryTemplates[0]}"
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="pt-3 border-t border-white/5 bg-muted/5 flex gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1 text-xs font-bold uppercase tracking-wider h-8 bg-indigo-600 hover:bg-indigo-700"
                                            onClick={() => router.push(`/crm/accounts/lists/${pool.id}`)}
                                        >
                                            Work List
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs font-bold uppercase tracking-wider h-8 border-white/10 hover:bg-white/5"
                                            onClick={() => startFirstContact(pool.id)}
                                            disabled={loadingOutreach === pool.id}
                                        >
                                            {loadingOutreach === pool.id ? "..." : "Outreach"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {icpModalPool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIcpModalPool(null)}>
                    <div className="bg-card rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">ICP Configuration</h2>
                                <p className="text-sm text-muted-foreground">{icpModalPool.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIcpModalPool(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                            <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto border border-white/5 font-mono">
                                {JSON.stringify(icpModalPool.icpConfig, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {assignModalPool && (
                <AssignPoolMembersModal
                    poolId={assignModalPool.id}
                    poolName={assignModalPool.name}
                    isOpen={true}
                    onClose={() => setAssignModalPool(null)}
                    onUpdate={() => mutate()}
                />
            )}

            <FirstContactWizard
                isOpen={!!wizardOpen}
                onClose={() => setWizardOpen(false)}
                leadIds={wizardLeadIds}
            />

            <AlertDialog open={!!poolToDelete} onOpenChange={(open) => !open && setPoolToDelete(null)}>
                <AlertDialogContent className="bg-card border-white/10 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Lead Pool</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete <span className="text-foreground font-semibold">"{poolToDelete?.name}"</span>?
                            This action cannot be undone and will remove all associated lead candidates.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="border-white/10 hover:bg-white/5 uppercase tracking-widest text-[10px] font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => poolToDelete && onDeletePool(poolToDelete.id)}
                            className="bg-red-600 hover:bg-red-700 uppercase tracking-widest text-[10px] font-bold"
                        >
                            {deleting ? "Deleting..." : "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <RestrictedAccessModal
                isOpen={!!restrictedPool}
                onClose={() => setRestrictedPool(null)}
                poolName={restrictedPool || ""}
            />
        </div>
    );
}
