import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Database } from "lucide-react";

interface UpdateRecordNodeProps {
    data: {
        label?: string;
        objectType?: string;
        operation?: "CREATE" | "UPDATE" | "DELETE" | "GET";
        fieldUpdates?: { field: string; value: string }[];
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function UpdateRecordNode({ data, selected }: UpdateRecordNodeProps) {
    const op = data?.operation || "UPDATE";
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#0c1a1a] border-2 border-cyan-500/50 w-full h-full flex items-center relative`}>
            {selected && (
                <NodeResizer
                    color="#06b6d4"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={60}
                    handleClassName="!w-2 !h-2 !bg-white !border-cyan-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-cyan-400 border-2 border-[#0c1a1a] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-cyan-500/20 rounded">
                    <Database className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                    <div className="text-[10px] text-cyan-500/50 font-bold uppercase tracking-wider">{op} Record</div>
                    <div className="text-sm font-black text-cyan-50 italic tracking-tight">
                        {data?.label || data?.objectType || "Record Op"}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-cyan-400 border-2 border-[#0c1a1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
        </div>
    );
}
