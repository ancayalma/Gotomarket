"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { User, Target, TrendingUp, Sparkles, ArrowRight, Loader2, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Combobox } from "@/components/ui/combobox";
import axios from "axios";
import { useRouter } from "next/navigation";

type Lead = { id: string; firstName?: string; lastName?: string; company?: string };

type Opportunity = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  expected_revenue?: number | null;
  createdAt?: string;
};

export default function LeadOpportunitiesPanel({
  metrics
}: {
  metrics?: {
    totalValue: number;
    countDeals: number;
    avgDealSize: number;
    isClosedView: boolean;
  }
} = {}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    // Fetch accessible leads
    (async () => {
      try {
        const res = await fetch("/api/crm/leads", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLeads(data as Lead[]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedLeadId) return;
    setIsLoading(true);
    (async () => {
      try {
        // Fetch opportunities for this lead
        // Note: Needs a way to filter opportunities by lead on the server
        // For now, we fetch all and filter client-side or use a specialized endpoint if exists
        const res = await fetch("/api/crm/opportunity", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Assuming the full data includes detailed info from the API route update
          setOpportunities((data?.opportunities || []).filter((o: any) => o.lead_id === selectedLeadId));
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedLeadId]);

  async function onCreateOpportunity() {
    if (!selectedLeadId) {
      toast({ title: "Select lead", description: "Choose a lead first" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Missing name", description: "Enter a name for the opportunity" });
      return;
    }
    try {
      setIsSubmitting(true);

      const fullLead = leads.find(l => l.id === selectedLeadId) as any;

      const res = await fetch("/api/crm/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          expected_revenue: expectedRevenue ? Number(expectedRevenue) : 0,
          budget: expectedRevenue ? Number(expectedRevenue) : 0,
          lead: selectedLeadId,
          assigned_to: fullLead?.assigned_to || undefined,
          account: fullLead?.accountsIDs?.[0] || undefined,
          type: "New Business", // Default type
          sales_stage: "Qualification", // Default stage
          close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      toast({ title: "Opportunity created", description: j?.newOpportunity?.name });
      setName("");
      setDescription("");
      setExpectedRevenue("");

      // Refresh list
      const res2 = await fetch("/api/crm/opportunity", { cache: "no-store" });
      const j2 = await res2.json();
      setOpportunities((j2?.opportunities || []).filter((o: any) => o.lead_id === selectedLeadId));

      router.refresh(); // Refresh the main CRM OpportunitiesTable server components
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to create opportunity" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className={`grid grid-cols-1 ${metrics ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-4`}>
        <div className="flex flex-col gap-4 items-start bg-gradient-to-br from-background via-background shadow-[0_8px_30px_rgb(0,0,0,0.04)] to-primary/[0.03] p-4 rounded-xl border border-white/5 h-full justify-center">
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-primary mr-1" /> Target Lead Profile
              </label>
              <Combobox
                options={leads.map(l => {
                  const fName = (l.firstName || '').replace(/Direct\s+/gi, '').trim();
                  return {
                    label: `${fName} ${l.lastName || ''} ${l.company ? `(${l.company})` : ''}`.trim(),
                    value: l.id
                  };
                })}
                value={selectedLeadId}
                onChange={setSelectedLeadId}
                placeholder="Select target lead to convert..."
                className="w-full bg-background border-white/10 hover:border-primary/50 transition-colors h-12 shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {metrics && (
          <>
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 flex flex-col justify-center">
              <div className="p-4 sm:p-5">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  {metrics.isClosedView ? "Total Closed Value" : "Total Pipeline Value"}
                </div>
                <div className="text-3xl font-bold text-primary">
                  ${Math.round(metrics.totalValue).toLocaleString()}
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20 flex flex-col justify-center">
              <div className="p-4 sm:p-5">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  {metrics.isClosedView ? "Closed Opportunities" : "Active Opportunities"}
                </div>
                <div className="text-3xl font-bold text-blue-500">
                  {metrics.countDeals}
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20 flex flex-col justify-center">
              <div className="p-4 sm:p-5">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Avg. Deal Size
                </div>
                <div className="text-3xl font-bold text-emerald-500">
                  ${Math.round(metrics.avgDealSize).toLocaleString()}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          <Card className="p-6 border-white/5 bg-gradient-to-br from-background via-background shadow-[0_8px_30px_rgb(0,0,0,0.04)] to-primary/[0.03] overflow-hidden relative h-full backdrop-blur-md">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center space-x-3 mb-6 relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner border border-primary/20">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-wide">Quick Opportunity Convert</h3>
                <p className="text-[11px] text-muted-foreground">Instantly draft a deal linked to the active lead</p>
              </div>
            </div>

            <div className="space-y-5 relative">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Deal Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q3 Enterprise Subscription Renewal"
                  className="bg-background/40 border-white/10 focus:border-primary/50 h-11 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Expected Revenue</label>
                <div className="relative group">
                  <div className="absolute left-0 inset-y-0 flex items-center justify-center w-11 bg-primary/5 border-r border-white/5 rounded-l-md text-muted-foreground">
                    <DollarSign className="h-4 w-4 text-primary group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    type="number"
                    value={expectedRevenue}
                    onChange={(e) => setExpectedRevenue(e.target.value)}
                    placeholder="25000"
                    className="pl-14 bg-background/40 border-white/10 focus:border-primary/50 h-11 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Strategic Notes (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key drivers, urgency, constraints..."
                  className="bg-background/40 border-white/10 focus:border-primary/50 h-11 transition-all"
                />
              </div>

              <Button
                disabled={isSubmitting || !selectedLeadId}
                onClick={onCreateOpportunity}
                className="w-full h-12 mt-2 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg shadow-primary/25 border-0 text-white font-medium group transition-all"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning Deal...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Convert to Opportunity <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          <Card className="p-6 border-white/5 bg-gradient-to-bl from-background via-background shadow-[0_8px_30px_rgb(0,0,0,0.04)] to-blue-500/[0.03] overflow-hidden relative h-full backdrop-blur-md flex flex-col">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 shadow-inner border border-blue-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-wide">Linked Pipeline</h3>
                  <p className="text-[11px] text-muted-foreground">Opportunities connected to this lead</p>
                </div>
              </div>
              {opportunities.length > 0 && (
                <div className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-inner flex items-center space-x-1">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  {opportunities.length} ACTIVE
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px] relative z-10">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-60">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Fetching pipeline...</p>
                </div>
              ) : (!selectedLeadId || opportunities.length === 0) ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3"
                >
                  <div className="p-4 rounded-full bg-muted/10 border border-white/5">
                    <User className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/80">
                      {!selectedLeadId ? "Awaiting Selection" : "No Active Pipeline"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 italic mt-1 max-w-[200px] mx-auto leading-relaxed">
                      {!selectedLeadId ? "Select a lead from the target profile dropdown above to view linked deals." : "Use the builder to convert this lead into a tangible revenue opportunity."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
                  <AnimatePresence>
                    {opportunities.map((o) => (
                      <motion.div
                        key={o.id}
                        variants={itemVariants}
                        layout
                        className="p-4 rounded-xl border border-white/5 bg-background shadow-sm hover:shadow-md hover:border-primary/20 hover:bg-primary/[0.02] transition-all group cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold group-hover:text-primary transition-colors pr-4">{o.name}</div>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-[9px] uppercase font-bold text-foreground/70 tracking-tighter bg-foreground/5 px-2 py-0.5 rounded-full border border-white/5 flex items-center space-x-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                <span>{o.status}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground/50">
                                Created {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'recently'}
                              </span>
                            </div>
                          </div>
                          {typeof o.expected_revenue === "number" && (
                            <div className="text-sm font-black text-emerald-500/90 whitespace-nowrap bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10 shadow-inner">
                              ${o.expected_revenue.toLocaleString()}
                            </div>
                          )}
                        </div>
                        {o.description && (
                          <div className="mt-3 text-xs text-muted-foreground/70 leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-white/5 line-clamp-2">
                            {o.description}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
