
"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    TrendingUp,
    DollarSign,
    Briefcase,
    Mail,
    MoreVertical,
    FileText,
    Star
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Employee {
    id: string;
    name: string;
    avatar: string;
    email?: string | null;
    salary: number;
    status: string;
}

export default function StaffDashboard({ employees }: { employees: Employee[] }) {
    const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
    const activeStaff = employees.filter(e => e.status === "ACTIVE").length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* HR Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/5 to-transparent">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Headcount</CardDescription>
                        <CardTitle className="text-2xl font-black">{employees.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <Users className="w-3 h-3 text-indigo-500" />
                            <span>{activeStaff} Active | {employees.length - activeStaff} Out</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Monthly Payroll</CardDescription>
                        <CardTitle className="text-2xl font-black">
                            ${(totalPayroll / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            <span>Total Annual: ${totalPayroll.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-amber-500">Avg. Performance</CardDescription>
                        <CardTitle className="text-2xl font-black">84%</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <TrendingUp className="w-3 h-3 text-amber-500" />
                            <span>+4% from last quarter</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {employees.map((emp) => (
                    <Card key={emp.id} className="group overflow-hidden hover:border-primary/40 transition-all border-border/50">
                        <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={emp.avatar} />
                                        <AvatarFallback className="font-bold bg-indigo-500/10 text-indigo-500">
                                            {emp.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${emp.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted"}`} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{emp.name}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                        <Mail className="w-2.5 h-2.5" />
                                        <span className="truncate max-w-[120px]">{emp.email || "no-email@company.com"}</span>
                                    </div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem className="text-xs font-bold gap-2">
                                        <FileText className="w-3.5 h-3.5" /> View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs font-bold gap-2">
                                        <Star className="w-3.5 h-3.5" /> Performance
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 rounded-lg bg-muted/30 flex flex-col gap-0.5">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Salary</span>
                                        <span className="text-xs font-black">${emp.salary.toLocaleString()}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/30 flex flex-col gap-0.5">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">KPI Score</span>
                                        <span className="text-xs font-black">--</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                    <Badge variant="outline" className="text-[10px] h-5 font-black uppercase border-indigo-500/20 bg-indigo-500/5 text-indigo-500">
                                        Engineering
                                    </Badge>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">#{emp.id.substring(0, 6)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Add Member Card */}
                <button className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[160px]">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground group-hover:text-primary">Add Staff Member</span>
                </button>
            </div>
        </div>
    );
}
