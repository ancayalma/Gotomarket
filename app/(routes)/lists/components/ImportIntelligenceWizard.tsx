"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp, CheckCircle2, AlertCircle, Loader2, Users, Building2,
  AlertTriangle, ArrowRight, ArrowLeft, Plus, Layers, FileText,
  X, Database, ArrowUpRight, Sparkles, Link2, Shield, Zap,
  UserCircle, Globe, Brain, TrendingUp, BarChart3, Lightbulb,
  RefreshCcw, Eye, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type PoolSummary = { id: string; name: string; description?: string };

type DetectedMapping = {
  csvHeader: string;
  crmField: string | null;
  crmFieldLabel: string | null;
  fieldGroup: "account" | "contact" | null;
  confidence: number;
  sampleValues: string[];
};

type CrmFieldDef = { key: string; label: string; required?: boolean };

type ScanResponse = {
  headers: string[];
  mappings: DetectedMapping[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  crmFields: { account: CrmFieldDef[]; contact: CrmFieldDef[] };
};

type AiInsight = { type: "success" | "warning" | "critical" | "suggestion"; title: string; detail: string };

type AiAnalysis = {
  dataQualityScore: number;
  dataQualityGrade: string;
  summary: string;
  insights: AiInsight[];
  mappingSuggestions: { csvHeader: string; suggestedField: string; reason: string }[];
  enrichmentOpportunities: string[];
};

type PreviewStats = {
  totalRows: number;
  validCandidates: number;
  validContacts: number;
  corruptRows: number;
  duplicates: { candidate: number; contact: number };
  creates: { candidate: number; contact: number };
  updates: { candidate: number; contact: number };
};

type PreviewResponse = {
  poolId: string | null;
  poolName?: string;
  poolMode: "new" | "existing";
  mapping?: { usedColumns?: string[]; unmappedColumns?: string[] };
  stats: PreviewStats;
  creates: { candidates: any[]; contacts: any[] };
  updates: { candidates: any[]; contacts: any[] };
  corruptRows: { index: number; errors: string[] }[];
  preview?: any[];
  fullPreview?: any[];
};

type CommitResponse = {
  created: { candidates: number; contacts: number };
  updated: { candidates: number; contacts: number };
};

type WizardStep = "source" | "cartography" | "briefing" | "syndication";

type Props = { pools: PoolSummary[]; onCommitted?: () => void };

// ─── Helpers ────────────────────────────────────────────────────────────────

const insightIcon = (type: AiInsight["type"]) => {
  switch (type) {
    case "success": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case "warning": return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    case "critical": return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    case "suggestion": return <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />;
  }
};

const insightBorder = (type: AiInsight["type"]) => {
  switch (type) {
    case "success": return "border-emerald-500/20 bg-emerald-500/5";
    case "warning": return "border-amber-500/20 bg-amber-500/5";
    case "critical": return "border-red-500/20 bg-red-500/5";
    case "suggestion": return "border-indigo-500/20 bg-indigo-500/5";
  }
};

const confidenceColor = (c: number) => {
  if (c >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (c >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
};

const gradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "from-emerald-400 to-teal-300";
  if (grade.startsWith("B")) return "from-blue-400 to-indigo-300";
  if (grade.startsWith("C")) return "from-amber-400 to-yellow-300";
  return "from-red-400 to-rose-300";
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImportIntelligenceWizard({ pools, onCommitted }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("source");

  // Step 1: Source
  const [poolId, setPoolId] = useState<string>(pools[0]?.id ?? "");
  const [createNewPool, setCreateNewPool] = useState<boolean>(true);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolDescription, setNewPoolDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Cartography
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [mappings, setMappings] = useState<DetectedMapping[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);

  // Step 3: Briefing
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  // Step 4: Syndication
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [commitProgress, setCommitProgress] = useState<string | null>(null);

  // Shared
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const accountMappings = useMemo(() => mappings.filter(m => m.fieldGroup === "account"), [mappings]);
  const contactMappings = useMemo(() => mappings.filter(m => m.fieldGroup === "contact"), [mappings]);
  const unmappedColumns = useMemo(() => mappings.filter(m => !m.crmField), [mappings]);
  const mappedCount = useMemo(() => mappings.filter(m => m.crmField).length, [mappings]);

  const allCrmOptions = useMemo(() => {
    if (!scanData) return [];
    return [
      { group: "Account Fields", options: scanData.crmFields.account },
      { group: "Contact Fields", options: scanData.crmFields.contact },
    ];
  }, [scanData]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setScanData(null);
    setMappings([]);
    setPreview(null);
    setCommitResult(null);
    setAiAnalysis(null);
    setError(null);
  };

  const scanAndAnalyze = useCallback(async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Scan the file
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/crm/leads/pools/import/scan", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ScanResponse;
      setScanData(data);
      setMappings(data.mappings);
      setStep("cartography");

      // 2. Run AI analysis in background (non-blocking)
      setAiLoading(true);
      fetch("/api/crm/leads/pools/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: data.headers,
          sampleRows: data.sampleRows,
          mappings: data.mappings,
          totalRows: data.totalRows,
        }),
      })
        .then(r => r.json())
        .then((analysis: AiAnalysis) => {
          setAiAnalysis(analysis);
          // Auto-apply AI mapping suggestions for unmapped columns
          if (analysis.mappingSuggestions?.length) {
            setMappings(prev => {
              const updated = [...prev];
              for (const suggestion of analysis.mappingSuggestions) {
                const idx = updated.findIndex(m => m.csvHeader === suggestion.csvHeader && !m.crmField);
                if (idx >= 0) {
                  const allFields = [...(data.crmFields.account || []), ...(data.crmFields.contact || [])];
                  const field = allFields.find(f => f.key === suggestion.suggestedField);
                  const group = data.crmFields.account.some(f => f.key === suggestion.suggestedField) ? "account" as const :
                    data.crmFields.contact.some(f => f.key === suggestion.suggestedField) ? "contact" as const : null;
                  if (field) {
                    updated[idx] = {
                      ...updated[idx],
                      crmField: suggestion.suggestedField,
                      crmFieldLabel: field.label,
                      fieldGroup: group,
                      confidence: 70,
                    };
                  }
                }
              }
              return updated;
            });
          }
        })
        .catch(() => { /* AI analysis is optional */ })
        .finally(() => setAiLoading(false));

    } catch (e: any) {
      setError(e?.message || "Failed to scan file");
    } finally {
      setSubmitting(false);
    }
  }, [file]);

  const updateMapping = (csvHeader: string, newCrmField: string | null) => {
    setMappings(prev => prev.map(m => {
      if (m.csvHeader !== csvHeader) return m;
      if (!newCrmField) return { ...m, crmField: null, crmFieldLabel: null, fieldGroup: null, confidence: 0 };
      const allFields = [...(scanData?.crmFields.account || []), ...(scanData?.crmFields.contact || [])];
      const field = allFields.find(f => f.key === newCrmField);
      const group = scanData?.crmFields.account.some(f => f.key === newCrmField) ? "account" as const :
        scanData?.crmFields.contact.some(f => f.key === newCrmField) ? "contact" as const : null;
      return { ...m, crmField: newCrmField, crmFieldLabel: field?.label || newCrmField, fieldGroup: group, confidence: 100 };
    }));
  };

  const runPreview = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const columnMap: Record<string, string> = {};
      mappings.forEach(m => { if (m.crmField) columnMap[m.csvHeader] = m.crmField; });
      const form = new FormData();
      form.append("file", file);
      form.append("columnMap", JSON.stringify(columnMap));
      if (createNewPool) {
        form.append("newPoolName", newPoolName);
        if (newPoolDescription.trim()) form.append("newPoolDescription", newPoolDescription);
      } else {
        form.append("poolId", poolId);
      }
      const res = await fetch("/api/crm/leads/pools/import/preview", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setPreview((await res.json()) as PreviewResponse);
      setStep("briefing");
    } catch (e: any) {
      setError(e?.message || "Failed to preview import");
    } finally {
      setSubmitting(false);
    }
  };

  const commitImport = async () => {
    if (!preview) return;
    setSubmitting(true);
    setError(null);

    const totalRecords = (preview.stats.creates.candidate + preview.stats.creates.contact +
      preview.stats.updates.candidate + preview.stats.updates.contact) || 1;

    // Animate a realistic progress counter while the backend does sequential DB writes
    let progressCount = 0;
    setCommitProgress(`Writing records... 0 / ${totalRecords}`);
    const progressInterval = setInterval(() => {
      progressCount = Math.min(progressCount + Math.ceil(totalRecords * 0.03), totalRecords - 1);
      setCommitProgress(`Writing records... ${progressCount} / ${totalRecords}`);
    }, 400);

    try {
      const res = await fetch("/api/crm/leads/pools/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: preview.poolId ?? undefined,
          poolName: preview.poolMode === "new" ? (preview.poolName || newPoolName) : undefined,
          poolDescription: preview.poolMode === "new" ? (newPoolDescription || undefined) : undefined,
          creates: preview.creates,
          updates: preview.updates,
        }),
      });
      clearInterval(progressInterval);
      if (!res.ok) throw new Error(await res.text());
      setCommitResult((await res.json()) as CommitResponse);
      setCommitProgress(null);
      setStep("syndication");
      if (onCommitted) onCommitted();
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e?.message || "Failed to commit import");
      setCommitProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null); setScanData(null); setMappings([]); setPreview(null);
    setCommitResult(null); setError(null); setAiAnalysis(null);
    setAiLoading(false); setCommitProgress(null); setStep("source");
    setShowEnrichment(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDialog = () => { setOpen(false); setTimeout(reset, 300); };

  // ─── Step Indicator ───────────────────────────────────────────────────────

  const STEPS: { key: WizardStep; label: string; icon: any; num: number }[] = [
    { key: "source", label: "Source Intelligence", icon: Database, num: 1 },
    { key: "cartography", label: "Schema Cartography", icon: Link2, num: 2 },
    { key: "briefing", label: "Intelligence Briefing", icon: Shield, num: 3 },
    { key: "syndication", label: "Pipeline Syndication", icon: Zap, num: 4 },
  ];

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const isActive = i === stepIndex;
        const isComplete = i < stepIndex;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2",
                isActive && "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/20 scale-110",
                isComplete && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
                !isActive && !isComplete && "bg-zinc-900 border-zinc-700 text-zinc-600"
              )}>
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-[0.15em] whitespace-nowrap",
                isActive && "text-indigo-400",
                isComplete && "text-emerald-500/60",
                !isActive && !isComplete && "text-zinc-700"
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "w-12 md:w-20 h-0.5 mx-1 mb-5 rounded-full transition-colors duration-500",
                isComplete ? "bg-gradient-to-r from-emerald-500/50 to-emerald-500/20" : "bg-zinc-800"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Source Intelligence ─────────────────────────────────────────

  const renderSource = () => (
    <motion.div key="step-source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-1">Source Intelligence</h3>
        <p className="text-zinc-500 text-sm">Configure your target destination and upload source data. AI will auto-detect your schema.</p>
      </div>

      {/* Destination Config */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Plus className={cn("w-4 h-4 transition-colors", createNewPool ? "text-indigo-400" : "text-zinc-600")} />
            <label htmlFor="createNewPoolWiz" className="text-sm font-medium text-zinc-300 cursor-pointer">Create a new list</label>
          </div>
          <Switch id="createNewPoolWiz" checked={createNewPool} onCheckedChange={setCreateNewPool} className="data-[state=checked]:bg-indigo-600" />
        </div>

        <AnimatePresence mode="wait">
          {createNewPool ? (
            <motion.div key="new" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1.5 block">List Name *</label>
                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors placeholder:text-zinc-700" placeholder="e.g. Q1 SaaS Growth Targets" value={newPoolName} onChange={(e) => setNewPoolName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1.5 block">Description</label>
                <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors resize-none h-16 placeholder:text-zinc-700" placeholder="Internal context for your team..." value={newPoolDescription} onChange={(e) => setNewPoolDescription(e.target.value)} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="existing" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors appearance-none cursor-pointer" value={poolId} onChange={(e) => setPoolId(e.target.value)}>
                <option value="" disabled>Select target list...</option>
                {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {pools.length === 0 && (
                <p className="text-[10px] text-amber-500/80 mt-2 flex items-center gap-1 italic"><AlertTriangle className="w-3 h-3" /> No existing lists found.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File Upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-10 cursor-pointer overflow-hidden",
          file ? "bg-emerald-500/5 border-emerald-500/30" : "bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900/80"
        )}
      >
        <input type="file" ref={fileInputRef} accept=".csv,.xlsx" className="hidden" onChange={onFileChange} />
        {file ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-bold">{file.name}</p>
            <p className="text-zinc-600 text-xs font-medium">{(file.size / 1024).toFixed(1)} KB · Ready for AI scan</p>
            <Button variant="ghost" size="sm" className="text-[10px] text-zinc-500 h-6 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Replace</Button>
          </motion.div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileText className="w-12 h-12 text-zinc-600 mb-3 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" />
            <p className="text-zinc-400 font-medium text-center">Drop your <span className="text-white font-bold">CSV</span> or <span className="text-white font-bold">Excel</span> file here</p>
            <p className="text-zinc-600 text-xs mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={scanAndAnalyze}
          disabled={submitting || !file || (createNewPool ? !newPoolName.trim() : !poolId)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold shadow-xl shadow-indigo-600/20 group disabled:opacity-50"
        >
          {submitting ? (
            <div className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" />Scanning with AI...</div>
          ) : (
            <div className="flex items-center gap-2"><Brain className="w-4 h-4" />Scan & Analyze<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></div>
          )}
        </Button>
      </div>
    </motion.div>
  );

  // ─── Step 2: Schema Cartography ─────────────────────────────────────────

  const renderCartography = () => (
    <motion.div key="step-cartography" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
      <div className="text-center mb-3">
        <h3 className="text-xl font-bold text-white mb-1">Schema Cartography</h3>
        <p className="text-zinc-500 text-sm">
          <span className="text-indigo-400 font-bold">{scanData?.totalRows || 0}</span> rows detected · <span className="text-emerald-400 font-bold">{mappedCount}</span> of <span className="text-white font-bold">{mappings.length}</span> columns mapped
        </p>
      </div>

      {/* AI Analysis Panel */}
      {(aiLoading || aiAnalysis) && (
        <div className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className={cn("w-4 h-4 text-indigo-400", aiLoading && "animate-pulse")} />
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">AI Intelligence Report</span>
            {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 ml-auto" />}
          </div>

          {aiLoading && !aiAnalysis && (
            <div className="space-y-2">
              <div className="h-3 bg-indigo-500/10 rounded-full animate-pulse w-3/4" />
              <div className="h-3 bg-indigo-500/10 rounded-full animate-pulse w-1/2" />
            </div>
          )}

          {aiAnalysis && (
            <>
              {/* Quality Score + Summary */}
              <div className="flex items-start gap-4">
                <div className="text-center shrink-0">
                  <div className={cn("text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br", gradeColor(aiAnalysis.dataQualityGrade))}>
                    {aiAnalysis.dataQualityGrade}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold">{aiAnalysis.dataQualityScore}/100</div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{aiAnalysis.summary}</p>
              </div>

              {/* Insights */}
              {aiAnalysis.insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiAnalysis.insights.slice(0, 4).map((insight, i) => (
                    <div key={i} className={cn("p-2.5 rounded-xl border flex items-start gap-2", insightBorder(insight.type))}>
                      {insightIcon(insight.type)}
                      <div>
                        <p className="text-[10px] font-bold text-zinc-300">{insight.title}</p>
                        <p className="text-[10px] text-zinc-500 leading-snug">{insight.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enrichment Opportunities */}
              {aiAnalysis.enrichmentOpportunities.length > 0 && (
                <div>
                  <button onClick={() => setShowEnrichment(!showEnrichment)} className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors">
                    <TrendingUp className="w-3 h-3" />
                    {aiAnalysis.enrichmentOpportunities.length} Enrichment Opportunities
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showEnrichment && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {showEnrichment && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 flex flex-wrap gap-1.5 overflow-hidden">
                        {aiAnalysis.enrichmentOpportunities.map((opp, i) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{opp}</span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 text-center">
          <Building2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-emerald-400">{accountMappings.length}</p>
          <p className="text-[9px] uppercase tracking-widest text-emerald-500/60 font-bold">Account</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 text-center">
          <UserCircle className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-blue-400">{contactMappings.length}</p>
          <p className="text-[9px] uppercase tracking-widest text-blue-500/60 font-bold">Contact</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-3 text-center">
          <X className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-zinc-400">{unmappedColumns.length}</p>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Unmapped</p>
        </div>
      </div>

      {contactMappings.length === 0 && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-xs font-bold">Account-Only Import</p>
            <p className="text-amber-500/70 text-[10px]">No contact fields detected. This will create organization records only.</p>
          </div>
        </div>
      )}

      {/* Mapping Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30">
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left font-bold text-zinc-400 w-[28%]">CSV Column</th>
                <th className="p-3 text-left font-bold text-zinc-400 w-[25%]">Mapped To</th>
                <th className="p-3 text-left font-bold text-zinc-400 w-[10%]">Type</th>
                <th className="p-3 text-left font-bold text-zinc-400 w-[12%]">Confidence</th>
                <th className="p-3 text-left font-bold text-zinc-400 w-[25%]">Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {mappings.map((m) => (
                <tr key={m.csvHeader} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-3">
                    <span className="font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">{m.csvHeader}</span>
                  </td>
                  <td className="p-3">
                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-300 text-[11px] focus:ring-1 focus:ring-indigo-500/30 outline-none cursor-pointer" value={m.crmField || ""} onChange={(e) => updateMapping(m.csvHeader, e.target.value || null)}>
                      <option value="">— Skip —</option>
                      {allCrmOptions.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.options.map(f => <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    {m.fieldGroup === "account" && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Org</span>}
                    {m.fieldGroup === "contact" && <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Human</span>}
                    {!m.fieldGroup && <span className="text-[9px] text-zinc-600">—</span>}
                  </td>
                  <td className="p-3">
                    {m.crmField ? <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", confidenceColor(m.confidence))}>{m.confidence}%</span> : <span className="text-zinc-700 text-[9px]">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {m.sampleValues.slice(0, 2).map((v, i) => (
                        <span key={i} className="text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 truncate max-w-[100px]">{v}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => setStep("source")} className="text-zinc-500 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Button onClick={runPreview} disabled={submitting || mappedCount === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold shadow-xl shadow-indigo-600/20 group disabled:opacity-50">
          {submitting ? (
            <div className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" />Processing...</div>
          ) : (
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" />Process & Review<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></div>
          )}
        </Button>
      </div>
    </motion.div>
  );

  // ─── Step 3: Intelligence Briefing ──────────────────────────────────────

  const renderBriefing = () => (
    <motion.div key="step-briefing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
      <div className="text-center mb-3">
        <h3 className="text-xl font-bold text-white mb-1">Intelligence Briefing</h3>
        <p className="text-zinc-500 text-sm">Review processed data before committing to your pipeline.</p>
      </div>

      {preview && (
        <>
          {/* Bento Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-1 hover:border-indigo-500/30 transition-colors">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">Total Rows</p>
              <p className="text-3xl font-extrabold text-white leading-none">{preview.stats.totalRows}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-1 hover:border-emerald-500/30 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 mb-1" />
              <p className="text-3xl font-extrabold text-emerald-400 leading-none">{preview.stats.validCandidates}</p>
              <p className="text-[9px] text-zinc-600 font-bold">Organizations</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-1 hover:border-blue-500/30 transition-colors">
              <Users className="w-3.5 h-3.5 text-blue-400 mb-1" />
              <p className="text-3xl font-extrabold text-blue-400 leading-none">{preview.stats.validContacts}</p>
              <p className="text-[9px] text-zinc-600 font-bold">Contacts</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-1 hover:border-amber-500/30 transition-colors">
              <p className="text-3xl font-extrabold text-amber-500 leading-none">{preview.stats.corruptRows}</p>
              <p className="text-[9px] text-zinc-600 font-bold">Anomalies</p>
            </div>
          </div>

          {/* AI Quality Badge */}
          {aiAnalysis && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-zinc-400">AI Quality Score:</span>
              <span className={cn("text-lg font-black bg-clip-text text-transparent bg-gradient-to-br", gradeColor(aiAnalysis.dataQualityGrade))}>{aiAnalysis.dataQualityGrade}</span>
              <span className="text-[10px] text-zinc-600">({aiAnalysis.dataQualityScore}/100)</span>
            </div>
          )}

          {/* Creates / Updates */}
          <div className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-tighter block mb-0.5">New Records</span>
              <div className="flex gap-3">
                <span className="text-xs text-zinc-400"><span className="text-emerald-400 font-bold">+{preview.stats.creates.candidate}</span> Accounts</span>
                <span className="text-xs text-zinc-400"><span className="text-blue-400 font-bold">+{preview.stats.creates.contact}</span> Contacts</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-tighter block mb-0.5">Updates</span>
              <div className="flex gap-3">
                <span className="text-xs text-zinc-400"><span className="text-amber-400 font-bold">{preview.stats.updates.candidate}</span> Accounts</span>
                <span className="text-xs text-zinc-400"><span className="text-amber-400 font-bold">{preview.stats.updates.contact}</span> Contacts</span>
              </div>
            </div>
          </div>

          {/* Sample Preview */}
          {preview.preview && preview.preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">Sample Preview</p>
              <div className="border border-zinc-800 rounded-2xl overflow-hidden text-xs bg-zinc-900/30">
                <table className="w-full">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 text-left font-bold text-zinc-400">Account</th>
                      <th className="p-3 text-left font-bold text-zinc-400">Contact</th>
                      <th className="p-3 text-left font-bold text-zinc-400">Email</th>
                      <th className="p-3 text-left font-bold text-zinc-400">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {preview.preview.slice(0, 5).map((r: any, i: number) => {
                      const accName = r.account?.companyName || r.account?.name || "—";
                      const contacts = r.contacts || [];
                      const firstContact = contacts[0] || {};
                      return (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3 text-zinc-300 font-medium">{accName}</td>
                          <td className="p-3 text-zinc-400">{firstContact.fullName || "—"}</td>
                          <td className="p-3 text-zinc-400 truncate max-w-[140px]">{firstContact.email || "—"}</td>
                          <td className="p-3 text-zinc-500 font-mono text-[10px]">{firstContact.phone || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => setStep("cartography")} disabled={submitting} className="text-zinc-500 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" /> Adjust Mapping</Button>
        <Button onClick={commitImport} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-12 rounded-xl font-bold shadow-xl shadow-emerald-600/20 group disabled:opacity-50">
          {submitting ? (
            <div className="flex items-center gap-3"><Loader2 className="w-4 h-4 animate-spin" />{commitProgress || "Committing..."}</div>
          ) : (
            <div className="flex items-center gap-2">Commit to Pipeline<ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></div>
          )}
        </Button>
      </div>
    </motion.div>
  );

  // ─── Step 4: Pipeline Syndication (Success) ─────────────────────────────

  const renderSyndication = () => (
    <motion.div key="step-syndication" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 space-y-8 text-center">
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="relative z-10 w-24 h-24 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">Pipeline Syndicated</h3>
        <p className="text-zinc-500 max-w-md mx-auto">Your intelligence dataset has been committed and is ready for outreach.</p>
      </div>

      {commitResult && (
        <div className="flex justify-center gap-8 max-w-sm mx-auto">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{commitResult.created.candidates + commitResult.created.contacts}</p>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Created</p>
          </div>
          <div className="w-px h-8 bg-zinc-800 self-center" />
          <div className="text-center">
            <p className="text-2xl font-black text-white">{commitResult.updated.candidates + commitResult.updated.contacts}</p>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Enriched</p>
          </div>
        </div>
      )}

      {aiAnalysis && (
        <div className="max-w-sm mx-auto p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">AI Recommendation</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {aiAnalysis.enrichmentOpportunities.length > 0
              ? `Next step: ${aiAnalysis.enrichmentOpportunities[0]}. Consider running the LeadGen Wizard to enrich these records further.`
              : "Your data is ready. Consider launching an outreach campaign from the list view."
            }
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-4">
        <Button variant="outline" onClick={reset} className="border-zinc-800 text-zinc-400 hover:text-white rounded-xl h-12 px-8">Start Another Import</Button>
        <Button onClick={closeDialog} className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl h-12 px-10 font-black">FINISH</Button>
      </div>
    </motion.div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 group transition-all duration-300 transform hover:scale-[1.02]">
          <Brain className="w-4 h-4 mr-2 group-hover:animate-pulse" />
          Import Intelligence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-zinc-950/95 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden p-0 gap-0 rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

        <div className="p-8 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  Import Intelligence
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm mt-0.5">AI-powered schema detection, quality analysis, and pipeline syndication.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {step !== "syndication" && renderStepIndicator()}

          <AnimatePresence mode="wait">
            {step === "source" && renderSource()}
            {step === "cartography" && renderCartography()}
            {step === "briefing" && renderBriefing()}
            {step === "syndication" && renderSyndication()}
          </AnimatePresence>
        </div>

        <div className="bg-zinc-900/40 p-3 flex justify-center border-t border-zinc-800/50">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] flex items-center gap-2 italic">
            <Brain className="w-3 h-3" /> Basalt CRM Intelligence Core v4.0
            <span className="w-1 h-3 bg-zinc-800" />
            AI: <span className="text-indigo-500/60">Active</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
