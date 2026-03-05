"use client";

import React, { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../accounts/table-components/columns";
import { NewAccountForm } from "../accounts/components/NewAccountForm";
import { AccountDataTable } from "../accounts/table-components/data-table";
import { useRouter } from "next/navigation";


const AccountsView = ({ data, crmData }: any) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const users = crmData?.users || [];
  const industries = crmData?.industries || [];

  return (
    <div className="space-y-4">


      <AccountDataTable
        data={data || []}
        columns={columns}
        industries={industries}
        users={users}
      />
    </div>
  );
};

export default AccountsView;
