import { Handle, Position, NodeResizer } from "@xyflow/react";
import { Mail, MessageSquare, CheckSquare, Bell } from "lucide-react";

interface ActionNodeProps {
    data: {
        label?: string;
        actionType?: "send_email" | "send_sms" | "create_task" | "notify";
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

const actionIcons = {
    send_email: Mail,
    send_sms: MessageSquare,
    create_task: CheckSquare,
    notify: Bell,
};

export function ActionNode({ data, selected }: ActionNodeProps) {
    const Icon = actionIcons[data?.actionType || "notify"] || Bell;
    const shapeClass =
        data.shape === "capsule" ? "rounded-full" :
            data.shape === "square" ? "rounded-none" :
                "rounded-lg";

    return (
        <div className={`group px-4 py-3 shadow-lg ${shapeClass} bg-[#0c1a12] border-2 border-emerald-500/50 w-full h-full flex items-center relative`}>
            {selected && (
                <NodeResizer
                    color="#10b981"
                    isVisible={selected}
                    minWidth={180}
                    minHeight={60}
                    handleClassName="!w-2 !h-2 !bg-white !border-emerald-500"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="!w-4 !h-4 !bg-emerald-400 border-2 border-[#0c1a12] hover:!scale-125 transition-transform cursor-crosshair !-top-2"
            />

            <div className="flex items-center gap-2 w-full">
                <div className="p-1.5 bg-emerald-500/20 rounded">
                    <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                    <div className="text-[10px] text-emerald-500/50 font-bold uppercase tracking-wider">Action</div>
                    <div className="text-sm font-black text-emerald-50 italic tracking-tight">
                        {data?.label || "Action"}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-4 !h-4 !bg-emerald-400 border-2 border-[#0c1a12] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2"
            />
        </div>
    );
}
