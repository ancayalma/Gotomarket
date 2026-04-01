"use client";

import { useState } from "react";
import { Merge, X, Check, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type Pool = {
  id: string;
  name: string;
  candidatesCount: number;
};

interface MergeListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pools: Pool[];
  onMerged: () => void;
}

export default function MergeListsModal({
  isOpen,
  onClose,
  pools,
  onMerged,
}: MergeListsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergedName, setMergedName] = useState("");
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const togglePool = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedPools = pools.filter((p) => selectedIds.has(p.id));
  const totalRecords = selectedPools.reduce(
    (sum, p) => sum + (p.candidatesCount || 0),
    0
  );
  const canSubmit = selectedIds.size >= 2 && mergedName.trim().length > 0;

  const handleMerge = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/leads/pools/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePoolIds: Array.from(selectedIds),
          name: mergedName.trim(),
          deleteOriginals,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Merge failed");
      }

      const data = await res.json();
      toast.success(
        `Merged ${selectedIds.size} lists into "${mergedName}" (${data.stats?.candidatesMoved || 0} accounts moved)`
      );
      onMerged();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to merge lists");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setMergedName("");
    setDeleteOriginals(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Merge className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Merge Lists
              </h2>
              <p className="text-xs text-zinc-500">
                Combine multiple lists into one
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* New name input */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-zinc-500 mb-2 block">
              Merged List Name
            </label>
            <input
              type="text"
              value={mergedName}
              onChange={(e) => setMergedName(e.target.value)}
              placeholder="e.g. Combined Q1 Outreach"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Pool selection */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-zinc-500 mb-2 block">
              Select Lists to Merge{" "}
              <span className="text-zinc-600">
                ({selectedIds.size} selected)
              </span>
            </label>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent pr-1">
              {pools.map((pool) => {
                const isSelected = selectedIds.has(pool.id);
                return (
                  <button
                    key={pool.id}
                    onClick={() => togglePool(pool.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                      isSelected
                        ? "border-indigo-500/30 bg-indigo-500/[0.06]"
                        : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08]"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-zinc-600 bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>

                    {/* Pool info */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium truncate block ${
                          isSelected ? "text-zinc-100" : "text-zinc-300"
                        }`}
                      >
                        {pool.name}
                      </span>
                    </div>

                    {/* Count badge */}
                    <span className="text-[10px] font-semibold text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-md flex-shrink-0">
                      {pool.candidatesCount || 0} records
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete originals toggle */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 cursor-pointer hover:border-rose-500/20 transition-colors">
            <input
              type="checkbox"
              checked={deleteOriginals}
              onChange={(e) => setDeleteOriginals(e.target.checked)}
              className="mt-0.5 rounded border-zinc-600 bg-zinc-900 text-rose-500 focus:ring-rose-500/30"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                Delete original lists after merge
              </span>
              <span className="text-xs text-zinc-500">
                The source lists will be removed. All records will live in the
                new merged list.
              </span>
            </div>
          </label>

          {/* Summary */}
          {selectedIds.size >= 2 && (
            <div className="rounded-xl bg-indigo-500/[0.04] border border-indigo-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <Merge className="w-3.5 h-3.5" />
                Merge Preview
              </div>
              <div className="text-[11px] text-zinc-400 space-y-1">
                <p>
                  <span className="text-zinc-200 font-medium">
                    {selectedIds.size}
                  </span>{" "}
                  lists →{" "}
                  <span className="text-zinc-200 font-medium">
                    &quot;{mergedName || "…"}&quot;
                  </span>
                </p>
                <p>
                  ~
                  <span className="text-emerald-400 font-semibold">
                    {totalRecords}
                  </span>{" "}
                  total records will be combined (duplicates removed)
                </p>
                {deleteOriginals && (
                  <p className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Original lists will be permanently deleted
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!canSubmit || submitting}
            className={`font-semibold ${
              deleteOriginals
                ? "bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white disabled:opacity-40`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Merging…
              </>
            ) : (
              <>
                <Merge className="w-4 h-4 mr-2" />
                Merge {selectedIds.size > 0 ? `${selectedIds.size} Lists` : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
