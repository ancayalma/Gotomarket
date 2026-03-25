import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { COLS } from "@/lib/import-utils";

/**
 * All known CRM fields the user can map to.
 * Grouped into ACCOUNT fields and CONTACT fields.
 */
const CRM_FIELDS = {
  account: [
    { key: "companyName", label: "Company / Account Name", required: true },
    { key: "domain", label: "Website / Domain" },
    { key: "industry", label: "Industry / Sector" },
    { key: "description", label: "Description / Notes" },
    { key: "homepageUrl", label: "Homepage URL" },
    { key: "techStack", label: "Tech Stack" },
    { key: "location", label: "Location / HQ" },
    { key: "employeeCount", label: "Employee Count" },
    { key: "revenue", label: "Revenue / ARR" },
  ],
  contact: [
    { key: "fullName", label: "Full Name", required: true },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "title", label: "Job Title / Role" },
    { key: "email", label: "Email Address" },
    { key: "additionalEmails", label: "Additional Emails" },
    { key: "phone", label: "Phone Number" },
    { key: "additionalPhones", label: "Additional Phones" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
  ],
};

/**
 * Extended synonym map for auto-detection, combining import-utils COLS
 * with additional fuzzy matches.
 */
const DETECTION_MAP: Record<string, string[]> = {
  // Account fields
  companyName: [...COLS.companyName, "company name", "account name", "business name", "merchant", "client", "client name", "firm", "entity"],
  domain: [...COLS.domain, "web", "company website", "company url", "company domain", "homepage"],
  industry: [...COLS.industry, "category", "field", "niche", "market", "business type"],
  description: [...COLS.description, "bio", "note", "info", "detail", "details"],
  homepageUrl: [...COLS.homepageUrl, "home page", "web page", "landing page"],
  techStack: [...COLS.techStack, "tech", "tools", "software", "platform"],
  location: ["location", "city", "state", "country", "region", "address", "hq", "headquarters", "geo", "geography"],
  employeeCount: ["employees", "employee count", "headcount", "size", "company size", "team size", "staff"],
  revenue: ["revenue", "arr", "annual revenue", "income", "sales volume", "annual sales"],

  // Contact fields
  fullName: [...COLS.fullName, "full name", "contact name", "representative", "rep", "poc", "point of contact", "decision maker"],
  firstName: ["first name", "firstname", "first", "given name", "givenname", "fname"],
  lastName: ["last name", "lastname", "last", "surname", "family name", "familyname", "lname"],
  title: [...COLS.title, "job title", "designation", "dept", "department", "function"],
  email: [...COLS.email, "e-mail", "mail", "email address", "work email", "business email"],
  additionalEmails: [...COLS.additionalEmails, "alternate email", "personal email", "other email"],
  phone: [...COLS.phone, "tel", "telephone", "cell", "cellphone", "work phone", "contact number", "contact phone"],
  additionalPhones: [...COLS.additionalPhones, "alternate phone", "fax", "home phone", "personal phone"],
  linkedinUrl: [...COLS.linkedinUrl, "li url", "li profile", "linkedin"],
};

type DetectedMapping = {
  csvHeader: string;
  crmField: string | null;
  crmFieldLabel: string | null;
  fieldGroup: "account" | "contact" | null;
  confidence: number; // 0-100
  sampleValues: string[];
};

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

function detectMapping(header: string, sampleValues: string[]): { crmField: string | null; confidence: number } {
  const h = header.toLowerCase().replace(/[_\-\.]/g, " ").trim();

  // Exact match passes
  for (const [crmField, synonyms] of Object.entries(DETECTION_MAP)) {
    for (const syn of synonyms) {
      if (h === syn) return { crmField, confidence: 95 };
    }
  }

  // Substring / contains match
  for (const [crmField, synonyms] of Object.entries(DETECTION_MAP)) {
    for (const syn of synonyms) {
      if (h.includes(syn) || syn.includes(h)) return { crmField, confidence: 75 };
    }
  }

  // Heuristic: check sample values for email patterns
  const hasEmailPattern = sampleValues.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  if (hasEmailPattern) return { crmField: "email", confidence: 60 };

  // Heuristic: check for phone patterns
  const hasPhonePattern = sampleValues.some(v => /^[\+\(\d][\d\s\-\(\)\.]{6,}$/.test(v));
  if (hasPhonePattern) return { crmField: "phone", confidence: 55 };

  // Heuristic: check for URL patterns
  const hasUrlPattern = sampleValues.some(v => /^(https?:\/\/|www\.)/.test(v));
  if (hasUrlPattern) return { crmField: "domain", confidence: 50 };

  // Heuristic: check for LinkedIn patterns
  const hasLinkedinPattern = sampleValues.some(v => /linkedin\.com/.test(v));
  if (hasLinkedinPattern) return { crmField: "linkedinUrl", confidence: 85 };

  return { crmField: null, confidence: 0 };
}

function getFieldGroup(crmField: string): "account" | "contact" | null {
  if (CRM_FIELDS.account.some(f => f.key === crmField)) return "account";
  if (CRM_FIELDS.contact.some(f => f.key === crmField)) return "contact";
  return null;
}

function getFieldLabel(crmField: string): string | null {
  const accField = CRM_FIELDS.account.find(f => f.key === crmField);
  if (accField) return accField.label;
  const conField = CRM_FIELDS.contact.find(f => f.key === crmField);
  if (conField) return conField.label;
  return null;
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

    if (rows.length === 0) {
      return NextResponse.json({ headers: [], mappings: [], sampleRows: [], totalRows: 0, crmFields: CRM_FIELDS });
    }

    const headers = Object.keys(rows[0]);
    const sampleRows = rows.slice(0, 5);

    // Build mappings with auto-detection
    const usedCrmFields = new Set<string>();
    const mappings: DetectedMapping[] = [];

    for (const header of headers) {
      const sampleValues = rows.slice(0, 20).map(r => String(r[header] ?? "").trim()).filter(Boolean);
      let { crmField, confidence } = detectMapping(header, sampleValues);

      // Avoid duplicate mappings - if this field is already taken, reduce confidence
      if (crmField && usedCrmFields.has(crmField)) {
        // Check if this is an "additional" variant
        if (crmField === "email") {
          crmField = "additionalEmails";
          confidence = Math.max(confidence - 10, 50);
        } else if (crmField === "phone") {
          crmField = "additionalPhones";
          confidence = Math.max(confidence - 10, 50);
        } else {
          confidence = Math.max(confidence - 30, 20);
        }
      }

      if (crmField) usedCrmFields.add(crmField);

      mappings.push({
        csvHeader: header,
        crmField,
        crmFieldLabel: crmField ? getFieldLabel(crmField) : null,
        fieldGroup: crmField ? getFieldGroup(crmField) : null,
        confidence,
        sampleValues: sampleValues.slice(0, 3),
      });
    }

    return NextResponse.json({
      headers,
      mappings,
      sampleRows,
      totalRows: rows.length,
      crmFields: CRM_FIELDS,
    });

  } catch (error: any) {
    console.error("[IMPORT_SCAN]", error);
    return new NextResponse(error.message || "Failed to scan file", { status: 500 });
  }
}
