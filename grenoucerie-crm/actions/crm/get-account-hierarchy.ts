import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export type AccountHierarchyNode = {
    id: string;
    name: string;
    type: string | null;
    industry: string | null;
    status: string | null;
    childCount: number;
    children: AccountHierarchyNode[];
};

/**
 * Get the full account hierarchy tree for a given account.
 * Walks up to find the root, then down to get all descendants.
 * Scoped to the user's team.
 */
export async function getAccountHierarchy(accountId: string): Promise<{
    root: AccountHierarchyNode;
    currentAccountId: string;
} | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId) return null;

    // Walk up to find the root (scoped to team)
    let rootId = accountId;
    const maxDepth = 10; // Safety limit
    let depth = 0;
    while (depth < maxDepth) {
        const account = await prismadb.crm_Accounts.findFirst({
            where: { id: rootId, team_id: teamInfo.teamId },
            select: { parent_account_id: true },
        });
        if (!account?.parent_account_id) break;
        rootId = account.parent_account_id;
        depth++;
    }

    // Build tree from root
    const tree = await buildAccountTree(rootId, teamInfo.teamId);
    if (!tree) return null;

    return { root: tree, currentAccountId: accountId };
}

async function buildAccountTree(accountId: string, teamId: string, depth = 0): Promise<AccountHierarchyNode | null> {
    if (depth > 5) return null; // Max recursion depth

    const account = await prismadb.crm_Accounts.findFirst({
        where: { id: accountId, team_id: teamId },
        select: {
            id: true,
            name: true,
            type: true,
            status: true,
            industry_type: { select: { name: true } },
            child_accounts: {
                where: { team_id: teamId },
                select: { id: true },
            },
        },
    });

    if (!account) return null;

    const children: AccountHierarchyNode[] = [];
    for (const child of account.child_accounts) {
        const childNode = await buildAccountTree(child.id, teamId, depth + 1);
        if (childNode) children.push(childNode);
    }

    return {
        id: account.id,
        name: account.name,
        type: account.type,
        industry: account.industry_type?.name || null,
        status: account.status,
        childCount: account.child_accounts.length,
        children,
    };
}

/**
 * Set or update an account's parent.
 */
export async function setAccountParent(accountId: string, parentAccountId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Prevent circular reference: ensure parentAccountId is not a descendant of accountId
    if (parentAccountId) {
        const isDescendant = await checkIsDescendant(parentAccountId, accountId);
        if (isDescendant) {
            return { success: false, error: "Cannot set a child account as parent (circular reference)" };
        }
        if (parentAccountId === accountId) {
            return { success: false, error: "Account cannot be its own parent" };
        }
    }

    await prismadb.crm_Accounts.update({
        where: { id: accountId },
        data: { parent_account_id: parentAccountId },
    });

    return { success: true };
}

/**
 * Check if `targetId` is a descendant of `ancestorId`.
 */
async function checkIsDescendant(targetId: string, ancestorId: string, depth = 0): Promise<boolean> {
    if (depth > 10) return false;
    const children = await prismadb.crm_Accounts.findMany({
        where: { parent_account_id: ancestorId },
        select: { id: true },
    });
    for (const child of children) {
        if (child.id === targetId) return true;
        if (await checkIsDescendant(targetId, child.id, depth + 1)) return true;
    }
    return false;
}
