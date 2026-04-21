import { MetadataRoute } from 'next';

const getSafeBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  if (!envUrl || envUrl.trim() === "") {
    return PRODUCTION_FALLBACK;
  }

  const trimmed = envUrl.trim();

  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return PRODUCTION_FALLBACK;
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSafeBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', // Do not crawl API routes
        '/admin/', // Do not crawl admin tools
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
