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
  Column,
  Row,
} from "@react-email/components";
import * as React from "react";
import type { ResourceLink } from "./OutreachTemplate";
import type { TemplateOptions } from "@/lib/outreach/outreach-styles";
import { getBackgroundTexture, getBorderAccent, getCardStyle, getDividerStyle } from "@/lib/outreach/outreach-styles";

/**
 * OutreachNewsletterTemplate
 * Magazine-style layout with section headers, columned resources, and editorial feel.
 */

interface OutreachNewsletterTemplateProps {
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
  ACCENT: "#0d9488",
  PRIMARY: "#0f172a",
  FONT: "'Georgia', 'Times New Roman', Times, serif",
  SANS: "Inter, ui-sans-serif, system-ui, sans-serif",
};

export const OutreachNewsletterTemplate: React.FC<
  Readonly<OutreachNewsletterTemplateProps>
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
  const showResources = templateOptions?.showResources !== false;
  const dividerCss = getDividerStyle(templateOptions?.dividerStyle, ACCENT);

  const paragraphs = bodyText
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const resourceButtons = (resources || []).filter((r) => r.enabled !== false);

  const cardLink: React.CSSProperties = {
    display: "block",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: DEFAULTS.SANS,
    padding: "14px 16px",
    margin: "0",
    color: SECONDARY,
    backgroundColor: `${SECONDARY}0a`,
    border: `1px solid ${SECONDARY}33`,
    textAlign: "center" as const,
  };

  const cardLinkPrimary: React.CSSProperties = {
    ...cardLink,
    color: "#ffffff",
    backgroundColor: ACCENT,
    border: `1px solid ${ACCENT}`,
  };

  return (
    <Html>
      <Head />
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
        <Container style={{ maxWidth: "720px", margin: "0 auto", ...cardStyleCss, ...borderAccent }}>
          {/* Banner image */}
          {templateOptions?.bannerImageUrl && (
            <Section style={{ margin: 0, padding: 0, marginBottom: "24px" }}>
              <Img
                src={templateOptions.bannerImageUrl}
                alt="Banner"
                width="720"
                style={{ display: "block", width: "100%", maxWidth: "720px", height: `${templateOptions.bannerHeight || 120}px`, objectFit: "cover" as const, objectPosition: `center ${templateOptions.bannerPositionY ?? 50}%` }}
              />
            </Section>
          )}
          {/* Masthead — hidden when banner image is used */}
          {!templateOptions?.bannerImageUrl && (
            <Section
              style={{
                padding: "24px 32px",
                borderBottom: `3px solid ${ACCENT}`,
                textAlign: "center",
              }}
            >
              {(brand?.logoUrl || heroIconUrl) && (
                <Img
                  src={brand?.logoUrl || heroIconUrl || ""}
                  alt={brand?.logoAlt || "Logo"}
                  width="44"
                  height="44"
                  style={{
                    display: "inline-block",
                    marginBottom: "8px",
                  }}
                />
              )}
            </Section>
          )}

          {/* Body */}
          <Section style={{ padding: "32px 32px 16px" }}>
            {/* Drop-cap style first paragraph */}
            {paragraphs.length > 0 && (
              <Text
                style={{
                  margin: "0 0 18px 0",
                  fontSize: "17px",
                  lineHeight: "1.85",
                  color: PRIMARY,
                }}
              >
                {paragraphs[0]}
              </Text>
            )}

            {paragraphs.length > 1 && (
              <Hr
                style={{
                  borderTop: `1px solid #e2e8f0`,
                  margin: "8px 0 18px 0",
                }}
              />
            )}

            {paragraphs.slice(1).map((p, idx) => (
              <Text
                key={idx}
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "15px",
                  lineHeight: "1.85",
                  color: "#334155",
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* Resources — Column Grid */}
          {showResources && resourceButtons.length > 0 && (
            <Section style={{ padding: "0 32px 24px" }}>
              <Hr
                style={{
                  borderTop: `2px solid ${ACCENT}`,
                  margin: "0 0 16px 0",
                  width: "80px",
                }}
              />
              <Text
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: DEFAULTS.SANS,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  margin: "0 0 14px 0",
                }}
              >
                Continue Reading
              </Text>
              {/* Two-column resource cards — 2 per row */}
              {resourceButtons.reduce((rows: any[][], r: any, idx: number) => {
                if (idx % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(r);
                return rows;
              }, []).map((pair: any[], rowIdx: number) => (
                <Row key={rowIdx} style={{ marginBottom: "10px" }}>
                  {pair.map((r: any, colIdx: number) => {
                    const isPrimary = r.type === "primary";
                    return (
                    <Column key={r.id || r.href} style={{ padding: colIdx === 0 ? "0 6px 0 0" : "0 0 0 6px", width: "50%" }}>
                      <Link
                        href={r.href}
                        style={isPrimary ? cardLinkPrimary : cardLink}
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
                    </Column>
                    );
                  })}
                  {pair.length === 1 && <Column style={{ width: "50%" }} />}
                </Row>
              ))}
            </Section>
          )}

          {/* Signature */}
          {signatureHtml && (
            <Section style={{ padding: "0 32px 16px" }}>
              <Hr style={{ borderTop: "1px solid #e5e7eb", margin: "0 0 16px 0" }} />
              <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
            </Section>
          )}

          {/* Footer */}
          <Section
            style={{
              padding: "16px 32px",
              borderTop: `1px solid #e2e8f0`,
              backgroundColor: `${SECONDARY}08`,
            }}
          >
            <Text
              style={{
                color: "#94a3b8",
                fontSize: "11px",
                fontFamily: DEFAULTS.SANS,
              }}
            >
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

export default OutreachNewsletterTemplate;
