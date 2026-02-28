"use client";

import { useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    BackgroundVariant,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    ConnectionMode,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Save,
    Play,
    Pause,
    Loader2,
    Bug,
    Zap,
    Maximize,
    Minus,
    Plus,
    Lock,
    Unlock,
    MousePointer2,
    PenTool,
    Image as ImageIcon,
} from "lucide-react";
import { activateWorkflow, pauseWorkflow, updateWorkflow } from "@/actions/crm/workflows";
import { toast } from "sonner";

// Custom node components
import { TriggerNode } from "./nodes/TriggerNode";
import { DelayNode } from "./nodes/DelayNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ScreenNode } from "./nodes/ScreenNode";
import { UpdateRecordNode } from "./nodes/UpdateRecordNode";
import { LoopNode } from "./nodes/LoopNode";
import { ApprovalNode } from "./nodes/ApprovalNode";
import { MediaNode } from "./nodes/MediaNode";
import { NodePalette } from "./NodePalette";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { DebugPanel, ExecutionLog, ExecutionStep } from "./DebugPanel";

interface Workflow {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    trigger_type: string;
    flow_type?: string;
    nodes: unknown;
    edges: unknown;
}

interface WorkflowEditorProps {
    workflow: Workflow;
}

// Use Record<string, any> to satisfy React Flow's flexible node type requirements
const nodeTypes: Record<string, any> = {
    trigger: TriggerNode,
    delay: DelayNode,
    action: ActionNode,
    condition: ConditionNode,
    screen: ScreenNode,
    updateRecord: UpdateRecordNode,
    loop: LoopNode,
    approval: ApprovalNode,
    media: MediaNode,
};

function WorkflowEditorInner({ workflow }: WorkflowEditorProps) {
    const router = useRouter();
    const { fitView, zoomIn, zoomOut } = useReactFlow();

    const [saving, setSaving] = useState(false);
    const [activating, setActivating] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [debugOpen, setDebugOpen] = useState(false);
    const [execution, setExecution] = useState<ExecutionLog | null>(null);
    const [running, setRunning] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Parse nodes and edges from workflow
    const initialNodes = useMemo(() => {
        try {
            return (workflow.nodes as Node[]) || [];
        } catch {
            return [];
        }
    }, [workflow.nodes]);

    const initialEdges = useMemo(() => {
        try {
            return (workflow.edges as Edge[]) || [];
        } catch {
            return [];
        }
    }, [workflow.edges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { strokeWidth: 3, stroke: "#06b6d4" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" }
        }, eds)),
        [setEdges]
    );

    // Node click ? open config panel
    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    // Close config panel
    const closeConfigPanel = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    // Update node data from the config panel
    const handleUpdateNode = useCallback(
        (nodeId: string, newData: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return { ...n, data: newData };
                    }
                    return n;
                })
            );
        },
        [setNodes]
    );

    // Canvas click ? deselect
    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const result = await updateWorkflow(workflow.id, {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
        });

        if (result.success) {
            toast.success("FlowState saved");
        } else {
            toast.error(result.error || "Failed to save");
        }
        setSaving(false);
    };

    const handleToggleStatus = async () => {
        setActivating(true);

        await updateWorkflow(workflow.id, {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges))
        });

        const result = workflow.status === "ACTIVE"
            ? await pauseWorkflow(workflow.id)
            : await activateWorkflow(workflow.id);

        if (result.success) {
            toast.success(workflow.status === "ACTIVE" ? "FlowState paused" : "FlowState activated");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update status");
        }
        setActivating(false);
    };

    const addNode = (type: string, label: string) => {
        const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type: type === "note" || type === "image" || type === "svg" ? "media" : type,
            position: {
                x: 400 + Math.random() * 50,
                y: 200 + nodes.length * 50
            },
            data: {
                label,
                shape: "rounded",
                type: type === "note" || type === "image" || type === "svg" ? type : undefined,
                content: type === "note" ? "" : undefined,
                url: type === "image" ? "" : undefined,
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ============ RUN / DEBUG ============

    const simulateExecution = useCallback(async () => {
        setRunning(true);
        setDebugOpen(true);

        const now = Date.now();
        const log: ExecutionLog = {
            id: `exec-${now}`,
            flowId: workflow.id,
            flowName: workflow.name,
            status: "running",
            startTime: now,
            steps: [],
            triggerData: { trigger_type: workflow.trigger_type, flow_type: workflow.flow_type || "AUTO_FLOW" },
        };
        setExecution({ ...log });

        // Walk nodes in topological-ish order (simplified: just follow edges from trigger)
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const visited = new Set<string>();
        const queue: string[] = [];

        // Find the trigger node
        const trigger = nodes.find((n) => n.type === "trigger");
        if (trigger) queue.push(trigger.id);

        const getOutgoingNodeIds = (nodeId: string): string[] => {
            return edges
                .filter((e) => e.source === nodeId)
                .map((e) => e.target)
                .filter((id) => !visited.has(id));
        };

        let hasError = false;

        while (queue.length > 0 && !hasError) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const currentNode = nodeMap.get(currentId);
            if (!currentNode) continue;

            const stepStart = Date.now();
            const step: ExecutionStep = {
                nodeId: currentId,
                nodeType: currentNode.type || "unknown",
                label: (currentNode.data as Record<string, string>)?.label || currentId,
                status: "running",
                startTime: stepStart,
                inputData: currentNode.data as Record<string, unknown>,
            };

            log.steps.push(step);
            setExecution({ ...log });

            // Simulate processing time
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

            // Check for missing config ? simulate error
            const data = currentNode.data as Record<string, unknown>;
            if (currentNode.type === "action") {
                const actionType = data.actionType as string;
                if (actionType === "send_email" && !data.emailTo) {
                    step.status = "failed";
                    step.error = "Email recipient (To) is not configured";
                    step.endTime = Date.now();
                    log.status = "failed";
                    log.endTime = Date.now();
                    hasError = true;
                    setExecution({ ...log });
                    continue;
                }
            }

            if (currentNode.type === "condition") {
                const conditions = data.conditions as Array<{ field: string }>;
                if (!conditions || conditions.length === 0) {
                    step.status = "failed";
                    step.error = "No conditions defined for decision node";
                    step.endTime = Date.now();
                    log.status = "failed";
                    log.endTime = Date.now();
                    hasError = true;
                    setExecution({ ...log });
                    continue;
                }

                // Simulate: take the "true" branch
                step.branch = "true";
                step.outputData = { evaluatedTo: true };
            }

            if (currentNode.type === "approval") {
                step.branch = "approved";
                step.outputData = { decision: "approved", approver: "manager@team.com" };
            }

            if (currentNode.type === "loop") {
                step.branch = "body";
                step.outputData = { iterationCount: 3 };
            }

            if (currentNode.type === "delay") {
                step.outputData = {
                    duration: data.duration || 1,
                    unit: data.unit || "minutes",
                    note: "Simulated (skipped wait)"
                };
            }

            if (currentNode.type === "updateRecord") {
                step.outputData = {
                    operation: data.operation || "UPDATE",
                    objectType: data.objectType || "Unknown",
                    recordsAffected: Math.floor(Math.random() * 5) + 1,
                };
            }

            if (currentNode.type === "screen") {
                step.outputData = { userInput: { status: "(simulated input)" } };
            }

            step.status = "completed";
            step.endTime = Date.now();
            setExecution({ ...log });

            // Queue outgoing nodes
            const outgoing = getOutgoingNodeIds(currentId);
            for (const nextId of outgoing) {
                queue.push(nextId);
            }
        }

        if (!hasError) {
            log.status = "completed";
            log.endTime = Date.now();
        }
        setExecution({ ...log });
        setRunning(false);

        if (log.status === "completed") {
            toast.success(`FlowState executed ? ${log.steps.length} steps completed`);
        } else {
            toast.error("FlowState execution failed. Check debug console.");
        }
    }, [nodes, edges, workflow]);

    const handleHighlightNode = useCallback(
        (nodeId: string) => {
            setSelectedNodeId(nodeId);
            // Center on node
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
                setNodes((nds) =>
                    nds.map((n) => ({
                        ...n,
                        selected: n.id === nodeId,
                    }))
                );
            }
        },
        [nodes, setNodes]
    );

    const statusBadge: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
        DRAFT: { label: "Draft", variant: "secondary" },
        ACTIVE: { label: "Active", variant: "default" },
        PAUSED: { label: "Paused", variant: "outline" },
        ARCHIVED: { label: "Archived", variant: "destructive" },
    };

    return (
        <div className="flex flex-col h-screen bg-[#06080a] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0c0e]/80 backdrop-blur-xl shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/crm/workflows")}
                        className="hover:bg-white/5"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-1.5 whitespace-nowrap">{workflow.name}</h1>
                            <Badge variant={statusBadge[workflow.status]?.variant || "secondary"} className="text-[10px] py-0 px-1.5 h-4">
                                {statusBadge[workflow.status]?.label || workflow.status}
                            </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            FlowState Editor
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Run Button */}
                    <Button
                        variant="outline"
                        onClick={simulateExecution}
                        disabled={running || nodes.length === 0}
                        className="gap-2 h-9 border-white/10 bg-white/5"
                    >
                        {running ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">{running ? "Running..." : "Run Flow"}</span>
                    </Button>

                    <Button variant="outline" onClick={handleSave} disabled={saving} className="h-9 border-white/10 bg-white/5 gap-2">
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 text-cyan-400" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">Save</span>
                    </Button>
                    <Button
                        onClick={handleToggleStatus}
                        disabled={activating}
                        variant={workflow.status === "ACTIVE" ? "outline" : "default"}
                        className={`h-9 gap-2 ${workflow.status === "ACTIVE" ? "border-white/10 bg-white/5" : "bg-cyan-500 hover:bg-cyan-400 text-black"}`}
                    >
                        {activating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : workflow.status === "ACTIVE" ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">{workflow.status === "ACTIVE" ? "Pause" : "Activate"}</span>
                    </Button>
                </div>
            </div>

            {/* Main area: Canvas + Config Panel */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Canvas */}
                <div className="flex-1 relative flex flex-col min-w-0">
                    <div className="flex-1 relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            colorMode="dark"
                            fitView
                            snapToGrid
                            snapGrid={[15, 15]}
                            defaultEdgeOptions={{
                                animated: true,
                                style: { stroke: "#06b6d4", strokeWidth: 3 },
                                markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
                            }}
                            nodesDraggable={!isLocked}
                            nodesConnectable={!isLocked}
                            elementsSelectable={!isLocked}
                            connectionMode={ConnectionMode.Loose}
                            selectionMode={isLocked ? undefined : 0 as any} // Allow selection unless locked
                            connectionLineStyle={{ stroke: "#06b6d4", strokeWidth: 3 }}
                        >
                            <Background variant={BackgroundVariant.Dots} gap={25} size={1} color="#ffffff10" />

                            <Controls
                                showInteractive={false}
                                position="bottom-right"
                                className="bg-[#0f1115] border border-white/10 rounded-lg overflow-hidden [&_button]:!bg-[#0f1115] [&_button]:!border-white/5 [&_button:hover]:!bg-white/5 [&_svg]:!fill-white"
                            />

                            {/* Node Palette */}
                            <Panel position="top-left" className="ml-6 mt-6">
                                <NodePalette onAddNode={addNode} />
                            </Panel>

                            {/* Global Toolbar */}
                            <Panel position="top-center" className="mt-6">
                                <div className="flex items-center gap-1 p-1 bg-[#0f1115]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-white/10"
                                        onClick={() => fitView()}
                                        title="Fit View"
                                    >
                                        <Maximize className="w-4 h-4" />
                                    </Button>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-white/10"
                                        onClick={() => zoomOut()}
                                        title="Zoom Out"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-white/10"
                                        onClick={() => zoomIn()}
                                        title="Zoom In"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <Button
                                        variant={isLocked ? "secondary" : "ghost"}
                                        size="icon"
                                        className={`h-8 w-8 rounded-full transition-colors ${isLocked ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" : "hover:bg-white/10"}`}
                                        onClick={() => setIsLocked(!isLocked)}
                                        title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                                    >
                                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </Button>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-white/10"
                                        onClick={() => setDebugOpen(!debugOpen)}
                                        title="Debug Logs"
                                    >
                                        <Bug className={`w-4 h-4 ${debugOpen ? "text-cyan-400" : ""}`} />
                                    </Button>
                                </div>
                            </Panel>

                            {/* Floating Stats */}
                            <Panel position="bottom-left" className="ml-6 mb-6">
                                <div className="px-3 py-1.5 bg-[#0f1115]/80 backdrop-blur-sm border border-white/5 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <MousePointer2 className="w-3 h-3" />
                                        <span>{nodes.length} Steps</span>
                                    </div>
                                    <div className="w-px h-2 bg-white/10" />
                                    <div className="flex items-center gap-1.5">
                                        <Zap className="w-3 h-3" />
                                        <span>{edges.length} Links</span>
                                    </div>
                                </div>
                            </Panel>
                        </ReactFlow>
                    </div>

                    {/* Debug Panel (bottom of canvas) */}
                    <DebugPanel
                        execution={execution}
                        isOpen={debugOpen}
                        onClose={() => setDebugOpen(false)}
                        onHighlightNode={handleHighlightNode}
                        onClear={() => setExecution(null)}
                    />
                </div>

                {/* Node Config Side Panel */}
                {selectedNode && (
                    <div className="w-[350px] border-l border-white/5 bg-[#0a0c0e]/95 backdrop-blur-xl shrink-0 z-40 overflow-y-auto">
                        <NodeConfigPanel
                            node={selectedNode}
                            onClose={closeConfigPanel}
                            onUpdateNode={handleUpdateNode}
                            allNodes={nodes}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export function WorkflowEditor({ workflow }: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <WorkflowEditorInner workflow={workflow} />
        </ReactFlowProvider>
    );
}
