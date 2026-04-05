"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { logUserMetric } from "@/actions/university/log-user-metric";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function BookmarkButton() {
    const pathname = usePathname();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const { toast } = useToast();

    const handleBookmark = async () => {
        setIsBookmarked(!isBookmarked);
        
        if (!isBookmarked) {
            try {
                await logUserMetric("saved_bookmark");
                toast({
                    title: "Page Bookmarked",
                    description: "You can quickly access this from your pinned items.",
                });
            } catch (error) {
                console.error("Failed to log bookmark metric", error);
            }
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full" 
            onClick={handleBookmark}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark this page"}
        >
            <Bookmark className={cn("w-4 h-4", isBookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
        </Button>
    );
}
