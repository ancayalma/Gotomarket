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
 * OutreachProfessionalTemplate
 * Branded header bar with logo, pill-shaped resource buttons in a grid,
 * accent-colored dividers, and polished professional styling.
 */

interface OutreachProfessionalTemplateProps {
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
  ACCENT: "#2563eb",
  PRIMARY: "#1e293b",
  FONT: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
};

export const OutreachProfessionalTemplate: React.FC<
  Readonly<OutreachProfessionalTemplateProps>
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
  const SECONDARY = brand?.secondaryColor || "#10b981";

  const bgTexture = getBackgroundTexture(templateOptions?.backgroundTexture, ACCENT);
  const borderAccent = getBorderAccent(templateOptions?.borderAccent, ACCENT);
  const cardStyleCss = getCardStyle(templateOptions?.cardStyle);
  const dividerCss = getDividerStyle(templateOptions?.dividerStyle, ACCENT);
  const showResources = templateOptions?.showResources !== false;

  const paragraphs = bodyText
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const resourceButtons = (resources || []).filter((r) => r.enabled !== false);

  const pillBtn: React.CSSProperties = {
    display: "inline-block",
    textDecoration: "none",
    borderRadius: "24px",
    fontSize: "13px",
    fontWeight: 600,
    padding: "10px 22px",
    margin: "6px 6px 6px 0",
    color: "#ffffff",
    background: ACCENT,
    border: "none",
  };

  const pillBtnSecondary: React.CSSProperties = {
    ...pillBtn,
    color: SECONDARY,
    background: "transparent",
    border: `2px solid ${SECONDARY}`,
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
          backgroundColor: "#f8fafc",
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
                style={{ display: "block", width: "100%", maxWidth: "720px", height: `${templateOptions.bannerHeight || 120}px`, objectFit: "cover" as const, objectPosition: `center ${templateOptions.bannerPositionY ?? 50}%`, borderRadius: "0 0 8px 8px" }}
              />
            </Section>
          )}
          {/* Branded Header Bar — hidden when banner image is used */}
          {!templateOptions?.bannerImageUrl && (
            <Section
              style={{
                backgroundColor: ACCENT,
                padding: "16px 32px",
                borderRadius: "0 0 8px 8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {brand?.logoUrl && (
                  <Img
                    src={brand.logoUrl}
                    alt={brand.logoAlt || "Logo"}
                    width="40"
                    height="40"
                    style={{
                      display: "inline-block",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.15)",
                    }}
                  />
                )}
                {heroIconUrl && !brand?.logoUrl && (
                  <Img
                    src={heroIconUrl}
                    alt="Icon"
                    width="36"
                    height="36"
                    style={{ display: "inline-block" }}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Body Card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              margin: "20px 0",
              padding: "32px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            {paragraphs.map((p, idx) => (
              <Text
                key={idx}
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  lineHeight: "1.75",
                  color: PRIMARY,
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* Resources */}
          {showResources && resourceButtons.length > 0 && (
            <Section
              style={{
                margin: "0 0 20px 0",
                padding: "24px 32px",
                backgroundColor: `${SECONDARY}0a`,
                borderRadius: "8px",
                border: `1px solid ${SECONDARY}1a`,
              }}
            >
              <Hr
                style={
                  templateOptions?.dividerStyle && templateOptions.dividerStyle !== "none"
                    ? dividerCss
                    : {
                        borderTop: `2px solid ${ACCENT}`,
                        margin: "0 0 16px 0",
                        width: "48px",
                      }
                }
              />
              <Text
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 12px 0",
                  textAlign: "center",
                }}
              >
                ✨ Quick Links
              </Text>
              <div style={{ textAlign: "center" }}>
                {resourceButtons.map((r) => {
                  const isPrimary = r.type === "primary";
                  return (
                  <Link
                    key={r.id || r.href}
                    href={r.href}
                    style={isPrimary ? pillBtn : pillBtnSecondary}
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
                          marginRight: "8px",
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

          {/* Signature */}
          {signatureHtml && (
            <Section
              style={{
                padding: "0 32px",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
                style={{ marginTop: "8px" }}
              />
            </Section>
          )}

          {/* Footer */}
          <Section
            style={{
              marginTop: "16px",
              padding: "16px 32px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <Text style={{ color: "#94a3b8", fontSize: "11px" }}>
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

export default OutreachProfessionalTemplate;
