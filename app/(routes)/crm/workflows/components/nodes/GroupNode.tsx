import { NodeResizer } from "@xyflow/react";
import { Maximize2, Type } from "lucide-react";

interface GroupNodeProps {
    data: {
        label?: string;
    };
    selected?: boolean;
}

export function GroupNode({ data, selected }: GroupNodeProps) {
    return (
        <div className={`group relative w-full h-full p-6 border-2 border-dashed transition-all duration-300 rounded-3xl ${selected
                ? "bg-white/5 border-cyan-500/50 shadow-[0_0_80px_rgba(6,182,212,0.15)] ring-2 ring-cyan-500/20"
                : "bg-white/[0.02] border-white/5"
            }`}>
            {selected && (
                <NodeResizer
                    color="#06b6d4"
                    isVisible={selected}
                    minWidth={200}
                    minHeight={200}
                    handleClassName="!w-3 !h-3 !bg-white !border-cyan-500 !rounded-full shadow-2xl"
                />
            )}

            <div className="absolute top-4 left-6 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="p-1 px-2.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                    <Maximize2 className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Section</span>
                </div>
                <div className="text-xs font-bold text-white/50 tracking-tight italic">
                    {data.label || "Workflow Group"}
                </div>
            </div>

            {/* Interaction hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                <div className="border border-white/20 p-4 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-white">Drop Nodes Here</span>
                </div>
            </div>
        </div>
    );
}
