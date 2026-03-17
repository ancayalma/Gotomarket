/**
 * Sandbox Service
 *
 * Manages sandbox environments for testing configuration changes
 * (workflows, validation rules, custom objects, page layouts)
 * in isolation before deploying to production.
 */

import { prismadb } from "@/lib/prisma";

type EntityType = "crm_Workflow" | "ValidationRule" | "CustomObjectDefinition" | "PageLayout";

const ENTITY_MODELS: Record<EntityType, string> = {
    crm_Workflow: "crm_Workflow",
    ValidationRule: "validationRule",
    CustomObjectDefinition: "customObjectDefinition",
    PageLayout: "pageLayout",
};

/**
 * Create a new sandbox and clone active configuration into it.
 */
export async function createSandbox(
    teamId: string,
    createdBy: string,
    name: string,
    description?: string
) {
    // Create the sandbox record
    const sandbox = await prismadb.sandbox.create({
        data: {
            name,
            description,
            team_id: teamId,
            created_by: createdBy,
            status: "ACTIVE",
            cloned_entity_ids: {},
        },
    });

    const clonedIds: Record<string, string[]> = {};

    // Clone workflows
    const workflows = await prismadb.crm_Workflow.findMany({
        where: { team_id: teamId, sandbox_id: null },
    });
    const clonedWorkflowIds: string[] = [];
    for (const wf of workflows) {
        const clone = await prismadb.crm_Workflow.create({
            data: {
                name: wf.name,
                description: wf.description,
                status: wf.status,
                trigger_type: wf.trigger_type,
                trigger_config: wf.trigger_config ?? undefined,
                flow_type: wf.flow_type,
                object_type: wf.object_type,
                record_trigger_event: wf.record_trigger_event,
                record_filter: wf.record_filter ?? undefined,
                screen_config: wf.screen_config ?? undefined,
                nodes: wf.nodes,
                edges: wf.edges,
                team_id: teamId,
                created_by: createdBy,
                webhook_token: null,
                sandbox_id: sandbox.id,
            },
        });
        clonedWorkflowIds.push(clone.id);

        await prismadb.sandboxDeployLog.create({
            data: {
                sandbox_id: sandbox.id,
                action: "CLONE",
                entity_type: "crm_Workflow",
                entity_id: clone.id,
                entity_name: wf.name,
                performed_by: createdBy,
            },
        });
    }
    clonedIds.workflows = clonedWorkflowIds;

    // Clone validation rules
    const rules = await prismadb.validationRule.findMany({
        where: { team_id: teamId, sandbox_id: null },
    });
    const clonedRuleIds: string[] = [];
    for (const rule of rules) {
        const clone = await prismadb.validationRule.create({
            data: {
                name: rule.name,
                description: rule.description,
                is_active: rule.is_active,
                object_type: rule.object_type,
                formula: rule.formula,
                error_message: rule.error_message,
                trigger_on: rule.trigger_on,
                order: rule.order,
                createdBy: createdBy,
                team_id: teamId,
                sandbox_id: sandbox.id,
            },
        });
        clonedRuleIds.push(clone.id);

        await prismadb.sandboxDeployLog.create({
            data: {
                sandbox_id: sandbox.id,
                action: "CLONE",
                entity_type: "ValidationRule",
                entity_id: clone.id,
                entity_name: rule.name,
                performed_by: createdBy,
            },
        });
    }
    clonedIds.validationRules = clonedRuleIds;

    // Update sandbox with cloned entity IDs
    await prismadb.sandbox.update({
        where: { id: sandbox.id },
        data: { cloned_entity_ids: clonedIds },
    });

    return sandbox;
}

/**
 * Get diff between sandbox and production configuration.
 */
export async function diffSandbox(sandboxId: string) {
    const sandbox = await prismadb.sandbox.findUnique({
        where: { id: sandboxId },
    });
    if (!sandbox) return null;

    const diffs: Array<{
        entity_type: EntityType;
        entity_name: string;
        sandbox_id: string;
        changes: string[];
    }> = [];

    // Get all modify/clone logs for this sandbox
    const logs = await prismadb.sandboxDeployLog.findMany({
        where: { sandbox_id: sandboxId },
        orderBy: { performedAt: "desc" },
    });

    // Group by entity
    const entityMap = new Map<string, typeof logs>();
    for (const log of logs) {
        const key = `${log.entity_type}:${log.entity_id}`;
        if (!entityMap.has(key)) entityMap.set(key, []);
        entityMap.get(key)!.push(log);
    }

    for (const [key, entityLogs] of entityMap) {
        const modifyLogs = entityLogs.filter(l => l.action === "MODIFY");
        if (modifyLogs.length > 0) {
            diffs.push({
                entity_type: entityLogs[0].entity_type as EntityType,
                entity_name: entityLogs[0].entity_name || "Unknown",
                sandbox_id: entityLogs[0].entity_id,
                changes: modifyLogs.map(l => {
                    const diff = l.diff as Record<string, unknown>;
                    return JSON.stringify(diff);
                }),
            });
        }
    }

    return {
        sandbox,
        logs,
        diffs,
        stats: {
            totalCloned: logs.filter(l => l.action === "CLONE").length,
            totalModified: logs.filter(l => l.action === "MODIFY").length,
        },
    };
}

/**
 * Promote sandbox changes to production.
 * Replaces production configs with sandbox versions.
 */
export async function promoteSandbox(sandboxId: string, promotedBy: string) {
    const sandbox = await prismadb.sandbox.findUnique({
        where: { id: sandboxId },
    });
    if (!sandbox || sandbox.status !== "ACTIVE") {
        return { success: false, error: "Sandbox not found or not active" };
    }

    const teamId = sandbox.team_id;

    // Promote workflows: delete production, update sandbox to production
    const sandboxWorkflows = await prismadb.crm_Workflow.findMany({
        where: { team_id: teamId, sandbox_id: sandboxId },
    });

    for (const wf of sandboxWorkflows) {
        // Remove sandbox flag (promote to production)
        await prismadb.crm_Workflow.update({
            where: { id: wf.id },
            data: { sandbox_id: null },
        });

        await prismadb.sandboxDeployLog.create({
            data: {
                sandbox_id: sandboxId,
                action: "PROMOTE",
                entity_type: "crm_Workflow",
                entity_id: wf.id,
                entity_name: wf.name,
                performed_by: promotedBy,
            },
        });
    }

    // Promote validation rules
    const sandboxRules = await prismadb.validationRule.findMany({
        where: { team_id: teamId, sandbox_id: sandboxId },
    });

    for (const rule of sandboxRules) {
        await prismadb.validationRule.update({
            where: { id: rule.id },
            data: { sandbox_id: null },
        });

        await prismadb.sandboxDeployLog.create({
            data: {
                sandbox_id: sandboxId,
                action: "PROMOTE",
                entity_type: "ValidationRule",
                entity_id: rule.id,
                entity_name: rule.name,
                performed_by: promotedBy,
            },
        });
    }

    // Mark sandbox as promoted
    await prismadb.sandbox.update({
        where: { id: sandboxId },
        data: {
            status: "PROMOTED",
            promotedAt: new Date(),
            promotedBy,
        },
    });

    return {
        success: true,
        promoted: {
            workflows: sandboxWorkflows.length,
            validationRules: sandboxRules.length,
        },
    };
}

/**
 * Discard a sandbox, deleting all cloned records.
 */
export async function discardSandbox(sandboxId: string, discardedBy: string) {
    const sandbox = await prismadb.sandbox.findUnique({
        where: { id: sandboxId },
    });
    if (!sandbox || sandbox.status !== "ACTIVE") {
        return { success: false, error: "Sandbox not found or not active" };
    }

    const teamId = sandbox.team_id;

    // Delete sandbox workflows
    await prismadb.crm_Workflow.deleteMany({
        where: { team_id: teamId, sandbox_id: sandboxId },
    });

    // Delete sandbox validation rules
    await prismadb.validationRule.deleteMany({
        where: { team_id: teamId, sandbox_id: sandboxId },
    });

    // Log discard
    await prismadb.sandboxDeployLog.create({
        data: {
            sandbox_id: sandboxId,
            action: "DISCARD",
            entity_type: "Sandbox",
            entity_id: sandboxId,
            entity_name: sandbox.name,
            performed_by: discardedBy,
        },
    });

    // Mark as discarded
    await prismadb.sandbox.update({
        where: { id: sandboxId },
        data: { status: "DISCARDED" },
    });

    return { success: true };
}
