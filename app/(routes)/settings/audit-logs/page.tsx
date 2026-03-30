export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Container from "../../components/ui/Container";
import { getRecentActivities } from "@/actions/audit";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import {
    ShieldIcon,
    UserIcon,
    ActivityIcon,
    DatabaseIcon,
    GlobeIcon,
    ClockIcon,
    SearchIcon,
    AlertCircleIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SuspenseLoading from "@/components/loadings/suspense";

const AuditLogsPage = async () => {
    const activities = await getRecentActivities(100);

    return (
        <Container
            title="System Audit Logs"
            description="Track sensitive system changes and user activities for security compliance."
        >
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/10">
                        <CardHeader className="p-4">
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Events (14d)</CardDescription>
                            <CardTitle className="text-2xl font-black">{activities.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/10">
                        <CardHeader className="p-4">
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-orange-400">Security Events</CardDescription>
                            <CardTitle className="text-2xl font-black text-orange-500">
                                {activities.filter((a: any) => a.action.includes("LOGIN") || a.action.includes("ROLE") || a.action.includes("PERMISSION")).length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
                        <CardHeader className="p-4">
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active Users</CardDescription>
                            <CardTitle className="text-2xl font-black text-emerald-500">
                                {new Set(activities.map((a: any) => a.userId)).size}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-cyan-500/5 to-transparent border-cyan-500/10">
                        <CardHeader className="p-4">
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Unique IPs</CardDescription>
                            <CardTitle className="text-2xl font-black text-cyan-500">
                                {new Set(activities.map((a: any) => a.ipAddress)).size}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filter Bar */}
                <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="relative w-full max-w-sm">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by action or user..."
                            className="pl-9 bg-background border-border/50 focus-visible:ring-indigo-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted font-bold text-[10px] uppercase tracking-tighter">Export CSV</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted font-bold text-[10px] uppercase tracking-tighter">Live Monitor</Badge>
                    </div>
                </div>

                <Suspense fallback={<SuspenseLoading />}>
                    <Card className="border-border/50 shadow-none overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-tighter">Timestamp</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-tighter">User</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-tighter">Action</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-tighter">Resource</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-tighter">IP / Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircleIcon className="w-8 h-8 opacity-20" />
                                                <p>No activity logs found for the last 14 days.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activities.map((log: any) => (
                                        <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {moment(log.createdAt).format("MMM DD, HH:mm:ss")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 border border-border/50">
                                                        <AvatarImage src={log.user?.avatar || undefined} />
                                                        <AvatarFallback className="text-[10px] font-black bg-indigo-500/10 text-indigo-500">
                                                            {log.user?.name?.substring(0, 2).toUpperCase() || "SY"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col -space-y-0.5">
                                                        <span className="text-xs font-bold">{log.user?.name || "System Process"}</span>
                                                        <span className="text-[10px] text-muted-foreground">{log.user?.email || "internal@system"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-tight",
                                                        log.action.includes("DELETE") ? "bg-rose-500/10 text-rose-500" :
                                                            log.action.includes("CREATE") ? "bg-emerald-500/10 text-emerald-500" :
                                                                log.action.includes("LOGIN") ? "bg-indigo-500/10 text-indigo-500" :
                                                                    "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {log.action.replace(/_/g, " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80">
                                                    <DatabaseIcon className="w-3 h-3" />
                                                    {log.resource}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                                                        <GlobeIcon className="w-3 h-3" />
                                                        {log.ipAddress}
                                                    </div>
                                                    {log.details && (
                                                        <span className="text-[10px] text-muted-foreground/60 italic truncate max-w-xs">
                                                            {log.details.length > 50 ? log.details.substring(0, 50) + "..." : log.details}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </Suspense>
            </div>
        </Container>
    );
};

export default AuditLogsPage;

// Helper to handle Tailwind classes safely
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
