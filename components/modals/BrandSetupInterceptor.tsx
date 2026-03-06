"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

type Props = {
  isOpen: boolean;
  teamId: string;
};

export const BrandSetupInterceptor = ({ isOpen, teamId }: Props) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  useEffect(() => {
    setMounted(true);
    // Use local state to handle the "skip" action for this session
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  if (!mounted) {
    return null;
  }

  const handleSkip = () => {
    setShow(false);
  };

  const handleScrapeAndSetup = async () => {
    try {
      if (!websiteUrl) {
        toast.error("Please enter a website URL");
        return;
      }
      setIsLoading(true);

      const res = await fetch("/api/ai/scrape-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl, teamId }),
      });

      if (!res.ok) {
        throw new Error("Failed to scrape website");
      }

      toast.success("AI successfully generated brand identity!");
      setShow(false);
      
      // Let's take them to the admin brand identity page to review the output
      router.push("/admin/brand");
    } catch (error) {
      toast.error("Something went wrong scraping the website.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-xl outline-none" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Initialize AI Memory</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Welcome to the future of outreach. Before our AI can begin synthesizing on your behalf, we need to map your Brand Identity. This information acts as the cognitive core for all autonomous campaigns and agentic workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Fast Track: AI Extraction</h4>
            <p className="text-xs text-muted-foreground">
              Enter your main website URL. Our synthesis engine will ingest the content and automatically structure your Core Values, Mission, and Target Audience.
            </p>
            <div className="flex w-full mt-2 gap-2">
              <Input
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full mt-2 pt-4 border-t border-border">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={handleSkip} disabled={isLoading}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/brand")} disabled={isLoading}>
              Enter Manually
            </Button>
            <Button 
                onClick={handleScrapeAndSetup} 
                disabled={isLoading || !websiteUrl}
                className="bg-primary text-primary-foreground"
            >
              {isLoading ? "Synthesizing..." : "Scrape & Setup"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
