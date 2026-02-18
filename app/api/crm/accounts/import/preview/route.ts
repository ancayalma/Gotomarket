import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import phoneNormalizer from "@/lib/scraper/quality/phone-normalizer";

type AccountNorm = {
    name: string;
    type?: string;
    location?: string;
    domain?: string;
    email?: string;
    phone?: string;
};

type ContactNorm = {
    fullName: string;
    title?: string;
    email?: string;
    phone?: string;
};

const COLS = {
    accountName: ["investors", "investor", "company", "account", "organization", "name", "business"],
    type: ["type", "classification", "category"],
    location: ["location", "city", "address", "country"],
    domain: ["domain", "website", "url"],
    contactName: ["primary contact", "contact", "person", "fullname", "name"],
    contactTitle: ["primary contact title", "title", "position", "role"],
    email: ["email", "email address", "mail"],
    phone: ["phone", "phone number", "mobile", "tel"],
};

function lc(s: any): string {
    return typeof s === "string" ? s.trim() : "";
}

function getFromRow(row: Record<string, any>, keys: string[]): any {
    for (const k of keys) {
        for (const rk of Object.keys(row)) {
            if (rk.toLowerCase() === k) return row[rk];
        }
    }
    return undefined;
}

function normalizeRow(row: Record<string, any>): { account?: AccountNorm; contact?: ContactNorm; usedCols: string[] } {
    const usedCols: string[] = [];

    const accountName = lc(getFromRow(row, COLS.accountName));
    if (accountName) usedCols.push("accountName");

    const type = lc(getFromRow(row, COLS.type));
    if (type) usedCols.push("type");

    const location = lc(getFromRow(row, COLS.location));
    if (location) usedCols.push("location");

    const domain = lc(getFromRow(row, COLS.domain)).toLowerCase();
    if (domain) usedCols.push("domain");

    const accountPhoneRaw = getFromRow(row, COLS.phone);
    const accountEmail = lc(getFromRow(row, COLS.email)).toLowerCase();

    const account = accountName ? {
        name: accountName,
        type: type || undefined,
        location: location || undefined,
        domain: domain || undefined,
        email: accountEmail || undefined,
    } : undefined;

    const contactName = lc(getFromRow(row, COLS.contactName));
    if (contactName) usedCols.push("contactName");

    const contactTitle = lc(getFromRow(row, COLS.contactTitle));
    if (contactTitle) usedCols.push("contactTitle");

    const contactEmail = lc(getFromRow(row, COLS.email)).toLowerCase();
    if (contactEmail) usedCols.push("email");

    const contactPhoneRaw = getFromRow(row, COLS.phone);
    if (contactPhoneRaw) usedCols.push("phone");

    const contact = contactName ? {
        fullName: contactName,
        title: contactTitle || undefined,
        email: contactEmail || undefined,
        phone: contactPhoneRaw ? String(contactPhoneRaw) : undefined,
    } : undefined;

    return { account, contact, usedCols };
}

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
        const preview = {
            accounts: [] as any[],
            contacts: [] as any[],
        };

        let validAccounts = 0;
        let validContacts = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const { account, contact, usedCols } = normalizeRow(row);
            usedCols.forEach(c => usedColsSet.add(c));

            if (account) {
                validAccounts++;
                preview.accounts.push(account);
            }
            if (contact) {
                validContacts++;
                // Normalize phone for preview
                if (contact.phone) {
                    const { normalized } = phoneNormalizer.normalizePhone(contact.phone, { preferUS: true });
                    contact.phone = normalized;
                }
                preview.contacts.push(contact);
            }

            if (!account && !contact) {
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
            preview: {
                accounts: preview.accounts.slice(0, 10),
                contacts: preview.contacts.slice(0, 10)
            },
            fullPreview: {
                accounts: preview.accounts.slice(0, 2000),
                contacts: preview.contacts.slice(0, 2000)
            }
        });

    } catch (error: any) {
        console.error("[ACCOUNTS_IMPORT_PREVIEW]", error);
        return new NextResponse(error.message || "Failed to preview import", { status: 500 });
    }
}
