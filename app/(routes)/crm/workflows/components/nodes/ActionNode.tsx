import { Position } from "@xyflow/react";
import { Mail, MessageSquare, CheckSquare, Bell } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

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

    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="Action"
            selected={selected}
            nodeType="Action"
            icon={Icon}
            shape={data.shape}
            bgColor="bg-[#0c1a12]"
            borderColor="border-emerald-500/50"
            accentColor="text-emerald-400"
            labelColor="text-emerald-50"
            resizerColor="#10b981"
            resizerBorderClass="!border-emerald-500"
            iconBgColor="bg-emerald-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-emerald-400 border-2 border-[#0c1a12] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-emerald-400 border-2 border-[#0c1a12] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
