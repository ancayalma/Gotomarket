import * as cheerio from 'cheerio';
import { systemLogger } from "@/lib/logger";

export type ParsedHtmlData = {
  title: string;
  description: string;
  emails: string[];
  phones: string[];
  contacts: Array<{ name: string; title: string; email: string; phone: string; linkedin: string }>;
  socialLinks: { [key: string]: string };
  techStack: string[];
  internalLinks: string[];
  hrefList: string[];
  rawTextExcerpt: string;
  _techSnapshot?: { html?: string; scripts?: string[]; links?: string[] };
};

export function parseHtmlForBusinessData(html: string, url: string): ParsedHtmlData {
  const result: ParsedHtmlData = {
    title: "",
    description: "",
    emails: [],
    phones: [],
    contacts: [],
    socialLinks: {},
    techStack: [],
    internalLinks: [],
    hrefList: [],
    rawTextExcerpt: ""
  };

  try {
    const $ = cheerio.load(html);

    // Basic Metadata
    result.title = $('title').text().trim();
    result.description = $('meta[name="description"]').attr('content') || "";

    // Cleanup useless tags to get clean text
    $('script, style, noscript, iframe, svg, img, video, audio').remove();

    // Text Content
    const bodyText = $('body').text() || '';
    // Normalize whitespace
    const cleanText = bodyText.replace(/\s+/g, ' ').trim();
    // Excerpt for AI
    result.rawTextExcerpt = cleanText.substring(0, 15000); // 15k char cap

    // Extract Contacts and Emails using heuristics
    const seenEmails = new Set<string>();
    
    // 1. Mailto links with context
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
      if (!email || !email.includes('@') || seenEmails.has(email)) return;
      if (email.endsWith('.png') || email.endsWith('.jpg') || email.includes('example.com') || email.includes('email.com')) return;
      seenEmails.add(email);

      let name = "";
      let title = "";
      const parent = $(el).closest("li, div, p, td, article, section, figure, .team-member, [class*='card'], [class*='person'], [class*='member']");
      if (parent.length) {
        const heading = parent.find("h1, h2, h3, h4, h5, strong, b, [class*='name']").first();
        if (heading.length) {
          const candidateName = heading.text().trim();
          if (candidateName.length > 2 && candidateName.length < 60 && candidateName.split(" ").length >= 2) name = candidateName;
        }
        const titleEl = parent.find("[class*='title'], [class*='role'], [class*='position'], small, .subtitle, em").first();
        if (titleEl.length) {
          const candidateTitle = titleEl.text().trim();
          if (candidateTitle.length > 2 && candidateTitle.length < 80) title = candidateTitle;
        }
      }
      result.contacts.push({ name, title, email, phone: "", linkedin: "" });
    });

    // 2. Text emails
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const bodyEmailMatches: string[] = Array.from(cleanText.match(emailPattern) || []);
    for (const email of bodyEmailMatches) {
      const lower = email.toLowerCase();
      if (seenEmails.has(lower)) continue;
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.includes('example.com') || lower.includes('email.com') || lower.includes('@sentry') || lower.includes('@wix')) continue;
      seenEmails.add(lower);
      result.contacts.push({ name: "", title: "", email: lower, phone: "", linkedin: "" });
    }
    
    result.emails = Array.from(seenEmails).slice(0, 20);

    // Extract Phones
    const phonePatterns = [
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ];
    const allPhones: string[] = [];
    for (const pattern of phonePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        matches.forEach(m => allPhones.push(m));
      }
    }
    result.phones = Array.from(new Set(allPhones)).slice(0, 10);

    // Extract Links (internal and social)
    let baseUrlObj;
    try {
      baseUrlObj = new URL(url);
    } catch {
      baseUrlObj = null;
    }

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      const lowerHref = href.toLowerCase();
      
      // Collect social links
      if (lowerHref.includes('linkedin.com/company/')) result.socialLinks.linkedin = href;
      else if (lowerHref.includes('twitter.com/') || lowerHref.includes('x.com/')) result.socialLinks.twitter = href;
      else if (lowerHref.includes('facebook.com/')) result.socialLinks.facebook = href;
      else if (lowerHref.includes('instagram.com/')) result.socialLinks.instagram = href;
      
      // Resolve absolute url
      try {
        if (baseUrlObj) {
          const absoluteUrl = new URL(href, baseUrlObj.toString()).toString();
          if (!result.hrefList.includes(absoluteUrl)) {
            result.hrefList.push(absoluteUrl);
            
            // Check if internal
            if (new URL(absoluteUrl).hostname === baseUrlObj.hostname) {
              result.internalLinks.push(absoluteUrl);
            }
          }
        }
      } catch {
        // ignore invalid URLs
      }
    });

  } catch (error) {
    systemLogger.error(`[HTML_PARSER] Failed down-parsing for ${url}:`, error);
  }

  return result;
}
