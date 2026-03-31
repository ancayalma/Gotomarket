"use client";

import { use, useState, useRef, useEffect, useMemo } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, ArrowRight, RotateCcw, Cpu } from "lucide-react";
import { LearnLink } from "@/components/ui/LearnLink";

type JobStatus = "QUEUED" | "RUNNING" | "PAUSED" | "STOPPED" | "SUCCESS" | "FAILED";

type LogEntry = {
  ts?: string;
  msg?: string;
  level?: string;
};

type JobStatusResponse = {
  job: {
    id: string;
    status: JobStatus;
    startedAt?: string;
    finishedAt?: string;
    counters: Record<string, number>;
    logs?: LogEntry[];
  };
  pool: {
    id: string;
    name?: string;
  };
  sourceEventsCount: number;
  candidatesCount: number;
};

// ─── Activity Classification ────────────────────────────────────────────────

type ActivityType = "search" | "visit" | "save" | "strategy" | "thinking" | "error" | "complete" | "info";

const ACTIVITY_CONFIG: Record<ActivityType, {
  label: string;
  color: string;
  accentHex: string;
  bgClass: string;
  borderClass: string;
}> = {
  search: { label: "SEARCH", color: "text-sky-400", accentHex: "#38bdf8", bgClass: "bg-sky-500/[0.06]", borderClass: "border-sky-500/10" },
  visit: { label: "CRAWL", color: "text-teal-400", accentHex: "#2dd4bf", bgClass: "bg-teal-500/[0.06]", borderClass: "border-teal-500/10" },
  save: { label: "CAPTURED", color: "text-amber-400", accentHex: "#fbbf24", bgClass: "bg-amber-500/[0.06]", borderClass: "border-amber-500/10" },
  strategy: { label: "STRATEGY", color: "text-violet-400", accentHex: "#a78bfa", bgClass: "bg-violet-500/[0.06]", borderClass: "border-violet-500/10" },
  thinking: { label: "REASONING", color: "text-indigo-400", accentHex: "#818cf8", bgClass: "bg-indigo-500/[0.06]", borderClass: "border-indigo-500/10" },
  error: { label: "ERROR", color: "text-rose-400", accentHex: "#fb7185", bgClass: "bg-rose-500/[0.06]", borderClass: "border-rose-500/10" },
  complete: { label: "COMPLETE", color: "text-emerald-400", accentHex: "#34d399", bgClass: "bg-emerald-500/[0.06]", borderClass: "border-emerald-500/10" },
  info: { label: "SYSTEM", color: "text-zinc-500", accentHex: "#71717a", bgClass: "bg-zinc-500/[0.04]", borderClass: "border-zinc-500/10" },
};

function classifyLog(log: LogEntry): ActivityType {
  const msg = (log.msg || "").toLowerCase();
  if (log.level === "ERROR" || log.level === "WARN") return "error";
  if (msg.includes("search") || msg.includes("🔍") || msg.includes("🔎") || msg.includes("serp")) return "search";
  if (msg.includes("visit") || msg.includes("🌐") || msg.includes("scraping") || msg.includes("crawl") || msg.includes("puppeteer")) return "visit";
  if (msg.includes("save") || msg.includes("💾") || msg.includes("saved") || msg.includes("captured")) return "save";
  if (msg.includes("strategy") || msg.includes("🎯") || msg.includes("refin") || msg.includes("checkpoint") || msg.includes("📍")) return "strategy";
  if (msg.includes("thinking") || msg.includes("💭") || msg.includes("reasoning") || msg.includes("agent reason")) return "thinking";
  if (msg.includes("complete") || msg.includes("✅") || msg.includes("success") || msg.includes("batch complete") || msg.includes("finished")) return "complete";
  return "info";
}

// ─── Abstract Eyeball / Iris Animation ──────────────────────────────────────

function AbstractIris({ accentColor, isActive, status }: { accentColor: string; isActive: boolean; status?: JobStatus }) {
  const [irisAngle, setIrisAngle] = useState(0);
  const [irisRadius, setIrisRadius] = useState(0);
  const [pupilScale, setPupilScale] = useState(1);

  useEffect(() => {
    if (!isActive) return;
    const drift = setInterval(() => {
      setIrisAngle(Math.random() * Math.PI * 2);
      setIrisRadius(Math.random() * 8);
      setPupilScale(0.85 + Math.random() * 0.3);
    }, 1200);
    return () => clearInterval(drift);
  }, [isActive]);

  const irisX = 60 + Math.cos(irisAngle) * irisRadius;
  const irisY = 60 + Math.sin(irisAngle) * irisRadius;

  const statusOpacity = status === "FAILED" ? 0.3 : status === "SUCCESS" ? 1 : 0.8;
  const isTerminal = status === "FAILED" || status === "SUCCESS" || status === "STOPPED";

  return (
    <div className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0">
      {/* Outer glow */}
      <div
        className={`absolute inset-[-12px] rounded-full blur-2xl transition-all duration-1000 ${isActive ? "animate-pulse" : ""}`}
        style={{ backgroundColor: accentColor, opacity: isActive ? 0.15 : 0.05 }}
      />
      {/* Mid glow ring */}
      <div
        className="absolute inset-[-4px] rounded-full transition-all duration-1000"
        style={{ boxShadow: `0 0 30px ${accentColor}22, inset 0 0 20px ${accentColor}11` }}
      />

      <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
        <defs>
          <radialGradient id="iris-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="60%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pupil-grad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="1" />
            <stop offset="100%" stopColor="#0a0a14" stopOpacity="1" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring — sclera */}
        <circle cx="60" cy="60" r="54" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.2"
          className="transition-all duration-1000" />
        <circle cx="60" cy="60" r="50" fill="#0a0a14" stroke={accentColor} strokeWidth="1" opacity={statusOpacity}
          className="transition-all duration-1000" />

        {/* Scanning ring */}
        {isActive && (
          <circle cx="60" cy="60" r="46" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.3"
            strokeDasharray="8 4">
            <animateTransform attributeName="transform" type="rotate" values="0 60 60;360 60 60" dur="8s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Iris — the colored ring */}
        <circle cx={irisX} cy={irisY} r="28" fill="url(#iris-grad)" opacity={statusOpacity}
          className="transition-all duration-700" filter="url(#glow)" />

        {/* Iris detail rings */}
        <circle cx={irisX} cy={irisY} r="24" fill="none" stroke={accentColor} strokeWidth="0.3" opacity="0.4"
          className="transition-all duration-700" />
        <circle cx={irisX} cy={irisY} r="18" fill="none" stroke={accentColor} strokeWidth="0.3" opacity="0.3"
          className="transition-all duration-700" />

        {/* Pupil */}
        <circle cx={irisX} cy={irisY} r={12 * pupilScale} fill="url(#pupil-grad)"
          className="transition-all duration-500" />
        <circle cx={irisX} cy={irisY} r={10 * pupilScale} fill="none" stroke={accentColor}
          strokeWidth="0.5" opacity="0.5" className="transition-all duration-500" />

        {/* Pupil highlight */}
        <circle cx={irisX - 4} cy={irisY - 4} r={3 * pupilScale} fill="white" opacity="0.15"
          className="transition-all duration-500" />

        {/* Data stream lines (when active) */}
        {isActive && !isTerminal && (
          <g opacity="0.15">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line key={angle} x1="60" y1="60"
                x2={60 + Math.cos(angle * Math.PI / 180) * 56}
                y2={60 + Math.sin(angle * Math.PI / 180) * 56}
                stroke={accentColor} strokeWidth="0.3" strokeDasharray="2 6">
                <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
              </line>
            ))}
          </g>
        )}

        {/* Outer tick marks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <line key={angle}
            x1={60 + Math.cos(angle * Math.PI / 180) * 48}
            y1={60 + Math.sin(angle * Math.PI / 180) * 48}
            x2={60 + Math.cos(angle * Math.PI / 180) * 52}
            y2={60 + Math.sin(angle * Math.PI / 180) * 52}
            stroke={accentColor} strokeWidth="0.5" opacity="0.25" />
        ))}
      </svg>

      {/* Status indicator */}
      {isActive && (
        <div className="absolute bottom-0 right-0 z-20">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: accentColor }} />
            <span className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: accentColor }} />
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: JobStatus }) {
  const configs: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    QUEUED: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Queued" },
    RUNNING: { bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-400", label: "Active", pulse: true },
    PAUSED: { bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400", label: "Paused" },
    STOPPED: { bg: "bg-zinc-500/10 border-zinc-500/20", text: "text-zinc-400", label: "Stopped" },
    SUCCESS: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Complete" },
    FAILED: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-400", label: "Failed" },
  };
  const c = configs[status || ""] || configs.QUEUED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${c.bg} ${c.text}`}>
      {c.pulse && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />}
      {c.label}
    </span>
  );
}

// ─── Metric Tile ────────────────────────────────────────────────────────────

function MetricTile({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

// ─── Token Graph Tile ───────────────────────────────────────────────────────

function TokenGraphCard({ label, value, history, accent }: { label: string; value: number | string; history: number[]; accent: string }) {
  const maxVal = history.length > 0 ? Math.max(...history) : 0;
  
  const width = 100;
  const height = 24; 
  
  const points = history.map((val, idx) => {
    const x = history.length > 1 ? (idx / (history.length - 1)) * width : width / 2;
    // Map values tightly to Y coordinates (0 is bottom, height is top)
    const y = maxVal > 0 ? height - (val / maxVal) * height : height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] min-w-[160px] max-w-[220px] flex-1 relative group overflow-hidden">
      {/* Background glow base */}
      <div className={`absolute -inset-x-4 -bottom-6 h-8 bg-current opacity-[0.03] blur-xl rounded-full ${accent}`} />

      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">{label}</span>
      </div>
      <div className="flex flex-col gap-1 z-10">
        <span className={`text-xl font-semibold tabular-nums leading-none ${accent}`}>{value}</span>
        <div className="flex items-end h-5 w-full mt-1 relative">
          {history.length === 0 ? (
            <div className="text-[9px] text-zinc-700 font-mono tracking-tighter">standing by...</div>
          ) : (
            <svg viewBox={`0 -1 ${width} ${height+2}`} className={`w-full h-full overflow-visible ${accent}`} preserveAspectRatio="none">
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="opacity-80 drop-shadow-[0_0_3px_currentColor] group-hover:opacity-100 transition-opacity"
              />
            </svg>
          )}
          {/* Tooltip Hover Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-full flex items-end opacity-0">
            {history.map((val, idx) => (
              <div 
                key={idx} 
                className={`flex-1 h-full cursor-crosshair hover:opacity-20 transition-opacity bg-current ${accent}`}
                title={`Batch ${idx+1}: ${val.toLocaleString()} tokens`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formatted Time ─────────────────────────────────────────────────────────

function formatTime(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

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

// ─── Clean message text ─────────────────────────────────────────────────────

function cleanMessage(msg: string): string {
  // Strip leading emoji and whitespace for cleaner display
  return msg.replace(/^[\s🔍🔎🌐💾🎯💭⚠️✅📋📍]+/, "").trim();
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LeadGenJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const [controlling, setControlling] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const { data, error, isLoading, mutate } = useSWR<JobStatusResponse>(
    `/api/crm/leads/autogen/status/${jobId}`,
    fetcher,
    { refreshInterval: 3000 }
  );

  // Auto-scroll reasoning stream
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [data?.job?.logs?.length]);

  const handleControl = async (action: "pause" | "resume" | "stop") => {
    setControlling(true);
    try {
      const res = await fetch(`/api/crm/leads/autogen/control/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Control action failed");
      }
      await mutate();
    } catch (err: any) {
      alert(err.message || "Failed to control job");
    } finally {
      setControlling(false);
    }
  };

  const logs = useMemo(() => Array.isArray(data?.job?.logs) ? data.job.logs : [], [data?.job?.logs]);
  const latestLog = logs[logs.length - 1];
  const latestActivity = latestLog ? classifyLog(latestLog) : "info";
  const accentColor = ACTIVITY_CONFIG[latestActivity].accentHex;
  const isActive = data?.job?.status === "RUNNING" || data?.job?.status === "QUEUED";
  const companiesFound = data?.job?.counters?.companiesFound || data?.candidatesCount || 0;
  const contactsFound = data?.job?.counters?.contactsCreated || 0;
  const iterations = data?.job?.counters?.agentIterations || 0;
  const target = data?.job?.counters?.targetCredits || data?.job?.counters?.targetCompanies || 100;
  const tokensUsed = data?.job?.counters?.tokensUsed || 0;
  const promptTokens = data?.job?.counters?.promptTokens || 0;
  const completionTokens = data?.job?.counters?.completionTokens || 0;
  const progressPct = data?.job?.counters?.progress ?? Math.min(100, target > 0 ? ((companiesFound + contactsFound) / target) * 100 : 0);
  const tokenHistory = ((data?.job?.counters as any)?.tokenHistory as { p: number, c: number, t: number }[]) || [];

  // Activity type counts
  const activityCounts = useMemo(() => {
    const counts: Partial<Record<ActivityType, number>> = {};
    logs.forEach((log) => {
      const type = classifyLog(log);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [logs]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <LearnLink
        tab="leads"
        overviewTitle="Neural Prospecting Console"
        overviewWhat="A real-time operations console for monitoring an autonomous AI agent as it researches, crawls, and captures leads matching your ideal customer profile."
        overviewWhy="Visibility into the agent's decision-making process. Monitor search strategy, crawl results, and capture quality in real time."
        overviewHow="Watch the Activity Feed for the agent's operations. Use Pause or Stop to intervene. When complete, click 'View Results' to work the generated list."
      />

      {/* ═══ Command Bar ═══════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={data?.job?.status} />
        <span className="text-xs text-zinc-600 font-mono">
          {jobId.slice(0, 8)}…
        </span>
        <span className="text-xs text-zinc-600">
          {data?.pool?.name && `· ${data.pool.name}`}
        </span>
        <div className="flex-1" />

        {/* Controls */}
        {(data?.job?.status === "RUNNING" || data?.job?.status === "PAUSED") && (
          <div className="flex items-center gap-2">
            {data?.job?.status === "RUNNING" ? (
              <button
                onClick={() => handleControl("pause")}
                disabled={controlling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/10 disabled:opacity-40 transition-all"
              >
                <Pause className="w-3 h-3" /> Pause
              </button>
            ) : (
              <button
                onClick={() => handleControl("resume")}
                disabled={controlling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-40 transition-all"
              >
                <Play className="w-3 h-3" /> Resume
              </button>
            )}
            <button
              onClick={() => handleControl("stop")}
              disabled={controlling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/10 disabled:opacity-40 transition-all"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          </div>
        )}
        {data?.pool?.id && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all"
            onClick={() => router.push(`/crm/accounts/lists/${data.pool.id}`)}
          >
            View Results <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ═══ Hero Section — Iris + Metrics ════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center p-6 md:p-8 rounded-2xl bg-zinc-950/60 border border-white/[0.04] backdrop-blur-sm">
        <AbstractIris accentColor={accentColor} isActive={isActive} status={data?.job?.status} />

        <div className="space-y-5">
          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100">
              Neural Prospecting
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isActive
                ? `Agent active · ${formatDuration(data?.job?.startedAt)} elapsed`
                : data?.job?.status === "SUCCESS"
                  ? `Completed in ${formatDuration(data?.job?.startedAt, data?.job?.finishedAt)}`
                  : data?.job?.status === "FAILED"
                    ? "Agent encountered an error"
                    : "Agent idle"
              }
            </p>
          </div>

          {/* Metrics row */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <MetricTile label="Accounts" value={companiesFound} accent="text-emerald-400" />
              <MetricTile label="Contacts" value={contactsFound} accent="text-sky-400" />
              <MetricTile label="Credits Used" value={companiesFound + contactsFound} accent="text-amber-400" />
              <MetricTile label="Target" value={target} accent="text-zinc-400" />
              <MetricTile label="Iterations" value={iterations} accent="text-violet-400" />
            </div>
            <div className="flex gap-3">
              <TokenGraphCard 
                label="Prompt Tokens" 
                value={promptTokens.toLocaleString()} 
                history={tokenHistory.map(h => h.p)} 
                accent="text-orange-400" 
              />
              <TokenGraphCard 
                label="Completion" 
                value={completionTokens.toLocaleString()} 
                history={tokenHistory.map(h => h.c)} 
                accent="text-rose-400" 
              />
            </div>
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Progress</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/[0.03] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                    boxShadow: `0 0 12px ${accentColor}44`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Insufficient AI Token Banner */}
          {data?.job?.status === "FAILED" && (data?.job?.counters as any)?.failReason === "INSUFFICIENT_AI_TOKENS" && (
            <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-amber-400 font-semibold text-sm">⚡ AI Token Balance Exhausted</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {companiesFound} companies saved before running out. Top up your AI credits to run more lead generation.
                </p>
              </div>
              <a
                href="/admin/ai-usage"
                className="shrink-0 px-4 py-2 rounded-md bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                Top Up Credits
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Loading / Error States ════════════════════════════════════════ */}
      {isLoading && (
        <div className="text-center py-16 text-zinc-500">
          <div className="inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4 animate-spin" />
            Connecting to agent…
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-rose-400 bg-rose-950/10 rounded-xl border border-rose-500/10 text-sm">
          Failed to connect to job. Verify the job ID.
        </div>
      )}

      {/* ═══ Activity Feed ════════════════════════════════════════════════ */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-950/40 overflow-hidden">
          {/* Feed header */}
          <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                {isActive && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: accentColor, opacity: 0.4 }} />
                )}
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-200">Activity Feed</h2>
              <span className="text-[10px] text-zinc-600 font-mono">{logs.length}</span>
            </div>

            {/* Activity type chips */}
            <div className="hidden md:flex items-center gap-3">
              {(["search", "visit", "save", "strategy", "thinking", "error"] as ActivityType[]).map(type => {
                const count = activityCounts[type] || 0;
                if (count === 0) return null;
                const cfg = ACTIVITY_CONFIG[type];
                return (
                  <span key={type} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.accentHex }} />
                    {cfg.label}
                    <span className="text-zinc-600 font-mono">{count}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Feed body */}
          <div
            ref={streamRef}
            className="max-h-[540px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
          >
            <div className="divide-y divide-white/[0.02]">
              {logs.map((log, idx) => {
                const type = classifyLog(log);
                const cfg = ACTIVITY_CONFIG[type];
                const isLatest = idx === logs.length - 1;
                const message = cleanMessage(log.msg || "…");

                return (
                  <div
                    key={idx}
                    className={`group flex items-start gap-3 px-5 py-3 transition-colors duration-300 hover:bg-white/[0.02] ${isLatest && isActive ? "bg-white/[0.015]" : ""}`}
                  >
                    {/* Accent bar */}
                    <div
                      className={`w-0.5 self-stretch rounded-full flex-shrink-0 transition-all duration-500 ${isLatest && isActive ? "opacity-100" : "opacity-40"}`}
                      style={{ backgroundColor: cfg.accentHex }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono ml-auto flex-shrink-0">
                          {formatTime(log.ts)}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                        {message}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isActive && (
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="w-0.5 self-stretch rounded-full bg-white/5" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] text-zinc-600 ml-2">Processing…</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Details Footer ═══════════════════════════════════════════════ */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailCard title="Job">
            <DetailRow label="ID" value={data.job.id.slice(0, 12) + "…"} mono />
            <DetailRow label="Started" value={data.job.startedAt ? new Date(data.job.startedAt).toLocaleString() : "—"} />
            <DetailRow label="Finished" value={data.job.finishedAt ? new Date(data.job.finishedAt).toLocaleString() : "—"} />
            <DetailRow label="Duration" value={formatDuration(data.job.startedAt, data.job.finishedAt || undefined)} />
          </DetailCard>

          <DetailCard title="Counters">
            {Object.entries(data.job.counters || {})
              .filter(([k]) => k !== 'tokenHistory')
              .map(([k, v]) => (
              <DetailRow key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={String(v)} mono />
            ))}
            <DetailRow label="Source Events" value={String(data.sourceEventsCount)} mono />
            <DetailRow label="Candidates" value={String(data.candidatesCount)} accent />
          </DetailCard>

          <DetailCard title="Actions">
            <p className="text-[11px] text-zinc-500 mb-3">
              When the job finishes, review accounts in the list and begin outreach.
            </p>
            <div className="flex gap-2">
              {data?.pool?.id && (
                <button
                  className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => router.push(`/crm/accounts/lists/${data.pool.id}`)}
                >
                  View List
                </button>
              )}
              <button
                className="rounded-md border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.03] transition-colors"
                onClick={() => router.refresh()}
              >
                Refresh
              </button>
            </div>
          </DetailCard>
        </div>
      )}
    </div>
  );
}

// ─── Detail Components ──────────────────────────────────────────────────────

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 bg-zinc-950/40 border border-white/[0.04] space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${accent ? "text-emerald-400 font-semibold" : "text-zinc-300"} truncate max-w-[160px]`}>
        {value}
      </span>
    </div>
  );
}
