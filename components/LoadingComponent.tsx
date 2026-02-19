
"use client";

import Image from "next/image";

const LoadingComponent = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[400px] overflow-hidden bg-background/40 backdrop-blur-[2px]">
      {/* 
        PREMIUM LOADING STATE 
        - Uses global CSS variables for theme-aware coloring (hsl(var(--primary)))
        - Matches 'Obsidian Gold' and other themes automatically
      */}

      {/* 1. Ambient Background Pulse - Reduced Opacity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }} />
      </div>

      {/* 2. Main Loader Assembly - Scaled Up */}
      <div className="relative flex items-center justify-center scale-125 md:scale-150">

        {/* Outer Orbital Ring (Thin, fast) */}
        <div className="absolute w-64 h-64 rounded-full border border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: '2s' }} />

        {/* Middle Dashed Ring (Reverse slow) */}
        <div className="absolute w-52 h-52 rounded-full border border-dashed border-primary/30 animate-spin-reverse-slow" />

        {/* Inner Glowing Arc (Pulse) */}
        <div className="absolute w-40 h-40 rounded-full border-2 border-transparent border-l-primary border-r-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)] animate-spin-slow" />

        {/* Center Content - Larger */}
        <div className="relative z-10 p-8 backdrop-blur-sm bg-background/20 rounded-full border border-white/5 shadow-2xl">
          <div className="relative w-48 h-16 animate-float">
            <Image
              src="/BasaltCRMWide.png"
              alt="Loading BasaltCRM"
              fill
              className="object-contain themed-logo drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
              priority
            />
          </div>
        </div>
      </div>

      {/* 3. Status Text */}
      <div className="mt-16 flex flex-col items-center gap-2">
        <h2 className="text-sm md:text-base font-light tracking-[0.5em] text-foreground/60 uppercase animate-pulse">
          Initializing
        </h2>
      </div>

      <style jsx>{`
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 8s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 3s ease-in-out infinite;
        }
        @keyframes infinite-scroll {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default LoadingComponent;
