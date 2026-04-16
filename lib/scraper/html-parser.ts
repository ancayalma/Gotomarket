import * as cheerio from 'cheerio';
import { systemLogger } from "@/lib/logger";

export type ParsedHtmlData = {
  title: string;
  description: string;
  emails: string[];
  phones: string[];
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

    // Extract Emails
    const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const bodyEmailMatches: string[] = Array.from(cleanText.match(emailPattern) || []);
    
    // Also from mailto: links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0];
        if (email && email.includes('@')) {
          bodyEmailMatches.push(email);
        }
      }
    });

    const filteredEmails = Array.from(new Set(bodyEmailMatches)).filter(email => {
      const lower = email.toLowerCase();
      return !lower.includes('example.com') &&
        !lower.includes('domain.com') &&
        !lower.includes('email.com') &&
        !lower.includes('@sentry') &&
        !lower.includes('@wix') &&
        !lower.includes('@squarespace') &&
        !lower.endsWith('.png') &&
        !lower.endsWith('.jpg');
    });
    result.emails = filteredEmails.slice(0, 20);

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
