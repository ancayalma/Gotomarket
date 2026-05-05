import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import pdfParse from "pdf-parse";
import { getAiSdkModel, logAiUsage } from "@/lib/varuni";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import * as ExcelJS from "exceljs";
import { prismadb } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 300; // 5 mins

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
});
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || "basalt-crm-uploads";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "anonymous";
        const teamId = session?.user?.team_id || null;
        const ip = req.headers.get("x-forwarded-for") || "unknown_ip";

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // EXCEL | MARKDOWN | JSON | TEXT
        const saveHistory = formData.get("saveHistory") === "true";

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const isImage = file.type.includes("image");
        let numPages = 1;
        let extractedText = "";

        if (!isImage) {
            const parsedPdf = await pdfParse(buffer);
            numPages = parsedPdf.numpages;
            extractedText = parsedPdf.text;
        }

        if (numPages > 200) {
            return NextResponse.json({ error: "File exceeds 200 pages. Contact support." }, { status: 400 });
        }

        // --- Rate Limiting Logic ---
        const freeLimit = type === "EXCEL" ? 5 : (type === "MARKDOWN" || type === "JSON" ? 10 : 20);
        
        if (numPages <= freeLimit && redis) {
            const ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.fixedWindow(25, "30 d"), // Simplified tracking
                analytics: true,
                prefix: `@upstash/ratelimit:transform_${type.toLowerCase()}`,
            });

            const identifier = `${ip}_${userId}`;
            const { success, remaining } = await ratelimit.limit(identifier);

            if (!success) {
                return NextResponse.json({ 
                    error: `Free tier limit exceeded for ${type}. You have ${remaining} generations left.` 
                }, { status: 429 });
            }
        }

        // --- Model Execution ---
        const { model, modelId } = await getAiSdkModel("system", "pdf_wizard", isImage);
        
        let resultBuffer: Buffer;
        let mimeType = "text/plain";
        let extension = ".txt";
        let cost = numPages * (type === "EXCEL" ? 0.05 : type === "TEXT" ? 0.01 : 0.02);

        // We prepare the content array. If it's an image, pass the image data. If PDF, pass extracted text.
        const contentPayload: any[] = [];
        if (isImage) {
            contentPayload.push({
                type: "image" as const,
                image: buffer,
            });
        } else {
            contentPayload.push({
                type: "text",
                text: `Document Content:\n\n${extractedText.substring(0, 80000)}`
            });
        }

        if (type === "EXCEL") {
            // ── Hybrid: Textract for raw extraction, Qwen for structuring ──
            const { TextractClient, AnalyzeDocumentCommand } = require("@aws-sdk/client-textract");
            const textract = new TextractClient({
                region: process.env.AWS_REGION || "us-west-2",
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            });

            // For images or single-page PDFs, use synchronous AnalyzeDocument
            // For multi-page PDFs, we still use Qwen with extracted text
            let textractKVPairs: string[] = [];
            let textractTableText = "";

            if (isImage || numPages === 1) {
                const textractRes = await textract.send(new AnalyzeDocumentCommand({
                    Document: { Bytes: buffer },
                    FeatureTypes: ["FORMS", "TABLES"],
                }));

                const blocks = textractRes.Blocks || [];
                const blockMap: Record<string, any> = {};
                blocks.forEach((b: any) => { if (b.Id) blockMap[b.Id] = b; });

                const getBlockText = (block: any): string => {
                    if (!block?.Relationships) return block?.Text || "";
                    const childRel = block.Relationships.find((r: any) => r.Type === "CHILD");
                    if (!childRel?.Ids) return block?.Text || "";
                    return childRel.Ids.map((id: string) => blockMap[id]?.Text || "").filter(Boolean).join(" ");
                }

                // Extract form key-value pairs
                const keyBlocks = blocks.filter((b: any) => b.BlockType === "KEY_VALUE_SET" && b.EntityTypes?.includes("KEY"));
                for (const keyBlock of keyBlocks) {
                    const keyText = getBlockText(keyBlock);
                    if (!keyText.trim()) continue;
                    const valueRel = keyBlock.Relationships?.find((r: any) => r.Type === "VALUE");
                    let valueText = "";
                    if (valueRel?.Ids) {
                        valueText = getBlockText(blockMap[valueRel.Ids[0]]);
                    }
                    textractKVPairs.push(`"${keyText.trim()}": "${valueText.trim()}"`);
                }

                // Extract table text
                const tableBlocks = blocks.filter((b: any) => b.BlockType === "TABLE");
                for (const table of tableBlocks) {
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
                        let tableStr = "Table:\n";
                        for (let r = 1; r <= maxRow; r++) {
                            const rowVals = [];
                            for (let c = 1; c <= maxCol; c++) {
                                rowVals.push(cellGrid[`${r}_${c}`] || "");
                            }
                            tableStr += rowVals.join(" | ") + "\n";
                        }
                        textractTableText += tableStr;
                    }
                }
            }

            // Feed Textract ground truth to Qwen for clean structuring
            const textractContext = [
                textractKVPairs.length > 0 ? `Textract Form Fields:\n${textractKVPairs.join("\n")}` : "",
                textractTableText ? `Textract Tables:\n${textractTableText}` : "",
                extractedText ? `PDF Text:\n${extractedText.substring(0, 40000)}` : "",
            ].filter(Boolean).join("\n\n");

            contentPayload.push({
                type: "text",
                text: `Structure this document data into clean, organized output. Use the Textract-extracted data as ground truth. Clean up any OCR artifacts.\n\n${textractContext}`
            });

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
                    })).optional()
                }),
                messages: [{ role: "user", content: contentPayload }],
                temperature: 0.1,
            });

            logAiUsage({ teamId, userId, service: "pdf_wizard", model: modelId, usage: { promptTokens: (usage as any).inputTokens || 0, completionTokens: (usage as any).outputTokens || 0 }, description: `BasaltLens EXCEL (${numPages} pages)` }).catch(console.error);

            // Build Excel
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Extracted Data");
            
            if (object.dataType === "FORM_FIELDS" || (!object.tables?.length && object.formFields?.length)) {
                sheet.columns = [
                    { header: "FIELD NAME", key: "label", width: 30 },
                    { header: "VALUE", key: "value", width: 50 }
                ];
                object.formFields?.forEach(field => {
                    sheet.addRow({ label: field.label, value: field.value });
                });
                sheet.getRow(1).font = { bold: true };
                sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            } else if (object.tables && object.tables.length > 0) {
                const table = object.tables[0];
                const keys = new Set<string>();
                table.rows.forEach(row => {
                    row.cells?.forEach(cell => {
                        if (cell.header) keys.add(cell.header);
                    });
                });
                sheet.columns = Array.from(keys).map(key => ({ header: key.toUpperCase(), key, width: 20 }));
                table.rows.forEach(row => {
                    const flatObj: any = {};
                    row.cells?.forEach(cell => {
                        if (cell.header) flatObj[cell.header] = cell.value || "";
                    });
                    sheet.addRow(flatObj);
                });
                sheet.getRow(1).font = { bold: true };
                sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            }
            resultBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
            mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            extension = ".xlsx";

        } else if (type === "MARKDOWN") {
            contentPayload.push({ type: "text", text: "Convert this document perfectly to Markdown (.md). Preserve all headers, bolding, lists, and tables." });
            const { text, usage } = await generateText({
                model,
                messages: [{ role: "user", content: contentPayload }],
                temperature: 0.2,
            });
            logAiUsage({ teamId, userId, service: "pdf_wizard", model: modelId, usage: { promptTokens: (usage as any).inputTokens || 0, completionTokens: (usage as any).outputTokens || 0 }, description: `BasaltTransform MARKDOWN (${numPages} pages)` }).catch(console.error);
            resultBuffer = Buffer.from(text, "utf-8");
            mimeType = "text/markdown";
            extension = ".md";

        } else if (type === "JSON") {
            contentPayload.push({ type: "text", text: "Extract receipt/invoice fields into JSON." });
            const { object, usage } = await generateObject({
                model,
                schema: z.object({
                    vendorName: z.string().optional(),
                    date: z.string().optional(),
                    totalAmount: z.number().optional(),
                    taxAmount: z.number().optional(),
                    lineItems: z.array(z.object({ description: z.string(), amount: z.number() })).optional()
                }),
                messages: [{ role: "user", content: contentPayload }],
                temperature: 0.1,
            });
            logAiUsage({ teamId, userId, service: "pdf_wizard", model: modelId, usage: { promptTokens: (usage as any).inputTokens || 0, completionTokens: (usage as any).outputTokens || 0 }, description: `BasaltTransform JSON (${numPages} pages)` }).catch(console.error);
            resultBuffer = Buffer.from(JSON.stringify(object, null, 2), "utf-8");
            mimeType = "application/json";
            extension = ".json";

        } else {
            // TEXT / OCR
            contentPayload.push({ type: "text", text: "Extract all handwriting or visible text exactly as written." });
            const { text, usage } = await generateText({
                model,
                messages: [{ role: "user", content: contentPayload }],
                temperature: 0.1,
            });
            logAiUsage({ teamId, userId, service: "pdf_wizard", model: modelId, usage: { promptTokens: (usage as any).inputTokens || 0, completionTokens: (usage as any).outputTokens || 0 }, description: `BasaltTransform TEXT (${numPages} pages)` }).catch(console.error);
            resultBuffer = Buffer.from(text, "utf-8");
            mimeType = "text/plain";
            extension = ".txt";
        }

        // --- History & Storage ---
        let originalS3Key = null;
        let resultS3Key = null;

        if (saveHistory && teamId) {
            try {
                const timestamp = Date.now();
                originalS3Key = `${teamId}/transforms/${timestamp}_original_${file.name}`;
                resultS3Key = `${teamId}/transforms/${timestamp}_result${extension}`;

                // Upload original
                await s3.send(new PutObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: originalS3Key,
                    Body: buffer,
                    ContentType: file.type
                }));

                // Upload result
                await s3.send(new PutObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: resultS3Key,
                    Body: resultBuffer,
                    ContentType: mimeType
                }));

                // Save to Mongo
                // Note: Using any to bypass strict prisma types during dynamic migration
                await (prismadb as any).crm_TransformHistory.create({
                    data: {
                        user_id: userId === "anonymous" ? undefined : userId,
                        team_id: teamId,
                        original_name: file.name,
                        transform_type: type,
                        cost: cost,
                        pages: numPages,
                        s3_key_original: originalS3Key,
                        s3_key_result: resultS3Key,
                        status: "COMPLETED",
                        is_saved: true
                    }
                });

            } catch (err) {
                console.error("[S3_UPLOAD_ERROR] Failed to save history", err);
                // Non-fatal, continue to stream the file
            }
        }

        // --- Stream back to client ---
        return new NextResponse(resultBuffer as any, {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename="${file.name.replace(/\.[^/.]+$/, "")}_extracted${extension}"`,
            },
        });

    } catch (error: any) {
        console.error("[TRANSFORM_PROCESS]", error);
        return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
    }
}
