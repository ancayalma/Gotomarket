"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";

// ── Conversion Matrix ──
const FORMATS = {
    PDF:  { label: "PDF",  group: "Document" },
    DOCX: { label: "DOCX", group: "Document" },
    PPTX: { label: "PPTX", group: "Document" },
    XLSX: { label: "XLSX", group: "Spreadsheet" },
    CSV:  { label: "CSV",  group: "Spreadsheet" },
    HTML: { label: "HTML", group: "Markup" },
    MD:   { label: "Markdown", group: "Markup" },
    XML:  { label: "XML",  group: "Markup" },
    JSON: { label: "JSON", group: "Data" },
    YAML: { label: "YAML", group: "Data" },
    TXT:  { label: "Plain Text", group: "Data" },
    PNG:  { label: "PNG",  group: "Image" },
    JPG:  { label: "JPG",  group: "Image" },
    WEBP: { label: "WebP", group: "Image" },
    TIFF: { label: "TIFF", group: "Image" },
    SVG:  { label: "SVG",  group: "Image" },
    BMP:  { label: "BMP",  group: "Image" },
    HEIC: { label: "HEIC", group: "Image" },
} as const;

type FormatKey = keyof typeof FORMATS;

const CONVERSIONS: Record<FormatKey, FormatKey[]> = {
    PDF:  ["DOCX", "XLSX", "CSV", "PNG", "JPG", "WEBP", "MD", "JSON", "TXT", "HTML", "XML"],
    DOCX: ["HTML", "MD", "TXT", "JSON"],
    PPTX: ["PDF", "PNG", "JPG", "MD", "TXT"],
    XLSX: ["CSV", "JSON", "HTML", "MD", "XML", "YAML"],
    CSV:  ["XLSX", "JSON", "HTML", "XML", "YAML"],
    HTML: ["MD", "TXT"],
    MD:   ["HTML", "TXT"],
    XML:  ["JSON", "CSV", "HTML", "TXT", "YAML"],
    JSON: ["CSV", "XLSX", "XML", "YAML", "TXT", "HTML"],
    YAML: ["JSON", "XML", "TXT"],
    TXT:  ["MD", "HTML"],
    PNG:  ["JPG", "WEBP", "TIFF", "BMP"],
    JPG:  ["PNG", "WEBP", "TIFF", "BMP"],
    WEBP: ["PNG", "JPG", "TIFF"],
    TIFF: ["PNG", "JPG", "WEBP"],
    SVG:  ["PNG", "JPG", "WEBP"],
    BMP:  ["PNG", "JPG", "WEBP"],
    HEIC: ["PNG", "JPG", "WEBP"],
};

interface CurveState {
    key: string;
    x1: number; y1: number;
    x2: number; y2: number;
    visible: boolean;
    // Physics state for dangling
    droopY: number;
    droopVel: number;
    opacity: number;
}

interface ConversionPickerProps {
    onSelect: (from: string, to: string) => void;
    from?: string;
    to?: string;
}

export function ConversionPicker({ onSelect, from, to }: ConversionPickerProps) {
    const [open, setOpen] = useState(false);
    const [selectedFrom, setSelectedFrom] = useState<FormatKey | null>(null);
    const [selectedTo, setSelectedTo] = useState<FormatKey | null>(null);
    const [hoveredSource, setHoveredSource] = useState<FormatKey | null>(null);

    // Sync from parent-controlled props
    useEffect(() => {
        if (from && from in FORMATS) setSelectedFrom(from as FormatKey);
        if (to && to in FORMATS) setSelectedTo(to as FormatKey);
    }, [from, to]);

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sourceScrollRef = useRef<HTMLDivElement>(null);
    const targetScrollRef = useRef<HTMLDivElement>(null);
    const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const curveStatesRef = useRef<Record<string, CurveState>>({});
    const rafRef = useRef<number>(0);

    const activeSource = hoveredSource || selectedFrom;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Physics animation loop
    useEffect(() => {
        if (!open) { cancelAnimationFrame(rafRef.current); return; }

        const GRAVITY = 800; // px/s^2
        const DAMPING = 0.92;
        const SPRING = 12;
        let lastTime = performance.now();

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            const canvas = canvasRef.current;
            const dropdown = dropdownRef.current;
            const srcScroll = sourceScrollRef.current;
            const tgtScroll = targetScrollRef.current;
            if (!canvas || !dropdown || !srcScroll || !tgtScroll) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }

            // Size canvas to dropdown
            const dRect = dropdown.getBoundingClientRect();
            canvas.width = dRect.width * window.devicePixelRatio;
            canvas.height = dRect.height * window.devicePixelRatio;
            canvas.style.width = dRect.width + "px";
            canvas.style.height = dRect.height + "px";
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
            ctx.clearRect(0, 0, dRect.width, dRect.height);

            if (!activeSource) {
                // Clear old states
                curveStatesRef.current = {};
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const validTargets = CONVERSIONS[activeSource] || [];
            const sourceEl = sourceRefs.current[activeSource];
            if (!sourceEl) { rafRef.current = requestAnimationFrame(tick); return; }

            const sourceRect = sourceEl.getBoundingClientRect();
            const srcScrollRect = srcScroll.getBoundingClientRect();
            const tgtScrollRect = tgtScroll.getBoundingClientRect();

            // Source visibility
            const srcVisible = sourceRect.bottom > srcScrollRect.top && sourceRect.top < srcScrollRect.bottom;
            const srcY = srcVisible
                ? sourceRect.top + sourceRect.height / 2 - dRect.top
                : (sourceRect.top < srcScrollRect.top
                    ? srcScrollRect.top - dRect.top + 4
                    : srcScrollRect.bottom - dRect.top - 4);
            const srcX = sourceRect.right - dRect.left;

            // Remove stale keys
            const activeKeys = new Set(validTargets.map(t => `${activeSource}_${t}`));
            for (const k of Object.keys(curveStatesRef.current)) {
                if (!activeKeys.has(k)) delete curveStatesRef.current[k];
            }

            validTargets.forEach((targetKey) => {
                const targetEl = targetRefs.current[targetKey];
                if (!targetEl) return;

                const targetRect = targetEl.getBoundingClientRect();
                const curveKey = `${activeSource}_${targetKey}`;

                // Is target visible in its scroll container?
                const tgtVisible = targetRect.bottom > tgtScrollRect.top && targetRect.top < tgtScrollRect.bottom;

                // Actual target position
                const tgtX = targetRect.left - dRect.left;
                const tgtY = targetRect.top + targetRect.height / 2 - dRect.top;

                // Clamp position when out of view
                const edgeY = targetRect.top < tgtScrollRect.top
                    ? tgtScrollRect.top - dRect.top + 2
                    : tgtScrollRect.bottom - dRect.top - 2;

                // Get or create state
                let state = curveStatesRef.current[curveKey];
                if (!state) {
                    state = { key: curveKey, x1: srcX, y1: srcY, x2: tgtX, y2: tgtVisible ? tgtY : edgeY, visible: tgtVisible, droopY: 0, droopVel: 0, opacity: tgtVisible ? 1 : 0 };
                    curveStatesRef.current[curveKey] = state;
                }

                // Update physics
                if (tgtVisible && srcVisible) {
                    // Spring back to connected position
                    state.droopVel += (-state.droopY * SPRING) * dt;
                    state.droopVel *= DAMPING;
                    state.droopY += state.droopVel * dt * 60;
                    if (Math.abs(state.droopY) < 0.5 && Math.abs(state.droopVel) < 0.5) { state.droopY = 0; state.droopVel = 0; }
                    state.opacity = Math.min(1, state.opacity + dt * 6);
                    state.x2 = tgtX;
                    state.y2 = tgtY;
                    state.visible = true;
                } else {
                    // Disconnected — apply gravity droop
                    state.droopVel += GRAVITY * dt;
                    state.droopVel *= 0.97;
                    state.droopY += state.droopVel * dt;
                    // Clamp droop so it doesn't go crazy
                    state.droopY = Math.min(state.droopY, 60);
                    state.droopVel = Math.min(state.droopVel, 200);
                    state.opacity = Math.max(0.15, state.opacity - dt * 4);
                    state.x2 = tgtX;
                    state.y2 = edgeY;
                    state.visible = false;
                }

                state.x1 = srcX;
                state.y1 = srcY;

                // Draw the curve
                const midX = (state.x1 + state.x2) / 2;
                const cpOffset = Math.min(80, Math.abs(state.x2 - state.x1) * 0.4);

                ctx.save();
                ctx.globalAlpha = state.opacity;
                ctx.beginPath();
                ctx.moveTo(state.x1, state.y1);

                if (state.visible && srcVisible) {
                    // Connected: clean bezier
                    ctx.bezierCurveTo(
                        state.x1 + cpOffset, state.y1 + state.droopY * 0.3,
                        state.x2 - cpOffset, state.y2 + state.droopY * 0.3,
                        state.x2, state.y2
                    );
                } else {
                    // Disconnected: droopy string that sags
                    const sagY = state.droopY;
                    const clipEdge = !srcVisible ? srcY : edgeY;
                    ctx.bezierCurveTo(
                        state.x1 + cpOffset, state.y1 + sagY * 0.6,
                        midX, Math.max(state.y1, state.y2) + sagY,
                        state.x2, state.y2
                    );
                }

                // Gradient stroke
                const grad = ctx.createLinearGradient(state.x1, 0, state.x2, 0);
                grad.addColorStop(0, `rgba(249, 115, 22, ${state.opacity * 0.8})`);
                grad.addColorStop(1, `rgba(251, 191, 36, ${state.opacity * 0.6})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = state.visible ? 1.5 : 1;
                ctx.lineCap = "round";
                ctx.stroke();

                // Dots at endpoints
                if (srcVisible) {
                    ctx.beginPath();
                    ctx.arc(state.x1, state.y1, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(249, 115, 22, ${state.opacity})`;
                    ctx.fill();
                }
                if (state.visible) {
                    ctx.beginPath();
                    ctx.arc(state.x2, state.y2, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(251, 191, 36, ${state.opacity})`;
                    ctx.fill();
                } else {
                    // Disconnected spark at edge
                    ctx.beginPath();
                    ctx.arc(state.x2, state.y2, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(249, 115, 22, ${state.opacity * 0.5})`;
                    ctx.fill();
                }

                ctx.restore();
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [open, activeSource]);

    const handleSelect = (from: FormatKey, to: FormatKey) => {
        setSelectedFrom(from);
        setSelectedTo(to);
        setOpen(false);
        onSelect(from, to);
    };

    const groupedFormats = Object.entries(FORMATS).reduce((acc, [key, val]) => {
        if (!acc[val.group]) acc[val.group] = [];
        acc[val.group].push(key as FormatKey);
        return acc;
    }, {} as Record<string, FormatKey[]>);

    const validTargetsForActive = activeSource ? CONVERSIONS[activeSource] || [] : [];

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all border ${
                    open ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
                <span>Convert</span>
                {selectedFrom ? (
                    <span className="font-mono text-orange-400">{FORMATS[selectedFrom].label}</span>
                ) : (
                    <span className="text-white/30 mx-0.5">X</span>
                )}
                <ArrowRight className={`w-3 h-3 ${selectedFrom || selectedTo ? "text-orange-400" : "text-white/20"}`} />
                {selectedTo ? (
                    <span className="font-mono text-amber-400">{FORMATS[selectedTo].label}</span>
                ) : (
                    <span className="text-white/30 mx-0.5">Y</span>
                )}
                <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 flex bg-[#0c0c0c] border border-white/[0.08] rounded-lg shadow-2xl shadow-black/60 overflow-hidden"
                    style={{ minWidth: 520 }}
                >
                    {/* Canvas overlay for physics curves */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{ overflow: "visible" }}
                    />

                    {/* Source (X) */}
                    <div className="w-[240px] border-r border-white/[0.06] flex flex-col">
                        <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                            <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Source Format</span>
                        </div>
                        <div ref={sourceScrollRef} className="flex-1 overflow-y-auto max-h-[360px] py-1">
                            {Object.entries(groupedFormats).map(([group, keys]) => (
                                <div key={group}>
                                    <div className="px-3 py-1 text-[9px] uppercase tracking-widest text-white/20 font-bold">{group}</div>
                                    {keys.map((key) => (
                                        <div
                                            key={key}
                                            ref={(el) => { sourceRefs.current[key] = el; }}
                                            onMouseEnter={() => setHoveredSource(key)}
                                            onMouseLeave={() => setHoveredSource(null)}
                                            onClick={() => {
                                                setSelectedFrom(key);
                                                if (selectedTo && !CONVERSIONS[key]?.includes(selectedTo)) setSelectedTo(null);
                                            }}
                                            className={`flex items-center justify-between px-3 py-1.5 mx-1 rounded cursor-pointer text-[11px] font-medium transition-all ${
                                                selectedFrom === key ? "bg-orange-500/15 text-orange-400"
                                                : hoveredSource === key ? "bg-white/[0.04] text-white/80"
                                                : "text-white/50 hover:text-white/70 hover:bg-white/[0.02]"
                                            }`}
                                        >
                                            <span className="font-mono">{FORMATS[key].label}</span>
                                            {selectedFrom === key && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center */}
                    <div className="flex items-center justify-center w-10 bg-white/[0.01]">
                        <ArrowRight className="w-4 h-4 text-white/15" />
                    </div>

                    {/* Target (Y) */}
                    <div className="w-[240px] flex flex-col">
                        <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                            <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Target Format</span>
                        </div>
                        <div ref={targetScrollRef} className="flex-1 overflow-y-auto max-h-[360px] py-1">
                            {Object.entries(groupedFormats).map(([group, keys]) => (
                                <div key={group}>
                                    <div className="px-3 py-1 text-[9px] uppercase tracking-widest text-white/20 font-bold">{group}</div>
                                    {keys.map((key) => {
                                        const isValidTarget = activeSource ? validTargetsForActive.includes(key) : true;
                                        const isSelectedTarget = selectedTo === key;
                                        return (
                                            <div
                                                key={key}
                                                ref={(el) => { targetRefs.current[key] = el; }}
                                                onClick={() => {
                                                    if (!selectedFrom) return;
                                                    if (!CONVERSIONS[selectedFrom]?.includes(key)) return;
                                                    handleSelect(selectedFrom, key);
                                                }}
                                                className={`flex items-center justify-between px-3 py-1.5 mx-1 rounded text-[11px] font-medium transition-all ${
                                                    isSelectedTarget ? "bg-amber-500/15 text-amber-400 cursor-pointer"
                                                    : activeSource && isValidTarget ? "bg-amber-500/[0.06] text-white/70 cursor-pointer"
                                                    : activeSource && !isValidTarget ? "text-white/15 cursor-not-allowed"
                                                    : "text-white/50 hover:text-white/70 hover:bg-white/[0.02] cursor-pointer"
                                                }`}
                                            >
                                                <span className="font-mono">{FORMATS[key].label}</span>
                                                {isSelectedTarget && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                                                {activeSource && isValidTarget && !isSelectedTarget && (
                                                    <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
