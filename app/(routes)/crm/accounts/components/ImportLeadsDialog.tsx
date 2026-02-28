"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Building2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Layers,
  FileText,
  RefreshCcw,
  X,
  ChevronRight,
  Database,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type PoolSummary = {
  id: string;
  name: string;
  description?: string;
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

type CandidatePreview = {
  dedupeKey: string;
  domain?: string;
  companyName?: string;
  homepageUrl?: string;
  description?: string;
  industry?: string;
  techStack?: string[];
  existingId?: string | null;
  changes?: Record<string, { from: any; to: any }>;
};

type ContactPreview = {
  dedupeKey: string;
  candidateKey?: string;
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  existingId?: string | null;
  changes?: Record<string, { from: any; to: any }>;
};

type PreviewResponse = {
  poolId: string | null;
  poolName?: string;
  poolMode: "new" | "existing";
  mapping?: {
    usedColumns?: string[];
    unmappedColumns?: string[];
  };
  stats: PreviewStats;
  creates: { candidates: CandidatePreview[]; contacts: ContactPreview[] };
  updates: { candidates: CandidatePreview[]; contacts: ContactPreview[] };
  corruptRows: { index: number; errors: string[] }[];
};

type CommitResponse = {
  created: { candidates: number; contacts: number };
  updated: { candidates: number; contacts: number };
};

type Props = {
  pools: PoolSummary[];
  onCommitted?: () => void;
};

export default function ImportLeadsDialog({ pools, onCommitted }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [poolId, setPoolId] = useState<string>(pools[0]?.id ?? "");
  const [createNewPool, setCreateNewPool] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>("");
  const [newPoolDescription, setNewPoolDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setCommitResult(null);
    setError(null);
  };

  const startPreview = async () => {
    if (!file) {
      setError("Please select a CSV or XLSX file.");
      return;
    }
    if (createNewPool) {
      if (!newPoolName.trim()) {
        setError("Please enter a name for the new List.");
        return;
      }
    } else {
      if (!poolId) {
        setError("Please select a target List.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    setPreview(null);
    setCommitResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (createNewPool) {
        form.append("newPoolName", newPoolName);
        if (newPoolDescription.trim()) form.append("newPoolDescription", newPoolDescription);
      } else {
        form.append("poolId", poolId);
      }

      const res = await fetch("/api/crm/leads/pools/import/preview", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to preview import");
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
    } catch (e: any) {
      setError(e?.message || "Failed to preview import");
    } finally {
      setSubmitting(false);
    }
  };

  const commitImport = async () => {
    if (!preview) {
      setError("No preview data to commit.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setCommitResult(null);

    try {
      const res = await fetch("/api/crm/leads/pools/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: preview.poolId ?? undefined,
          newPool: preview.poolMode === "new" ? { name: preview.poolName || newPoolName, description: newPoolDescription || undefined } : undefined,
          creates: preview.creates,
          updates: preview.updates,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to commit import");
      }
      const data = (await res.json()) as CommitResponse;
      setCommitResult(data);
      if (onCommitted) onCommitted();
    } catch (e: any) {
      setError(e?.message || "Failed to commit import");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCommitResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDialog = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 group transition-[color,background-color,border-color,transform] duration-300 transform hover:scale-[1.02]">
          <FileUp className="w-4 h-4 mr-2 group-hover:animate-bounce" />
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-zinc-950/95 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden p-0 gap-0 rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  Import Intelligence
                </DialogTitle>
                <p className="text-zinc-500 text-sm mt-1">Transform your lists into actionable pipeline with AI-powered normalization.</p>
              </div>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!preview && !commitResult && (
              <motion.div
                key="step-upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Step 1: Destination */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/10">1</span>
                      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Destination List</h3>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4 transition-colors hover:border-zinc-700 group">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                          <Plus className={cn("w-4 h-4 transition-colors", createNewPool ? "text-indigo-400" : "text-zinc-600")} />
                          <label htmlFor="createNewPool" className="text-sm font-medium text-zinc-300 cursor-pointer">Create a new list</label>
                        </div>
                        <Switch
                          id="createNewPool"
                          checked={createNewPool}
                          onCheckedChange={setCreateNewPool}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {!createNewPool ? (
                          <motion.div
                            key="existing-pool"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <select
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors appearance-none cursor-pointer"
                              value={poolId}
                              onChange={(e) => setPoolId(e.target.value)}
                            >
                              <option value="" disabled>Select target list...</option>
                              {pools.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {pools.length === 0 && (
                              <p className="text-[10px] text-amber-500/80 mt-2 flex items-center gap-1 italic">
                                <AlertTriangle className="w-3 h-3" /> No existing lists found.
                              </p>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div
                            key="new-pool"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <input
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors"
                              placeholder="List name (e.g. Q1 Global Growth)"
                              value={newPoolName}
                              onChange={(e) => setNewPoolName(e.target.value)}
                            />
                            <textarea
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-colors resize-none h-20"
                              placeholder="Description (optional context for your team)"
                              value={newPoolDescription}
                              onChange={(e) => setNewPoolDescription(e.target.value)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Step 2: Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/10">2</span>
                      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Source Data</h3>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "group relative aspect-video rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden",
                        file
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900/80"
                      )}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.xlsx"
                        className="hidden"
                        onChange={onFileChange}
                      />

                      {file ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-center space-y-3"
                        >
                          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-emerald-400 font-bold text-lg leading-none mb-1">{file.name}</p>
                            <p className="text-emerald-500/50 text-xs font-medium">Ready for intelligence scan</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] text-zinc-500 h-6 hover:text-red-400 hover:bg-red-500/5"
                            onClick={(e) => { e.stopPropagation(); reset(); }}
                          >
                            Discard & Change
                          </Button>
                        </motion.div>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <FileText className="w-12 h-12 text-zinc-600 mb-4 group-hover:text-indigo-400 group-hover:scale-110 transition-[color,background-color,border-color,transform] duration-300" />
                          <p className="text-zinc-400 font-medium text-center">
                            Drop your <span className="text-white">CSV</span> or <span className="text-white">Excel</span> here
                          </p>
                          <p className="text-zinc-600 text-xs mt-2 uppercase tracking-tighter">Auto-detection active</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <RefreshCcw className="w-3 h-3" /> Auto-Normalize
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <Building2 className="w-3 h-3" /> Deduplication
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={closeDialog}
                      disabled={submitting}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={startPreview}
                      disabled={submitting || !file || (!createNewPool && !poolId) || (createNewPool && !newPoolName)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold shadow-xl shadow-indigo-600/20 group relative overflow-hidden disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing Dataset...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Analyze & Preview
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </motion.div>
            )}

            {preview && !commitResult && (
              <motion.div
                key="step-preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Bento Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1 group hover:border-indigo-500/30 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Universe Total</p>
                    <p className="text-4xl font-extrabold text-white leading-none">{preview.stats.totalRows}</p>
                    <p className="text-[10px] text-zinc-600 italic">Raw lines detected</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div className="absolute top-2 right-2 p-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Building2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-black italic">Companies</p>
                    <p className="text-4xl font-extrabold text-emerald-400 leading-none">{preview.stats.validCandidates}</p>
                    <p className="text-[10px] text-zinc-600 font-medium">Valid organizations</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-2 right-2 p-2 bg-blue-500/10 rounded-full border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Users className="w-3 h-3 text-blue-400" />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-blue-500/70 font-black italic">Contacts</p>
                    <p className="text-4xl font-extrabold text-blue-400 leading-none">{preview.stats.validContacts}</p>
                    <p className="text-[10px] text-zinc-600 font-medium">Named decision makers</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-1 group hover:border-amber-500/30 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-black">Anomalies</p>
                    <p className="text-4xl font-extrabold text-amber-500 leading-none">{preview.stats.corruptRows}</p>
                    <p className="text-[10px] text-zinc-600 italic">Rows flagged for review</p>
                  </div>
                </div>

                {/* Intelligent Reconciliation Summary */}
                <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/20 flex flex-wrap gap-x-12 gap-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-tighter mb-1 italic">Knowledge Mapping</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-300">Deduplication complete</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-tighter mb-1 italic">Action Log</span>
                    <div className="flex gap-4">
                      <div className="text-xs text-zinc-400">
                        <span className="text-emerald-400 font-bold">+{preview.stats.creates.candidate}</span> New Co.
                      </div>
                      <div className="text-xs text-zinc-400">
                        <span className="text-blue-400 font-bold">+{preview.stats.updates.candidate}</span> Updates
                      </div>
                    </div>
                  </div>
                  {preview.mapping && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-tighter mb-1 italic">Structure Detected</span>
                      <div className="flex flex-wrap gap-1">
                        {preview.mapping.usedColumns?.slice(0, 5).map(col => (
                          <span key={col} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-500 font-mono">{col}</span>
                        ))}
                        {(preview.mapping.usedColumns?.length ?? 0) > 5 && <span className="text-[8px] text-zinc-600">+more</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                  <Button variant="ghost" onClick={() => setPreview(null)} disabled={submitting} className="text-zinc-500">
                    Modify Dataset
                  </Button>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={commitImport}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-12 rounded-xl font-bold shadow-xl shadow-emerald-600/20 group disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Syndicating Data...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Commit to Pipeline
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {commitResult && (
              <motion.div
                key="step-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 space-y-8 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                  <div className="relative z-10 w-24 h-24 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                    Sync Orchestrated
                  </h3>
                  <p className="text-zinc-500 max-w-md mx-auto">Your intelligence dataset has been successfully integrated into the active pipeline.</p>
                </div>

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

                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={reset} className="border-zinc-800 text-zinc-400 hover:text-white rounded-xl h-12 px-8">
                    Start Another Import
                  </Button>
                  <Button onClick={closeDialog} className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl h-12 px-10 font-black tracking-tighter italic">
                    FINISH
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-zinc-900/40 p-3 flex justify-center border-t border-zinc-800/50">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em] flex items-center gap-2 italic">
            <Layers className="w-3 h-3" /> Basalt CRM Intelligence Core v2.4
            <span className="w-1 h-3 bg-zinc-800" />
            Status: <span className="text-emerald-500/60">Operational</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
