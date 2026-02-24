"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../contracts/table-components/columns";

import { useRouter, useSearchParams } from "next/navigation";
import { ContractsDataTable } from "../contracts/table-components/data-table";

import CreateContractForm from "../contracts/_forms/create-contract";
import { NavigationCard } from "@/components/NavigationCard";
import { FileText, Globe, LayoutGrid, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealRoomsGrid } from "../contracts/components/DealRoomsGrid";

const ContractsView = ({ data, crmData, accountId }: any) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const isRoomView = view === "deal_rooms" || view === "rooms";

  const { users, accounts } = crmData;

  const card = {
    title: "Create Contract",
    description: "Create a new contract",
    icon: FileText,
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400"
  };

  const dealRoomCard = {
    title: "Deal Rooms",
    description: "Manage digital sales rooms",
    icon: Globe,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400"
  };

  const allContractsCard = {
    title: "All Contracts",
    description: "View all your contracts",
    icon: LayoutGrid,
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400"
  };

  const filteredData = isRoomView
    ? data.filter((c: any) => c.deal_room && c.deal_room.is_active)
    : data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic uppercase leading-tight py-4">
            {isRoomView ? "Digital Sales Rooms" : "Contract Management"}
          </h2>
          <p className="text-muted-foreground/80 mt-1 text-base font-medium tracking-wide">
            {isRoomView
              ? "Monitor engagement and activities across your secure deal rooms."
              : "Generate, sign, and manage legal agreements with ease."
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRoomView ? (
            <Button
              variant="outline"
              className="gap-2 border-primary/20 bg-background/50 hover:bg-primary/5"
              onClick={() => router.push('/crm/contracts')}
            >
              <LayoutGrid className="w-4 h-4" />
              View All Contracts
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <CreateContractForm
                users={users}
                accounts={accounts}
                accountId={accountId}
                customTrigger={
                  <Button className="gap-2 bg-primary shadow-lg shadow-primary/20">
                    <PlusCircle className="w-4 h-4" />
                    New Contract
                  </Button>
                }
              />
              <Button
                variant="outline"
                className="gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                onClick={() => router.push('/crm/contracts?view=deal_rooms')}
              >
                <Globe className="w-4 h-4" />
                Deal Rooms
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-primary/5" />

      {isRoomView ? (
        <DealRoomsGrid data={filteredData} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <CreateContractForm
              users={users}
              accounts={accounts}
              accountId={accountId}
              customTrigger={<NavigationCard card={card} />}
            />
            <NavigationCard
              card={dealRoomCard}
              onClick={() => router.push('/crm/contracts?view=deal_rooms')}
            />
          </div>

          <ContractsDataTable
            data={filteredData || []}
            columns={columns}
          />
        </div>
      )}
    </div>
  );
};

export default ContractsView;
