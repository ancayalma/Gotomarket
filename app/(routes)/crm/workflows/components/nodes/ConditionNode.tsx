import { Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

interface ConditionNodeProps {
    data: {
        label?: string;
        field?: string;
        operator?: string;
        value?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="If / Else"
            selected={selected}
            nodeType="Decision"
            icon={GitBranch}
            shape={data.shape}
            layout="column"
            bgColor="bg-[#1a160c]"
            borderColor="border-amber-500/50"
            accentColor="text-amber-400"
            labelColor="text-amber-50"
            resizerColor="#f59e0b"
            resizerBorderClass="!border-amber-500"
            iconBgColor="bg-amber-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-amber-400 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "true",
                    style: { left: '30%' },
                    className: "!w-4 !h-4 !bg-emerald-500 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "false",
                    style: { left: '70%' },
                    className: "!w-4 !h-4 !bg-rose-500 border-2 border-[#1a160c] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
            footer={
                <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2">
                    <span className="text-emerald-500">True</span>
                    <span className="text-rose-500">False</span>
                </div>
            }
        />
    );
}
