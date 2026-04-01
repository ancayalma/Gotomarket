"use client";

import { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { Bot, ArrowLeft, ExternalLink, RotateCcw, Search } from "lucide-react";
import { LearnLink } from "@/components/ui/LearnLink";

type JobStatus = "QUEUED" | "RUNNING" | "PAUSED" | "STOPPED" | "SUCCESS" | "FAILED";

type Job = {
  id: string;
  status: JobStatus;
  startedAt?: string;
  finishedAt?: string;
  counters: Record<string, number>;
  poolId: string;
  poolName: string;
};

const STATUS_CONFIG: Record<string, {
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
}> = {
  QUEUED: { label: "Queued", dot: "bg-amber-400", bg: "bg-amber-500/[0.06]", text: "text-amber-400", border: "border-amber-500/10" },
  RUNNING: { label: "Running", dot: "bg-sky-400", bg: "bg-sky-500/[0.06]", text: "text-sky-400", border: "border-sky-500/10", pulse: true },
  PAUSED: { label: "Paused", dot: "bg-orange-400", bg: "bg-orange-500/[0.06]", text: "text-orange-400", border: "border-orange-500/10" },
  STOPPED: { label: "Stopped", dot: "bg-zinc-400", bg: "bg-zinc-500/[0.06]", text: "text-zinc-400", border: "border-zinc-500/10" },
  SUCCESS: { label: "Complete", dot: "bg-emerald-400", bg: "bg-emerald-500/[0.06]", text: "text-emerald-400", border: "border-emerald-500/10" },
  FAILED: { label: "Failed", dot: "bg-rose-400", bg: "bg-rose-500/[0.06]", text: "text-rose-400", border: "border-rose-500/10" },
};

function formatDuration(start?: string, end?: string) {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = Math.max(0, e - s);
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function JobsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading } = useSWR<{ jobs: Job[] }>(
    "/api/crm/leads/autogen/jobs",
    fetcher,
    {
      refreshInterval: (data) => {
        const hasActive = data?.jobs?.some(
          (j) => j.status === "RUNNING" || j.status === "QUEUED"
        );
        return hasActive ? 5000 : 30000;
      },
    }
  );

  const jobs = data?.jobs || [];

  const activeJobs = jobs.filter(
    (j) => j.status === "RUNNING" || j.status === "QUEUED" || j.status === "PAUSED"
  );
  const completedJobs = jobs.filter(
    (j) => j.status === "SUCCESS" || j.status === "FAILED" || j.status === "STOPPED"
  );

  const filteredActive = activeJobs.filter(
    (j) =>
      j.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompleted = completedJobs.filter(
    (j) =>
      j.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <LearnLink
        tab="lists"
        overviewTitle="Lead Generation Jobs"
        overviewWhat="A real-time dashboard of all AI-powered lead generation jobs across your lists."
        overviewWhy="Monitor active scraping operations and review completed runs in one place."
        overviewHow="Click any job to view its full activity feed and results. Active jobs auto-refresh."
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/lists")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100">
            Lead Gen Jobs
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {activeJobs.length > 0
              ? `${activeJobs.length} active job${activeJobs.length > 1 ? "s" : ""}`
              : "No active jobs"}
            {completedJobs.length > 0 && ` · ${completedJobs.length} completed`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by list name or job ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/40 border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-20 text-zinc-500">
          <div className="inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4 animate-spin" />
            Loading jobs…
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-rose-400 bg-rose-950/10 rounded-xl border border-rose-500/10 text-sm">
          Failed to load jobs.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && jobs.length === 0 && (
        <div className="text-center py-20">
          <Bot className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-sm">No lead generation jobs found.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Start one from the LeadGen Wizard in the Accounts tab.
          </p>
        </div>
      )}

      {/* Active Jobs */}
      {filteredActive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Active Jobs
          </h2>
          <div className="space-y-2">
            {filteredActive.map((job) => (
              <JobRow key={job.id} job={job} onClick={() => router.push(`/lists/jobs/${job.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Jobs */}
      {filteredCompleted.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            History
          </h2>
          <div className="space-y-2">
            {filteredCompleted.map((job) => (
              <JobRow key={job.id} job={job} onClick={() => router.push(`/lists/jobs/${job.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Job Row ────────────────────────────────────────────────────────────────

function JobRow({ job, onClick }: { job: Job; onClick: () => void }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.QUEUED;
  const isActive = job.status === "RUNNING" || job.status === "QUEUED";
  const companies = job.counters?.companiesFound || 0;
  const contacts = job.counters?.contactsCreated || 0;
  const target = job.counters?.targetCredits || job.counters?.targetCompanies || 100;
  const progress = target > 0 ? Math.min(100, ((companies + contacts) / target) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full group relative rounded-xl border border-white/[0.04] bg-zinc-950/40 hover:bg-zinc-950/60 hover:border-white/[0.08] transition-all duration-200 text-left overflow-hidden"
    >
      {/* Progress underline for active jobs */}
      {isActive && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="px-5 py-4 flex items-center gap-4">
        {/* Status dot */}
        <div className="relative flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          {cfg.pulse && (
            <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${cfg.dot} animate-ping opacity-40`} />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-zinc-200 truncate">
              {job.poolName}
            </span>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
            <span className="font-mono">{job.id.slice(0, 8)}…</span>
            <span>·</span>
            <span>{formatRelativeTime(job.startedAt)}</span>
            {isActive && (
              <>
                <span>·</span>
                <span className="text-zinc-400">{formatDuration(job.startedAt)} elapsed</span>
              </>
            )}
            {!isActive && job.startedAt && (
              <>
                <span>·</span>
                <span>{formatDuration(job.startedAt, job.finishedAt)} total</span>
              </>
            )}
          </div>
        </div>

        {/* Counters */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs text-zinc-500">Accounts</div>
            <div className="text-sm font-semibold tabular-nums text-emerald-400">{companies}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Contacts</div>
            <div className="text-sm font-semibold tabular-nums text-sky-400">{contacts}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Target</div>
            <div className="text-sm font-semibold tabular-nums text-zinc-400">{target}</div>
          </div>
        </div>

        {/* Arrow */}
        <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}
