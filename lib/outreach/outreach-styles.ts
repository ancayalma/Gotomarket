/**
 * Email-safe CSS helpers for template customization.
 * All patterns use CSS gradients (no external images) for universal email client support.
 */
import type { CSSProperties } from "react";

// ── Types ──
export type BackgroundTexture = "none" | "dots" | "lines" | "grid" | "noise" | "diagonal";
export type BorderAccent = "none" | "left" | "top" | "gradient-top" | "bottom-glow";
export type CardStyle = "flat" | "elevated" | "glass" | "bordered";
export type DividerStyle = "none" | "thin" | "accent" | "gradient" | "dotted";

export interface TemplateOptions {
  backgroundTexture?: BackgroundTexture;
  borderAccent?: BorderAccent;
  showResources?: boolean;
  cardStyle?: CardStyle;
  dividerStyle?: DividerStyle;
}

// ── Background Textures ──
export function getBackgroundTexture(
  type: BackgroundTexture | undefined,
  accentColor = "#F54029"
): CSSProperties {
  switch (type) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(${accentColor}15 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      };
    case "lines":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${accentColor}08, ${accentColor}08 1px, transparent 1px, transparent 24px)`,
      };
    case "grid":
      return {
        backgroundImage: `
          linear-gradient(${accentColor}08 1px, transparent 1px),
          linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)
        `.trim(),
        backgroundSize: "24px 24px",
      };
    case "noise":
      return {
        backgroundImage: `
          radial-gradient(circle at 20% 35%, ${accentColor}08 0%, transparent 50%),
          radial-gradient(circle at 75% 44%, ${accentColor}06 0%, transparent 50%),
          radial-gradient(circle at 46% 80%, ${accentColor}04 0%, transparent 40%)
        `.trim(),
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          ${accentColor}06 10px,
          ${accentColor}06 11px
        )`,
      };
    default:
      return {};
  }
}

// ── Border Accents ──
export function getBorderAccent(
  type: BorderAccent | undefined,
  accentColor = "#F54029"
): CSSProperties {
  switch (type) {
    case "left":
      return {
        borderLeft: `4px solid ${accentColor}`,
      };
    case "top":
      return {
        borderTop: `3px solid ${accentColor}`,
      };
    case "gradient-top":
      return {
        borderTop: "none",
        backgroundImage: `linear-gradient(${accentColor}, ${accentColor}), linear-gradient(to right, ${accentColor}, ${accentColor}88, ${accentColor})`,
        backgroundSize: "100% 3px",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top",
        paddingTop: "12px",
      };
    case "bottom-glow":
      return {
        boxShadow: `0 4px 20px ${accentColor}20`,
        borderBottom: `2px solid ${accentColor}30`,
      };
    default:
      return {};
  }
}

// ── Card Styles ──
export function getCardStyle(type: CardStyle | undefined): CSSProperties {
  switch (type) {
    case "elevated":
      return {
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)",
      };
    case "glass":
      return {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
      };
    case "bordered":
      return {
        border: "2px solid #e5e7eb",
        boxShadow: "none",
      };
    case "flat":
    default:
      return {};
  }
}

// ── Divider Styles ──
export function getDividerStyle(
  type: DividerStyle | undefined,
  accentColor = "#F54029"
): CSSProperties {
  switch (type) {
    case "thin":
      return {
        borderTop: "1px solid #e5e7eb",
        margin: "16px 0",
      };
    case "accent":
      return {
        borderTop: `2px solid ${accentColor}`,
        margin: "20px 0",
      };
    case "gradient":
      return {
        border: "none",
        height: "2px",
        backgroundImage: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        margin: "20px 0",
      };
    case "dotted":
      return {
        borderTop: `2px dotted ${accentColor}40`,
        margin: "16px 0",
      };
    default:
      return {};
  }
}
