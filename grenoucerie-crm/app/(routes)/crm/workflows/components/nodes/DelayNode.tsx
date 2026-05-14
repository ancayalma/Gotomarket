import { Position } from "@xyflow/react";
import { Clock } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

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
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="Wait"
            selected={selected}
            nodeType="Delay"
            icon={Clock}
            shape={data.shape}
            bgColor="bg-[#0c141a]"
            borderColor="border-blue-500/50"
            accentColor="text-blue-400"
            labelColor="text-blue-50"
            resizerColor="#3b82f6"
            resizerBorderClass="!border-blue-500"
            iconBgColor="bg-blue-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-blue-400 border-2 border-[#0c141a] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-blue-400 border-2 border-[#0c141a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
