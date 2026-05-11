import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
        <div className="h-16 w-16 bg-white/[0.02] border border-white/5 shadow-2xl shadow-primary/10 rounded-2xl flex items-center justify-center relative z-10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
      <p className="text-xs font-bold text-white/40 animate-pulse tracking-widest uppercase">
        Loading Database Records...
      </p>
    </div>
  );
}
