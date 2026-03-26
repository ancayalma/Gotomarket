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
    // ── New fields ────────────────────────────────
    accountType?: string;
    accountStatus?: string;
    employeeCount?: string;
    revenue?: string;
    vat?: string;
    companyId?: string;
    accountEmail?: string;
    accountPhone?: string;
    fax?: string;
    billingStreet?: string;
    billingCity?: string;
    billingState?: string;
    billingPostalCode?: string;
    billingCountry?: string;
    shippingStreet?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
    location?: string;
    accountLinkedin?: string;
    accountTwitter?: string;
    accountFacebook?: string;
    accountInstagram?: string;
};

export type ContactNorm = {
    dedupeKey: string;
    candidateKey?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    // ── New fields ────────────────────────────────
    department?: string;
    personalEmail?: string;
    mobilePhone?: string;
    officePhone?: string;
    contactTwitter?: string;
    contactFacebook?: string;
    contactInstagram?: string;
    contactSkype?: string;
    birthday?: string;
    contactWebsite?: string;
    contactDescription?: string;
    tags?: string;
};

export const COLS = {
    // ── Account ───────────────────────────────────
    companyName: ["company", "companyname", "org", "organization", "business", "account", "company name", "legal name", "merchant name"],
    domain: ["domain", "website", "site", "companydomain", "company_domain", "url"],
    homepageUrl: ["homepage", "websiteurl", "companyurl", "company_url"],
    description: ["description", "about", "summary", "notes", "comments"],
    industry: ["industry", "sector", "vertical", "mcc"],
    techStack: ["techstack", "technology", "stack", "technologies"],
    accountType: ["type", "account type", "company type", "business category"],
    accountStatus: ["account status", "customer status"],
    employeeCount: ["employees", "employee count", "headcount", "company size", "team size", "staff"],
    revenue: ["revenue", "arr", "annual revenue", "turnover", "sales volume"],
    vat: ["vat", "vat number", "tax id", "tax number", "gst", "abn", "tin"],
    companyId: ["company id", "registration number", "reg no", "ein", "company number"],
    accountEmail: ["company email", "account email", "general email", "office email", "corporate email"],
    accountPhone: ["company phone", "account phone", "main phone", "corporate phone", "switchboard"],
    fax: ["fax", "fax number", "facsimile"],
    // Billing address
    billingStreet: ["billing street", "billing address", "billing address 1", "street address", "address 1", "address line 1", "street"],
    billingCity: ["billing city", "city"],
    billingState: ["billing state", "billing province", "state", "province", "state/province", "region"],
    billingPostalCode: ["billing zip", "billing postal code", "zip", "postal code", "postcode", "zip code"],
    billingCountry: ["billing country", "country", "nation"],
    // Shipping address
    shippingStreet: ["shipping street", "shipping address", "shipping address 1", "delivery address", "mailing address", "address 2", "address line 2"],
    shippingCity: ["shipping city", "delivery city", "mailing city"],
    shippingState: ["shipping state", "shipping province", "delivery state", "mailing state"],
    shippingPostalCode: ["shipping zip", "shipping postal code", "delivery zip", "mailing zip"],
    shippingCountry: ["shipping country", "delivery country", "mailing country"],
    location: ["location", "hq", "headquarters", "geo", "geography"],
    accountLinkedin: ["company linkedin", "account linkedin", "linkedin company"],
    accountTwitter: ["company twitter", "account twitter"],
    accountFacebook: ["company facebook", "account facebook"],
    accountInstagram: ["company instagram", "account instagram"],
    // ── Contact ───────────────────────────────────
    fullName: ["name", "fullname", "contact", "person", "contact name", "primary contact"],
    firstName: ["first name", "firstname", "first", "given name", "fname"],
    lastName: ["last name", "lastname", "last", "surname", "family name", "lname"],
    title: ["title", "role", "jobtitle", "position", "job title"],
    department: ["department", "dept", "division", "business unit"],
    email: ["email", "emailaddress", "contactemail", "email1", "email_1", "primaryemail", "primary email", "primary email / contact", "contact email"],
    additionalEmails: ["email2", "email3", "email_4", "other_emails", "emails", "secondary email", "third email", "secondaryemail", "thirdemail", "additional email"],
    personalEmail: ["personal email", "private email", "home email"],
    phone: ["phone", "phonenumber", "contactphone", "mobile", "phone number", "office phone", "business phone", "phone 1", "phone_1"],
    additionalPhones: ["phone2", "phone3", "phone_2", "secondary phone", "other phone", "mobile phone", "direct phone", "direct line"],
    mobilePhone: ["mobile", "mobile phone", "cell phone", "cell", "cellphone", "mobile number"],
    officePhone: ["office phone", "direct phone", "direct line", "direct dial", "desk phone", "extension", "ext"],
    linkedinUrl: ["linkedin", "linkedinurl", "linkedin_profile", "linkedin profile"],
    contactTwitter: ["twitter", "twitter handle", "twitter url", "x handle"],
    contactFacebook: ["facebook", "facebook url", "fb", "fb url"],
    contactInstagram: ["instagram", "instagram handle", "ig", "ig handle"],
    contactSkype: ["skype", "skype id", "skype name"],
    birthday: ["birthday", "date of birth", "dob", "birth date", "birthdate"],
    contactWebsite: ["personal website", "blog", "portfolio"],
    contactDescription: ["contact notes", "contact bio", "person notes"],
    tags: ["tags", "labels", "categories", "keywords"],
};

function lc(s: any): string {
    if (s === null || s === undefined) return "";
    if (typeof s === "number") return String(s);
    return typeof s === "string" ? s.trim() : "";
}

/**
 * Strips legal suffixes and noise to find the core brand name.
 */
export function normalizeCompanyName(name: string): string {
    if (!name) return "";
    let n = name.toLowerCase().trim();

    const commonLegal = ["llc", "inc", "corp", "ltd", "corporation", "incorporated", "limited", "group"];
    if (commonLegal.includes(n.replace(/[,\.]/g, ""))) return n;

    const noisePatterns = [
        /\bl\.?l\.?c\.?$/g,
        /\bl\.?p\.?$/g,
        /\bi\.?n\.?c\.?\\.?$/g,
        /\bc\.?o\.?r\.?p\.?\\.?$/g,
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
        if (potential) n = potential;
    });

    n = n.replace(/[,\.\s]+$/g, "").trim();

    return n;
}

/**
 * Normalizes a URL/Domain to a consistent format.
 */
export function normalizeDomain(url: string): string {
    if (!url) return "";
    let d = url.toLowerCase().trim();

    d = d.replace(/^(https?:\/\/)?(www\.)?/, "");
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

const JUNK_PHONES = ["0000000000", "1234567890", "9999999999"];
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

    // ── New account fields ────────────────────────────
    const accountType = lc(getFromRow(row, COLS.accountType));
    if (accountType) usedCols.push("accountType");
    const accountStatus = lc(getFromRow(row, COLS.accountStatus));
    if (accountStatus) usedCols.push("accountStatus");
    const employeeCount = lc(getFromRow(row, COLS.employeeCount));
    if (employeeCount) usedCols.push("employeeCount");
    const revenue = lc(getFromRow(row, COLS.revenue));
    if (revenue) usedCols.push("revenue");
    const vat = lc(getFromRow(row, COLS.vat));
    if (vat) usedCols.push("vat");
    const companyIdVal = lc(getFromRow(row, COLS.companyId));
    if (companyIdVal) usedCols.push("companyId");
    const accountEmail = lc(getFromRow(row, COLS.accountEmail));
    if (accountEmail) usedCols.push("accountEmail");
    const accountPhone = lc(getFromRow(row, COLS.accountPhone));
    if (accountPhone) usedCols.push("accountPhone");
    const fax = lc(getFromRow(row, COLS.fax));
    if (fax) usedCols.push("fax");
    // Billing address
    const billingStreet = lc(getFromRow(row, COLS.billingStreet));
    if (billingStreet) usedCols.push("billingStreet");
    const billingCity = lc(getFromRow(row, COLS.billingCity));
    if (billingCity) usedCols.push("billingCity");
    const billingState = lc(getFromRow(row, COLS.billingState));
    if (billingState) usedCols.push("billingState");
    const billingPostalCode = lc(getFromRow(row, COLS.billingPostalCode));
    if (billingPostalCode) usedCols.push("billingPostalCode");
    const billingCountry = lc(getFromRow(row, COLS.billingCountry));
    if (billingCountry) usedCols.push("billingCountry");
    // Shipping address
    const shippingStreet = lc(getFromRow(row, COLS.shippingStreet));
    if (shippingStreet) usedCols.push("shippingStreet");
    const shippingCity = lc(getFromRow(row, COLS.shippingCity));
    if (shippingCity) usedCols.push("shippingCity");
    const shippingState = lc(getFromRow(row, COLS.shippingState));
    if (shippingState) usedCols.push("shippingState");
    const shippingPostalCode = lc(getFromRow(row, COLS.shippingPostalCode));
    if (shippingPostalCode) usedCols.push("shippingPostalCode");
    const shippingCountry = lc(getFromRow(row, COLS.shippingCountry));
    if (shippingCountry) usedCols.push("shippingCountry");
    const location = lc(getFromRow(row, COLS.location));
    if (location) usedCols.push("location");
    // Account social
    const accountLinkedin = lc(getFromRow(row, COLS.accountLinkedin));
    if (accountLinkedin) usedCols.push("accountLinkedin");
    const accountTwitter = lc(getFromRow(row, COLS.accountTwitter));
    if (accountTwitter) usedCols.push("accountTwitter");
    const accountFacebook = lc(getFromRow(row, COLS.accountFacebook));
    if (accountFacebook) usedCols.push("accountFacebook");
    const accountInstagram = lc(getFromRow(row, COLS.accountInstagram));
    if (accountInstagram) usedCols.push("accountInstagram");

    // Gather all emails in the row
    const allEmailsFound = new Set<string>();
    const emailSynonyms = [...COLS.email, ...COLS.additionalEmails];
    for (const rk of Object.keys(row)) {
        const lk = rk.toLowerCase();
        if (emailSynonyms.includes(lk) || lk.includes("email")) {
            const rawVal = row[rk];
            if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
                const val = String(rawVal).trim();
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

    // Dedupe Key Mitigation
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
        // New account fields
        accountType: accountType || undefined,
        accountStatus: accountStatus || undefined,
        employeeCount: employeeCount || undefined,
        revenue: revenue || undefined,
        vat: vat || undefined,
        companyId: companyIdVal || undefined,
        accountEmail: accountEmail || undefined,
        accountPhone: accountPhone || undefined,
        fax: fax || undefined,
        billingStreet: billingStreet || undefined,
        billingCity: billingCity || undefined,
        billingState: billingState || undefined,
        billingPostalCode: billingPostalCode || undefined,
        billingCountry: billingCountry || undefined,
        shippingStreet: shippingStreet || undefined,
        shippingCity: shippingCity || undefined,
        shippingState: shippingState || undefined,
        shippingPostalCode: shippingPostalCode || undefined,
        shippingCountry: shippingCountry || undefined,
        location: location || undefined,
        accountLinkedin: accountLinkedin || undefined,
        accountTwitter: accountTwitter || undefined,
        accountFacebook: accountFacebook || undefined,
        accountInstagram: accountInstagram || undefined,
    } : undefined;

    // Contact Metadata
    let fullName = lc(getFromRow(row, COLS.fullName));
    if (fullName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullName)) fullName = "";

    // First/last name fallback
    const firstName = lc(getFromRow(row, COLS.firstName));
    if (firstName) usedCols.push("firstName");
    const lastName = lc(getFromRow(row, COLS.lastName));
    if (lastName) usedCols.push("lastName");
    if (!fullName && (firstName || lastName)) {
        fullName = [firstName, lastName].filter(Boolean).join(" ");
    }

    if (fullName) usedCols.push("fullName");
    const title = lc(getFromRow(row, COLS.title));
    if (title) usedCols.push("title");
    const linkedinUrl = lc(getFromRow(row, COLS.linkedinUrl));
    if (linkedinUrl) usedCols.push("linkedinUrl");

    // ── New contact fields ────────────────────────────
    const department = lc(getFromRow(row, COLS.department));
    if (department) usedCols.push("department");
    const personalEmail = lc(getFromRow(row, COLS.personalEmail));
    if (personalEmail) usedCols.push("personalEmail");
    const mobilePhone = lc(getFromRow(row, COLS.mobilePhone));
    if (mobilePhone) usedCols.push("mobilePhone");
    const officePhone = lc(getFromRow(row, COLS.officePhone));
    if (officePhone) usedCols.push("officePhone");
    const contactTwitter = lc(getFromRow(row, COLS.contactTwitter));
    if (contactTwitter) usedCols.push("contactTwitter");
    const contactFacebook = lc(getFromRow(row, COLS.contactFacebook));
    if (contactFacebook) usedCols.push("contactFacebook");
    const contactInstagram = lc(getFromRow(row, COLS.contactInstagram));
    if (contactInstagram) usedCols.push("contactInstagram");
    const contactSkype = lc(getFromRow(row, COLS.contactSkype));
    if (contactSkype) usedCols.push("contactSkype");
    const birthday = lc(getFromRow(row, COLS.birthday));
    if (birthday) usedCols.push("birthday");
    const contactWebsite = lc(getFromRow(row, COLS.contactWebsite));
    if (contactWebsite) usedCols.push("contactWebsite");
    const contactDescription = lc(getFromRow(row, COLS.contactDescription));
    if (contactDescription) usedCols.push("contactDescription");
    const tags = lc(getFromRow(row, COLS.tags));
    if (tags) usedCols.push("tags");

    // Gather all phones in the row
    const allPhonesFound = new Set<string>();
    const phoneSynonyms = [...COLS.phone, ...COLS.additionalPhones];
    for (const rk of Object.keys(row)) {
        const lk = rk.toLowerCase();
        if (phoneSynonyms.includes(lk)) {
            const val = row[rk];
            if (val !== null && val !== undefined && val !== "") {
                if (!usedCols.includes(lk)) usedCols.push(lk);
                allPhonesFound.add(String(val).trim());
            }
        }
    }

    const primaryPhone = lc(getFromRow(row, COLS.phone));
    const finalPhone = primaryPhone || mobilePhone || officePhone || Array.from(allPhonesFound)[0] || "";

    if (fullName || finalPhone || linkedinUrl) {
        const targetEmail = lc(emailCol).toLowerCase();
        const existingIdx = discoveredContacts.findIndex(dc => (fullName && dc.fullName === fullName) || (targetEmail && dc.email === targetEmail));

        if (existingIdx >= 0) {
            discoveredContacts[existingIdx].fullName = fullName || discoveredContacts[existingIdx].fullName;
            discoveredContacts[existingIdx].firstName = firstName || undefined;
            discoveredContacts[existingIdx].lastName = lastName || undefined;
            discoveredContacts[existingIdx].title = title;
            discoveredContacts[existingIdx].phone = finalPhone || discoveredContacts[existingIdx].phone;
            discoveredContacts[existingIdx].linkedinUrl = linkedinUrl;
            discoveredContacts[existingIdx].department = department || undefined;
            discoveredContacts[existingIdx].personalEmail = personalEmail || undefined;
            discoveredContacts[existingIdx].mobilePhone = mobilePhone || undefined;
            discoveredContacts[existingIdx].officePhone = officePhone || undefined;
            discoveredContacts[existingIdx].contactTwitter = contactTwitter || undefined;
            discoveredContacts[existingIdx].contactFacebook = contactFacebook || undefined;
            discoveredContacts[existingIdx].contactInstagram = contactInstagram || undefined;
            discoveredContacts[existingIdx].contactSkype = contactSkype || undefined;
            discoveredContacts[existingIdx].birthday = birthday || undefined;
            discoveredContacts[existingIdx].contactWebsite = contactWebsite || undefined;
            discoveredContacts[existingIdx].contactDescription = contactDescription || undefined;
            discoveredContacts[existingIdx].tags = tags || undefined;
        } else if (fullName || finalPhone || linkedinUrl) {
            const isNamed = targetEmail ? classifyEmail(targetEmail).type === "NAMED" : !!fullName;
            if (isNamed) {
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
                        firstName: firstName || undefined,
                        lastName: lastName || undefined,
                        title: title || undefined,
                        email: targetEmail || undefined,
                        phone: finalPhone || undefined,
                        linkedinUrl: linkedinUrl || undefined,
                        department: department || undefined,
                        personalEmail: personalEmail || undefined,
                        mobilePhone: mobilePhone || undefined,
                        officePhone: officePhone || undefined,
                        contactTwitter: contactTwitter || undefined,
                        contactFacebook: contactFacebook || undefined,
                        contactInstagram: contactInstagram || undefined,
                        contactSkype: contactSkype || undefined,
                        birthday: birthday || undefined,
                        contactWebsite: contactWebsite || undefined,
                        contactDescription: contactDescription || undefined,
                        tags: tags || undefined,
                    });
                }
            }
        }
    }

    return { candidate, contacts: discoveredContacts, usedCols };
}
