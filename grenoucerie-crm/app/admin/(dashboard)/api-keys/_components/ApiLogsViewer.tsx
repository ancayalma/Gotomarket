"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Clock, Search, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ApiLog {
    id: string;
    endpoint: string;
    method: string;
    status_code: number;
    ip_address: string | null;
    request_dur: number | null;
    timestamp: Date;
}

export function ApiLogsViewer({ initialLogs }: { initialLogs: ApiLog[] }) {
    const [search, setSearch] = useState("");

    const filteredLogs = initialLogs.filter((log) => 
        log.endpoint.toLowerCase().includes(search.toLowerCase()) ||
        log.method.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-[#18181b] border border-primary/20 rounded-2xl flex flex-col items-start justify-start p-6 space-y-4">
            <div className="flex w-full mb-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search logs by endpoint or method..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-black/40 border-primary/20 transition-all focus:border-primary/50 text-sm"
                    />
                </div>
            </div>

            <div className="w-full space-y-2 max-h-[500px] overflow-y-auto no-scrollbar custom-scrollbar pr-2 pb-2">
                {filteredLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No API logs match your search.</p>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 transition-colors border border-primary/5 rounded-xl group relative overflow-hidden">
                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-[100%] group-hover:translate-x-[100%] duration-1000 ease-in-out pointer-events-none" />

                            <div className="flex items-center gap-3 z-10 w-full overflow-hidden">
                                <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-black/40 border border-white/5">
                                    {log.status_code >= 200 && log.status_code < 300 ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2 relative group/endpoint">
                                        <span className={`text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                                            log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                            log.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                                            log.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                            'bg-orange-500/20 text-orange-400'
                                        }`}>
                                            {log.method}
                                        </span>
                                        <span className="font-mono text-xs sm:text-sm text-primary/80 truncate">
                                            {log.endpoint}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground opacity-80">
                                        <span className="flex items-center gap-1 font-mono tracking-tighter shrink-0">
                                            <Clock className="w-3 h-3 text-primary/50" />
                                            {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                                        </span>
                                        <span className="shrink-0">•</span>
                                        <span className={`font-medium tracking-wide font-mono shrink-0 ${
                                            log.status_code >= 200 && log.status_code < 300 ? 'text-emerald-500' : 'text-red-500'
                                        }`}>
                                            {log.status_code}
                                        </span>
                                        {log.request_dur !== null && (
                                            <>
                                                <span className="shrink-0 hidden sm:inline">•</span>
                                                <span className="font-mono tracking-wide shrink-0 hidden sm:inline text-primary/60">
                                                    {log.request_dur}ms
                                                </span>
                                            </>
                                        )}
                                        {log.ip_address && (
                                            <>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:inline">
                                                    • {log.ip_address}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
