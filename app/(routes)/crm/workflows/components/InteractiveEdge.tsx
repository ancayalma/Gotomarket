import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useReactFlow } from "@xyflow/react";
import { Plus, X } from "lucide-react";

export function InteractiveEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const { setEdges, setNodes, getNodes } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 20,
    });

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        setEdges((es) => es.filter((e) => e.id !== id));
    };

    const onAddNode = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        const nodes = getNodes();
        const newNodeId = `action-${Date.now()}`;

        const newNode = {
            id: newNodeId,
            type: "action",
            position: { x: labelX - 100, y: labelY - 30 },
            data: { label: "New Step", shape: "rounded" },
        };

        setNodes((nds) => [...nds, newNode]);

        // Remove current edge and add two new ones
        setEdges((eds) => {
            const currentEdge = eds.find(e => e.id === id);
            if (!currentEdge) return eds;

            const newEdges = [
                {
                    id: `e-${currentEdge.source}-${newNodeId}`,
                    source: currentEdge.source,
                    target: newNodeId,
                    animated: true,
                    type: "interactive",
                },
                {
                    id: `e-${newNodeId}-${currentEdge.target}`,
                    source: newNodeId,
                    target: currentEdge.target,
                    animated: true,
                    type: "interactive",
                }
            ];

            return [...eds.filter(e => e.id !== id), ...newEdges];
        });
    };

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 4,
                    stroke: "#06b6d4",
                    filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))"
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex items-center gap-1 group"
                >
                    <button
                        className="w-6 h-6 bg-[#0f1115] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-cyan-400 hover:border-cyan-500/50 transition-[color,background-color,border-color,transform] hover:scale-125 shadow-2xl"
                        onClick={onAddNode}
                        title="Insert Step"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        className="w-6 h-6 bg-[#0f1115] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-rose-400 hover:border-rose-500/50 transition-[color,background-color,border-color,transform] hover:scale-125 shadow-2xl opacity-0 group-hover:opacity-100"
                        onClick={onEdgeClick}
                        title="Delete Link"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
