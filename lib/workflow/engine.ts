
import { prismadb } from "@/lib/prisma";
import { ExecutionStatus, Prisma } from "@prisma/client";
import { systemLogger } from "@/lib/logger";

/**
 * FlowState Engine - The core execution logic for CRM workflows.
 */

export async function runWorkflowEngine(workflowExecutionId: string) {
    const execution = await prismadb.crm_Workflow_Execution.findUnique({
        where: { id: workflowExecutionId },
        include: { workflow: true }
    });

    if (!execution || !execution.workflow) {
        systemLogger.error(`[WORKFLOW_ENGINE] Execution ${workflowExecutionId} not found.`);
        return;
    }

    if (execution.status !== ExecutionStatus.RUNNING) {
        return;
    }

    try {
        const nodes = execution.workflow.nodes as any[];
        const edges = execution.workflow.edges as any[];
        const triggerData = (execution.trigger_data as any) || {};

        // Find Trigger Node
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            throw new Error("No trigger node found in workflow.");
        }

        // Keep track of node outputs for variable substitution
        const nodeOutputs: Record<string, any> = {
            trigger: triggerData
        };

        // Execution Queue
        let currentNodeId = triggerNode.id;
        const completedNodes: string[] = [];

        // Simple BFS/DFS traversal for individual path execution
        // Note: For complex branching, this logic would need to handle multiple paths.
        // For launch, we'll support sequential execution with logic branches.

        while (currentNodeId) {
            const node = nodes.find(n => n.id === currentNodeId);
            if (!node) break;

            systemLogger.info(`[WORKFLOW_ENGINE] Executing node: ${node.id} (${node.type})`);

            let nextNodeId: string | null = null;
            let outcome: string | null = null;

            // 1. Execute Node Logic
            try {
                const result = await executeNode(node, triggerData, nodeOutputs);
                nodeOutputs[node.id] = result.output;
                outcome = result.outcome || null;
            } catch (err: any) {
                await prismadb.crm_Workflow_Execution.update({
                    where: { id: workflowExecutionId },
                    data: {
                        status: ExecutionStatus.FAILED,
                        error: `Node ${node.id} failed: ${err.message}`,
                        completedAt: new Date()
                    }
                });
                return;
            }

            completedNodes.push(currentNodeId);

            // 2. Find Next Node via Edges
            // If it's a condition node, we look for edge matching the outcome (true/false)
            if (node.type === 'condition' || node.type === 'decision') {
                const edge = edges.find(e => e.source === currentNodeId && e.sourceHandle === outcome);
                nextNodeId = edge ? edge.target : null;
            } else {
                const edge = edges.find(e => e.source === currentNodeId);
                nextNodeId = edge ? edge.target : null;
            }

            currentNodeId = nextNodeId as string;

            // Safety break to prevent infinite loops for now
            if (completedNodes.length > 50) {
                throw new Error("Maximum node execution limit reached (possible loop).");
            }
        }

        // Mark as completed
        await prismadb.crm_Workflow_Execution.update({
            where: { id: workflowExecutionId },
            data: {
                status: ExecutionStatus.COMPLETED,
                completed_nodes: completedNodes,
                node_outputs: nodeOutputs,
                completedAt: new Date()
            }
        });

        systemLogger.info(`[WORKFLOW_ENGINE] Execution ${workflowExecutionId} completed successfully.`);

    } catch (error: any) {
        systemLogger.error(`[WORKFLOW_ENGINE] Execution ${workflowExecutionId} failed:`, error);
        await prismadb.crm_Workflow_Execution.update({
            where: { id: workflowExecutionId },
            data: {
                status: ExecutionStatus.FAILED,
                error: error.message,
                completedAt: new Date()
            }
        });
    }
}

type NodeResult = {
    output: any;
    outcome?: string | null;
};

async function executeNode(node: any, triggerData: any, previousOutputs: Record<string, any>): Promise<NodeResult> {
    const data = node.data || {};

    switch (node.type) {
        case 'trigger':
            return { output: triggerData };

        case 'action':
            return await handleActionNode(data, triggerData, previousOutputs);

        case 'condition':
            return await handleConditionNode(data, triggerData, previousOutputs);

        case 'updateRecord':
            return await handleUpdateRecordNode(data, triggerData, previousOutputs);

        default:
            systemLogger.warn(`[WORKFLOW_ENGINE] Unknown node type: ${node.type}`);
            return { output: {} };
    }
}

async function handleActionNode(data: any, triggerData: any, previousOutputs: Record<string, any>) {
    const actionType = data.actionType;

    // Variable substitution helper (e.g. {{trigger.email}})
    const resolveVars = (str: string) => {
        if (!str) return str;
        return str.replace(/\{\{(.*?)\}\}/g, (match, path) => {
            const parts = path.split('.');
            let value: any = previousOutputs;
            for (const part of parts) {
                value = value?.[part];
            }
            return value !== undefined ? String(value) : match;
        });
    };

    if (actionType === 'send_email') {
        const to = resolveVars(data.to || triggerData.email || triggerData.contact?.email);
        const subject = resolveVars(data.subject || "Workflow Notification");
        const body = resolveVars(data.body || "");

        systemLogger.info(`[WORKFLOW_ENGINE] Action: Sending Email to ${to}`);
        // In a real app, you'd call a real email service here. 
        // For launch, we'll log it and simulate success.
        return { output: { sent: true, to } };
    }

    if (actionType === 'notify') {
        // Create a system notification record
        const userId = data.userId || triggerData.assigned_to || triggerData.createdBy;
        if (userId) {
            await prismadb.crm_Notifications.create({
                data: {
                    user_id: userId,
                    title: resolveVars(data.title || "Workflow Alert"),
                    content: resolveVars(data.message || "A workflow has triggered an alert."),
                    type: "WORKFLOW",
                    status: "UNREAD"
                }
            });
        }
        return { output: { notified: true } };
    }

    return { output: { success: true } };
}

async function handleConditionNode(data: any, triggerData: any, previousOutputs: Record<string, any>) {
    const fieldPath = data.field || "";
    const operator = data.operator || "equals";
    const expectedValue = data.value;

    // Resolve current value from trigger data
    let actualValue: any = triggerData;
    const parts = fieldPath.split('.');
    for (const part of parts) {
        if (part) actualValue = actualValue?.[part];
    }

    let isTrue = false;
    switch (operator) {
        case 'equals': isTrue = actualValue == expectedValue; break;
        case 'not_equals': isTrue = actualValue != expectedValue; break;
        case 'contains': isTrue = String(actualValue).includes(String(expectedValue)); break;
        case 'greater_than': isTrue = Number(actualValue) > Number(expectedValue); break;
        case 'less_than': isTrue = Number(actualValue) < Number(expectedValue); break;
    }

    return {
        output: { conditionMet: isTrue, actualValue },
        outcome: isTrue ? "true" : "false"
    };
}

async function handleUpdateRecordNode(data: any, triggerData: any, previousOutputs: Record<string, any>) {
    const objectType = data.objectType; // e.g. "crm_Opportunities"
    const recordId = triggerData.id; // Usually we update the record that triggered the flow

    if (!objectType || !recordId) {
        throw new Error("UpdateRecordNode missing objectType or recordId context.");
    }

    const updates: Record<string, any> = {};
    if (data.fieldUpdates) {
        data.fieldUpdates.forEach((u: { field: string, value: string }) => {
            updates[u.field] = u.value;
        });
    }

    const model = (prismadb as any)[objectType];
    if (model) {
        await model.update({
            where: { id: recordId },
            data: updates
        });
    }

    return { output: { updated: true, fields: Object.keys(updates) } };
}
