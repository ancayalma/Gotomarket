import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

const SupportComponent = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <HelpCircle className="cursor-pointer w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex flex-col gap-1.5 mt-3 w-auto p-2"
        align={"end"}
      >
        <Button asChild variant="ghost" className="h-9 justify-start gap-2.5 px-3">
          <Link
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/G9Sp8CAQmV"}
            target="_blank"
          >
            <DiscordLogoIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm">Need help? Join us on Discord</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-9 justify-start gap-2.5 px-3">
          <Link
            href={process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL || "https://github.com/BasaltHQ/crm-official/issues"}
            target="_blank"
          >
            <GitHubLogoIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm">Find a bug? Report on GitHub</span>
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default SupportComponent;
