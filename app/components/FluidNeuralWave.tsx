"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FluidNeuralWaveProps {
    className?: string;
    opacity?: number;
    variant?: "default" | "aggressive" | "complex" | "minimal";
    seed?: number;
}

export default function FluidNeuralWave({
    className = "",
    opacity = 0.5,
    variant = "default",
    seed = 1
}: FluidNeuralWaveProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Simple deterministic random based on seed
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    // Colors for the neural grid
    const colorPalettes = {
        default: ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6"],
        aggressive: ["#ef4444", "#8b5cf6", "#06b6d4", "#f472b6", "#fbbf24"],
        complex: ["#22d3ee", "#818cf8", "#c084fc", "#2dd4bf", "#34d399"],
        minimal: ["#94a3b8", "#64748b", "#cbd5e1", "#475569", "#1e293b"]
    };

    const colors = colorPalettes[variant];

    // Generate a denser set of paths for a more "complex" neural web
    const paths = useMemo(() => {
        const count = variant === "complex" ? 20 : 15;
        return Array.from({ length: count }).map((_, i) => ({
            d: `M-100,${300 + i * 25} Q${200 + i * 50 * seed},${100 + (i % 3) * 150} ${500},${500} T1100,${300 + i * 25}`,
            duration: (variant === "aggressive" ? 6 : 10) + random(seed + i) * 15,
            delay: i * 0.5,
            stroke: colors[i % colors.length],
            width: (variant === "complex" ? 0.5 : 1) + random(seed + i + 100) * 3,
            opacity: 0.2 + random(seed + i + 200) * 0.5
        }));
    }, [colors, seed, variant]);

    // Generate more synaptic pulses
    const pulses = useMemo(() => {
        const count = variant === "aggressive" ? 20 : 12;
        return Array.from({ length: count }).map((_, i) => ({
            pathIndex: i % paths.length,
            duration: (variant === "aggressive" ? 3 : 5) + random(seed + i + 500) * 10,
            delay: i * 1.5,
            size: 2 + random(seed + i + 600) * 4
        }));
    }, [paths, variant, seed]);

    if (!mounted) return <div className={`w-full h-full bg-[#03060b] ${className}`} />;

    return (
        <div className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}>
            <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full"
            >
                <defs>
                    <filter id={`neural-glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={variant === "aggressive" ? "12" : "10"} result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>

                    {colors.map((color, i) => (
                        <linearGradient key={`grad-${i}`} id={`grad-${variant}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color} stopOpacity="0" />
                            <stop offset="30%" stopColor={color} stopOpacity="0.8" />
                            <stop offset="70%" stopColor={color} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    ))}
                </defs>

                <g filter={`url(#neural-glow-${variant})`} opacity={opacity}>
                    {paths.map((path, i) => (
                        <motion.path
                            key={`path-${i}`}
                            d={path.d}
                            stroke={`url(#grad-${variant}-${i % colors.length})`}
                            strokeWidth={path.width}
                            strokeOpacity={path.opacity}
                            fill="transparent"
                            strokeLinecap="round"
                            animate={{
                                d: [
                                    path.d,
                                    path.d.replace(/(\d+),(\d+)/g, (match, x, y) => {
                                        const nx = parseInt(x) + (random(seed + i + 1000) * 150 - 75);
                                        const ny = parseInt(y) + (random(seed + i + 2000) * 200 - 100);
                                        return `${nx},${ny}`;
                                    }),
                                    path.d
                                ]
                            }}
                            transition={{
                                duration: path.duration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: path.delay
                            }}
                        />
                    ))}

                    {pulses.map((pulse, i) => (
                        <motion.circle
                            key={`synapse-${i}`}
                            r={pulse.size}
                            fill="white"
                            filter="blur(1px)"
                            initial={{ offsetDistance: "0%" }}
                            animate={{
                                offsetDistance: ["0%", "100%"],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: pulse.duration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: pulse.delay
                            }}
                            style={{
                                offsetPath: `path("${paths[pulse.pathIndex].d}")`,
                            }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
