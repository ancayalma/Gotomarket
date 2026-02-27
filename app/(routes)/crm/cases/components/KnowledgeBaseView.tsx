"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ThumbsUp, Layers, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface KnowledgeBaseViewProps {
    initialArticles: any[];
}

export default function KnowledgeBaseView({ initialArticles }: KnowledgeBaseViewProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [articles, setArticles] = useState(initialArticles);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            const res = await fetch(`/api/crm/knowledge/articles?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (error) {
            console.error("Failed to search articles", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur px-4 md:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <BookOpen className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Knowledge Base</h1>
                            <p className="text-xs text-muted-foreground">Internal documentation & customer guides</p>
                        </div>
                    </div>
                    {/* Placeholder for 'New Article' button - could be added if permissions allow */}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-muted/30 border-border/50"
                    />
                </form>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                {articles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No articles found</p>
                        <p className="text-sm">Try close searching for something else</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {articles.map((article) => (
                            <Card key={article.id} className="group hover:border-emerald-500/30 transition-all cursor-pointer bg-card/50 hover:bg-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            {article.category?.icon ? (
                                                <span className="text-lg">{article.category.icon}</span>
                                            ) : (
                                                <Layers className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                {article.category?.name || "Uncategorized"}
                                            </span>
                                        </div>
                                        {article.is_internal && (
                                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/5">
                                                Internal
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                                        {article.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {article.summary || "No summary available."}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                                        <div className="flex items-center gap-1">
                                            <ThumbsUp className="w-3 h-3" />
                                            {article.helpful_count || 0} found helpful
                                        </div>
                                        <span>{new Date(article.updatedAt || article.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
