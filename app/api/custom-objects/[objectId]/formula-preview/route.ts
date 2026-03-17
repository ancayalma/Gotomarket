import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeSingleFormula } from "@/lib/formula/compute-formula";

/**
 * POST /api/custom-objects/[objectId]/formula-preview
 * Test-evaluate a formula expression against sample data without saving.
 *
 * Body: { formula: string, sampleData: Record<string, unknown> }
 * Returns: { value: unknown, error?: string }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ objectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { formula, sampleData } = await req.json();

        if (!formula || typeof formula !== "string") {
            return NextResponse.json({ error: "Formula expression is required" }, { status: 400 });
        }

        const result = computeSingleFormula(formula, sampleData || {});

        return NextResponse.json(result);
    } catch (error) {
        console.error("[FORMULA_PREVIEW]", error);
        return NextResponse.json(
            { error: "Failed to evaluate formula" },
            { status: 500 }
        );
    }
}
