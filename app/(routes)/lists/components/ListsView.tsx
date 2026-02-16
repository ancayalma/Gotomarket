"use client";

import React, { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Plus, Search, Layers, FileText, Palette, ExternalLink, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function ListsView() {
    const { data, error, isLoading } = useSWR("/api/lists", fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const lists = data?.lists || [];

    const filteredLists = lists.filter((list: any) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search lists..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => router.push("/crm/accounts?tab=wizard")} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    New List (Wizard)
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : filteredLists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No lists found. Create one with the Lead Gen Wizard.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredLists.map((list: any) => (
                        <ListCard key={list.id} list={list} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ListCard({ list }: { list: any }) {
    // Use list.color if available, else default
    const color = list.color || "#6366f1"; // Default indigo-500

    return (
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow group">
            <div className="h-2 w-full" style={{ backgroundColor: color }} />
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold">{list.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                            {list.description || "No description provided."}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage List</DropdownMenuLabel>
                            <DropdownMenuItem><Palette className="w-4 h-4 mr-2" /> Change Color</DropdownMenuItem>
                            <DropdownMenuItem><FileText className="w-4 h-4 mr-2" /> Manage Documents</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-secondary/50">
                        Active
                    </Badge>
                    {/* Placeholder for lead count if available */}
                    <Badge variant="outline">
                        {list._count?.candidates || 0} Leads
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-muted/5 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                    Created {new Date(list.createdAt).toLocaleDateString()}
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1 hover:text-primary">
                    Open <ExternalLink className="w-3 h-3" />
                </Button>
            </CardFooter>
        </Card>
    );
}
