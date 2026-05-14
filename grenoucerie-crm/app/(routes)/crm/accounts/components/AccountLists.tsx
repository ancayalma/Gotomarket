"use client";

import ListsView from "../../../lists/components/ListsView";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

export default function AccountLists() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 lg:p-8 pb-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Lists"
            description="AI-assisted lead lists with detailed previews"
          />
        </div>
        <Separator className="mt-4 bg-white/5" />
      </div>

      <div className="px-4 md:px-6 lg:px-8 py-6">
        <ListsView />
      </div>
    </div>
  );
}
