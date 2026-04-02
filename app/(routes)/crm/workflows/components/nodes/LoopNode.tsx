import { Position } from "@xyflow/react";
import { Repeat } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

interface LoopNodeProps {
    data: {
        label?: string;
        collection?: string;
        iteratorVariable?: string;
        shape?: "rounded" | "capsule" | "square";
    };
    selected?: boolean;
}

export function LoopNode({ data, selected }: LoopNodeProps) {
    return (
        <BaseWorkflowNode
            label={data?.label}
            defaultLabel="For Each"
            selected={selected}
            nodeType="Loop"
            icon={Repeat}
            shape={data.shape}
            bgColor=""
            borderColor=""
            accentColor="text-indigo-400"
            labelColor="text-indigo-50"
            resizerColor="#6366f1"
            resizerBorderClass="!border-indigo-500"
            iconBgColor=""
            handles={[
                {
                    type: "target",
                    position: Position.Top,
                    className: "!w-4 !h-4 !bg-indigo-400 border-2 border-white hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "body",
                    style: { left: '30%' },
                    className: "!w-4 !h-4 !bg-indigo-400 border-2 border-white hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    id: "done",
                    style: { left: '70%' },
                    className: "!w-4 !h-4 !bg-slate-400 border-2 border-white hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
            footer={
                <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-tighter px-2 relative z-10 w-full">
                    <span className="text-indigo-400">Each</span>
                    <span className="text-slate-500">Done</span>
                </div>
            }
        />
    );
}
