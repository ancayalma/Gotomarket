"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { columns } from "../opportunities/table-components/columns";
import { NewOpportunityForm } from "../opportunities/components/NewOpportunityForm";
import { OpportunitiesDataTable } from "../opportunities/table-components/data-table";
import LeadOpportunitiesPanel from "../dashboard/_components/ProjectOpportunitiesPanel";

import { KanbanBoard } from "./KanbanBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";

const OpportunitiesView = ({
  data,
  crmData,
  accountId,
}: {
  data: any;
  crmData: any;
  accountId?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return "kanban";
    return "table";
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const { users, accounts, contacts, leads, saleTypes, saleStages, campaigns } =
    crmData;

  const isClosedView = searchParams.get("view") === "closed";

  const displayData = data?.filter((o: any) => {
    const s = o.status?.toUpperCase() || "";
    if (isClosedView) {
      return ["CLOSED", "INACTIVE"].includes(s);
    }
    return !["CLOSED", "INACTIVE"].includes(s);
  }) || [];

  // Calculate some basic metrics based on the current view
  const totalValue = displayData.reduce((acc: number, curr: any) => acc + (Number(curr.expected_revenue) || 0), 0);
  const countDeals = displayData.length;
  const avgDealSize = countDeals > 0 ? totalValue / countDeals : 0;

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {!isClosedView ? (
        <LeadOpportunitiesPanel metrics={{ totalValue, countDeals, avgDealSize, isClosedView }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                {isClosedView ? "Total Closed Value" : "Total Pipeline Value"}
              </CardDescription>
              <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                ${totalValue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                {isClosedView ? "Closed Opportunities" : "Active Opportunities"}
              </CardDescription>
              <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                {countDeals}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Avg. Deal Size
              </CardDescription>
              <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                ${Math.round(avgDealSize).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <CardTitle
                  onClick={() => router.push("/crm/opportunities")}
                  className="cursor-pointer text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2"
                >
                  {isClosedView ? "Won / Lost Deals" : "Sales Pipeline"}
                </CardTitle>
                <CardDescription className="px-2">
                  {isClosedView ? "Review past deals that have been closed or lost" : "Manage and track your active sales deals"}
                </CardDescription>
              </div>

              {!isClosedView && (
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto sm:w-[200px]">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/50">
                    <TabsTrigger value="table" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <List className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Table</span>
                    </TabsTrigger>
                    <TabsTrigger value="kanban" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      <LayoutGrid className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Kanban</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
            <div className="flex space-x-2">
              <Sheet open={open} onOpenChange={() => setOpen(false)}>
                <Button
                  className="my-2 cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow text-xs sm:text-sm"
                  onClick={() => setOpen(true)}
                >
                  <span className="hidden sm:inline">+ New Opportunity</span>
                  <span className="sm:hidden">+ New</span>
                </Button>
                <SheetContent className="min-w-[100vw] sm:min-w-[1000px] space-y-2 border-l border-white/10 glass">
                  <SheetHeader>
                    <SheetTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Create new opportunity</SheetTitle>
                  </SheetHeader>
                  <div className="h-full overflow-y-auto pt-4 custom-scrollbar pr-2">
                    <NewOpportunityForm
                      users={users}
                      accounts={accounts}
                      leads={leads}
                      contacts={contacts}
                      salesType={saleTypes}
                      saleStages={saleStages}
                      accountId={accountId}
                      onDialogClose={() => {
                        setOpen(false);
                        setDialogOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <Separator className="bg-white/5" />
        </CardHeader>
        <CardContent className="overflow-hidden p-2 sm:p-6">
          {!displayData || displayData.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-muted/5 rounded-xl border border-white/5 mx-2 my-2">
              {isClosedView ? "No closed deals found" : "No active pipeline found"}
            </div>
          ) : (
            <>
              {viewMode === "table" ? (
                <OpportunitiesDataTable data={displayData} columns={columns} />
              ) : (
                <div className="overflow-x-auto min-w-0 -mx-1 px-1 custom-scrollbar">
                  <KanbanBoard opportunities={displayData} stages={saleStages} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunitiesView;
