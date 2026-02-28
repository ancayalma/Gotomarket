"use client";

import React from "react";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallback?: React.ReactNode;
}

/**
 * SafeImage Component for SOC2 Compliance.
 * Automatically wraps S3/OVH private URLs with a temporary signed URL.
 */
export function SafeImage({ src, fallback, className, alt, ...props }: SafeImageProps) {
    const { signedUrl, loading } = useSignedUrl(src);

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center bg-muted animate-pulse rounded", className)}>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!signedUrl && fallback) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={signedUrl || src}
            alt={alt || "Image"}
            className={cn("object-cover", className)}
            {...props}
        />
    );
}
