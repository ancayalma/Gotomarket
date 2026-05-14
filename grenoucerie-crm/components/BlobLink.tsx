"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function truncate(href: string, max = 60) {
  try {
    const u = new URL(href);
    const host = u.hostname;
    const path = u.pathname + (u.search || "");
    const base = host + path;
    if (base.length <= max) return base;
    return base.slice(0, max - 3) + "...";
  } catch {
    return href.length > max ? href.slice(0, max - 3) + "..." : href;
  }
}

export default function BlobLink({ href }: { href: string }) {
  const [loading, setLoading] = useState(false);
  if (!href) return null;

  const handleOpen = async () => {
    // If it's already a local/data URL or not S3-like, just open it
    if (!href.includes(".s3.") && !href.includes("cloud.ovh.us")) {
      window.open(href, "_blank");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/blobs/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: href }),
      });

      if (!response.ok) throw new Error("Failed to sign URL");

      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Could not securely open file.");
    } finally {
      setLoading(false);
    }
  };

  const label = truncate(href, 50);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground truncate max-w-[220px]">{label}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
        Open
      </Button>
    </div>
  );
}
