import { Handle, Position, NodeResizer } from "@xyflow/react";
import { LayoutGrid } from "lucide-react";

interface ScreenNodeProps {
    data: {
        label?: string;
        screenTitle?: string;
        fields?: { name: string; type: string; required?: boolean }[];
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function ScreenNode({ data, selected }: ScreenNodeProps) {
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#140c1a] border-2 border-purple-500/50 w-full h-full flex items-center relative`}>
            {selected && (
                <NodeResizer
                    color="#a855f7"
                    isVisible={selected}
                    minWidth={200}
                    minHeight={60}
                    handleClassName="!w-2 !h-2 !bg-white !border-purple-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-purple-400 border-2 border-[#140c1a] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-purple-500/20 rounded">
                    <LayoutGrid className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                    <div className="text-[10px] text-purple-500/50 font-bold uppercase tracking-wider">Screen</div>
                    <div className="text-sm font-black text-purple-50 italic tracking-tight">
                        {data?.label || "User Input"}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-purple-400 border-2 border-[#140c1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
        </div>
    );
}
