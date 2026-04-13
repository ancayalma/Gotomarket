import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";
import type { ResourceLink } from "./OutreachTemplate";
import type { TemplateOptions } from "@/lib/outreach/outreach-styles";
import { getBackgroundTexture, getBorderAccent, getCardStyle, getDividerStyle } from "@/lib/outreach/outreach-styles";

/**
 * OutreachBoldTemplate
 * Full-width gradient hero header, large greeting text,
 * full-width stacked CTA buttons, dark footer.
 */

interface OutreachBoldTemplateProps {
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

const DEFAULTS = {
  ACCENT: "#dc2626",
  PRIMARY: "#0f172a",
  FONT: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

function darken(hex: string, amount: number = 40): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

export const OutreachBoldTemplate: React.FC<
  Readonly<OutreachBoldTemplateProps>
> = ({
  subjectPreview = "New partnership opportunity",
  bodyText,
  resources = [],
  signatureHtml,
  trackingPixelUrl,
  brand,
  heroIconUrl,
  templateOptions,
}) => {
  const ACCENT = brand?.accentColor || DEFAULTS.ACCENT;
  const PRIMARY = brand?.primaryText || DEFAULTS.PRIMARY;
  const FONT = brand?.fontFamily || DEFAULTS.FONT;
  const ACCENT_DARK = darken(ACCENT, 50);
  const SECONDARY = brand?.secondaryColor || "#10b981";

  const bgTexture = getBackgroundTexture(templateOptions?.backgroundTexture, ACCENT);
  const borderAccent = getBorderAccent(templateOptions?.borderAccent, ACCENT);
  const cardStyleCss = getCardStyle(templateOptions?.cardStyle);
  const dividerCss = getDividerStyle(templateOptions?.dividerStyle, ACCENT);
  const showResources = templateOptions?.showResources !== false;

  const lines = bodyText
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // First line = large greeting, rest = body
  const greeting = lines[0] || "";
  const bodyParagraphs = lines.slice(1);

  const resourceButtons = (resources || []).filter((r) => r.enabled !== false);

  const ctaBtn: React.CSSProperties = {
    display: "block",
    textDecoration: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 700,
    padding: "16px 24px",
    margin: "8px 0",
    textAlign: "center" as const,
    color: "#ffffff",
    background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
    boxShadow: `0 4px 14px ${ACCENT}44`,
  };

  const ctaBtnSecondary: React.CSSProperties = {
    ...ctaBtn,
    color: SECONDARY,
    background: "#ffffff",
    border: `2px solid ${SECONDARY}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  };

  return (
    <Html>
      <Head />
      <Preview>{subjectPreview}</Preview>
      <Body
        style={{
          fontFamily: FONT,
          lineHeight: 1.7,
          color: PRIMARY,
          padding: "40px 20px",
          backgroundColor: `${SECONDARY}08`,
          ...bgTexture,
        }}
      >
        <Container style={{ maxWidth: "720px", margin: "0 auto", ...cardStyleCss, ...borderAccent }}>
          {/* Banner image */}
          {templateOptions?.bannerImageUrl && (
            <Section style={{ margin: 0, padding: 0, marginBottom: "24px" }}>
              <Img
                src={templateOptions.bannerImageUrl}
                alt="Banner"
                width="720"
                style={{ display: "block", width: "100%", maxWidth: "720px", height: `${templateOptions.bannerHeight || 120}px`, objectFit: "cover" as const, objectPosition: `center ${templateOptions.bannerPositionY ?? 50}%`, borderRadius: "0 0 16px 16px" }}
              />
            </Section>
          )}
          {/* Gradient Hero Header — hidden when banner image is used */}
          {!templateOptions?.bannerImageUrl && (
            <Section
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                padding: "40px 32px 36px",
                textAlign: "center",
                borderRadius: "0 0 16px 16px",
              }}
            >
              {(brand?.logoUrl || heroIconUrl) && (
                <Img
                  src={brand?.logoUrl || heroIconUrl || ""}
                  alt={brand?.logoAlt || "Logo"}
                  width="56"
                  height="56"
                  style={{
                    display: "inline-block",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    padding: "4px",
                  }}
                />
              )}
            </Section>
          )}

          {/* Body Card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              margin: "24px 0 16px",
              padding: "36px 32px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Large Greeting */}
            <Text
              style={{
                margin: "0 0 20px 0",
                fontSize: "22px",
                fontWeight: 800,
                lineHeight: "1.3",
                color: PRIMARY,
              }}
            >
              {greeting}
            </Text>

            {/* Bold first paragraph */}
            {bodyParagraphs.length > 0 && (
              <Text
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: 600,
                  lineHeight: "1.7",
                  color: PRIMARY,
                }}
              >
                {bodyParagraphs[0]}
              </Text>
            )}

            {/* Remaining paragraphs */}
            {bodyParagraphs.slice(1).map((p, idx) => (
              <Text
                key={idx}
                style={{
                  margin: "0 0 14px 0",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: "#334155",
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {templateOptions?.dividerStyle && templateOptions.dividerStyle !== "none" && (
            <Hr style={dividerCss} />
          )}

          {/* Resources - Stacked Full-Width CTAs */}
          {showResources && resourceButtons.length > 0 && (
            <Section
              style={{
                padding: "0 0 16px 0",
              }}
            >
              {resourceButtons.map((r) => {
                const isPrimary = r.type === "primary";
                return (
                <Link
                  key={r.id || r.href}
                  href={r.href}
                  style={isPrimary ? ctaBtn : ctaBtnSecondary}
                >
                  {r.iconUrl && (
                    <Img
                      src={r.iconUrl}
                      alt=""
                      width="14"
                      height="14"
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                  )}
                  {r.label}
                </Link>
                );
              })}
            </Section>
          )}

          {/* Signature */}
          {signatureHtml && (
            <Section
              style={{
                padding: "8px 0",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                margin: "0 0 16px 0",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
                style={{ padding: "16px 24px" }}
              />
            </Section>
          )}

          {/* Dark Footer */}
          <Section
            style={{
              backgroundColor: "#0f172a",
              padding: "20px 32px",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <Text style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>
              To unsubscribe from future emails, please reply with
              &quot;UNSUBSCRIBE&quot; in the subject line.
            </Text>
          </Section>

          {trackingPixelUrl && (
            <Img
              src={trackingPixelUrl}
              alt=""
              width="1"
              height="1"
              style={{ display: "none", width: "1px", height: "1px" }}
            />
          )}
        </Container>
      </Body>
    </Html>
  );
};

export default OutreachBoldTemplate;
