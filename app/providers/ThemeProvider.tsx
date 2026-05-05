"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// Suppress false-positive React 19 warning about next-themes' inline FOUC-prevention script.
// next-themes v0.4.x injects a <script> during SSR which is valid, but React 19 warns about it
// during client hydration. The library is unmaintained; this is the accepted community workaround.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    _origConsoleError.apply(console, args);
  };
}

export const THEME_PRESETS = [
  "obsidian-gold",
  "midnight-protocol",
  "neon-circuit",
  "prismatic-aurora",
  "deep-ocean",
  "crimson-night",
  "monochrome-studio",
  "forest-spectrum",
  "toxic-vapor",
  "solar-flare",
  "super-nova",
  "obsidian-eclipse",
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];

function CustomThemeInjector() {
  const { theme } = useTheme();

  React.useEffect(() => {
    // If the theme is a preset, we remove any custom styles
    if (THEME_PRESETS.includes(theme as ThemePreset)) {
      document.getElementById("custom-theme-active")?.remove();
      return;
    }

    try {
      const saved = localStorage.getItem("custom-themes");
      if (saved) {
        const customThemes = JSON.parse(saved);
        const activeCustom = customThemes.find((t: any) => t.id === theme);

        if (activeCustom) {
          const style = document.createElement("style");
          style.id = "custom-theme-active";
          style.textContent = `
            :root[data-theme="${activeCustom.id}"] {
              --background: ${activeCustom.colors.background} !important;
              --foreground: ${activeCustom.colors.foreground} !important;
              --muted: ${activeCustom.colors.surface} !important;
              --muted-foreground: ${activeCustom.colors.mutedForeground} !important;
              --card: ${activeCustom.colors.surface} !important;
              --card-foreground: ${activeCustom.colors.foreground} !important;
              --popover: ${activeCustom.colors.background} !important;
              --popover-foreground: ${activeCustom.colors.foreground} !important;
              --primary: ${activeCustom.colors.primary} !important;
              --primary-foreground: ${activeCustom.colors.primaryForeground} !important;
              --secondary: ${activeCustom.colors.surface} !important;
              --secondary-foreground: ${activeCustom.colors.foreground} !important;
              --accent: ${activeCustom.colors.accent} !important;
              --accent-foreground: ${activeCustom.colors.foreground} !important;
              --border: ${activeCustom.colors.primary} / 0.2 !important;
              --input: ${activeCustom.colors.elevated} !important;
              --ring: ${activeCustom.colors.primary} !important;
              --radius: ${activeCustom.radius} !important;
              ${activeCustom.fonts?.heading ? `--font-heading: '${activeCustom.fonts.heading}', sans-serif;` : ''}
              ${activeCustom.fonts?.body ? `--font-body: '${activeCustom.fonts.body}', sans-serif;` : ''}
              ${activeCustom.fonts?.button ? `--font-button: '${activeCustom.fonts.button}', sans-serif;` : ''}
            }

            /* Apply fonts globally when this custom theme is active */
            :root[data-theme="${activeCustom.id}"] body {
              ${activeCustom.fonts?.body ? `font-family: var(--font-body) !important;` : ''}
              ${activeCustom.fonts?.bodyWeight ? `font-weight: ${activeCustom.fonts.bodyWeight} !important;` : ''}
              ${activeCustom.fonts?.bodyStyle ? `font-style: ${activeCustom.fonts.bodyStyle} !important;` : ''}
            }
            :root[data-theme="${activeCustom.id}"] h1,
            :root[data-theme="${activeCustom.id}"] h2,
            :root[data-theme="${activeCustom.id}"] h3,
            :root[data-theme="${activeCustom.id}"] h4,
            :root[data-theme="${activeCustom.id}"] h5,
            :root[data-theme="${activeCustom.id}"] h6 {
              ${activeCustom.fonts?.heading ? `font-family: var(--font-heading) !important;` : ''}
              ${activeCustom.fonts?.headingWeight ? `font-weight: ${activeCustom.fonts.headingWeight} !important;` : ''}
              ${activeCustom.fonts?.headingStyle ? `font-style: ${activeCustom.fonts.headingStyle} !important;` : ''}
            }
            :root[data-theme="${activeCustom.id}"] button {
              ${activeCustom.fonts?.button ? `font-family: var(--font-button) !important;` : ''}
              ${activeCustom.fonts?.buttonWeight ? `font-weight: ${activeCustom.fonts.buttonWeight} !important;` : ''}
              ${activeCustom.fonts?.buttonStyle ? `font-style: ${activeCustom.fonts.buttonStyle} !important;` : ''}
            }
          `.replace(/\n/g, ""); // strip newlines for compact DOM

          // Inject fonts link if fonts exist
          if (activeCustom.fonts) {
            const fontLink = document.createElement("link");
            fontLink.id = "custom-theme-fonts";
            fontLink.rel = "stylesheet";
            const query = "family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800;900&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Lato:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Lexend:wght@400;500;600;700;800;900&family=Ubuntu:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap";
            fontLink.href = `https://fonts.googleapis.com/css2?${query}`;

            document.getElementById("custom-theme-fonts")?.remove();
            document.head.appendChild(fontLink);
          } else {
            document.getElementById("custom-theme-fonts")?.remove();
          }

          document.getElementById("custom-theme-active")?.remove();
          document.head.appendChild(style);
        }
      }
    } catch (e) {
      console.error("Failed to inject custom theme", e);
    }
  }, [theme]);

  // Load known custom themes into NextThemes on mount so NextThemes doesn't strip the class
  const customThemesList = React.useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("custom-themes");
      if (saved) {
        return JSON.parse(saved).map((t: any) => t.id);
      }
    } catch (e) { }
    return [];
  }, []);

  return null;
}


export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="obsidian-gold"
      enableSystem={false}
      themes={[...THEME_PRESETS, "custom-theme"]} // Allow fallback
      {...props}
    >
      {children}
      <CustomThemeInjector />
    </NextThemesProvider>
  );
}


