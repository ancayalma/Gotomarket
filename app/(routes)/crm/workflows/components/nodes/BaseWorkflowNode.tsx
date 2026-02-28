import { Handle, Position, NodeResizer } from "@xyflow/react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BaseWorkflowNode — Composition Pattern: Compound Component
 *
 * Extracts the shared structure from 7 workflow node components:
 * TriggerNode, ActionNode, ConditionNode, DelayNode, ScreenNode,
 * UpdateRecordNode, and MediaNode.
 *
 * Each node had identical code for:
 *   - Shape calculation (rounded/capsule/square)
 *   - NodeResizer rendering when selected
 *   - Handle positioning (top/bottom)
 *   - Icon + label layout
 *
 * This reduces ~350 lines of duplicated code to a single configurable
 * component, and makes adding new node types trivial.
 */

export type NodeShape = "rounded" | "capsule" | "square";

interface HandleConfig {
    type: "source" | "target";
    position: Position;
    id?: string;
    style?: React.CSSProperties;
    className: string;
}

interface BaseWorkflowNodeProps {
    // Node data
    label?: string;
    defaultLabel: string;
    selected?: boolean;

    // Theming
    nodeType: string;          // e.g. "Trigger", "Action", "Decision"
    icon: LucideIcon;
    shape?: NodeShape;
    bgColor: string;           // e.g. "bg-[#0c1a12]" or "bg-gradient-to-br from-orange-500 to-red-500"
    borderColor: string;       // e.g. "border-emerald-500/50"
    accentColor: string;       // e.g. "text-emerald-400" (for icon and label)
    labelColor: string;        // e.g. "text-emerald-50" (for main label text)
    resizerColor: string;      // e.g. "#10b981"
    resizerBorderClass: string; // e.g. "!border-emerald-500"

    // Icon background
    iconBgColor: string;       // e.g. "bg-emerald-500/20"

    // Handles
    handles: HandleConfig[];

    // Optional footer (e.g. True/False labels on ConditionNode)
    footer?: React.ReactNode;

    // Additional content (e.g. field list on ScreenNode)
    children?: React.ReactNode;

    // Layout variant
    layout?: "row" | "column";  // "row" = flex items-center, "column" = flex-col justify-center
}

export function BaseWorkflowNode({
    label,
    defaultLabel,
    selected,
    nodeType,
    icon: Icon,
    shape = "rounded",
    bgColor,
    borderColor,
    accentColor,
    labelColor,
    resizerColor,
    resizerBorderClass,
    iconBgColor,
    handles,
    footer,
    children,
    layout = "row",
}: BaseWorkflowNodeProps) {
    const shapeClass =
        shape === "capsule" ? "rounded-full" :
            shape === "square" ? "rounded-none" :
                "rounded-lg";

    const layoutClass = layout === "column"
        ? "flex flex-col justify-center"
        : "flex items-center";

    return (
        <div className={cn(
            "group px-4 py-3 shadow-lg w-full h-full relative",
            shapeClass,
            bgColor,
            `border-2 ${borderColor}`,
            layoutClass,
        )}>
            {selected && (
                <NodeResizer
                    color={resizerColor}
                    isVisible={selected}
                    minWidth={180}
                    minHeight={layout === "column" ? 80 : 60}
                    handleClassName={cn("!w-2 !h-2 !bg-white", resizerBorderClass)}
                />
            )}

            {/* Render all handles */}
            {handles.map((handle, idx) => (
                <Handle
                    key={handle.id || `${handle.type}-${handle.position}-${idx}`}
                    type={handle.type}
                    position={handle.position}
                    id={handle.id}
                    style={handle.style}
                    className={handle.className}
                />
            ))}

            {/* Icon + Label */}
            <div className="flex items-center gap-2 w-full">
                <div className={cn("p-1.5 rounded", iconBgColor)}>
                    <Icon className={cn("h-4 w-4", accentColor)} />
                </div>
                <div>
                    <div className={cn("text-[10px] font-bold uppercase tracking-wider", accentColor, "opacity-50")}>
                        {nodeType}
                    </div>
                    <div className={cn("text-sm font-black italic tracking-tight", labelColor)}>
                        {label || defaultLabel}
                    </div>
                </div>
            </div>

            {/* Optional additional content */}
            {children}

            {/* Optional footer (e.g. True/False labels) */}
            {footer}
        </div>
    );
}
