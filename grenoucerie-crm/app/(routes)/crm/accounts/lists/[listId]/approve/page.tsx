"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useSession } from "next-auth/react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Loader2, Sparkles, User, Globe, Building2, Briefcase, Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { LearnLink } from "@/components/ui/LearnLink";
import { manualAgentEnrichment } from "@/actions/leads/manual-enrichment";

type ContactCandidate = {
    id: string;
    fullName: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    confidence: number;
    status: string;
};

type LeadCandidate = {
    id: string;
    domain: string | null;
    companyName: string | null;
    homepageUrl: string | null;
    description: string | null;
    industry: string | null;
    techStack: string[] | null;
    score: number;
    freshnessAt: string;
    status: string;
    contacts: ContactCandidate[];
};

export default function ApprovalCenterPage() {
    const params = useParams();
    const router = useRouter();
    const listId = params.listId as string;
    const { data: session } = useSession();

    const { data, error, isLoading, mutate } = useSWR<{ candidates: LeadCandidate[] }>(
        listId ? `/api/crm/leads/pools/${listId}/candidates` : null,
        fetcher
    );

    const [processing, setProcessing] = useState<string | null>(null);

    const candidates = data?.candidates?.filter(c => c.status !== "CONVERTED" && c.status !== "REJECTED") || [];

    const handleApprove = async (candidateId: string) => {
        if (!session?.user?.id) {
            toast.error("You must be logged in to approve candidates.");
            return;
        }

        setProcessing(candidateId);
        try {
            const res = await fetch(`/api/crm/leads/pools/${listId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignments: [{ candidateId, userId: session.user.id }]
                })
            });

            if (!res.ok) throw new Error("Failed to approve candidate.");

            toast.success("Candidate Approved & Added to List!");
            mutate();
        } catch (error) {
            console.error(error);
            toast.error("Failed to approve candidate.");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (candidateId: string) => {
        setProcessing(candidateId);
        // Assuming there isn't a direct endpoint tailored for REJECTING yet, 
        // we can update status via a generic PATCH or simply hide it in the UI.
        // For now, let's mock the UI hiding or show toast. Let me know if you want the API added.
        toast.error("Candidate Rejected (Skipped).");
        setProcessing(null);
    };

    const handleDeepSearch = async (candidateId: string) => {
        if (!session?.user?.id) {
            toast.error("You must be logged in.");
            return;
        }

        setProcessing(`research_${candidateId}`);
        try {
            const result = await manualAgentEnrichment(candidateId, session.user.id);
            if (result.success) {
                toast.success("Domain enriched! Credits charged.");
                mutate();
            } else {
                toast.error(result.message || "Failed to enrich domain.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to trigger deep research.");
        } finally {
            setProcessing(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 gap-4">
                <p className="text-red-500">Failed to load candidates</p>
                <Button variant="outline" onClick={() => router.push(`/crm/accounts/lists/${listId}`)}>Back to List</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <LearnLink
                tab="approvals"
                overviewTitle="AI Intelligence Review"
                overviewWhat="The human-in-the-loop stage for vetting AI-generated company and contact candidates before they enter the CRM."
                overviewWhy="Automation is powerful but requires oversight. This page allows you to review confidence scores, detected tech stacks, and social signals to ensure only high-quality data enters your pipeline."
                overviewHow="Examine each candidate card for firmographic fit. Click 'Check' to promote the record to your active list, or 'X' to dismiss it. Promoting a candidate automatically creates the Account and Contact records."
            />
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/crm/accounts/lists/${listId}`)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <Heading title="Approval Center" description="Review AI generated candidates before promoting them to your active list." />
                    </div>
                    <Badge variant="outline" className="px-4 py-2 border-primary/20 bg-primary/5">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        {candidates.length} Pending Approvals
                    </Badge>
                </div>
                <Separator />
            </div>

            <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 pb-8">
                {candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg bg-muted/10">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                        <h3 className="text-xl font-semibold">You're all caught up!</h3>
                        <p className="text-muted-foreground mt-2">No pending candidates requiring approval.</p>
                        <Button className="mt-4" onClick={() => router.push(`/crm/accounts/lists/${listId}`)}>Return to List</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {candidates.map((candidate) => (
                            <Card key={candidate.id} className="border-border/50 bg-card overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
                                <CardHeader className="bg-muted/20 pb-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                                {candidate.companyName || candidate.domain || "Unknown Company"}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4 mt-2">
                                                {candidate.domain && (
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        <a href={`https://${candidate.domain}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                            {candidate.domain}
                                                        </a>
                                                    </span>
                                                )}
                                                {candidate.industry && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {candidate.industry}
                                                    </span>
                                                )}
                                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none rounded-sm">
                                                    Score: {candidate.score}%
                                                </Badge>
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 text-destructive border-destructive/20 hover:bg-destructive/10"
                                                onClick={() => handleReject(candidate.id)}
                                                disabled={!!processing && processing !== candidate.id}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            {(!candidate.contacts || candidate.contacts.length === 0) && (
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-3 border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400 gap-1 dark:text-indigo-400"
                                                    onClick={() => handleDeepSearch(candidate.id)}
                                                    disabled={!!processing}
                                                >
                                                    {processing === `research_${candidate.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    <span className="text-xs font-semibold">Deep Research</span>
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-lg"
                                                onClick={() => handleApprove(candidate.id)}
                                                disabled={!!processing && processing !== candidate.id}
                                            >
                                                {processing === candidate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 flex-1 space-y-6">
                                    {candidate.description && (
                                        <div className="text-sm text-muted-foreground line-clamp-3">
                                            <span className="font-semibold text-foreground mr-2">Overview:</span>
                                            {candidate.description}
                                        </div>
                                    )}

                                    {candidate.techStack && candidate.techStack.length > 0 && (
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Detected Tech Stack</span>
                                            <div className="flex flex-wrap gap-2">
                                                {candidate.techStack.map((tech, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs font-mono bg-muted/30">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            Key Contacts Found
                                        </span>
                                        {candidate.contacts && candidate.contacts.length > 0 ? (
                                            <div className="space-y-3">
                                                {candidate.contacts.map((contact) => (
                                                    <div key={contact.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-muted">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                                                                {contact.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium">{contact.fullName}</div>
                                                                <div className="text-xs text-muted-foreground">{contact.title || "No title found"}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {contact.email ? (
                                                                <div className="text-xs font-mono text-emerald-500 flex items-center gap-1 justify-end">
                                                                    <Mail className="w-3 h-3" />
                                                                    {contact.email}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">No target email</span>
                                                            )}
                                                            <div className="text-[10px] text-muted-foreground uppercase mt-1">
                                                                {contact.confidence}% Confidence
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-md border border-dashed">
                                                No direct contacts identified yet.
                                            </div>
                                        )}
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
