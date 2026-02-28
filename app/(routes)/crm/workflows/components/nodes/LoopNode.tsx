import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Repeat } from "lucide-react";

interface LoopNodeProps {
    data: {
        label?: string;
        collection?: string;
        iteratorVariable?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function LoopNode({ data, selected }: LoopNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#120c1a] border-2 border-indigo-500/50 w-full h-full flex flex-col justify-center relative`}>
            {selected && (
                <NodeResizer
                    color="#6366f1"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={80}
                    handleClassName="!w-2 !h-2 !bg-white !border-indigo-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-indigo-400 border-2 border-[#120c1a] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-indigo-500/20 rounded">
                    <Repeat className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                    <div className="text-[10px] text-indigo-500/50 font-bold uppercase tracking-wider">Loop</div>
                    <div className="text-sm font-black text-indigo-50 italic tracking-tight">
                        {data?.label || "For Each"}
                    </div>
                </div>
            </div>

            {/* Loop body path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="body"
                style={{ left: '30%' }}
                className="!w-4 !h-4 !bg-indigo-400 border-2 border-[#120c1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            {/* After loop path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="done"
                style={{ left: '70%' }}
                className="!w-4 !h-4 !bg-slate-400 border-2 border-[#120c1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2">
                <span className="text-indigo-400">Each</span>
                <span className="text-slate-500">Done</span>
            </div>
        </div>
    );
}
