import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";
import { normalizeRow } from "@/lib/import-utils";

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

        const rows: Record<string, any>[] = [];
        const headers: string[] = [];

        const firstRow = worksheet.getRow(1);
        firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const val = cell.value;
            headers[colNumber] = (val === null || val === undefined) ? "" : val.toString();
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData: Record<string, any> = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                    let val = cell.value;
                    if (val && typeof val === 'object' && 'result' in (val as any)) {
                        val = (val as any).result;
                    }
                    rowData[header] = val === null || val === undefined ? "" : val;
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
        console.error("[ACCOUNTS_IMPORT_PREVIEW]", error);
        return new NextResponse(error.message || "Failed to preview import", { status: 500 });
    }
}
