import { Position } from "@xyflow/react";
import { Zap } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

interface TriggerNodeProps {
    data: {
        label?: string;
        triggerType?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="Trigger"
            selected={selected}
            nodeType="Trigger"
            icon={Zap}
            shape={data.shape}
            bgColor=""
            borderColor=""
            accentColor="text-orange-500"
            labelColor="text-orange-50"
            resizerColor="#f97316"
            resizerBorderClass="!border-orange-500"
            iconBgColor=""
            handles={[
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-orange-300 border-2 border-white hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
