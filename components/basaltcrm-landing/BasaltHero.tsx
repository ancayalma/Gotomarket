import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Cpu, Bot, Zap } from "lucide-react";
import FluidNeuralWave from "@/app/components/FluidNeuralWave";

export default function BasaltHero() {
    return (
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden md:pt-0">
            {/* The Neural Background */}
            <div className="absolute inset-0 z-0">
                <FluidNeuralWave className="opacity-40" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl">
                {/* Status Indicator */}
                <div className="inline-flex items-center gap-3 mb-12 px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-md opacity-0 animate-fadeInUp">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-[9px] md:text-[10px] font-mono tracking-[0.4em] text-cyan-400 uppercase">
                        SYSTEM OPERATIONAL // CORE ONLINE
                    </span>
                </div>

                {/* Main Heading - Billboard Style */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter mb-10 leading-[0.85] opacity-0 animate-fadeInUp stagger-1 uppercase tracking-tight">
                    <span className="block text-white">TOTAL</span>
                    <span className="block bg-gradient-to-r from-cyan-400 via-white to-violet-500 bg-clip-text text-transparent">
                        AGENCY
                    </span>
                </h1>

                {/* Mission Statement */}
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed opacity-0 animate-fadeInUp stagger-2 font-light">
                    Move beyond management. Deploy performance. <br className="hidden md:block" />
                    <span className="text-white font-medium">BasaltCRM</span> is the first end-to-end autonomous <span className="text-white">AI-ASSISTED STACK</span>.
                    From infrastructure provisioning to AI closing, we build the loop that never sleeps.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 opacity-0 animate-fadeInUp stagger-3">
                    <Link
                        href="https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0"
                        target="_blank"
                        className="group relative h-16 px-10 flex items-center justify-center text-base font-bold tracking-wider rounded-2xl bg-white text-black hover:bg-cyan-400 transition-all duration-500 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            DEPLOY CORE
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        href="/features"
                        className="h-16 px-10 flex items-center justify-center text-base font-bold tracking-wider rounded-2xl border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-xl"
                    >
                        SYSTEM SPECS
                    </Link>
                </div>

                {/* Infrastructure Tags */}
                <div className="mt-12 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 opacity-0 animate-fadeInUp stagger-4 px-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-mono text-gray-500 whitespace-nowrap">
                        <Cpu className="h-3 w-3" /> GRID SCALE PROVISION
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-mono text-gray-500 whitespace-nowrap">
                        <Bot className="h-3 w-3" /> SYNAPTIC SDR CORES
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-mono text-gray-500 whitespace-nowrap">
                        <Zap className="h-3 w-3" /> 0.12s SYNAPTIC LATENCY
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fadeInUp stagger-5">
                <Link href="#features" className="flex flex-col items-center gap-2 text-gray-500 hover:text-cyan-500 transition-colors">
                    <span className="text-[9px] md:text-[10px] font-mono tracking-widest uppercase">Initializing Core</span>
                    <div className="w-px h-8 md:h-12 bg-gradient-to-b from-cyan-500 to-transparent animate-pulse" />
                </Link>
            </div>
        </section>
    );
}
