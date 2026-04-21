import { MetadataRoute } from 'next';
import competitors from '../data/competitors.json';
import industries from '../data/industries.json';
import locations from '../data/locations.json';

const getSafeBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  if (!envUrl || envUrl.trim() === "") {
    return PRODUCTION_FALLBACK;
  }

  const trimmed = envUrl.trim();

  // Skip localhost URLs in production sitemaps, force production URL
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return PRODUCTION_FALLBACK;
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSafeBaseUrl();
  const currentDate = new Date();

  // Define static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai-agents`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare/ratings`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/industry`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/location`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Map dynamic competitor pages
  const competitorRoutes: MetadataRoute.Sitemap = competitors.map((comp) => ({
    url: `${baseUrl}/compare/${comp.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Map dynamic industry pages
  const industryRoutes: MetadataRoute.Sitemap = industries.map((ind) => ({
    url: `${baseUrl}/industry/${ind.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Map dynamic location pages
  const locationRoutes: MetadataRoute.Sitemap = locations.map((loc) => ({
    url: `${baseUrl}/location/${loc.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...competitorRoutes, ...industryRoutes, ...locationRoutes];
}
