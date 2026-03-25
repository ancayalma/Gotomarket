import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { CandidateNorm, ContactNorm, normalizeRow } from "@/lib/import-utils";
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

    const rows: Record<string, any>[] = [];
    const headers: string[] = [];

    // Get headers from first row
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = cell.value;
      headers[colNumber] = (val === null || val === undefined) ? "" : val.toString();
    });

    // Get data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header row
      const rowData: Record<string, any> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          let val = cell.value;
          // Handle cases where value might be an object (like a formula result)
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
  // assume CSV
  const text = buffer.toString("utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true }) as Record<string, any>[];
  return rows;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const poolIdRaw = form.get("poolId");
    const newPoolName = (form.get("newPoolName") as string | null) || null;
    const newPoolDescription = (form.get("newPoolDescription") as string | null) || null;

    const poolId = poolIdRaw ? String(poolIdRaw) : "";
    const isNewPool = !poolId;

    if (!file || (!poolId && !newPoolName)) {
      return new NextResponse("Missing file and either poolId or newPoolName", { status: 400 });
    }

    // verify pool ownership only if using existing pool
    if (!isNewPool) {
      const pool = await (prismadbCrm as any).crm_Lead_Pools.findFirst({
        where: { id: poolId, user: session.user.id },
        select: { id: true },
      });
      if (!pool) {
        return new NextResponse("List not found", { status: 404 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = await bufferToRows((file as any).name, buffer);

    // Read user's column mapping from the wizard (Step 2)
    const columnMapRaw = form.get("columnMap") as string | null;
    const columnMap: Record<string, string> = columnMapRaw ? JSON.parse(columnMapRaw) : {};

    // CRM field key → COLS synonym key mapping (what normalizeRow looks for)
    const crmFieldToColsKey: Record<string, string> = {
      companyName: "company",
      domain: "domain",
      homepageUrl: "homepage",
      description: "description",
      industry: "industry",
      techStack: "techstack",
      fullName: "name",
      title: "title",
      email: "email",
      additionalEmails: "email2",
      phone: "phone",
      linkedinUrl: "linkedin",
    };

    // Remap row keys using the user's column mapping so normalizeRow can find them
    const remapRow = (row: Record<string, any>): Record<string, any> => {
      if (!Object.keys(columnMap).length) return row;
      const remapped: Record<string, any> = {};
      const mappedCsvHeaders = new Set<string>();
      
      // First pass: apply user mapping (csvHeader → crmField)
      for (const [csvHeader, crmField] of Object.entries(columnMap)) {
        const colsKey = crmFieldToColsKey[crmField];
        if (colsKey) {
          // Find the original value from the row (case-insensitive header match)
          const originalKey = Object.keys(row).find(k => k.toLowerCase() === csvHeader.toLowerCase());
          if (originalKey && row[originalKey] !== undefined && row[originalKey] !== "") {
            // For additionalEmails, we may have multiple CSV columns mapped to the same CRM field
            if (crmField === "additionalEmails") {
              // Append to existing additional email values
              const existing = remapped[colsKey] || "";
              const val = String(row[originalKey]).trim();
              remapped[colsKey] = existing ? `${existing};${val}` : val;
            } else {
              remapped[colsKey] = row[originalKey];
            }
            mappedCsvHeaders.add(originalKey);
          }
        }
      }
      
      // Second pass: carry over unmapped columns with their original keys
      for (const [key, val] of Object.entries(row)) {
        if (!mappedCsvHeaders.has(key)) {
          remapped[key] = val;
        }
      }
      
      return remapped;
    };

    const usedColsSet = new Set<string>();
    const corruptRows: { index: number; errors: string[] }[] = [];
    const combinedRows: any[] = [];

    // Detect duplicates within this import
    const seenCandidate = new Set<string>();
    const seenContact = new Set<string>();

    const creates = { candidates: [] as any[], contacts: [] as any[] };
    const updates = { candidates: [] as any[], contacts: [] as any[] };

    let validCandidates = 0;
    let validContacts = 0;
    let dupCandidates = 0;
    let dupContacts = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = remapRow(rows[i]);
      const { candidate, contacts, usedCols } = normalizeRow(row);
      usedCols.forEach((c) => usedColsSet.add(c));

      const rowErrors: string[] = [];

      if (candidate || (contacts && contacts.length > 0)) {
        combinedRows.push({ account: candidate, contacts: contacts || [] });
      }

      // Candidate
      if (candidate) {
        const parsed = candidateSchema.safeParse(candidate);
        if (!parsed.success) {
          rowErrors.push("Invalid company row: " + parsed.error.message);
        } else {
          const key = candidate.dedupeKey;
          if (seenCandidate.has(key)) {
            dupCandidates++;
          } else {
            seenCandidate.add(key);

            if (!isNewPool) {
              // find existing candidate in pool
              const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                where: { pool: poolId, dedupeKey: key },
                select: {
                  id: true,
                  domain: true,
                  companyName: true,
                  homepageUrl: true,
                  description: true,
                  industry: true,
                  techStack: true,
                  additional_emails: true,
                },
              });
              const changes: Record<string, { from: any; to: any }> = {};
              if (existing) {
                const fields: (keyof CandidateNorm)[] = ["domain", "companyName", "homepageUrl", "description", "industry", "techStack", "additional_emails"];
                for (const f of fields) {
                  const fromVal = (existing as any)[f];
                  const toVal = (candidate as any)[f];
                  const same =
                    Array.isArray(fromVal) && Array.isArray(toVal)
                      ? JSON.stringify(fromVal) === JSON.stringify(toVal)
                      : (fromVal ?? "") === (toVal ?? "");
                  if (!same) {
                    changes[f as string] = { from: fromVal, to: toVal };
                  }
                }
                updates.candidates.push({ ...candidate, existingId: existing.id, changes });
              } else {
                creates.candidates.push({ ...candidate, existingId: null });
              }
            } else {
              // new pool => no existing data to compare; treat as create
              creates.candidates.push({ ...candidate, existingId: null });
            }
            validCandidates++;
          }
        }
      }

      // Contacts
      if (contacts) {
        for (const contact of contacts) {
          const parsed = contactSchema.safeParse(contact);
          if (!parsed.success) {
            rowErrors.push("Invalid contact row: " + parsed.error.message);
          } else {
            const key = contact.dedupeKey;
            if (seenContact.has(key)) {
              dupContacts++;
            } else {
              seenContact.add(key);

              if (!isNewPool) {
                // If contact maps to a candidateKey, check if candidate exists
                let candidateId: string | null = null;
                if (contact.candidateKey) {
                  const candExisting = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                    where: { pool: poolId, dedupeKey: contact.candidateKey },
                    select: { id: true },
                  });
                  candidateId = candExisting?.id ?? null;
                }

                const existing = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
                  where: {
                    dedupeKey: key,
                    ...(candidateId ? { leadCandidate: candidateId } : {}),
                  },
                  select: {
                    id: true,
                    fullName: true,
                    title: true,
                    email: true,
                    phone: true,
                    linkedinUrl: true,
                  },
                });

                const changes: Record<string, { from: any; to: any }> = {};
                if (existing) {
                  const fields: (keyof ContactNorm)[] = ["fullName", "title", "email", "phone", "linkedinUrl"];
                  for (const f of fields) {
                    const fromVal = (existing as any)[f];
                    const toVal = (contact as any)[f];
                    const same = (fromVal ?? "") === (toVal ?? "");
                    if (!same) {
                      changes[f as string] = { from: fromVal, to: toVal };
                    }
                  }
                  updates.contacts.push({ ...contact, existingId: existing.id, changes });
                } else {
                  creates.contacts.push({ ...contact, existingId: null });
                }
              } else {
                // new pool => no existing data
                creates.contacts.push({ ...contact, existingId: null });
              }
              validContacts++;
            }
          }
        }
      }

      if (rowErrors.length) {
        corruptRows.push({ index: i, errors: rowErrors });
      }
    }

    const response = {
      poolId: isNewPool ? null : poolId,
      poolName: isNewPool ? newPoolName : undefined,
      poolMode: isNewPool ? "new" : "existing",
      mapping: {
        usedColumns: Array.from(usedColsSet),
        unmappedColumns: Object.keys(rows[0] || {})
          .map((k) => k.toLowerCase())
          .filter((k) => !Array.from(usedColsSet).includes(k)),
      },
      stats: {
        totalRows: rows.length,
        validCandidates,
        validContacts,
        corruptRows: corruptRows.length,
        duplicates: { candidate: dupCandidates, contact: dupContacts },
        creates: { candidate: creates.candidates.length, contact: creates.contacts.length },
        updates: { candidate: updates.candidates.length, contact: updates.contacts.length },
      },
      creates,
      updates,
      corruptRows,
      preview: combinedRows.slice(0, 10),
      fullPreview: combinedRows.slice(0, 5000),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    systemLogger.error("[LEADS_POOLS_IMPORT_PREVIEW]", error);
    return new NextResponse(error?.message || "Failed to preview import", { status: 500 });
  }
}
