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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
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
import { VaruniNode } from "./nodes/VaruniNode";
import { useHelperLines } from "./useHelperLines";
import { Copy, Clipboard, Undo, Redo, Trash2, LayoutTemplate } from "lucide-react";
import { WORKFLOW_PRESETS } from "./WorkflowPresets";

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
    allWorkflows: Workflow[];
    teamId: string;
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
    varuni: VaruniNode,
};

const edgeTypes = {
    interactive: InteractiveEdge,
};

function WorkflowEditorInner({ workflow, allWorkflows, teamId }: WorkflowEditorProps) {
    const router = useRouter();
    const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

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

    const takeSnapshot = useCallback(() => {
        setHistory(prev => [...prev.slice(-49), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setRedoStack([]);
    }, [nodes, edges]);

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

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');
            const rawData = event.dataTransfer.getData('application/reactflow-data');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            let initialData: Record<string, unknown> = {};
            try { if (rawData) initialData = JSON.parse(rawData); } catch { /* ignore */ }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `${type}-${Date.now()}`,
                type: type === "note" || type === "image" || type === "svg" ? "media" : type,
                position,
                data: { 
                    label, 
                    shape: 'rounded',
                    type: type === "note" || type === "image" || type === "svg" ? type : undefined,
                    ...initialData,
                },
            };

            takeSnapshot();
            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes, takeSnapshot]
    );

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

    const addNode = (type: string, label: string, initialData?: Record<string, unknown>) => {
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
                ...(initialData || {}),
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };


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

    const exportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `flowstate-${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("JSON exported successfully");
    };

    const importJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target?.result as string);
                    if (parsed.nodes && parsed.edges) {
                        takeSnapshot();
                        setNodes(parsed.nodes);
                        setEdges(parsed.edges);
                        toast.success("JSON loaded successfully. Remember to save!");
                    } else {
                        toast.error("Invalid JSON format");
                    }
                } catch (err) {
                    toast.error("Error reading JSON file");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const loadPreset = (presetId: string) => {
        const preset = WORKFLOW_PRESETS.find(p => p.id === presetId);
        if (!preset) return;
        
        if (nodes.length > 1 && !confirm(`This will overwrite your existing ${nodes.length} nodes. Continue?`)) {
            return;
        }

        takeSnapshot();
        // Reset the canvas then stamp the preset in
        setNodes(preset.nodes as Node[]);
        setEdges(preset.edges as Edge[]);
        toast.success(`Loaded ${preset.name} Template!`);
        setTimeout(() => fitView({ padding: 0.2 }), 100);
    };

    return (
        <div className="flex flex-col h-full absolute inset-0 w-full bg-[#06080a] overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-white/5 bg-[#0a0c0e]/80 backdrop-blur-xl shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/crm/workflows")} className="hover:bg-white/5 shrink-0 hidden sm:flex">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="hidden md:block shrink-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">FlowState</p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center w-full mt-2 sm:mt-0 sm:w-auto relative group">
                    <div className="absolute inset-0 bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all rounded-full pointer-events-none" />
                    
                    <div className="flex items-center gap-2 border border-white/10 bg-black/40 backdrop-blur rounded-xl px-2 py-1 shadow-2xl relative z-10 w-full sm:w-auto overflow-hidden">
                        <Select 
                            value={workflow.id} 
                            onValueChange={(val) => {
                                if (val === workflow.id) return;
                                router.push(`/crm/workflows/${val}`);
                            }}
                        >
                            <SelectTrigger className="h-9 border-0 bg-transparent shadow-none w-[200px] sm:w-[280px] font-black italic tracking-tighter text-white uppercase text-lg sm:text-xl truncate justify-center hover:bg-white/5 hover:text-cyan-400 transition-colors focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f1115]/95 backdrop-blur-2xl border-white/10">
                                {allWorkflows.map(w => (
                                    <SelectItem key={w.id} value={w.id} className="cursor-pointer font-bold italic tracking-tight uppercase">
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="h-6 w-px bg-white/10 mx-2 shrink-0 hidden sm:block" />
                        
                        <Badge variant={statusBadge[workflow.status]?.variant || "secondary"} className="text-[10px] py-0 px-2 h-5 shrink-0 uppercase tracking-widest hidden sm:inline-flex">
                            {statusBadge[workflow.status]?.label || workflow.status}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden xl:flex items-center gap-2 mr-2 pr-4 border-r border-white/10">
                        {/* Editor Canvas Preset Switcher */}
                        <Select onValueChange={(val) => loadPreset(val)}>
                            <SelectTrigger className="h-9 w-[180px] bg-white/5 border-white/10 text-white font-bold tracking-tight text-xs uppercase hover:bg-white/10 focus:ring-0">
                                <div className="flex items-center gap-2 w-full">
                                    <LayoutTemplate className="h-4 w-4 text-cyan-400 shrink-0" />
                                    <span className="truncate">Load Template</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[300px] bg-[#0f1115]/95 backdrop-blur-2xl border-white/10 max-h-[70vh]">
                                {Array.from(new Set(WORKFLOW_PRESETS.map(p => p.category))).map(cat => (
                                    <SelectGroup key={cat}>
                                        <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 px-2 py-1 bg-white/5">
                                            {cat}
                                        </SelectLabel>
                                        {WORKFLOW_PRESETS.filter(p => p.category === cat).map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id} className="cursor-pointer py-2">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="font-bold text-primary tracking-tight">{preset.name}</span>
                                                    <span className="text-[10px] text-muted-foreground leading-tight whitespace-normal max-w-[260px] text-left">
                                                        {preset.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="h-6 w-px bg-white/10 mx-2 shrink-0 hidden 2xl:block" />

                        <Button variant="ghost" size="sm" onClick={importJSON} className="h-9 gap-2 text-muted-foreground hover:text-white">
                            <span className="text-xs font-bold uppercase tracking-wider hidden 2xl:inline">Import</span>
                            <span className="text-[10px] font-mono tracking-widest bg-white/5 px-2 py-1 rounded">JSON</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={exportJSON} className="h-9 gap-2 text-muted-foreground hover:text-white">
                            <span className="text-xs font-bold uppercase tracking-wider hidden 2xl:inline">Export</span>
                            <span className="text-[10px] font-mono tracking-widest bg-white/5 px-2 py-1 rounded">JSON</span>
                        </Button>
                    </div>

                    <Button variant="outline" onClick={simulateExecution} disabled={running || nodes.length === 0} className="gap-2 h-9 border-white/10 bg-white/5 hidden lg:flex">
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-orange-500" />}
                        <span className="text-xs font-bold uppercase tracking-wider">Run Flow</span>
                    </Button>
                    <Button variant="outline" onClick={handleSave} disabled={saving} className="h-9 border-white/10 bg-white/5 gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-cyan-400" />}
                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Save</span>
                    </Button>
                    <Button onClick={handleToggleStatus} disabled={activating} variant={workflow.status === "ACTIVE" ? "outline" : "default"} className={`h-9 gap-2 ${workflow.status === "ACTIVE" ? "border-white/10 bg-white/5" : "bg-cyan-500 hover:bg-cyan-400 text-black hidden sm:flex"}`}>
                        {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : workflow.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider">{workflow.status === "ACTIVE" ? "Pause" : "Activate"}</span>
                    </Button>
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex min-h-0 relative overflow-hidden">
                {/* Docked Left Sidebar - Node Palette */}
                <div className="hidden md:flex flex-col w-[260px] border-r border-white/5 bg-[#0a0c0e]/95 backdrop-blur-3xl z-40 relative">
                    <div className="flex-1 overflow-hidden p-4 h-full">
                         <NodePalette onAddNode={addNode} />
                    </div>
                </div>

                {/* Flow Canvas Area */}
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
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            colorMode="dark"
                            fitView
                            snapToGrid
                            snapGrid={[20, 20]}
                            defaultEdgeOptions={{
                                animated: workflow.status === "ACTIVE" || running,
                                type: "interactive",
                                style: { stroke: "#06b6d4", strokeWidth: 2, filter: "drop-shadow(0 0 5px rgba(6, 182, 212, 0.6))" },
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

                            <Controls position="bottom-right" className="bg-[#0f1115] border border-white/10 rounded-lg overflow-hidden [&_button]:!bg-[#0f1115] [&_button:hover]:!bg-white/5 shadow-2xl scale-110 mb-20 md:mb-0" />
                            <MiniMap position="bottom-right" className="!bg-[#0f1115]/80 !border-white/10 !rounded-xl m-8 h-[120px] w-[180px] hidden lg:block" nodeColor={(n) => n.type === 'trigger' ? '#f97316' : '#3b82f6'} />

                            {helperLines.v && <div className="absolute top-0 bottom-0 border-l border-cyan-500/50 z-50 pointer-events-none" style={{ left: helperLines.v }} />}
                            {helperLines.h && <div className="absolute left-0 right-0 border-t border-cyan-500/50 z-50 pointer-events-none" style={{ top: helperLines.h }} />}

                            <Panel position="top-center" className="mt-4 flex gap-2">
                                <div className="flex items-center gap-1 p-1.5 bg-[#0f1115]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={history.length === 0}><Undo className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0}><Redo className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copySelected}><Copy className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={paste}><Clipboard className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10" onClick={deleteSelected}><Trash2 className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10 hidden sm:block" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => fitView()} title="Fit View"><Maximize className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => zoomOut()} title="Zoom Out"><Minus className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => zoomIn()} title="Zoom In"><Plus className="w-4 h-4" /></Button>
                                    <Separator orientation="vertical" className="h-4 mx-1 bg-white/10" />
                                    <Button variant={isLocked ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setIsLocked(!isLocked)} title={isLocked ? "Unlock Canvas" : "Lock Canvas"}>{isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="h-4 w-4" />}</Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDebugOpen(!debugOpen)} title="Debug Logs"><Bug className={`w-4 h-4 ${debugOpen ? "text-cyan-400" : ""}`} /></Button>
                                </div>
                            </Panel>
                        </ReactFlow>
                    </div>
                    <DebugPanel execution={execution} isOpen={debugOpen} onClose={() => setDebugOpen(false)} onHighlightNode={handleHighlightNode} onClear={() => setExecution(null)} />
                </div>
                
                {/* Docked Right Sidebar - Node Config Panel */}
                {selectedNode && (
                    <div className="w-full sm:w-[320px] lg:w-[420px] shrink-0 border-l border-white/5 bg-[#0a0c0e]/95 backdrop-blur-3xl z-40 relative absolute sm:static inset-y-0 right-0 max-w-full">
                        <NodeConfigPanel node={selectedNode} onClose={closeConfigPanel} onUpdateNode={handleUpdateNode} allNodes={nodes} />
                    </div>
                )}
            </div>
        </div>
    );
}

export function WorkflowEditor({ workflow, allWorkflows, teamId }: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <WorkflowEditorInner workflow={workflow} allWorkflows={allWorkflows} teamId={teamId} />
        </ReactFlowProvider>
    );
}
