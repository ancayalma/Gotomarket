import { Position } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

interface ApprovalNodeProps {
    data: {
        label?: string;
        processName?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function ApprovalNode({ data, selected }: ApprovalNodeProps) {
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="Submit for Approval"
            selected={selected}
            nodeType="Approval"
            icon={CheckCircle2}
            shape={data.shape}
            layout="column"
            bgColor="bg-[#1a0c0e]"
            borderColor="border-rose-500/50"
            accentColor="text-rose-400"
            labelColor="text-rose-50"
            resizerColor="#f43f5e"
            resizerBorderClass="!border-rose-500"
            iconBgColor="bg-rose-500/20"
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-rose-400 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "approved",
                    style: { left: '30%' },
                    className: "!w-4 !h-4 !bg-emerald-500 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "rejected",
                    style: { left: '70%' },
                    className: "!w-4 !h-4 !bg-rose-500 border-2 border-[#1a0c0e] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
            footer={
                <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2">
                    <span className="text-emerald-500">Approved</span>
                    <span className="text-rose-500">Rejected</span>
                </div>
            }
        />
    );
}
