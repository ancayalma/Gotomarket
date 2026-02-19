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
    companyName: ["company", "companyname", "org", "organization", "business", "account", "company name"],
    domain: ["domain", "website", "site", "companydomain", "company_domain"],
    homepageUrl: ["homepage", "url", "websiteurl", "companyurl", "company_url"],
    description: ["description", "about", "summary", "notes"],
    industry: ["industry", "sector"],
    techStack: ["techstack", "technology", "stack", "technologies"],
    fullName: ["name", "fullname", "contact", "person"],
    title: ["title", "role", "jobtitle", "position"],
    email: ["email", "emailaddress", "contactemail", "email1", "email_1", "primaryemail", "primary email", "primary email / contact"],
    additionalEmails: ["email2", "email3", "email_2", "email_3", "other_emails", "emails", "secondary email", "third email", "secondaryemail", "thirdemail"],
    phone: ["phone", "phonenumber", "contactphone", "mobile", "phone number"],
    linkedinUrl: ["linkedin", "linkedinurl", "linkedin_profile"],
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

export function normalizeRow(row: Record<string, any>): { candidate?: CandidateNorm; contacts?: ContactNorm[]; usedCols: string[] } {
    const usedCols: string[] = [];
    const contacts: ContactNorm[] = [];

    const companyName = lc(getFromRow(row, COLS.companyName));
    if (companyName) usedCols.push("companyName");
    const domain = lc(getFromRow(row, COLS.domain)).toLowerCase();
    if (domain) usedCols.push("domain");
    const homepageUrl = lc(getFromRow(row, COLS.homepageUrl));
    if (homepageUrl) usedCols.push("homepageUrl");
    const description = lc(getFromRow(row, COLS.description));
    if (description) usedCols.push("description");
    const industry = lc(getFromRow(row, COLS.industry));
    if (industry) usedCols.push("industry");
    const techStackRaw = getFromRow(row, COLS.techStack);
    const techStack =
        typeof techStackRaw === "string"
            ? techStackRaw
                .split(/[;,]/)
                .map((s: string) => s.trim())
                .filter(Boolean)
            : Array.isArray(techStackRaw)
                ? techStackRaw.map((s: any) => String(s).trim()).filter(Boolean)
                : undefined;
    if (techStack && techStack.length) usedCols.push("techStack");

    // dedupeKey for candidate: prefer domain; else companyName|homepageUrl; else companyName
    let candidateKey = "";
    if (domain) candidateKey = domain;
    else if (companyName && homepageUrl) candidateKey = `${companyName.toLowerCase()}|${homepageUrl.toLowerCase()}`;
    else if (companyName) candidateKey = companyName.toLowerCase();

    // Find all emails
    const allEmailsFound = new Set<string>();

    // Check every column in the row against our COLS.email and COLS.additionalEmails
    const emailSynonyms = [...COLS.email, ...COLS.additionalEmails];
    for (const rk of Object.keys(row)) {
        const lk = rk.toLowerCase();
        if (emailSynonyms.includes(lk)) {
            const val = row[rk];
            if (val) {
                if (!usedCols.includes(lk)) usedCols.push(lk);
                if (typeof val === "string") {
                    val.split(/[;,]/).forEach((e: string) => {
                        const trimmed = e.trim().toLowerCase();
                        if (trimmed && trimmed.includes("@")) allEmailsFound.add(trimmed);
                    });
                }
            }
        }
    }

    // Also specifically use the primary email col if we need it for contact key later
    const emailCol = getFromRow(row, COLS.email);

    const genericEmails: string[] = [];
    const discoveredContacts: ContactNorm[] = [];

    allEmailsFound.forEach(email => {
        const classification = classifyEmail(email);
        if (classification.type === "NAMED") {
            discoveredContacts.push({
                dedupeKey: email,
                candidateKey: candidateKey || undefined,
                fullName: classification.nameHint,
                email: email,
            });
        } else {
            genericEmails.push(email);
        }
    });

    const candidate =
        candidateKey
            ? {
                dedupeKey: candidateKey,
                domain: domain || undefined,
                companyName: companyName || undefined,
                homepageUrl: homepageUrl || undefined,
                description: description || undefined,
                industry: industry || undefined,
                techStack,
                additional_emails: genericEmails,
            }
            : undefined;

    // Manual Contact Info (if provided in dedicated columns)
    let fullName = lc(getFromRow(row, COLS.fullName));
    if (fullName.includes("@")) fullName = ""; // Don't treat email as name

    if (fullName) usedCols.push("fullName");
    const title = lc(getFromRow(row, COLS.title));
    if (title) usedCols.push("title");
    const phone = lc(getFromRow(row, COLS.phone));
    if (phone) usedCols.push("phone");
    const linkedinUrl = lc(getFromRow(row, COLS.linkedinUrl));
    if (linkedinUrl) usedCols.push("linkedinUrl");

    // If a specific name/email was in the row, make sure that contact is prioritized or added
    if (fullName || phone || linkedinUrl) {
        // try to find if one of our discovered contacts matches this info
        const targetEmail = emailCol?.toLowerCase();
        const existingIdx = discoveredContacts.findIndex(dc => (fullName && dc.fullName === fullName) || (targetEmail && dc.email === targetEmail));

        if (existingIdx >= 0) {
            discoveredContacts[existingIdx].fullName = fullName || discoveredContacts[existingIdx].fullName;
            discoveredContacts[existingIdx].title = title;
            discoveredContacts[existingIdx].phone = phone;
            discoveredContacts[existingIdx].linkedinUrl = linkedinUrl;
        } else if (fullName || phone || linkedinUrl) {
            // Only add if it's actually a named person
            const emailToUse = lc(emailCol);
            const isNamed = emailToUse ? classifyEmail(emailToUse).type === "NAMED" : !!fullName;

            if (isNamed) {
                let contactKey = "";
                if (emailToUse) contactKey = emailToUse.toLowerCase();
                else if (fullName && linkedinUrl) contactKey = `${fullName.toLowerCase()}|${linkedinUrl.toLowerCase()}`;
                else if (fullName && candidateKey) contactKey = `${fullName.toLowerCase()}|${candidateKey}`;

                if (contactKey) {
                    discoveredContacts.push({
                        dedupeKey: contactKey,
                        candidateKey: candidateKey || undefined,
                        fullName: fullName || undefined,
                        title: title || undefined,
                        email: emailToUse || undefined,
                        phone: phone || undefined,
                        linkedinUrl: linkedinUrl || undefined,
                    });
                }
            }
        }
    }

    return { candidate, contacts: discoveredContacts, usedCols };
}
