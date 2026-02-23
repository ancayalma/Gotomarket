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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              {isClosedView ? "Total Closed Value" : "Total Pipeline Value"}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">
              ${totalValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              {isClosedView ? "Closed Opportunities" : "Active Opportunities"}
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-500">
              {countDeals}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Avg. Deal Size
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-500">
              ${Math.round(avgDealSize).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {!isClosedView && <LeadOpportunitiesPanel />}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <div>
              <CardTitle
                onClick={() => router.push("/crm/opportunities")}
                className="cursor-pointer"
              >
                {isClosedView ? "Won / Lost Deals" : "Sales Pipeline"}
              </CardTitle>
              <CardDescription>
                {isClosedView ? "Review past deals that have been closed or lost" : "Manage and track your active sales deals"}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Sheet open={open} onOpenChange={() => setOpen(false)}>
                <Button
                  className="my-2 cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                  onClick={() => setOpen(true)}
                >
                  + New Opportunity
                </Button>
                <SheetContent className="min-w-[1000px] space-y-2 border-l border-white/10 glass">
                  <SheetHeader>
                    <SheetTitle>Create new opportunity</SheetTitle>
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
        <CardContent>
          {!displayData || displayData.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-muted/5 rounded-xl border border-white/5 mx-2 my-2">
              {isClosedView ? "No closed deals found" : "No active pipeline found"}
            </div>
          ) : (
            <OpportunitiesDataTable data={displayData} columns={columns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunitiesView;
