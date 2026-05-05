import { NextResponse } from "next/server";
import { getAiSdkModel, logAiUsage } from "@/lib/varuni";
import { generateObject } from "ai";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";

export const maxDuration = 60;

const textract = new TextractClient({
    region: (process.env.AWS_REGION || "us-west-2").trim(),
    credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID || "").trim(),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || "").trim(),
    },
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "anonymous";

        const { images, imageWidth, imageHeight } = await req.json();

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        // ── Step 1: Textract for pixel-perfect layout ──
        // Send first page image to Textract
        const base64Data = images[0].split(",")[1];
        const imageBuffer = Buffer.from(base64Data, "base64");

        const textractResponse = await textract.send(new AnalyzeDocumentCommand({
            Document: { Bytes: imageBuffer },
            FeatureTypes: ["FORMS", "TABLES"],
        }));

        const blocks = textractResponse.Blocks || [];

        // Build bounding boxes from Textract blocks
        // Textract returns Left/Top/Width/Height as ratios (0-1), we convert to percentages (0-100)
        const boundingBoxes: any[] = [];
        const keyValuePairs: { key: string; value: string; bbox: any }[] = [];
        const tableData: { headers: string[]; rows: any[] } = { headers: [], rows: [] };

        // Build block lookup for relationship traversal
        const blockMap: Record<string, any> = {};
        blocks.forEach(b => { if (b.Id) blockMap[b.Id] = b; });

        // Helper: get text from a block by following CHILD relationships
        const getBlockText = (block: any): string => {
            if (!block?.Relationships) return block?.Text || "";
            const childRel = block.Relationships.find((r: any) => r.Type === "CHILD");
            if (!childRel?.Ids) return block?.Text || "";
            return childRel.Ids
                .map((id: string) => blockMap[id]?.Text || "")
                .filter(Boolean)
                .join(" ");
        }

        // Extract KEY_VALUE_SET pairs (forms)
        const keyBlocks = blocks.filter(b => b.BlockType === "KEY_VALUE_SET" && b.EntityTypes?.includes("KEY"));
        for (const keyBlock of keyBlocks) {
            const keyText = getBlockText(keyBlock);
            if (!keyText.trim()) continue;

            // Find the VALUE block
            const valueRel = keyBlock.Relationships?.find((r: any) => r.Type === "VALUE");
            let valueText = "";
            if (valueRel?.Ids) {
                const valueBlock = blockMap[valueRel.Ids[0]];
                valueText = getBlockText(valueBlock);
            }

            const bbox = keyBlock.Geometry?.BoundingBox;
            if (bbox) {
                keyValuePairs.push({
                    key: keyText.trim(),
                    value: valueText.trim(),
                    bbox: {
                        id: `kv_${boundingBoxes.length}`,
                        label: keyText.trim(),
                        x: (bbox.Left || 0) * 100,
                        y: (bbox.Top || 0) * 100,
                        width: (bbox.Width || 0) * 100,
                        height: (bbox.Height || 0) * 100,
                    }
                });
                boundingBoxes.push(keyValuePairs[keyValuePairs.length - 1].bbox);
            }
        }

        // Extract TABLE blocks
        const tableBlocks = blocks.filter(b => b.BlockType === "TABLE");
        for (const table of tableBlocks) {
            const bbox = table.Geometry?.BoundingBox;
            if (bbox) {
                boundingBoxes.push({
                    id: `table_${boundingBoxes.length}`,
                    label: "Table",
                    x: (bbox.Left || 0) * 100,
                    y: (bbox.Top || 0) * 100,
                    width: (bbox.Width || 0) * 100,
                    height: (bbox.Height || 0) * 100,
                });
            }

            // Extract cells
            const cellRel = table.Relationships?.find((r: any) => r.Type === "CHILD");
            if (cellRel?.Ids) {
                const cells = cellRel.Ids.map((id: string) => blockMap[id]).filter(Boolean);
                const cellGrid: Record<string, string> = {};
                let maxRow = 0, maxCol = 0;

                cells.forEach((cell: any) => {
                    if (cell.BlockType === "CELL") {
                        const row = cell.RowIndex || 0;
                        const col = cell.ColumnIndex || 0;
                        maxRow = Math.max(maxRow, row);
                        maxCol = Math.max(maxCol, col);
                        cellGrid[`${row}_${col}`] = getBlockText(cell);
                    }
                });

                // First row as headers
                const headers: string[] = [];
                for (let c = 1; c <= maxCol; c++) {
                    headers.push(cellGrid[`1_${c}`] || `Col ${c}`);
                }
                const rows: any[] = [];
                for (let r = 2; r <= maxRow; r++) {
                    const rowCells: { header: string; value: string }[] = [];
                    for (let c = 1; c <= maxCol; c++) {
                        rowCells.push({ header: headers[c - 1], value: cellGrid[`${r}_${c}`] || "" });
                    }
                    rows.push({ cells: rowCells });
                }
                tableData.headers = headers;
                tableData.rows = rows;
            }
        }

        // ── Step 2: Qwen for intelligent data structuring ──
        const { model, modelId } = await getAiSdkModel("system", "pdf_wizard", true);

        // Build a text summary from Textract raw for Qwen to structure
        const textractSummary = keyValuePairs.length > 0
            ? `Textract detected the following form fields:\n${keyValuePairs.map(kv => `  "${kv.key}": "${kv.value}"`).join("\n")}`
            : "";

        const imageParts = images.map((imgUrl: string) => ({
            type: "image" as const,
            image: Buffer.from(imgUrl.split(",")[1], "base64"),
        }));

        const { object, usage } = await generateObject({
            model,
            schema: z.object({
                dataType: z.enum(["FORM_FIELDS", "TABULAR", "MIXED"]),
                formFields: z.array(z.object({
                    label: z.string(),
                    value: z.string()
                })).optional(),
                tables: z.array(z.object({
                    tableName: z.string(),
                    headers: z.array(z.string()),
                    rows: z.array(z.object({
                        cells: z.array(z.object({
                            header: z.string(),
                            value: z.string()
                        }))
                    }))
                })).optional(),
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this document and structure the data cleanly. ${textractSummary ? `\n\nAWS Textract already extracted these raw key-value pairs — use them as ground truth but clean up the labels and values:\n${textractSummary}` : ""}\n\nReturn structured formFields (for forms/invoices) or tables (for grid data). Clean up any OCR artifacts in the field names and values.`
                        },
                        ...imageParts,
                    ],
                },
            ],
            temperature: 0.1,
        });

        // Log AI usage
        logAiUsage({
            teamId: session?.user?.team_id || null,
            userId,
            service: "pdf_wizard",
            model: modelId,
            usage: {
                promptTokens: (usage as any).inputTokens || 0,
                completionTokens: (usage as any).outputTokens || 0,
            },
            description: "BasaltLens Preview (Textract + Vision)"
        }).catch(console.error);

        // Return Qwen's structured data + Textract's pixel-perfect bounding boxes
        return NextResponse.json({
            ...object,
            boundingBoxes, // from Textract — pixel-perfect
        });

    } catch (error: any) {
        console.error("[BASALTLENS_PREVIEW]", error);
        require("fs").writeFileSync("u:\\BasaltCRM\\crm-official\\preview-error.txt", error.stack || error.toString());
        return NextResponse.json({ error: error.message || "Failed to process preview" }, { status: 500 });
    }
}
