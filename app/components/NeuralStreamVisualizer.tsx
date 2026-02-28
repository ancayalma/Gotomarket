"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function NeuralStreamVisualizer() {
    const [mounted, setMounted] = useState(false);
    const [streamData, setStreamData] = useState<number[]>([]);
    const [glitch, setGlitch] = useState(false);
    const [uid, setUid] = useState("");
    const [time, setTime] = useState(0);

    // Initial setup
    useEffect(() => {
        setMounted(true);
        setUid(Math.random().toString(36).substring(7).toUpperCase());

        // Simulate real-time data flow
        const interval = setInterval(() => {
            setStreamData(Array.from({ length: 50 }).map(() => Math.random()));
        }, 100);

        // Occasional random "glitch" pulse
        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.8) {
                setGlitch(true);
                setTimeout(() => setGlitch(false), 150);
            }
        }, 2000);

        // Continuous time for Waveform animation to avoid Date.now() in render
        let start: number;
        let frame: number;
        const step = (timestamp: number) => {
            if (!start) start = timestamp;
            setTime(timestamp - start);
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);

        return () => {
            clearInterval(interval);
            clearInterval(glitchInterval);
            cancelAnimationFrame(frame);
        };
    }, []);

    const pathConfig = useMemo(() => {
        return [
            { id: 0, opacity: 0.8, scaley: 1.2, color: "#22d3ee", width: 3, blur: "4px" },
            { id: 1, opacity: 0.4, scaley: 0.8, color: "#818cf8", width: 1.5, blur: "2px" },
            { id: 2, opacity: 0.2, scaley: 0.5, color: "#c084fc", width: 1, blur: "1px" },
        ];
    }, []);

    // Static random values for bits to avoid Math.random in render
    const bits = useMemo(() => {
        return Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            offset: i * 40,
            yOffset: (i % 2 === 0 ? 1 : -1) * (20 + (i * 7) % 30)
        }));
    }, []);

    if (!mounted) return <div className="w-full h-full bg-[#020205] rounded-[2rem] animate-pulse" />;

    return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center bg-[#020205] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-colors duration-300 ${glitch ? 'brightness-150 saturate-200' : ''}`}>
            {/* Ultra-Tech Matrix Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <motion.div
                    className="absolute left-0 right-0 h-px bg-cyan-500/20 z-0"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Neural Pulse Layers */}
            <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
                <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        {pathConfig.map(p => (
                            <filter key={`glow-${p.id}`} id={`glow-${p.id}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation={p.blur} result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        ))}
                    </defs>

                    {pathConfig.map((p) => (
                        <motion.path
                            key={p.id}
                            d={`M 0 100 ${streamData.map((d, i) => `L ${i * 8} ${100 + (d - 0.5) * 110 * p.scaley}`).join(' ')} L 400 100`}
                            fill="none"
                            stroke={p.color}
                            strokeWidth={p.width}
                            strokeLinecap="round"
                            animate={{
                                opacity: glitch ? 1 : p.opacity,
                                d: `M 0 100 ${streamData.map((d, i) => `L ${i * 8} ${100 + (d - 0.5) * 110 * p.scaley * (1 + Math.sin(time * 0.005 + i * 0.5) * 0.3)}`).join(' ')} L 400 100`,
                                x: glitch ? 5 : 0
                            }}
                            filter={`url(#glow-${p.id})`}
                            transition={{
                                d: { duration: 0.1, ease: "linear" },
                                opacity: { duration: 0.2 }
                            }}
                        />
                    ))}

                    {/* Digital Artifacts */}
                    {bits.map((bit) => (
                        <motion.circle
                            key={bit.id}
                            r="1.5"
                            fill="#22d3ee"
                            animate={{
                                cx: bit.offset + (time % 400),
                                cy: 100 + bit.yOffset,
                                opacity: [0, 1, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </svg>
            </div>

            {/* Technical HUD Display */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <motion.div
                                className="w-2 h-2 rounded-full bg-cyan-400"
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            />
                            <span className="text-[11px] font-mono text-cyan-400 font-black tracking-[0.2em] uppercase">NEURAL_LINK: ESTABLISHED</span>
                        </div>
                        <div className="flex gap-2 text-[8px] font-mono text-gray-500 uppercase">
                            <span>UID: {uid}</span>
                            <span className="text-cyan-900">|</span>
                            <span>PROT: BASALT_V4</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-end border-t border-white/5 pt-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">System Integrity</span>
                                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                                        animate={{ width: glitch ? '40%' : '99.8%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Matrix */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {['GATE_01', 'CORE_X', 'VOID_7', 'SYNC_P'].map(s => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                                    <span className="text-[7px] font-mono text-gray-500">{s}:</span>
                                    <span className="text-[7px] font-mono text-cyan-400">OK</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Corner Decorative HUD Brackets */}
            <div className="absolute top-6 left-6 w-8 h-8 opacity-40">
                <div className="absolute top-0 left-0 w-full h-px bg-cyan-500" />
                <div className="absolute top-0 left-0 w-px h-full bg-cyan-500" />
            </div>
            <div className="absolute top-6 right-6 w-8 h-8 opacity-40 rotate-90">
                <div className="absolute top-0 left-0 w-full h-px bg-cyan-500" />
                <div className="absolute top-0 left-0 w-px h-full bg-cyan-500" />
            </div>
            <div className="absolute bottom-6 left-6 w-8 h-8 opacity-40 -rotate-90">
                <div className="absolute top-0 left-0 w-full h-px bg-cyan-500" />
                <div className="absolute top-0 left-0 w-px h-full bg-cyan-500" />
            </div>
            <div className="absolute bottom-6 right-6 w-8 h-8 opacity-40 180 rotate-180">
                <div className="absolute top-0 left-0 w-full h-px bg-cyan-500" />
                <div className="absolute top-0 left-0 w-px h-full bg-cyan-500" />
            </div>
        </div>
    );
}
