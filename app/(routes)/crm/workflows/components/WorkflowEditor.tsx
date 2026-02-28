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
    MiniMap,
    SelectionMode,
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
import { InteractiveEdge } from "./InteractiveEdge";
import { GroupNode } from "./nodes/GroupNode";
import { useHelperLines } from "./useHelperLines";
import { Copy, Clipboard, Undo, Redo, Trash2 } from "lucide-react";

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
    group: GroupNode,
};

const edgeTypes = {
    interactive: InteractiveEdge,
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
    const { helperLines, setHelperLines, calculateHelperLines } = useHelperLines();

    // History & Clipboard
    const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [redoStack, setRedoStack] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [clipboard, setClipboard] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);

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

    const onNodeDrag = useCallback(
        (_: any, node: Node) => {
            calculateHelperLines(node, nodes);
        },
        [nodes, calculateHelperLines]
    );

    const onNodeDragStop = useCallback(() => {
        setHelperLines({});
    }, [setHelperLines]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            type: "interactive",
            style: { strokeWidth: 4, stroke: "#06b6d4", filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" }
        }, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const closeConfigPanel = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

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
            dragHandle: type === "group" ? ".group-drag-handle" : undefined,
            position: {
                x: 400 + Math.random() * 50,
                y: 200 + nodes.length * 50
            },
            data: {
                label,
                shape: "rounded",
                type: type === "note" || type === "image" || type === "svg" ? type : undefined,
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const takeSnapshot = useCallback(() => {
        setHistory(prev => [...prev.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setRedoStack([]);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setRedoStack(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setNodes(previous.nodes);
        setEdges(previous.edges);
        setHistory(prev => prev.slice(0, -1));
        toast.info("Undo: Reverted changes");
    }, [history, nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setHistory(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setNodes(next.nodes);
        setEdges(next.edges);
        setRedoStack(prev => prev.slice(0, -1));
        toast.info("Redo: Applied forward");
    }, [redoStack, nodes, edges, setNodes, setEdges]);

    const copySelected = useCallback(() => {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);
        if (selectedNodes.length === 0) return;
        setClipboard({ nodes: JSON.parse(JSON.stringify(selectedNodes)), edges: JSON.parse(JSON.stringify(selectedEdges)) });
        toast.success(`Copied ${selectedNodes.length} objects`);
    }, [nodes, edges]);

    const paste = useCallback(() => {
        if (!clipboard) return;
        takeSnapshot();
        const idMap: Record<string, string> = {};
        const newNodes = clipboard.nodes.map(n => {
            const newId = `${n.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            idMap[n.id] = newId;
            return {
                ...n,
                id: newId,
                position: { x: n.position.x + 40, y: n.position.y + 40 },
                selected: true,
            };
        });

        const newEdges = clipboard.edges.map(e => ({
            ...e,
            id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            source: idMap[e.source] || e.source,
            target: idMap[e.target] || e.target,
            selected: true,
        }));

        setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
        setEdges(eds => [...eds.map(e => ({ ...e, selected: false })), ...newEdges]);
        toast.success(`Pasted ${newNodes.length} objects`);
    }, [clipboard, takeSnapshot, setNodes, setEdges]);

    const deleteSelected = useCallback(() => {
        takeSnapshot();
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
        toast.success("Deleted selected objects");
    }, [takeSnapshot, setNodes, setEdges]);

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

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const visited = new Set<string>();
        const queue: string[] = [];

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
            await new Promise((r) => setTimeout(r, 600));

            const data = currentNode.data as Record<string, unknown>;
            if (currentNode.type === "action" && data.actionType === "send_email" && !data.emailTo) {
                step.status = "failed";
                step.error = "Email (To) not configured";
                hasError = true;
            } else {
                step.status = "completed";
            }

            step.endTime = Date.now();
            setExecution({ ...log });
            if (!hasError) queue.push(...getOutgoingNodeIds(currentId));
        }

        log.status = hasError ? "failed" : "completed";
        log.endTime = Date.now();
        setExecution({ ...log });
        setRunning(false);
    }, [nodes, edges, workflow]);

    const handleHighlightNode = useCallback((nodeId: string) => {
        setSelectedNodeId(nodeId);
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
    }, [setNodes]);

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
                    <Button variant="ghost" size="icon" onClick={() => router.push("/crm/workflows")} className="hover:bg-white/5">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-1.5 whitespace-nowrap">{workflow.name}</h1>
                            <Badge variant={statusBadge[workflow.status]?.variant || "secondary"} className="text-[10px] py-0 px-1.5 h-4">
                                {statusBadge[workflow.status]?.label || workflow.status}
                            </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">FlowState Editor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={simulateExecution} disabled={running || nodes.length === 0} className="gap-2 h-9 border-white/10 bg-white/5">
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-orange-500" />}
                        <span className="text-xs font-bold uppercase tracking-wider">{running ? "Running..." : "Run Flow"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleSave} disabled={saving} className="h-9 border-white/10 bg-white/5 gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-cyan-400" />}
                        <span className="text-xs font-bold uppercase tracking-wider">Save</span>
                    </Button>
                    <Button onClick={handleToggleStatus} disabled={activating} variant={workflow.status === "ACTIVE" ? "outline" : "default"} className={`h-9 gap-2 ${workflow.status === "ACTIVE" ? "border-white/10 bg-white/5" : "bg-cyan-500 hover:bg-cyan-400 text-black"}`}>
                        {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : workflow.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider">{workflow.status === "ACTIVE" ? "Pause" : "Activate"}</span>
                    </Button>
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex min-h-0 relative">
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
                            onNodeDrag={onNodeDrag}
                            onNodeDragStop={onNodeDragStop}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            colorMode="dark"
                            fitView
                            snapToGrid
                            snapGrid={[20, 20]}
                            defaultEdgeOptions={{
                                animated: true,
                                type: "interactive",
                                style: { stroke: "#06b6d4", strokeWidth: 3, filter: "drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))" },
                                markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
                            }}
                            nodesDraggable={!isLocked}
                            nodesConnectable={!isLocked}
                            connectionMode={ConnectionMode.Loose}
                            selectionMode={SelectionMode.Partial}
                            proOptions={{ hideAttribution: true }}
                        >
                            <Background variant={BackgroundVariant.Lines} gap={40} size={1} color="#ffffff05" />
                            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff08" />

                            <Controls position="bottom-right" className="bg-[#0f1115] border border-white/10 rounded-lg overflow-hidden [&_button]:!bg-[#0f1115] [&_button:hover]:!bg-white/5 shadow-2xl scale-110" />
                            <MiniMap position="bottom-right" className="!bg-[#0f1115]/80 !border-white/10 !rounded-xl m-8 h-[120px] w-[180px]" nodeColor={(n) => n.type === 'trigger' ? '#f97316' : '#3b82f6'} />

                            {helperLines.v && <div className="absolute top-0 bottom-0 border-l border-cyan-500/50 z-50 pointer-events-none" style={{ left: helperLines.v }} />}
                            {helperLines.h && <div className="absolute left-0 right-0 border-t border-cyan-500/50 z-50 pointer-events-none" style={{ top: helperLines.h }} />}

                            <Panel position="top-left" className="ml-6 mt-6">
                                <NodePalette onAddNode={addNode} />
                            </Panel>

                            <Panel position="top-left" className="ml-[250px] mt-6 flex gap-2">
                                <div className="flex items-center gap-1 p-1.5 bg-[#0f1115]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={history.length === 0}><Undo className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0}><Redo className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copySelected}><Copy className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={paste}><Clipboard className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10" onClick={deleteSelected}><Trash2 className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView()} title="Fit View"><Maximize className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()} title="Zoom Out"><Minus className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()} title="Zoom In"><Plus className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10" />
                                    <Button variant={isLocked ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setIsLocked(!isLocked)} title={isLocked ? "Unlock Canvas" : "Lock Canvas"}>{isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="h-4 w-4" />}</Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDebugOpen(!debugOpen)} title="Debug Logs"><Bug className={`w-4 h-4 ${debugOpen ? "text-cyan-400" : ""}`} /></Button>
                                </div>
                            </Panel>

                            {selectedNode && (
                                <Panel position="top-right" className="h-full">
                                    <NodeConfigPanel node={selectedNode} onClose={closeConfigPanel} onUpdateNode={handleUpdateNode} allNodes={nodes} />
                                </Panel>
                            )}
                        </ReactFlow>
                    </div>
                    <DebugPanel execution={execution} isOpen={debugOpen} onClose={() => setDebugOpen(false)} onHighlightNode={handleHighlightNode} onClear={() => setExecution(null)} />
                </div>
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
