import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateOptions } from "@/lib/outreach/outreach-styles";
import { getBackgroundTexture, getBorderAccent, getCardStyle, getDividerStyle } from "@/lib/outreach/outreach-styles";
import * as React from "react";

/**
 * OutreachTemplate
 * Renders a branded HTML email for outreach:
 * - Renders plain text body paragraphs
 * - Resource buttons grid (configurable per-user, defaults handled by caller)
 * - Tracking pixel (1x1) for open tracking
 * - Appends user's saved HTML signature (sanitized before saving)
 * - CAN-SPAM footer
 *
 * Use this template from the outreach send API. Provide plain text body; do not pass HTML in bodyText.
 */

export type ResourceLink = {
  id: string;
  label: string;
  href: string;
  type?: "primary" | "secondary";
  icon?: string;
  iconUrl?: string;
  enabled?: boolean;
};

interface OutreachTemplateProps {
  subjectPreview?: string;
  bodyText: string; // Plain text paragraphs separated by \n
  resources?: ResourceLink[]; // Rendered as buttons
  signatureHtml?: string; // sanitized HTML fragment appended
  trackingPixelUrl?: string; // 1x1 tracking pixel URL
  brand?: {
    accentColor?: string; // default #F54029 (TUC red) — used for secondary buttons
    secondaryColor?: string; // default #10b981 (green) — used for primary buttons
    primaryText?: string; // default #1f2937
    fontFamily?: string; // default system stack
    logoUrl?: string;
    logoAlt?: string;
  };
  // Optional: sometimes we want to include a hero icon
  heroIconUrl?: string;
  templateOptions?: TemplateOptions;
}

const DEFAULTS = {
  ACCENT: "#F54029",
  PRIMARY: "#1f2937",
  FONT:
    "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

export const OutreachTemplate: React.FC<Readonly<OutreachTemplateProps>> = ({
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

  const SECONDARY = brand?.secondaryColor || "#10b981";

  const bgTexture = getBackgroundTexture(templateOptions?.backgroundTexture, ACCENT);
  const borderAccent = getBorderAccent(templateOptions?.borderAccent, ACCENT);
  const cardStyle = getCardStyle(templateOptions?.cardStyle);
  const dividerCss = getDividerStyle(templateOptions?.dividerStyle, ACCENT);
  const showResources = templateOptions?.showResources !== false;

  const paragraphs = bodyText
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const resourceButtons = (resources || []).filter((r) => r.enabled !== false);

  // Styles for resource buttons (inline for email client compatibility)
  const btnBase: React.CSSProperties = {
    display: "inline-block",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 700,
    padding: "10px 16px",
    margin: "6px 6px 6px 0",
    textAlign: "center" as const,
  };
  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    color: "#ffffff",
    background: `linear-gradient(135deg, ${SECONDARY} 0%, ${SECONDARY}dd 100%)`,
    boxShadow: `0 2px 8px ${SECONDARY}40`,
    border: `2px solid ${SECONDARY}`,
  };
  const btnSecondary: React.CSSProperties = {
    ...btnBase,
    color: "#ffffff",
    background: `linear-gradient(135deg, ${ACCENT} 0%, #c7301e 100%)`,
    boxShadow: "0 2px 6px rgba(245,64,41,0.20)",
    border: `2px solid ${ACCENT}`,
  };

  const footerText =
    'To unsubscribe from future emails, please reply with "UNSUBSCRIBE" in the subject line.';

  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <Preview>{subjectPreview}</Preview>
      <Body
        style={{
          fontFamily: FONT,
          lineHeight: 1.8,
          color: PRIMARY,
          padding: "40px 20px",
          backgroundColor: "#ffffff",
          ...bgTexture,
        }}
      >
        <Container style={{ maxWidth: "720px", margin: "0 auto", ...cardStyle, ...borderAccent }}>
          {/* Optional hero/logo */}
          {brand?.logoUrl && (
            <Section style={{ textAlign: "center", marginBottom: 16 }}>
              <Img
                src={brand.logoUrl}
                alt={brand.logoAlt || "Logo"}
                width="96"
                height="96"
                style={{ display: "inline-block" }}
              />
            </Section>
          )}

          {heroIconUrl && (
            <Section style={{ textAlign: "center", marginBottom: 16 }}>
              <Img
                src={heroIconUrl}
                alt="Icon"
                width="64"
                height="64"
                style={{ display: "inline-block" }}
              />
            </Section>
          )}

          {/* Body paragraphs */}
          <Section>
            {paragraphs.map((p, idx) => (
              <Text
                key={idx}
                style={{ margin: "0 0 16px 0", fontSize: "15px", color: PRIMARY }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* Divider before resources */}
          {showResources && resourceButtons.length > 0 && templateOptions?.dividerStyle && templateOptions.dividerStyle !== "none" && (
            <Hr style={dividerCss} />
          )}

          {/* Resources */}
          {showResources && resourceButtons.length > 0 && (
            <Section
              style={{
                margin: "28px 0 20px 0",
                padding: "20px",
                background:
                  "linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%)",
                borderRadius: "10px",
                border: "1px solid #e1e4e8",
              }}
            >
              <Text
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "0 0 12px 0",
                  textAlign: "center",
                }}
              >
                ✨ Quick Links
              </Text>
              <div style={{ textAlign: "center" }}>
                {resourceButtons.map((r) => {
                  const style = r.type === "primary" ? btnPrimary : btnSecondary;
                  const isPrimary = r.type === "primary";
                  return (
                    <Link key={r.id || r.href} href={r.href} style={style}>
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
              </div>
            </Section>
          )}

          {/* Signature - appended as HTML fragment */}
          {signatureHtml && (
            <Section>
              <div
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
                style={{ marginTop: "12px" }}
              />
            </Section>
          )}

          {/* CAN-SPAM footer */}
          <Section style={{ marginTop: "16px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
            <Text style={{ color: "#6b7280", fontSize: "12px" }}>{footerText}</Text>
            {/* Optional company address block can be appended by caller if desired */}
          </Section>

          {/* Tracking pixel */}
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

export default OutreachTemplate;
