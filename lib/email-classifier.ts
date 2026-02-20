/**
 * Utility to classify emails as "Generic" (corporate/inbox) or "Named" (individual).
 */

const GENERIC_WORDS = [
    "info", "sales", "support", "admin", "office", "hello", "contact",
    "enquiry", "queries", "marketing", "billing", "accounts", "hr",
    "jobs", "careers", "webmaster", "help", "service", "press", "media",
    "inbox", "general", "mail", "team", "staff", "reception", "partners",
    "partnership", "partnerships", "iso", "isosupport", "isos", "merchants",
    "merchant", "merchantsuccess", "success", "agent", "agents", "affiliate",
    "affiliates", "no-reply", "noreply", "newsletter", "accounting", "finance",
    "legal", "compliance", "privacy", "security", "dev", "tech", "it",
    "operations", "ops", "bizdev", "business", "feedback", "notification",
    "alert", "api", "system", "request", "care", "relations", "savings",
    "apply", "applications", "deals", "leads", "desk", "payment", "payments",
    "success", "growth", "member", "membership", "community", "trust",
    "partner", "manager", "phish", "phishing", "report", "spam", "desk",
    "service", "help", "support", "success", "careers", "hiring",
    "complaints", "grievances", "grievance", "commerce", "dpo", "legal",
    "lawyer", "attorney", "compliance", "abuse", "fraud", "security",
    "merchant", "merchants", "bizdev", "development", "research",
    "llc", "corp", "inc", "company", "process", "systems", "solutions",
    "bank", "banking", "finance", "financial", "account", "funds",
    "sac", "reclami", "claim", "claims", "merchant", "merchants",
    "risk", "start", "integration", "assistance", "reachus", "play",
    "google", "africa", "europe", "asia", "americas", "usa", "uk",
    "test", "demo", "mail", "user", "guest", "client", "customer",
    "google-play", "googleplay", "playstore", "appstore", "ios", "android",
    "onboarding", "signup", "verification", "auth", "security", "privacy",
    "compliance", "abuse", "fraud", "risk", "dispute", "disputes",
    "chargeback", "chargebacks", "payout", "payouts", "settlement",
    "integration", "integrations", "developer", "developers", "api",
    "webhook", "webhooks", "sandbox", "production", "live", "start",
    "begin", "go", "launch", "getstarted", "reachus", "contactus",
    "helpdesk", "supportdesk", "servicedesk", "assistance",
    "nick", "nicki", "pda",
];

export type EmailClassification = {
    type: "GENERIC" | "NAMED";
    nameHint?: string;
};

export function classifyEmail(email: string): EmailClassification {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes("@")) return { type: "GENERIC" };

    const [prefix, domain] = cleanEmail.split("@");
    if (!prefix) return { type: "GENERIC" };

    // Mitigation for Short Names (Initials):
    // Allow prefix length 2 if it contains a separator like a dot (e.g., "j.o@")
    if (prefix.length < 3 && !prefix.includes(".") && !prefix.includes("_") && !prefix.includes("-")) {
        return { type: "GENERIC" };
    }

    const domainParts = domain.split(".");
    const domainName = domainParts[0];

    // 1. Exact match in generic list
    if (GENERIC_WORDS.includes(prefix)) {
        return { type: "GENERIC" };
    }

    // 2. Check if prefix matches the domain name
    if (prefix === domainName) {
        return { type: "GENERIC" };
    }

    // 3. Check if prefix contains any generic word as a discrete part
    const parts = prefix.split(/[\._\-]/);
    if (parts.some(part => GENERIC_WORDS.includes(part))) {
        return { type: "GENERIC" };
    }

    // 4. Check for concatenated generic words
    if (GENERIC_WORDS.some(word => {
        if (word.length === 3) return prefix.endsWith(word);
        if (word.length < 3) return false;
        return prefix.startsWith(word) || prefix.endsWith(word);
    })) {
        return { type: "GENERIC" };
    }

    // 5. Pattern-based: Numbers without separators
    if (/\d/.test(prefix) && !prefix.includes(".") && !prefix.includes("_") && !prefix.includes("-")) {
        return { type: "GENERIC" };
    }

    // 6. Common system starters
    const systemStarters = ["test", "demo", "mail", "user", "guest", "client", "customer", "project"];
    if (systemStarters.some(s => prefix.startsWith(s))) {
        return { type: "GENERIC" };
    }

    // If we passed all checks, it's likely a NAMED contact
    let nameHint = "";
    if (prefix.includes(".")) {
        nameHint = prefix.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    } else if (prefix.includes("_")) {
        nameHint = prefix.split("_").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    } else if (prefix.includes("-")) {
        nameHint = prefix.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    } else {
        nameHint = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return { type: "NAMED", nameHint };
}

export function sortEmails(emails: string[]): {
    primary: string | null;
    named: { email: string; name: string }[];
    generic: string[];
} {
    const named: { email: string; name: string }[] = [];
    const generic: string[] = [];

    emails.forEach((email) => {
        const classification = classifyEmail(email);
        if (classification.type === "NAMED") {
            named.push({ email, name: classification.nameHint || "Contact" });
        } else {
            generic.push(email);
        }
    });

    let primary: string | null = null;
    if (named.length > 0) primary = named[0].email;
    else if (generic.length > 0) primary = generic[0];

    return { primary, named, generic };
}
