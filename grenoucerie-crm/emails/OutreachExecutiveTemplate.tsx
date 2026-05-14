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
 * OutreachExecutiveTemplate
 * Serif typography, thin gold accent lines, understated elegance.
 * Designed for C-suite and high-touch outreach.
 */

interface OutreachExecutiveTemplateProps {
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
  ACCENT: "#b8860b",
  PRIMARY: "#1a1a1a",
  FONT: "Georgia, 'Times New Roman', Times, serif",
};

export const OutreachExecutiveTemplate: React.FC<
  Readonly<OutreachExecutiveTemplateProps>
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

  const linkStyle: React.CSSProperties = {
    display: "inline-block",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    padding: "10px 20px",
    margin: "6px 6px 6px 0",
    color: SECONDARY,
    border: `1.5px solid ${SECONDARY}`,
    borderRadius: "4px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  };

  const linkStylePrimary: React.CSSProperties = {
    ...linkStyle,
    color: "#ffffff",
    backgroundColor: ACCENT,
    border: `1.5px solid ${ACCENT}`,
  };

  return (
    <Html>
      <Head />
      <Preview>{subjectPreview}</Preview>
      <Body
        style={{
          fontFamily: FONT,
          lineHeight: 1.9,
          color: PRIMARY,
          padding: "40px 20px",
          backgroundColor: `${SECONDARY}0a`,
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
          {/* Thin accent top line + logo — hidden when banner image is used */}
          {!templateOptions?.bannerImageUrl && (
            <>
              <div style={{ height: "3px", backgroundColor: ACCENT }} />
              {(brand?.logoUrl || heroIconUrl) && (
                <Section style={{ padding: "28px 40px 8px", textAlign: "center" }}>
                  <Img
                    src={brand?.logoUrl || heroIconUrl || ""}
                    alt={brand?.logoAlt || "Logo"}
                    width="48"
                    height="48"
                    style={{ display: "inline-block" }}
                  />
                </Section>
              )}
            </>
          )}

          {/* Body */}
          <Section style={{ padding: "28px 40px" }}>
            {paragraphs.map((p, idx) => (
              <Text
                key={idx}
                style={{
                  margin: "0 0 18px 0",
                  fontSize: "16px",
                  lineHeight: "1.9",
                  color: PRIMARY,
                }}
              >
                {p}
              </Text>
            ))}
          </Section>

          {/* Resources */}
          {showResources && resourceButtons.length > 0 && (
            <Section style={{ padding: "0 40px 28px" }}>
              <Hr
                style={
                  templateOptions?.dividerStyle
                    ? dividerCss
                    : { borderTop: `1px solid ${ACCENT}55`, margin: "0 0 20px 0" }
                }
              />
              <div style={{ textAlign: "center" }}>
                {resourceButtons.map((r) => {
                  const isPrimary = r.type === "primary";
                  return (
                  <Link
                    key={r.id || r.href}
                    href={r.href}
                    style={isPrimary ? linkStylePrimary : linkStyle}
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
            </Section>
          )}

          {/* Signature */}
          {signatureHtml && (
            <Section style={{ padding: "0 40px 16px" }}>
              <Hr
                style={{
                  borderTop: `1px solid #e5e5e5`,
                  margin: "0 0 16px 0",
                }}
              />
              <div
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
              />
            </Section>
          )}

          {/* Footer */}
          <Section
            style={{
              padding: "16px 40px",
              borderTop: `1px solid #e5e5e5`,
            }}
          >
            {unsubscribeUrl && (
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: "11px",
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                  fontStyle: "italic",
                }}
              >
                <Link href={unsubscribeUrl} style={{ color: "#9ca3af", textDecoration: "underline" }}>
                  Click here to unsubscribe
                </Link>
              </Text>
            )}
          </Section>

          {/* Thin accent bottom line */}
          <div style={{ height: "3px", backgroundColor: ACCENT }} />

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

export default OutreachExecutiveTemplate;
