import { Handle, Position, NodeResizer } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

interface ApprovalNodeProps {
    data: {
        label?: string;
        processName?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function ApprovalNode({ data, selected }: ApprovalNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#1a0c0e] border-2 border-rose-500/50 w-full h-full flex flex-col justify-center relative`}>
            {selected && (
                <NodeResizer
                    color="#f43f5e"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={80}
                    handleClassName="!w-2 !h-2 !bg-white !border-rose-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-rose-400 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-rose-500/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                    <div className="text-[10px] text-rose-500/50 font-bold uppercase tracking-wider">Approval</div>
                    <div className="text-sm font-black text-rose-50 italic tracking-tight">
                        {data?.label || "Submit for Approval"}
                    </div>
                </div>
            </div>

            {/* Approved path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="approved"
                style={{ left: '30%' }}
                className="!w-4 !h-4 !bg-emerald-500 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            {/* Rejected path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="rejected"
                style={{ left: '70%' }}
                className="!w-4 !h-4 !bg-rose-500 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
            <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2">
                <span className="text-emerald-500">Approved</span>
                <span className="text-rose-500">Rejected</span>
            </div>
        </div>
    );
}
