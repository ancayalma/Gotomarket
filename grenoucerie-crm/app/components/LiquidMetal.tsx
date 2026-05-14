"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LiquidMetalProps {
    className?: string;
    opacity?: number;
    seed?: number;
}

export default function LiquidMetal({
    className = "",
    opacity = 0.8,
    seed = 123
}: LiquidMetalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Deterministic random
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // Generate organic, liquid-like paths with deterministic values
    const paths = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => {
            const s = seed + i;
            const originalD = `M-200,${200 + i * 150} C${200 + i * 100},${100 - i * 50} ${600 - i * 100},${900 + i * i * 10} 1200,${500 + i * 50}`;

            // Pre-calculate target D to avoid Math.random in render
            const targetD = originalD.replace(/(\d+),(\d+)/g, (match, x, y) => {
                const nx = parseInt(x) + (random(s + 1000) * 200 - 100);
                const ny = parseInt(y) + (random(s + 2000) * 300 - 150);
                return `${nx},${ny}`;
            });

            return {
                id: i,
                d: originalD,
                targetD: targetD,
                duration: 15 + i * 5,
                delay: -i * 3
            };
        });
    }, [seed]);

    if (!mounted) return <div className={`w-full h-full bg-[#050507] ${className}`} />;

    return (
        <div className={`relative w-full h-full overflow-hidden bg-[#050507] ${className}`}>
            <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full"
            >
                <defs>
                    {/* Liquid Metal Gradient */}
                    <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a1a1f" />
                        <stop offset="45%" stopColor="#2d2d35" />
                        <stop offset="50%" stopColor="#4a4a55" /> {/* Highlight */}
                        <stop offset="55%" stopColor="#2d2d35" />
                        <stop offset="100%" stopColor="#1a1a1f" />
                    </linearGradient>

                    {/* Neon Blue Flash */}
                    <radialGradient id="neon-flash" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                    </radialGradient>

                    <filter id="metal-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
                    </filter>
                </defs>

                <g filter="url(#metal-blur)" opacity={opacity}>
                    {paths.map((path, i) => (
                        <motion.path
                            key={path.id}
                            d={path.d}
                            fill="none"
                            stroke="url(#liquid-gradient)"
                            strokeWidth={200 + i * 50}
                            strokeLinecap="round"
                            animate={{
                                d: [path.d, path.targetD, path.d]
                            }}
                            transition={{
                                duration: path.duration,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </g>

                {/* Periodic Neon Flashes */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <motion.circle
                        key={i}
                        r="300"
                        fill="url(#neon-flash)"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: [0, 0.3, 0],
                            scale: [0.5, 1.5, 0.8],
                            cx: [200 + i * 300, 500 + i * 100, 300 + i * 200],
                            cy: [300 + i * 200, 600 - i * 100, 400 + i * 150]
                        }}
                        transition={{
                            duration: 8 + i * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 4
                        }}
                    />
                ))}
            </svg>

            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>
    );
}
