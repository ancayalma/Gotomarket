import { Handle, Position, NodeResizer } from "@xyflow/react";
import { GitBranch } from "lucide-react";

interface ConditionNodeProps {
    data: {
        label?: string;
        field?: string;
        operator?: string;
        value?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#1a160c] border-2 border-amber-500/50 w-full h-full flex flex-col justify-center relative`}>
            {selected && (
                <NodeResizer
                    color="#f59e0b"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={80}
                    handleClassName="!w-2 !h-2 !bg-white !border-amber-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-amber-400 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 rounded">
                    <GitBranch className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                    <div className="text-[10px] text-amber-500/50 font-bold uppercase tracking-wider">Decision</div>
                    <div className="text-sm font-black text-amber-50 italic tracking-tight">
                        {data?.label || "If / Else"}
                    </div>
                </div>
            </div>

            {/* True path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                style={{ left: '30%' }}
                className="!w-4 !h-4 !bg-emerald-500 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            {/* False path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                style={{ left: '70%' }}
                className="!w-4 !h-4 !bg-rose-500 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2">
                <span className="text-emerald-500">True</span>
                <span className="text-rose-500">False</span>
            </div>
        </div>
    );
}
