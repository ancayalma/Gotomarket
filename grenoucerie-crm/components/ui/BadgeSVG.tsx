"use client";

import React from "react";
import type { BadgeDNA } from "@/lib/quest-engine/badge-dna";
import { PALETTES, RARITIES, RARITY_COLORS } from "@/lib/quest-engine/badge-dna";

// ─── SVG Path Data for Icons ────────────────────────────────────────────────────
// Compact centerpiece icons rendered at 24x24 viewBox scale

const ICON_PATHS: Record<number, string> = {
    0: "M12 2l2.5 7H22l-6 4.5 2.3 7L12 16l-6.3 4.5 2.3-7L2 9h7.5z", // sword/star hybrid
    1: "M12 2c1 3 4 5 4 9 0 3.3-2.7 6-4 6s-4-2.7-4-6c0-4 3-6 4-9z", // flame
    2: "M12 2l2 4h4l-2 4 2 4h-4l-2 4-2-4H6l2-4-2-4h4z", // crown
    3: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z", // target
    4: "M13 2L3 14h8l-1 8 10-12h-8z", // bolt
    5: "M12 2l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z", // trophy star
    6: "M12 2C8 2 5 5 5 8c0 2 1 3 2 4l5 8 5-8c1-1 2-2 2-4 0-3-3-6-7-6zm0 3a3 3 0 110 6 3 3 0 010-6z", // skull/pin
    7: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", // eye
    8: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z", // compass
    9: "M12 2C8 2 5 4 5 8c0 2 1.5 4 3 5v7l4-2 4 2v-7c1.5-1 3-3 3-5 0-4-3-6-7-6z", // anchor/shield
    10: "M12 2L4 8v8l8 6 8-6V8z", // rocket (hex)
    11: "M12 2a10 10 0 100 20 10 10 0 000-20zM8 12l2-4h4l2 4-2 4H10z", // atom
    12: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z", // heart
    13: "M12 2L2 22h20zM12 6l7 14H5z", // mountain
    14: "M2 17c2-3 4-4 6-2s4-1 6-2 4 1 6 2v4H2z", // wave
    15: "M20.39 8.56l-1.67-2.88-2.88 1.67-.45-3.33H12.6l-.45 3.33-2.88-1.67-1.67 2.88 3.33.45-1.67 2.88 2.88 1.67-.45 3.33h2.78l.45-3.33 2.88 1.67 1.67-2.88-3.33-.45z", // feather/spin
    16: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z", // gem star
    17: "M12 2L8 6H2v6l4 4v6h6l4-4h6v-6l-4-4V2h-6zm0 5a5 5 0 110 10 5 5 0 010-10z", // key
    18: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z", // star
    19: "M12 2a10 10 0 100 20 10 10 0 000-20zM8 12a4 4 0 008 0", // moon
    20: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12z", // sun
    21: "M7 2v11h3v9l7-12h-4l4-8z", // lightning
    22: "M12 2C6 2 3 7 3 12s3 8 5 9c0-2 1-3 2-4-2-1-3-3-3-5s2-5 5-5 5 3 5 5-1 4-3 5c1 1 2 2 2 4 2-1 5-4 5-9S18 2 12 2z", // leaf  
    23: "M12 2c-2 0-3 2-3 4 0 1 .5 2 1 3L6 12l-4 3 3 1-1 4 4-1 1 3 3-4 3 4 1-3 4 1-1-4 3-1-4-3-4 3c.5-1 1-2 1-3 0-2-1-4-3-4z", // dragon
};

// ─── Shape Clip Paths ───────────────────────────────────────────────────────────

function getShapePath(shape: number, size: number): string {
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;
    switch (shape) {
        case 0: // circle
            return `M${cx},${cy - r}A${r},${r},0,1,1,${cx},${cy + r}A${r},${r},0,1,1,${cx},${cy - r}Z`;
        case 1: { // hexagon
            const pts = Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            });
            return `M${pts.join("L")}Z`;
        }
        case 2: // shield
            return `M${cx},${cy - r} L${cx + r},${cy - r * 0.3} L${cx + r * 0.8},${cy + r * 0.6} L${cx},${cy + r} L${cx - r * 0.8},${cy + r * 0.6} L${cx - r},${cy - r * 0.3}Z`;
        case 3: { // star (5-point)
            const pts = Array.from({ length: 10 }, (_, i) => {
                const angle = (Math.PI / 5) * i - Math.PI / 2;
                const rad = i % 2 === 0 ? r : r * 0.5;
                return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
            });
            return `M${pts.join("L")}Z`;
        }
        case 4: // diamond
            return `M${cx},${cy - r} L${cx + r * 0.7},${cy} L${cx},${cy + r} L${cx - r * 0.7},${cy}Z`;
        case 5: { // pentagon
            const pts = Array.from({ length: 5 }, (_, i) => {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            });
            return `M${pts.join("L")}Z`;
        }
        case 6: { // octagon
            const pts = Array.from({ length: 8 }, (_, i) => {
                const angle = (Math.PI / 4) * i - Math.PI / 8;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            });
            return `M${pts.join("L")}Z`;
        }
        case 7: { // gear
            const pts: string[] = [];
            for (let i = 0; i < 8; i++) {
                const angle1 = (Math.PI / 4) * i - Math.PI / 8;
                const angle2 = angle1 + Math.PI / 16;
                pts.push(`${cx + r * Math.cos(angle1)},${cy + r * Math.sin(angle1)}`);
                pts.push(`${cx + r * 0.75 * Math.cos(angle2)},${cy + r * 0.75 * Math.sin(angle2)}`);
            }
            return `M${pts.join("L")}Z`;
        }
        default: return getShapePath(0, size);
    }
}

// ─── Pattern Generators ─────────────────────────────────────────────────────────

function PatternDef({ pattern, patternColor }: { pattern: number; patternColor: string }) {
    const opacity = 0.12;
    switch (pattern) {
        case 1: // stripes
            return (
                <pattern id="bgPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="6" y2="6" stroke={patternColor} strokeWidth="0.5" opacity={opacity} />
                </pattern>
            );
        case 2: // dots
            return (
                <pattern id="bgPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="1" fill={patternColor} opacity={opacity} />
                </pattern>
            );
        case 3: // crosshatch
            return (
                <pattern id="bgPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="8" y2="8" stroke={patternColor} strokeWidth="0.4" opacity={opacity} />
                    <line x1="8" y1="0" x2="0" y2="8" stroke={patternColor} strokeWidth="0.4" opacity={opacity} />
                </pattern>
            );
        case 4: // radial
            return (
                <radialGradient id="bgPattern" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={patternColor} stopOpacity={opacity * 2} />
                    <stop offset="100%" stopColor={patternColor} stopOpacity={0} />
                </radialGradient>
            );
        case 5: // circuit
            return (
                <pattern id="bgPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M0 6h4M8 6h4M6 0v4M6 8v4" stroke={patternColor} strokeWidth="0.5" fill="none" opacity={opacity} />
                    <circle cx="6" cy="6" r="1" fill={patternColor} opacity={opacity} />
                </pattern>
            );
        default:
            return null;
    }
}

// ─── Frame Renderers ────────────────────────────────────────────────────────────

function FrameRing({ frame, size }: { frame: number; size: number }) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 1;
    if (frame === 0) return null;

    const frameColors: Record<number, string> = {
        1: "#CD7F32", // Bronze
        2: "#C0C0C0", // Silver
        3: "#FFD700", // Gold
        4: "#E5E4E2", // Platinum
        5: "#B9F2FF", // Diamond
        6: "#2D1B4E", // Obsidian
    };

    const color = frameColors[frame] || frameColors[1];
    const sw = frame >= 5 ? 2.5 : frame >= 3 ? 2 : 1.5;

    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} opacity={0.8} />
            {frame >= 3 && (
                <circle cx={cx} cy={cy} r={r + 1} fill="none" stroke={color} strokeWidth={0.5} opacity={0.3} />
            )}
            {frame >= 5 && (
                <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke={color} strokeWidth={0.3} opacity={0.2} />
            )}
        </g>
    );
}

// ─── Main Badge SVG Component ───────────────────────────────────────────────────

interface BadgeSVGProps {
    dna: BadgeDNA;
    size?: number;
    className?: string;
    showGlow?: boolean;
}

export default function BadgeSVG({ dna, size = 48, className = "", showGlow = true }: BadgeSVGProps) {
    const palette = PALETTES[dna.palette % PALETTES.length];
    const [primary, secondary, accent] = palette;
    const rarityColor = RARITY_COLORS[RARITIES[dna.rarity] || "COMMON"];
    const shapePath = getShapePath(dna.shape, size);
    const iconPath = ICON_PATHS[dna.icon % 24] || ICON_PATHS[0];

    const clipId = `clip-${dna.shape}-${dna.icon}-${dna.palette}`;
    const gradId = `grad-${dna.shape}-${dna.palette}`;
    const iconScale = size / 48; // icons are drawn at 24x24, we want them at ~50% of badge size
    const iconSize = 24;
    const iconOffset = (size - iconSize * iconScale) / 2;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            style={{ overflow: "visible" }}
        >
            <defs>
                {/* Shape clip */}
                <clipPath id={clipId}>
                    <path d={shapePath} />
                </clipPath>
                {/* Background gradient */}
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={secondary} />
                    <stop offset="100%" stopColor={primary} />
                </linearGradient>
                {/* Pattern */}
                <PatternDef pattern={dna.pattern} patternColor={accent} />
                {/* Glow for legendaries */}
                {showGlow && dna.rarity >= 3 && (
                    <filter id={`glow-${clipId}`}>
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
            </defs>

            {/* Glow effect for high rarity */}
            {showGlow && dna.rarity >= 3 && (
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={size / 2 + 2}
                    fill="none"
                    stroke={rarityColor}
                    strokeWidth={1}
                    opacity={0.4}
                    filter={`url(#glow-${clipId})`}
                />
            )}

            {/* Shape background */}
            <g clipPath={`url(#${clipId})`}>
                <path d={shapePath} fill={`url(#${gradId})`} />
                {/* Pattern overlay */}
                {dna.pattern > 0 && (
                    <rect
                        width={size}
                        height={size}
                        fill={dna.pattern === 4 ? `url(#bgPattern)` : `url(#bgPattern)`}
                    />
                )}
            </g>

            {/* Shape border */}
            <path d={shapePath} fill="none" stroke={accent} strokeWidth={1} opacity={0.5} />

            {/* Icon */}
            <g transform={`translate(${iconOffset}, ${iconOffset}) scale(${iconScale})`}>
                <path d={iconPath} fill="white" opacity={0.9} />
            </g>

            {/* Frame ring (prestige/rarity driven) */}
            <FrameRing frame={dna.frame} size={size} />

            {/* Rarity indicator dot */}
            {dna.rarity > 0 && (
                <circle
                    cx={size - 4}
                    cy={size - 4}
                    r={3}
                    fill={rarityColor}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={0.5}
                />
            )}
        </svg>
    );
}
