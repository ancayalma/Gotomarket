import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Clock } from "lucide-react";

interface DelayNodeProps {
    data: {
        label?: string;
        duration?: number;
        unit?: "minutes" | "hours" | "days";
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function DelayNode({ data, selected }: DelayNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#0c141a] border-2 border-blue-500/50 w-full h-full flex items-center relative`}>
            {selected && (
                <NodeResizer
                    color="#3b82f6"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={60}
                    handleClassName="!w-2 !h-2 !bg-white !border-blue-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-blue-400 border-2 border-[#0c141a] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-blue-500/20 rounded">
                    <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                    <div className="text-[10px] text-blue-500/50 font-bold uppercase tracking-wider">Delay</div>
                    <div className="text-sm font-black text-blue-50 italic tracking-tight">
                        {data?.label || "Wait"}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-blue-400 border-2 border-[#0c141a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
        </div>
    );
}
