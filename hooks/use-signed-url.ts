import { useState, useEffect } from "react";

/**
 * Hook to convert a private S3/OVH URL into a temporary signed URL.
 * SOC2 Compliance: Ensures direct S3 links are never exposed or called without signing.
 */
export function useSignedUrl(url: string | null | undefined) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!url) {
            setSignedUrl(null);
            return;
        }

        // Skip if not an S3/OVH URL or already signed/local
        if (!url.includes(".s3.") && !url.includes("cloud.ovh.us")) {
            setSignedUrl(url);
            return;
        }

        const fetchSignedUrl = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/blobs/signed-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSignedUrl(data.url);
                } else {
                    console.error("Failed to sign URL:", url);
                    setSignedUrl(null);
                }
            } catch (err) {
                console.error("Error signing URL:", err);
                setSignedUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrl();
    }, [url]);

    return { signedUrl, loading };
}
