/**
 * Shared freemail / personal email domain detection.
 * Used at registration time to decide whether to trigger SES verification
 * (workspace emails) or show a warning modal (personal emails).
 *
 * Personal-email users can still use the CRM fully — they simply cannot
 * use BasaltCRM's outbound email services (outreach, campaigns, etc.).
 */

const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "me.com",
    "live.com",
    "msn.com",
    "ymail.com",
    "zoho.com",
    "pm.me",
    "hey.com",
    "gmx.com",
    "gmx.net",
    "mail.ru",
    "yandex.com",
    "fastmail.com",
    "tutanota.com",
    "tutamail.com",
    "tuta.io",
    "rocketmail.com",
    "att.net",
    "comcast.net",
    "sbcglobal.net",
    "verizon.net",
    "cox.net",
    "charter.net",
    "earthlink.net",
    "optonline.net",
    "frontier.com",
    "qq.com",
    "163.com",
    "126.com",
    "naver.com",
    "daum.net",
    "hanmail.net",
]);

/**
 * Returns true if the email domain belongs to a free/personal email provider.
 * These addresses are NOT eligible for SES-based email verification or outreach.
 */
export function isFreemailDomain(email: string): boolean {
    if (!email || !email.includes("@")) return false;
    const domain = email.split("@")[1]?.toLowerCase().trim();
    return !!domain && FREE_EMAIL_DOMAINS.has(domain);
}
