import { Position } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

interface VaruniNodeProps {
    data: {
        label?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function VaruniNode({ data, selected }: VaruniNodeProps) {
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="Varuni Agent"
            selected={selected}
            nodeType="AI Agent"
            icon={Sparkles}
            shape={data.shape}
            bgColor="bg-[#0a1120]"
            borderColor="border-cyan-500/50"
            accentColor="text-cyan-400"
            labelColor="text-cyan-50"
            resizerColor="#06b6d4"
            resizerBorderClass="!border-cyan-500"
            iconBgColor="bg-cyan-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-cyan-400 border-2 border-[#0a1120] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-cyan-400 border-2 border-[#0a1120] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
