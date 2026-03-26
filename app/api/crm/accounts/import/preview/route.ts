import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";
import { normalizeRow } from "@/lib/import-utils";
import { systemLogger } from "@/lib/logger";

const candidateSchema = z.object({
    dedupeKey: z.string().min(1),
    domain: z.string().optional(),
    companyName: z.string().optional(),
    homepageUrl: z.string().optional(),
    description: z.string().optional(),
    industry: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    additional_emails: z.array(z.string()).optional(),
});

const contactSchema = z.object({
    dedupeKey: z.string().min(1),
    candidateKey: z.string().optional(),
    fullName: z.string().optional(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedinUrl: z.string().optional(),
});

async function bufferToRows(fileName: string | undefined, buffer: Buffer): Promise<Record<string, any>[]> {
    const name = (fileName || "").toLowerCase();
    if (name.endsWith(".xlsx")) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) return [];

        const resolveExcelCellValue = (val: any): string | number => {
            if (val === null || val === undefined) return "";
            if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return typeof val === "boolean" ? String(val) : val;
            if (val instanceof Date) return val.toISOString();
            if (typeof val === "object") {
                if ("text" in val && typeof val.text === "string") return val.text;
                if ("richText" in val && Array.isArray(val.richText)) {
                    return val.richText.map((part: any) => part?.text || "").join("");
                }
                if ("result" in val) {
                    const r = val.result;
                    if (r === null || r === undefined) return "";
                    if (typeof r === "string" || typeof r === "number") return r;
                    if (r instanceof Date) return r.toISOString();
                    return String(r);
                }
                if ("error" in val) return "";
                return String(val);
            }
            return String(val);
        };

        const rows: Record<string, any>[] = [];
        const headers: string[] = [];

        const firstRow = worksheet.getRow(1);
        firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const val = resolveExcelCellValue(cell.value);
            headers[colNumber] = val === "" ? "" : String(val);
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData: Record<string, any> = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                    rowData[header] = resolveExcelCellValue(cell.value);
                }
            });
            rows.push(rowData);
        });
        return rows;
    }
    const text = buffer.toString("utf8");
    return parse(text, { columns: true, skip_empty_lines: true });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) return new NextResponse("Missing file", { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const rows = await bufferToRows((file as any).name, buffer);

        const usedColsSet = new Set<string>();
        const corruptRows: any[] = [];
        const combinedRows: any[] = [];
        let validAccounts = 0;
        let validContacts = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const { candidate, contacts, usedCols } = normalizeRow(row);
            usedCols.forEach(c => usedColsSet.add(c));

            if (candidate || (contacts && contacts.length > 0)) {
                if (candidate) {
                    const parsed = candidateSchema.safeParse(candidate);
                    if (parsed.success) validAccounts++;
                }

                if (contacts && contacts.length > 0) {
                    for (const contact of contacts) {
                        const parsed = contactSchema.safeParse(contact);
                        if (parsed.success) {
                            validContacts++;
                            if (contact.phone) {
                                const { normalized } = phoneNormalizer.normalizePhone(contact.phone, { preferUS: true });
                                contact.phone = normalized;
                            }
                        }
                    }
                }

                combinedRows.push({
                    account: candidate,
                    contacts: contacts || []
                });
            } else {
                corruptRows.push({ index: i, error: "Empty row or no recognizable fields" });
            }
        }

        return NextResponse.json({
            stats: {
                totalRows: rows.length,
                validAccounts,
                validContacts,
                corruptRows: corruptRows.length
            },
            mapping: {
                usedColumns: Array.from(usedColsSet),
                allColumns: Object.keys(rows[0] || {})
            },
            preview: combinedRows.slice(0, 10),
            fullPreview: combinedRows.slice(0, 5000)
        });

    } catch (error: any) {
        systemLogger.error("[ACCOUNTS_IMPORT_PREVIEW]", error);
        return new NextResponse(error.message || "Failed to preview import", { status: 500 });
    }
}
