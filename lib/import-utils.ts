import { classifyEmail } from "./email-classifier";

export type CandidateNorm = {
    dedupeKey: string;
    domain?: string;
    companyName?: string;
    homepageUrl?: string;
    description?: string;
    industry?: string;
    techStack?: string[];
    additional_emails?: string[];
};

export type ContactNorm = {
    dedupeKey: string;
    candidateKey?: string;
    fullName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
};

export const COLS = {
    companyName: ["company", "companyname", "org", "organization", "business", "account", "company name", "legal name", "merchant name"],
    domain: ["domain", "website", "site", "companydomain", "company_domain", "url"],
    homepageUrl: ["homepage", "websiteurl", "companyurl", "company_url"],
    description: ["description", "about", "summary", "notes", "comments"],
    industry: ["industry", "sector", "vertical", "mcc"],
    techStack: ["techstack", "technology", "stack", "technologies"],
    fullName: ["name", "fullname", "contact", "person", "contact name", "primary contact"],
    title: ["title", "role", "jobtitle", "position", "job title"],
    email: ["email", "emailaddress", "contactemail", "email1", "email_1", "primaryemail", "primary email", "primary email / contact", "contact email"],
    additionalEmails: ["email2", "email3", "email_4", "other_emails", "emails", "secondary email", "third email", "secondaryemail", "thirdemail", "additional email"],
    phone: ["phone", "phonenumber", "contactphone", "mobile", "phone number", "office phone", "business phone", "phone 1", "phone_1"],
    additionalPhones: ["phone2", "phone3", "phone_2", "secondary phone", "other phone", "mobile phone", "direct phone", "direct line"],
    linkedinUrl: ["linkedin", "linkedinurl", "linkedin_profile", "linkedin profile"],
};

function lc(s: any): string {
    return typeof s === "string" ? s.trim() : "";
}

/**
 * Strips legal suffixes and noise to find the core brand name.
 */
export function normalizeCompanyName(name: string): string {
    if (!name) return "";
    let n = name.toLowerCase().trim();

    // Exact map for special cases or if the name is just a legal entity
    const commonLegal = ["llc", "inc", "corp", "ltd", "corporation", "incorporated", "limited", "group"];
    if (commonLegal.includes(n.replace(/[,\.]/g, ""))) return n;

    // Remove legal entities and common noise only if they are at the end
    const noisePatterns = [
        /\bl\.?l\.?c\.?$/g,
        /\bl\.?p\.?$/g,
        /\bi\.?n\.?c\.?\.?$/g,
        /\bc\.?o\.?r\.?p\.?\.?$/g,
        /\bltd\.?$/g,
        /\bincorporated$/g,
        /\bcorporation$/g,
        /\blimited$/g,
        /\bgroup$/g,
        /\bholdings$/g,
        /\bservices$/g,
        /\bsvcs\.?$/g,
        /\btechnology$/g,
        /\bsystems$/g,
        /\bglobal$/g,
    ];

    noisePatterns.forEach(pattern => {
        const potential = n.replace(pattern, "").trim();
        if (potential) n = potential; // Only apply if it doesn't leave an empty string
    });

    // Strip trailing commas/dots
    n = n.replace(/[,\.\s]+$/g, "").trim();

    return n;
}

/**
 * Normalizes a URL/Domain to a consistent format.
 */
export function normalizeDomain(url: string): string {
    if (!url) return "";
    let d = url.toLowerCase().trim();

    // Remove protocol and www
    d = d.replace(/^(https?:\/\/)?(www\.)?/, "");

    // Remove paths, queries, fragments
    d = d.split(/[/?#]/)[0];

    return d;
}

function getFromRow(row: Record<string, any>, keys: string[]): any {
    for (const k of keys) {
        for (const rk of Object.keys(row)) {
            if (rk.toLowerCase() === k) return row[rk];
        }
    }
    return undefined;
}

// Global list of junk phone numbers to ignore for deduplication
const JUNK_PHONES = ["0000000000", "1234567890", "9999999999"];

// Global list of public email domains
const PUBLIC_DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "aol.com", "live.com", "msn.com", "me.com"];

export function normalizeRow(row: Record<string, any>): { candidate?: CandidateNorm; contacts?: ContactNorm[]; usedCols: string[] } {
    const usedCols: string[] = [];
    let domain = normalizeDomain(lc(getFromRow(row, COLS.domain)));
    if (domain) usedCols.push("domain");

    const companyName = lc(getFromRow(row, COLS.companyName));
    if (companyName) usedCols.push("companyName");

    const homepageUrl = lc(getFromRow(row, COLS.homepageUrl));
    if (homepageUrl) usedCols.push("homepageUrl");

    const description = lc(getFromRow(row, COLS.description));
    if (description) usedCols.push("description");

    const industry = lc(getFromRow(row, COLS.industry));
    if (industry) usedCols.push("industry");

    const techStackRaw = getFromRow(row, COLS.techStack);
    const techStack =
        typeof techStackRaw === "string"
            ? techStackRaw.split(/[;,|]/).map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(techStackRaw)
                ? techStackRaw.map((s: any) => String(s).trim()).filter(Boolean)
                : undefined;
    if (techStack && techStack.length) usedCols.push("techStack");

    // Gather all emails in the row
    const allEmailsFound = new Set<string>();
    const emailSynonyms = [...COLS.email, ...COLS.additionalEmails];
    for (const rk of Object.keys(row)) {
        const lk = rk.toLowerCase();
        if (emailSynonyms.includes(lk)) {
            const val = row[rk];
            if (val && typeof val === "string") {
                if (!usedCols.includes(lk)) usedCols.push(lk);
                val.split(/[;,|]/).forEach((e: string) => {
                    const trimmed = e.trim().toLowerCase();
                    if (trimmed && trimmed.includes("@")) allEmailsFound.add(trimmed);
                });
            }
        }
    }

    // Domain Extraction Mitigation
    if (!domain && allEmailsFound.size > 0) {
        for (const email of Array.from(allEmailsFound)) {
            const domainPart = email.split("@")[1];
            if (domainPart && !PUBLIC_DOMAINS.includes(domainPart)) {
                domain = domainPart;
                break;
            }
        }
    }

    // Dedupe Key Mitigation (Block public domains as account dedupe keys)
    let finalCandidateKey = "";
    if (domain && !PUBLIC_DOMAINS.includes(domain)) {
        finalCandidateKey = domain;
    } else {
        const normalizedName = normalizeCompanyName(companyName);
        if (normalizedName) {
            finalCandidateKey = domain ? `${normalizedName}|${domain}` : normalizedName;
        }
    }

    const emailCol = getFromRow(row, COLS.email);
    const genericEmails: string[] = [];
    const discoveredContacts: ContactNorm[] = [];

    allEmailsFound.forEach(email => {
        const classification = classifyEmail(email);
        if (classification.type === "NAMED") {
            discoveredContacts.push({
                dedupeKey: email,
                candidateKey: finalCandidateKey || undefined,
                fullName: classification.nameHint,
                email: email,
            });
        } else {
            genericEmails.push(email);
        }
    });

    const candidate = finalCandidateKey ? {
        dedupeKey: finalCandidateKey,
        domain: domain || undefined,
        companyName: companyName || undefined,
        homepageUrl: homepageUrl || undefined,
        description: description || undefined,
        industry: industry || undefined,
        techStack,
        additional_emails: genericEmails,
    } : undefined;

    // Contact Metadata
    let fullName = lc(getFromRow(row, COLS.fullName));
    // Improved Email Detection: Only clear if it actually matches an email pattern
    if (fullName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullName)) fullName = "";

    if (fullName) usedCols.push("fullName");
    const title = lc(getFromRow(row, COLS.title));
    if (title) usedCols.push("title");
    const linkedinUrl = lc(getFromRow(row, COLS.linkedinUrl));
    if (linkedinUrl) usedCols.push("linkedinUrl");

    // Gather all phones in the row
    const allPhonesFound = new Set<string>();
    const phoneSynonyms = [...COLS.phone, ...COLS.additionalPhones];
    for (const rk of Object.keys(row)) {
        const lk = rk.toLowerCase();
        if (phoneSynonyms.includes(lk)) {
            const val = row[rk];
            if (val) {
                if (!usedCols.includes(lk)) usedCols.push(lk);
                allPhonesFound.add(String(val).trim());
            }
        }
    }

    const primaryPhone = lc(getFromRow(row, COLS.phone));
    // Prioritize mobile/direct if primary is empty
    const finalPhone = primaryPhone || Array.from(allPhonesFound)[0] || "";

    if (fullName || finalPhone || linkedinUrl) {
        const targetEmail = lc(emailCol).toLowerCase();
        const existingIdx = discoveredContacts.findIndex(dc => (fullName && dc.fullName === fullName) || (targetEmail && dc.email === targetEmail));

        if (existingIdx >= 0) {
            discoveredContacts[existingIdx].fullName = fullName || discoveredContacts[existingIdx].fullName;
            discoveredContacts[existingIdx].title = title;
            discoveredContacts[existingIdx].phone = finalPhone || discoveredContacts[existingIdx].phone;
            discoveredContacts[existingIdx].linkedinUrl = linkedinUrl;
        } else if (fullName || finalPhone || linkedinUrl) {
            const isNamed = targetEmail ? classifyEmail(targetEmail).type === "NAMED" : !!fullName;
            if (isNamed) {
                // Ignore junk phones for deduplication keys
                const cleanPhone = finalPhone.replace(/\D/g, "");
                const isJunkPhone = JUNK_PHONES.includes(cleanPhone);

                let contactKey = "";
                if (targetEmail) contactKey = targetEmail;
                else if (fullName && linkedinUrl) contactKey = `${fullName.toLowerCase()}|${linkedinUrl.toLowerCase()}`;
                else if (fullName && finalCandidateKey) contactKey = `${fullName.toLowerCase()}|${finalCandidateKey}`;

                if (contactKey) {
                    discoveredContacts.push({
                        dedupeKey: contactKey,
                        candidateKey: finalCandidateKey || undefined,
                        fullName: fullName || undefined,
                        title: title || undefined,
                        email: targetEmail || undefined,
                        phone: finalPhone || undefined,
                        linkedinUrl: linkedinUrl || undefined,
                    });
                }
            }
        }
    }

    return { candidate, contacts: discoveredContacts, usedCols };
}
