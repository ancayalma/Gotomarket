import React from 'react';

interface AIWatermarkProps {
    children: React.ReactNode;
    showWatermark?: boolean;
    styleType?: 'subtle' | 'manifest';
}

/**
 * Manifest Disclosure Toggle component.
 * Wraps generated content (images, visualizations) to apply an extraordinarily difficult-to-remove watermark
 * and forensic overlay per CA SB 942 Output Provenance requirements.
 */
export default function AIWatermark({ children, showWatermark = true, styleType = 'manifest' }: AIWatermarkProps) {
    if (!showWatermark) return <>{children}</>;

    return (
        <div className="relative inline-block w-full h-full" style={{ userSelect: 'none' }}>
            {children}
            
            {/* The Manifest Label - Positioned bottom right */}
            <div className={`
                absolute bottom-2 right-2 px-2 py-1 rounded shadow-lg backdrop-blur-md pointer-events-none z-50
                flex items-center gap-1.5 transition-opacity
                ${styleType === 'manifest' 
                    ? 'bg-black/80 text-white/95 font-bold border border-white/20 shadow-black' 
                    : 'bg-black/30 text-white/60 text-xs'
                }
            `}>
                <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[10px] tracking-wider uppercase font-mono">
                    AI Generated
                </span>
            </div>

            {/* Invisible forensic overlay - Extremely hard to remove without completely corrupting the image */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-40"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                }}
                aria-hidden="true"
            />
        </div>
    );
}
