"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    RotateCcw,
    Save,
    X,
    Download,
    Upload,
    Check,
    AlertTriangle,
    Sparkles,
    MousePointer2,
    Move,
    Type,
    Palette,
    Layers,
    Italic
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "./ColorPicker";
import { LivePreview } from "./LivePreview";
import { THEME_PRESETS, type ThemePreset } from "@/app/providers/ThemeProvider";

// Default colors for a new custom theme
const DEFAULT_CUSTOM_COLORS = {
    background: "0 0% 6%",
    surface: "0 0% 8%",
    elevated: "0 0% 14%",
    foreground: "0 0% 98%",
    mutedForeground: "0 0% 65%",
    primary: "45 90% 50%",
    primaryForeground: "0 0% 5%",
    accent: "45 90% 20%",
    accentGlow: "45 90% 35%",
    // Removed Status Colors as per new plan
};

const DEFAULT_RADIUS = "0.5rem";

// Preset theme metadata for quick start
const PRESET_COLORS: Record<ThemePreset, Partial<typeof DEFAULT_CUSTOM_COLORS>> = {
    "obsidian-gold": { primary: "45 90% 50%", accent: "45 90% 20%" },
    "midnight-protocol": { primary: "191 65% 58%", accent: "191 65% 20%" },
    "neon-circuit": { primary: "300 100% 50%", accent: "300 100% 20%" },
    "prismatic-aurora": { primary: "270 70% 60%", accent: "270 70% 25%" },
    "deep-ocean": { primary: "200 100% 40%", accent: "200 100% 15%" },
    "crimson-night": { primary: "0 80% 50%", accent: "0 80% 15%" },
    "monochrome-studio": { primary: "0 0% 100%", accent: "0 0% 20%" },
    "forest-spectrum": { primary: "150 60% 50%", accent: "150 60% 15%" },
    "toxic-vapor": {
        primary: "75 100% 50%",
        accent: "260 100% 60%",
        background: "80 10% 4%",
        surface: "80 15% 7%",
        elevated: "80 15% 12%",
    },
    "solar-flare": {
        primary: "25 100% 50%",
        accent: "45 100% 50%",
        background: "15 15% 4%",
        surface: "15 20% 7%",
        elevated: "15 20% 12%",
    },
    "super-nova": {
        primary: "330 100% 45%",
        accent: "0 0% 0%",
        background: "220 20% 98%",
        foreground: "220 40% 10%",
        surface: "220 20% 95%",
        elevated: "220 20% 94%",
        mutedForeground: "220 20% 40%",
        primaryForeground: "0 0% 100%",
    },
    "obsidian-eclipse": {
        primary: "191 65% 58%",
        accent: "45 90% 50%",
        background: "20 10% 3%",
        surface: "20 15% 5%",
        elevated: "20 15% 10%",
    },
};

const AVAILABLE_FONTS = [
    "Inter",
    "Roboto",
    "Montserrat",
    "Poppins",
    "Outfit",
    "Open Sans",
    "Lato",
    "Lexend",
    "Ubuntu",
    "Plus Jakarta Sans",
    "Public Sans"
];

export interface CustomTheme {
    id: string;
    name: string;
    colors: typeof DEFAULT_CUSTOM_COLORS;
    radius: string;
    motion: "fast" | "fluid";
    fonts?: {
        heading: string;
        body: string;
        button: string;
        headingWeight?: string;
        bodyWeight?: string;
        buttonWeight?: string;
        headingStyle?: string;
        bodyStyle?: string;
        buttonStyle?: string;
    };
    createdAt: number;
    shared?: boolean;
}

interface ThemeEditorProps {
    onBack: () => void;
    editingTheme?: CustomTheme | null;
    activeThemeId?: string;
    activeCustomTheme?: CustomTheme;
}

export function ThemeEditor({
    onBack,
    editingTheme,
    activeThemeId,
    activeCustomTheme,
}: ThemeEditorProps) {
    const router = useRouter();
    const [themeName, setThemeName] = useState(editingTheme?.name || "My Custom Theme");

    // Colors State
    const [colors, setColors] = useState<typeof DEFAULT_CUSTOM_COLORS>(() => {
        if (editingTheme?.colors) return editingTheme.colors;
        if (activeCustomTheme?.colors) return activeCustomTheme.colors;
        if (activeThemeId && activeThemeId in PRESET_COLORS) {
            return {
                ...DEFAULT_CUSTOM_COLORS,
                ...PRESET_COLORS[activeThemeId as ThemePreset],
            };
        }
        return { ...DEFAULT_CUSTOM_COLORS };
    });

    // System Feel & Typography State
    const [radius, setRadius] = useState<string>(editingTheme?.radius || DEFAULT_RADIUS);
    const [motion, setMotion] = useState<"fast" | "fluid">(editingTheme?.motion || "fluid");
    const [headingFont, setHeadingFont] = useState<string>(editingTheme?.fonts?.heading || activeCustomTheme?.fonts?.heading || "Inter");
    const [bodyFont, setBodyFont] = useState<string>(editingTheme?.fonts?.body || activeCustomTheme?.fonts?.body || "Inter");
    const [buttonFont, setButtonFont] = useState<string>(editingTheme?.fonts?.button || activeCustomTheme?.fonts?.button || "Inter");

    const [headingWeight, setHeadingWeight] = useState<string>(editingTheme?.fonts?.headingWeight || activeCustomTheme?.fonts?.headingWeight || "700");
    const [bodyWeight, setBodyWeight] = useState<string>(editingTheme?.fonts?.bodyWeight || activeCustomTheme?.fonts?.bodyWeight || "400");
    const [buttonWeight, setButtonWeight] = useState<string>(editingTheme?.fonts?.buttonWeight || activeCustomTheme?.fonts?.buttonWeight || "600");

    const [headingStyle, setHeadingStyle] = useState<string>(editingTheme?.fonts?.headingStyle || activeCustomTheme?.fonts?.headingStyle || "normal");
    const [bodyStyle, setBodyStyle] = useState<string>(editingTheme?.fonts?.bodyStyle || activeCustomTheme?.fonts?.bodyStyle || "normal");
    const [buttonStyle, setButtonStyle] = useState<string>(editingTheme?.fonts?.buttonStyle || activeCustomTheme?.fonts?.buttonStyle || "normal");

    // Load fonts into preview
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        const query = "family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800;900&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Lato:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Lexend:wght@400;500;600;700;800;900&family=Ubuntu:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap";
        link.href = `https://fonts.googleapis.com/css2?${query}`;
        document.head.appendChild(link);
    }, []);

    // 2. Dynamic Studio Skinning - Live adaptive UI for all themes
    useEffect(() => {

        const style = document.createElement("style");
        style.id = "theme-studio-skin";
        style.textContent = `
            .theme-studio-root {
                --background: ${colors.background} !important;
                --foreground: ${colors.foreground} !important;
                --card: ${colors.surface} !important;
                --muted: ${colors.surface} !important;
                --muted-foreground: ${colors.mutedForeground} !important;
                --primary: ${colors.primary} !important;
                --primary-foreground: ${colors.primaryForeground} !important;
                --border: ${colors.primary} / 0.15 !important;
                --accent: ${colors.accent} !important;
                --input: ${colors.elevated} !important;
                --ring: ${colors.primary} !important;
            }
            .theme-studio-root input, 
            .theme-studio-root select,
            .theme-studio-root textarea {
                color: hsl(${colors.foreground}) !important;
                background-color: hsl(${colors.surface}) !important;
                border-color: hsla(${colors.primary}, 0.2) !important;
            }
        `;
        document.getElementById("theme-studio-skin")?.remove();
        document.head.appendChild(style);

        return () => {
            document.getElementById("theme-studio-skin")?.remove();
        };
    }, [colors, activeThemeId]);

    // Apply preview styles to document
    useEffect(() => {
        const style = document.createElement("style");
        style.id = "theme-editor-preview";

        // Convert motion choice to CSS logic (approximate for preview)
        // Note: Real reduced motion usually uses media query. Here we simulate via transition duration override?
        // Actually the global css uses :root.reduced-motion. We can toggle a class on body or just specific vars.
        // For now, let's just handle colors and radius. Motion visualization in preview might be subtle.

        style.textContent = `
      :root {
        --background: ${colors.background} !important;
        --foreground: ${colors.foreground} !important;
        --muted: ${colors.surface} !important;
        --muted-foreground: ${colors.mutedForeground} !important;
        --card: ${colors.surface} !important;
        --card-foreground: ${colors.foreground} !important;
        --popover: ${colors.background} !important;
        --popover-foreground: ${colors.foreground} !important;
        --primary: ${colors.primary} !important;
        --primary-foreground: ${colors.primaryForeground} !important;
        --secondary: ${colors.surface} !important;
        --secondary-foreground: ${colors.foreground} !important;
        --accent: ${colors.accent} !important;
        --accent-foreground: ${colors.foreground} !important;
        --border: ${colors.primary} / 0.2 !important;
        --input: ${colors.elevated} !important;
        --ring: ${colors.primary} !important;
        --radius: ${radius} !important;
        --font-heading: '${headingFont}', sans-serif;
        --font-body: '${bodyFont}', sans-serif;
        --font-button: '${buttonFont}', sans-serif;
      }

      /* Apply font overrides directly for the preview session */
      body {
        font-family: var(--font-body) !important;
        font-weight: ${bodyWeight} !important;
        font-style: ${bodyStyle} !important;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading) !important;
        font-weight: ${headingWeight} !important;
        font-style: ${headingStyle} !important;
      }
      button {
        font-family: var(--font-button) !important;
        font-weight: ${buttonWeight} !important;
        font-style: ${buttonStyle} !important;
      }
    `;

        // Remove existing preview style
        document.getElementById("theme-editor-preview")?.remove();
        document.head.appendChild(style);

        // Motion handling (toggle class on body for preview purposes)
        if (motion === "fast") {
            document.documentElement.classList.add("reduced-motion"); // Using existing class from globals.css
        } else {
            document.documentElement.classList.remove("reduced-motion");
        }

        return () => {
            document.getElementById("theme-editor-preview")?.remove();
            document.documentElement.classList.remove("reduced-motion");
        };
    }, [colors, radius, motion, headingFont, bodyFont, buttonFont, headingWeight, bodyWeight, buttonWeight, headingStyle, bodyStyle, buttonStyle]);

    const updateColor = (key: keyof typeof colors, value: string) => {
        if (colors[key] === value) return;
        setColors((prev) => ({ ...prev, [key]: value }));
    };

    const loadPreset = (preset: ThemePreset) => {
        const presetColors = PRESET_COLORS[preset];
        setColors((prev) => ({ ...prev, ...presetColors }));
    };

    const resetToDefault = () => {
        setColors({ ...DEFAULT_CUSTOM_COLORS });
        setRadius(DEFAULT_RADIUS);
        setMotion("fluid");
        setHeadingFont("Inter");
        setBodyFont("Inter");
        setButtonFont("Inter");
        setHeadingWeight("700");
        setBodyWeight("400");
        setButtonWeight("600");
        setHeadingStyle("normal");
        setBodyStyle("normal");
        setButtonStyle("normal");
        setThemeName("My Custom Theme");
    };

    const saveTheme = () => {
        const savedThemes: CustomTheme[] = JSON.parse(
            localStorage.getItem("custom-themes") || "[]"
        );

        const newTheme: CustomTheme = {
            id: editingTheme?.id || `custom-${Date.now()}`,
            name: themeName,
            colors,
            radius,
            motion,
            fonts: {
                heading: headingFont,
                body: bodyFont,
                button: buttonFont,
                headingWeight,
                bodyWeight,
                buttonWeight,
                headingStyle,
                bodyStyle,
                buttonStyle,
            },
            createdAt: editingTheme?.createdAt || Date.now(),
        };

        // Check limit (max 6)
        if (!editingTheme && savedThemes.length >= 6) {
            alert("Maximum of 6 custom themes allowed. Please delete one first.");
            return;
        }

        // Update or add
        const existingIndex = savedThemes.findIndex((t) => t.id === newTheme.id);
        if (existingIndex >= 0) {
            savedThemes[existingIndex] = newTheme;
        } else {
            savedThemes.push(newTheme);
        }

        localStorage.setItem("custom-themes", JSON.stringify(savedThemes));

        // Clear preview and go back
        document.getElementById("theme-editor-preview")?.remove();
        onBack();
    };

    const handleCancel = () => {
        document.getElementById("theme-editor-preview")?.remove();
        onBack();
    };

    const exportTheme = () => {
        const exportData = {
            name: themeName,
            colors,
            radius,
            motion,
            fonts: {
                heading: headingFont,
                body: bodyFont,
                button: buttonFont,
                headingWeight,
                bodyWeight,
                buttonWeight,
                headingStyle,
                bodyStyle,
                buttonStyle,
            },
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${themeName.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importTheme = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.colors) {
                        setColors({ ...DEFAULT_CUSTOM_COLORS, ...data.colors });
                        if (data.name) setThemeName(data.name);
                        if (data.radius) setRadius(data.radius);
                        if (data.motion) setMotion(data.motion);
                        if (data.fonts) {
                            if (data.fonts.heading) setHeadingFont(data.fonts.heading);
                            if (data.fonts.body) setBodyFont(data.fonts.body);
                            if (data.fonts.button) setButtonFont(data.fonts.button);
                            if (data.fonts.headingWeight) setHeadingWeight(data.fonts.headingWeight);
                            if (data.fonts.bodyWeight) setBodyWeight(data.fonts.bodyWeight);
                            if (data.fonts.buttonWeight) setButtonWeight(data.fonts.buttonWeight);
                            if (data.fonts.headingStyle) setHeadingStyle(data.fonts.headingStyle);
                            if (data.fonts.bodyStyle) setBodyStyle(data.fonts.bodyStyle);
                            if (data.fonts.buttonStyle) setButtonStyle(data.fonts.buttonStyle);
                        }
                    }
                } catch {
                    alert("Invalid theme file");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Simple contrast check
    const checkContrast = (): { passed: boolean; issues: string[] } => {
        const issues: string[] = [];
        // Basic lightness check for primary vs primaryForeground
        const primaryL = parseFloat(colors.primary.split(" ")[2] || "50");
        const fgL = parseFloat(colors.primaryForeground.split(" ")[2] || "50");
        const diff = Math.abs(primaryL - fgL);

        if (diff < 40) {
            issues.push("Primary button text may be hard to read");
        }

        return { passed: issues.length === 0, issues };
    };

    const contrastResult = checkContrast();

    return (
        <div className="flex flex-col min-h-full theme-studio-root">
            {/* Header */}
            <div className="px-6 py-6 md:px-8 lg:px-10">
                <div className="flex items-center gap-3 mb-1">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Theme Studio</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">
                    Create Your Theme
                </h1>
                <p className="text-muted-foreground">
                    Define your brand's look and feel, from colors to motion.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 md:px-8 lg:px-10 pb-10">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left & Middle Column - 2x2 Grid Controls */}
                    <div className="xl:col-span-2 space-y-8">

                        {/* Global Settings */}
                        <div className="flex gap-6 items-end">
                            <div className="flex-1">
                                <Label htmlFor="theme-name" className="text-sm font-medium">
                                    Theme Name
                                </Label>
                                <Input
                                    id="theme-name"
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    className="mt-2"
                                    placeholder="My Custom Theme"
                                />
                            </div>

                            {/* Preset Quick Loader */}
                            <div className="flex-1">
                                <Label className="text-sm font-medium mb-2 block">Quick Start Presets</Label>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {THEME_PRESETS.map((preset: ThemePreset) => (
                                        <button
                                            key={preset}
                                            onClick={() => loadPreset(preset)}
                                            className="w-8 h-8 rounded-full border border-border/50 hover:scale-110 transition-transform flex-shrink-0"
                                            style={{ backgroundColor: `hsl(${PRESET_COLORS[preset as ThemePreset].primary})` }}
                                            title={preset}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 4-Quadrant Visual Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">

                            {/* Q1: Brand Core */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Brand Core
                                </h3>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="Primary Color"
                                        description="Main buttons and active states"
                                        value={colors.primary}
                                        onChange={(v) => updateColor("primary", v)}
                                    />
                                    <ColorPicker
                                        label="Primary Foreground"
                                        description="Text on primary buttons"
                                        value={colors.primaryForeground}
                                        onChange={(v) => updateColor("primaryForeground", v)}
                                    />
                                    <ColorPicker
                                        label="Accent"
                                        description="Secondary highlights and details"
                                        value={colors.accent}
                                        onChange={(v) => updateColor("accent", v)}
                                    />
                                    <ColorPicker
                                        label="Glow"
                                        description="Focus rings and subtle glows"
                                        value={colors.accentGlow}
                                        onChange={(v) => updateColor("accentGlow", v)}
                                    />
                                </div>
                            </div>

                            {/* Q2: System Feel */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <MousePointer2 className="w-4 h-4" />
                                    System Feel
                                </h3>
                                <div className="space-y-6 p-4 rounded-xl border border-border/40 bg-card/20">
                                    {/* Radius Control */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">Corner Radius</Label>
                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {radius}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1.5"
                                            step="0.1"
                                            value={parseFloat(radius)}
                                            onChange={(e) => setRadius(`${e.target.value}rem`)}
                                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                                            <span>Square</span>
                                            <span>Round</span>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Motion Control */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-medium">Motion Speed</Label>
                                            <Move className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setMotion("fast")}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${motion === "fast"
                                                    ? "bg-primary/20 border-primary text-primary"
                                                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                Fast (Reduced)
                                            </button>
                                            <button
                                                onClick={() => setMotion("fluid")}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${motion === "fluid"
                                                    ? "bg-primary/20 border-primary text-primary"
                                                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                Fluid (Standard)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Q3: Backgrounds */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Background & Surface
                                </h3>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="App Background"
                                        description="Main application canvas (bg0)"
                                        value={colors.background}
                                        onChange={(v) => updateColor("background", v)}
                                    />
                                    <ColorPicker
                                        label="Surface Cards"
                                        description="Panels and containers (bg1)"
                                        value={colors.surface}
                                        onChange={(v) => updateColor("surface", v)}
                                    />
                                    <ColorPicker
                                        label="Elevated Elements"
                                        description="Modals and sticky headers (bg2)"
                                        value={colors.elevated}
                                        onChange={(v) => updateColor("elevated", v)}
                                    />
                                </div>
                            </div>

                            {/* Q4: Typography & Fonts */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Type className="w-4 h-4" />
                                    Typography & Fonts
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <ColorPicker
                                            label="Primary Text"
                                            description="Headings and main content"
                                            value={colors.foreground}
                                            onChange={(v) => updateColor("foreground", v)}
                                        />
                                        <ColorPicker
                                            label="Muted Text"
                                            description="Subtitles and metadata"
                                            value={colors.mutedForeground}
                                            onChange={(v) => updateColor("mutedForeground", v)}
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-border/50 space-y-4">
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Heading Font</Label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={headingFont}
                                                    onChange={(e) => setHeadingFont(e.target.value)}
                                                    className="flex-1 bg-card/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                    style={{ fontFamily: headingFont }}
                                                >
                                                    {AVAILABLE_FONTS.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={headingWeight}
                                                    onChange={(e) => setHeadingWeight(e.target.value)}
                                                    className="w-[100px] bg-card/60 border border-border/50 rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                >
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">Semibold</option>
                                                    <option value="700">Bold</option>
                                                    <option value="800">ExtraBold</option>
                                                    <option value="900">Black</option>
                                                </select>
                                                <button
                                                    onClick={() => setHeadingStyle(headingStyle === "italic" ? "normal" : "italic")}
                                                    className={`w-9 rounded-lg border flex items-center justify-center transition-colors ${headingStyle === "italic" ? "bg-primary/20 border-primary text-primary" : "bg-card/60 border-border/50 text-muted-foreground hover:bg-muted"}`}
                                                    title="Italic"
                                                >
                                                    <Italic className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Body Font</Label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={bodyFont}
                                                    onChange={(e) => setBodyFont(e.target.value)}
                                                    className="flex-1 bg-card/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                    style={{ fontFamily: bodyFont }}
                                                >
                                                    {AVAILABLE_FONTS.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={bodyWeight}
                                                    onChange={(e) => setBodyWeight(e.target.value)}
                                                    className="w-[100px] bg-card/60 border border-border/50 rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                >
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">Semibold</option>
                                                    <option value="700">Bold</option>
                                                    <option value="800">ExtraBold</option>
                                                    <option value="900">Black</option>
                                                </select>
                                                <button
                                                    onClick={() => setBodyStyle(bodyStyle === "italic" ? "normal" : "italic")}
                                                    className={`w-9 rounded-lg border flex items-center justify-center transition-colors ${bodyStyle === "italic" ? "bg-primary/20 border-primary text-primary" : "bg-card/60 border-border/50 text-muted-foreground hover:bg-muted"}`}
                                                    title="Italic"
                                                >
                                                    <Italic className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Button Font</Label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={buttonFont}
                                                    onChange={(e) => setButtonFont(e.target.value)}
                                                    className="flex-1 bg-card/60 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                    style={{ fontFamily: buttonFont }}
                                                >
                                                    {AVAILABLE_FONTS.map(font => (
                                                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={buttonWeight}
                                                    onChange={(e) => setButtonWeight(e.target.value)}
                                                    className="w-[100px] bg-card/60 border border-border/50 rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                                >
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">Semibold</option>
                                                    <option value="700">Bold</option>
                                                    <option value="800">ExtraBold</option>
                                                    <option value="900">Black</option>
                                                </select>
                                                <button
                                                    onClick={() => setButtonStyle(buttonStyle === "italic" ? "normal" : "italic")}
                                                    className={`w-9 rounded-lg border flex items-center justify-center transition-colors ${buttonStyle === "italic" ? "bg-primary/20 border-primary text-primary" : "bg-card/60 border-border/50 text-muted-foreground hover:bg-muted"}`}
                                                    title="Italic"
                                                >
                                                    <Italic className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column - Preview & Actions */}
                    <div className="space-y-6">
                        {/* Live Preview */}
                        <div className="sticky top-6">
                            <LivePreview
                                themeName={themeName}
                                colors={{
                                    background: colors.background,
                                    surface: colors.surface,
                                    foreground: colors.foreground,
                                    mutedForeground: colors.mutedForeground,
                                    primary: colors.primary,
                                    primaryForeground: colors.primaryForeground,
                                    accent: colors.accent,
                                    // Pass mock status colors if needed by older preview, 
                                    // but we will update LivePreview next
                                    success: "142 71% 45%",
                                    warning: "38 92% 50%",
                                    error: "0 84% 60%",
                                }}
                                radius={radius}
                                fonts={{
                                    heading: headingFont,
                                    body: bodyFont,
                                    button: buttonFont,
                                    headingWeight,
                                    bodyWeight,
                                    buttonWeight,
                                    headingStyle,
                                    bodyStyle,
                                    buttonStyle,
                                }}
                            />

                            {/* Readability Check */}
                            <div
                                className={`mt-4 p-4 rounded-lg border ${contrastResult.passed
                                    ? "border-green-500/30 bg-green-500/10"
                                    : "border-yellow-500/30 bg-yellow-500/10"
                                    }`}
                            >
                                <p className="text-sm font-medium mb-2">Readability</p>
                                {contrastResult.passed ? (
                                    <div className="flex items-center gap-2 text-green-500 text-sm">
                                        <Check className="w-4 h-4" />
                                        All contrast checks passed
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {contrastResult.issues.map((issue, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-yellow-500 text-sm"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-2">
                                <Button variant="outline" className="w-full" onClick={exportTheme}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Theme
                                </Button>
                                <Button variant="outline" className="w-full" onClick={importTheme}>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Theme
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full hover:bg-destructive/10 hover:text-destructive"
                                    onClick={resetToDefault}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset to Default
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-md border-t border-border mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-end gap-3 px-6 py-4 md:px-8 lg:px-10">
                    <Button variant="ghost" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={saveTheme} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4 mr-2" />
                        Save Theme
                    </Button>
                </div>
            </div>
        </div>
    );
}
