"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * PREMIUM LOADING STATE - FULL SCREEN
 * - Consumes the entire page via Portal to avoid layout constraints
 * - Uses global CSS variables for theme-aware coloring
 * - Centered logo and animated status
 */
const LoadingComponent = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-background/98 backdrop-blur-2xl">
      {/* 1. Ambient Background Glows */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[100vw] h-[100vw] md:w-[800px] md:h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] md:w-[500px] md:h-[500px] bg-primary/5 rounded-full blur-[80px] animate-pulse-slow" />
      </div>

      {/* 2. Main Loader Assembly */}
      <div className="relative flex items-center justify-center scale-110 md:scale-150">

        {/* Outer Orbital Ring */}
        <div className="absolute w-72 h-72 rounded-full border border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: '2.5s' }} />

        {/* Middle Decorative Ring */}
        <div className="absolute w-60 h-60 rounded-full border border-dashed border-primary/30 animate-spin-reverse-slow" />

        {/* Inner Glowing Arc */}
        <div className="absolute w-48 h-48 rounded-full border-2 border-transparent border-l-primary border-r-primary shadow-[0_0_30px_hsl(var(--primary)/0.3)] animate-spin-slow" />

        {/* Center Logo Container */}
        <div className="relative z-10 p-10 bg-background/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="relative w-56 h-20 animate-float">
            <Image
              src="/BasaltCRMWide.png"
              alt="BasaltCRM"
              fill
              sizes="(max-width: 768px) 224px, 224px"
              className="object-contain themed-logo drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]"
              priority
            />
          </div>
        </div>
      </div>

      {/* 3. Status Text */}
      <div className="mt-24 flex flex-col items-center gap-4">
        <div className="h-1 w-48 bg-primary/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-primary/40 animate-loading-bar" />
        </div>
        <h2 className="text-base md:text-lg font-light tracking-[0.8em] text-foreground/80 uppercase animate-pulse">
          INITIALIZING
        </h2>
        <p className="text-[10px] text-muted-foreground/50 tracking-[0.2em] uppercase">
          Secure Connection Established
        </p>
      </div>

      <style jsx>{`
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 12s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
            animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-float {
            animation: float 5s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-loading-bar {
            animation: loading-bar 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default LoadingComponent;
