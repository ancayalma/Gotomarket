import { Position } from "@xyflow/react";
import { Database } from "lucide-react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";

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

    return (
        <BaseWorkflowNode
            label={data?.label || data?.objectType}
            defaultLabel="Record Op"
            selected={selected}
            nodeType={`${op} Record`}
            icon={Database}
            shape={data.shape}
            bgColor="bg-[#0c1a1a]"
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
                    className: "!w-4 !h-4 !bg-cyan-400 border-2 border-[#0c1a1a] hover:!scale-125 transition-transform cursor-crosshair !-top-2",
                },
                {
                    type: "source",
                    position: Position.Bottom,
                    className: "!w-4 !h-4 !bg-cyan-400 border-2 border-[#0c1a1a] hover:!scale-125 transition-transform cursor-crosshair !-bottom-2",
                },
            ]}
        />
    );
}
