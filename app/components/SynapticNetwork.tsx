"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SynapticNetworkProps {
    className?: string;
    opacity?: number;
    nodeCount?: number;
    seed?: number;
}

export default function SynapticNetwork({
    className = "",
    opacity = 0.4,
    nodeCount = 40,
    seed = 42
}: SynapticNetworkProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Deterministic random
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // Generate nodes with deterministic random values
    const nodes = useMemo(() => {
        return Array.from({ length: nodeCount }).map((_, i) => {
            const s = seed + i;
            return {
                id: i,
                x: random(s) * 1000,
                y: random(s + 100) * 1000,
                z: random(s + 200) * 1000,
                size: 1 + random(s + 300) * 3,
                duration: 15 + random(s + 400) * 20,
                delay: -random(s + 500) * 20,
                noiseX: random(s + 600),
                noiseY: random(s + 700)
            };
        });
    }, [nodeCount, seed]);

    // Generate connections between nearby nodes
    const connections = useMemo(() => {
        const lines: { sX: number; sY: number; eX: number; eY: number; id: string; duration: number }[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(nodes[i].x - nodes[j].x, 2) +
                    Math.pow(nodes[i].y - nodes[j].y, 2)
                );
                if (dist < 150) {
                    lines.push({
                        sX: nodes[i].x,
                        sY: nodes[i].y,
                        eX: nodes[j].x,
                        eY: nodes[j].y,
                        id: `${i}-${j}`,
                        duration: 10 + random(seed + i + j) * 10
                    });
                }
            }
        }
        return lines;
    }, [nodes, seed]);

    if (!mounted) return <div className={`w-full h-full bg-[#0A0A0F] ${className}`} />;

    return (
        <div className={`relative w-full h-full overflow-hidden bg-[#0A0A0F] ${className}`}>
            <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full"
            >
                <defs>
                    <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -2" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                </defs>

                <g opacity={opacity}>
                    {/* Connections */}
                    {connections.map((line) => (
                        <motion.line
                            key={line.id}
                            x1={line.sX}
                            y1={line.sY}
                            x2={line.eX}
                            y2={line.eY}
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.1"
                            animate={{
                                strokeOpacity: [0.05, 0.15, 0.05],
                                x1: [line.sX, line.sX + 10, line.sX],
                                y1: [line.sY, line.sY - 5, line.sY]
                            }}
                            transition={{
                                duration: line.duration,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <motion.g
                            key={node.id}
                            filter="url(#node-glow)"
                        >
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={node.size}
                                fill="white"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0.2, 0.8, 0.2],
                                    scale: [1, 1.5, 1],
                                    cx: [node.x, node.x + (node.noiseX * 40 - 20), node.x],
                                    cy: [node.y, node.y + (node.noiseY * 40 - 20), node.y]
                                }}
                                transition={{
                                    duration: node.duration,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: node.delay
                                }}
                            />
                        </motion.g>
                    ))}
                </g>
            </svg>

            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    scale: [1, 1.1, 1],
                    x: [-20, 20, -20],
                    y: [-10, 10, -10]
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </div>
    );
}
