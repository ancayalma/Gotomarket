import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Zap } from "lucide-react";

interface TriggerNodeProps {
    data: {
        label?: string;
        triggerType?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-gradient-to-br from-orange-500 to-red-500 border-2 border-orange-600 w-full h-full flex items-center`}>
            {selected && (
                <NodeResizer
                    color="#f97316"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={60}
                    handleClassName="!w-2 !h-2 !bg-white !border-orange-500"
                />
            )}

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-white/20 rounded">
                    <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                    <div className="text-[10px] text-orange-100 font-bold uppercase tracking-wider">Trigger</div>
                    <div className="text-sm font-black text-white italic tracking-tight">{data?.label || "Trigger"}</div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-orange-300 border-2 border-white hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
        </div>
    );
}
