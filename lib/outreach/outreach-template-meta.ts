/**
 * Outreach email template metadata — CLIENT-SAFE.
 *
 * Contains only the template catalogue and type definitions.
 * No react-email or server-only imports.
 * Used by the wizard UI for rendering the template picker cards.
 */

export type OutreachTemplateId =
  | "minimal"
  | "professional"
  | "bold"
  | "executive"
  | "playful"
  | "newsletter";

export interface OutreachTemplateMeta {
  id: OutreachTemplateId;
  name: string;
  description: string;
  /** Short style hints for the card preview */
  style: string;
}

/** Template catalogue — order here determines display order in wizard */
export const OUTREACH_TEMPLATES: OutreachTemplateMeta[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean text-focused layout with subtle resource links. No distractions — lets your words do the talking.",
    style: "Clean • Text-first • Subtle",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Branded header bar with logo, pill-shaped buttons, and accent dividers. Business-ready polish.",
    style: "Branded • Structured • Polished",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Full-width gradient hero header, large greeting, and stacked CTA buttons with dark footer. High impact.",
    style: "Gradient hero • Dark footer • High impact",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Serif typography with thin gold accent lines. Understated elegance for C-suite and high-touch outreach.",
    style: "Serif • Gold accents • Elegant",
  },
  {
    id: "playful",
    name: "Playful",
    description: "Rounded cards, pastel palette, and friendly vibes. Perfect for creative industries and startups.",
    style: "Rounded • Pastel • Friendly",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Magazine-style masthead with editorial body and two-column resource cards. Informative and engaging.",
    style: "Editorial • Columned • Magazine",
  },
];
