"use client";

import { columns } from "@/app/(routes)/documents/components/columns";
import { DocumentsDataTable } from "@/app/(routes)/documents/components/data-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

interface DocumentsViewProps {
  data: any;
}

const DocumentsView = ({ data }: DocumentsViewProps) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div>
            <CardTitle
              onClick={() => router.push("/documents")}
              className="cursor-pointer text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2"
            >
              Documents
            </CardTitle>
            <CardDescription></CardDescription>
          </div>
          <div className="flex space-x-2">
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          "No assigned documents found"
        ) : (
          <DocumentsDataTable
            data={data}
            columns={columns}
          />
        )}
      </CardContent>
    </Card >
  );
};

export default DocumentsView;
