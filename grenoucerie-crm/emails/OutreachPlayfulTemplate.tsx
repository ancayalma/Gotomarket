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
 * OutreachPlayfulTemplate
 * Rounded card layout, colorful, pastel accent tones,
 * friendly and approachable for creative/startup outreach.
 */

interface OutreachPlayfulTemplateProps {
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
  unsubscribeUrl?: string;
}

const DEFAULTS = {
  ACCENT: "#8b5cf6",
  PRIMARY: "#1e1b4b",
  FONT: "'Nunito', 'Poppins', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
};

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

export const OutreachPlayfulTemplate: React.FC<
  Readonly<OutreachPlayfulTemplateProps>
> = ({
  subjectPreview = "New partnership opportunity",
  bodyText,
  resources = [],
  signatureHtml,
  trackingPixelUrl,
  brand,
  heroIconUrl,
  templateOptions,
  unsubscribeUrl,
}) => {
  const ACCENT = brand?.accentColor || DEFAULTS.ACCENT;
  const PRIMARY = brand?.primaryText || DEFAULTS.PRIMARY;
  const FONT = brand?.fontFamily || DEFAULTS.FONT;
  const SECONDARY = brand?.secondaryColor || "#10b981";

  const bgTexture = getBackgroundTexture(templateOptions?.backgroundTexture, ACCENT);
  const borderAccent = getBorderAccent(templateOptions?.borderAccent, ACCENT);
  const cardStyleCss = getCardStyle(templateOptions?.cardStyle);
  const showResources = templateOptions?.showResources !== false;
  const dividerCss = getDividerStyle(templateOptions?.dividerStyle, ACCENT);

  const paragraphs = bodyText
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const resourceButtons = (resources || []).filter((r) => r.enabled !== false);

  const funBtn: React.CSSProperties = {
    display: "inline-block",
    textDecoration: "none",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 700,
    padding: "10px 18px",
    margin: "6px 6px 6px 0",
    color: "#ffffff",
    background: ACCENT,
    boxShadow: `0 4px 12px ${hexToRgba(ACCENT, 0.3)}`,
  };

  const funBtnSecondary: React.CSSProperties = {
    ...funBtn,
    color: SECONDARY,
    background: hexToRgba(SECONDARY, 0.1),
    boxShadow: "none",
    border: `2px solid ${hexToRgba(SECONDARY, 0.3)}`,
  };

  return (
    <Html>
      <Head />
      <Preview>{subjectPreview}</Preview>
      <Body
        style={{
          fontFamily: FONT,
          lineHeight: 1.75,
          color: PRIMARY,
          padding: "40px 20px",
          backgroundColor: "#faf5ff",
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
                style={{ display: "block", width: "100%", maxWidth: "720px", height: `${templateOptions.bannerHeight || 120}px`, objectFit: "cover" as const, objectPosition: `center ${templateOptions.bannerPositionY ?? 50}%`, borderRadius: "20px" }}
              />
            </Section>
          )}
          {/* Rounded Header Card — hidden when banner image is used */}
          {!templateOptions?.bannerImageUrl && (
            <Section
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(SECONDARY, 0.15)} 0%, ${hexToRgba(SECONDARY, 0.05)} 100%)`,
                padding: "24px 32px",
                borderRadius: "20px",
                textAlign: "center",
                marginBottom: "16px",
                border: `1px solid ${hexToRgba(ACCENT, 0.15)}`,
              }}
            >
              {(brand?.logoUrl || heroIconUrl) && (
                <Img
                  src={brand?.logoUrl || heroIconUrl || ""}
                  alt={brand?.logoAlt || "Logo"}
                  width="52"
                  height="52"
                  style={{
                    display: "inline-block",
                    borderRadius: "14px",
                    boxShadow: `0 4px 12px ${hexToRgba(ACCENT, 0.2)}`,
                  }}
                />
              )}
            </Section>
          )}

          {/* Body Card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              padding: "28px 32px",
              borderRadius: "20px",
              border: "1px solid #ede9fe",
              marginBottom: "16px",
            }}
          >
            {paragraphs.map((p, idx) => (
              <Text
                key={idx}
                style={{
                  margin: "0 0 14px 0",
                  fontSize: "15px",
                  lineHeight: "1.75",
                  color: PRIMARY,
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {templateOptions?.dividerStyle && templateOptions.dividerStyle !== "none" && (
            <Hr style={dividerCss} />
          )}

          {/* Resources Card */}
          {showResources && resourceButtons.length > 0 && (
            <Section
              style={{
                padding: "20px 24px",
                borderRadius: "20px",
                backgroundColor: "#ffffff",
                border: "1px solid #ede9fe",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: ACCENT,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 12px 0",
                }}
              >
                ✨ Quick Links
              </Text>
              <div style={{ textAlign: "center" }}>
                {resourceButtons.reduce((rows: any[][], r: any, idx: number) => {
                  if (idx % 2 === 0) rows.push([]);
                  rows[rows.length - 1].push(r);
                  return rows;
                }, []).map((pair: any[], rowIdx: number) => (
                  <div key={rowIdx} style={{ marginBottom: "4px" }}>
                    {pair.map((r: any) => {
                      const isPrimary = r.type === "primary";
                      return (
                      <Link
                        key={r.id || r.href}
                        href={r.href}
                        style={isPrimary ? funBtn : funBtnSecondary}
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
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Signature */}
          {signatureHtml && (
            <Section
              style={{
                padding: "16px 24px",
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #ede9fe",
                marginBottom: "16px",
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
            </Section>
          )}

          {/* Footer */}
          <Section style={{ padding: "12px 24px", textAlign: "center" }}>
            {unsubscribeUrl && (
              <Text
                style={{
                  color: "#a78bfa",
                  fontSize: "11px",
                }}
              >
                <Link href={unsubscribeUrl} style={{ color: "#a78bfa", textDecoration: "underline" }}>
                  Click here to unsubscribe
                </Link>
              </Text>
            )}
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

export default OutreachPlayfulTemplate;
