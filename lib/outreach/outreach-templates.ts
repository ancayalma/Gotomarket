/**
 * Outreach email template registry — SERVER-ONLY.
 *
 * Re-exports client-safe metadata from outreach-template-meta.ts and adds
 * the server-only renderOutreachTemplate function that depends on react-email.
 */

import React from "react";
import { render } from "@react-email/render";
import OutreachTemplate from "@/emails/OutreachTemplate";
import type { ResourceLink } from "@/emails/OutreachTemplate";
import OutreachProfessionalTemplate from "@/emails/OutreachProfessionalTemplate";
import OutreachBoldTemplate from "@/emails/OutreachBoldTemplate";
import OutreachExecutiveTemplate from "@/emails/OutreachExecutiveTemplate";
import OutreachPlayfulTemplate from "@/emails/OutreachPlayfulTemplate";
import OutreachNewsletterTemplate from "@/emails/OutreachNewsletterTemplate";

// Re-export everything from the client-safe metadata file
export { OUTREACH_TEMPLATES, type OutreachTemplateId, type OutreachTemplateMeta } from "./outreach-template-meta";
import type { TemplateOptions } from "./outreach-styles";
export type { TemplateOptions };

export interface OutreachRenderProps {
  subjectPreview?: string;
  bodyText: string;
  resources?: ResourceLink[];
  signatureHtml?: string;
  trackingPixelUrl?: string;
  brand?: {
    accentColor?: string;
    secondaryColor?: string;
    primaryText?: string;
    fontFamily?: string;
    logoUrl?: string;
    logoAlt?: string;
  };
  heroIconUrl?: string;
  templateOptions?: TemplateOptions;
}

/**
 * Render the chosen outreach template to an HTML string.
 * Falls back to Minimal (the original) if templateId is unknown.
 * SERVER-ONLY — do not import into 'use client' components.
 */
export async function renderOutreachTemplate(
  templateId: string | undefined | null,
  props: OutreachRenderProps
): Promise<string> {
  let element: React.ReactElement;

  switch (templateId) {
    case "professional":
      element = React.createElement(OutreachProfessionalTemplate, props);
      break;
    case "bold":
      element = React.createElement(OutreachBoldTemplate, props);
      break;
    case "executive":
      element = React.createElement(OutreachExecutiveTemplate, props);
      break;
    case "playful":
      element = React.createElement(OutreachPlayfulTemplate, props);
      break;
    case "newsletter":
      element = React.createElement(OutreachNewsletterTemplate, props);
      break;
    case "minimal":
    default:
      element = React.createElement(OutreachTemplate, props);
      break;
  }

  return render(element);
}
