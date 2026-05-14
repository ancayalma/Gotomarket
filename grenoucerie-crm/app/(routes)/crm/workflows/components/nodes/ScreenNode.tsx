import { Position } from "@xyflow/react";
import { LayoutGrid } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

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
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="User Input"
            selected={selected}
            nodeType="Screen"
            icon={LayoutGrid}
            shape={data.shape}
            bgColor="bg-[#140c1a]"
            borderColor="border-purple-500/50"
            accentColor="text-purple-400"
            labelColor="text-purple-50"
            resizerColor="#a855f7"
            resizerBorderClass="!border-purple-500"
            iconBgColor="bg-purple-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-purple-400 border-2 border-[#140c1a] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-purple-400 border-2 border-[#140c1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
