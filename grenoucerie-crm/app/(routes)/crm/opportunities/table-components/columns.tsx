"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { statuses } from "../table-data/data";
import { Opportunity } from "../table-data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import moment from "moment";
import Link from "next/link";

export const columns: ColumnDef<Opportunity>[] = [
  /* {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ), 
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  */
  {
    accessorKey: "close_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expected close" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {moment(row.getValue("close_date")).format("YY-MM-DD")}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),

    cell: ({ row }) => (
      <div className="w-[150px]">
        {
          //@ts-ignore
          //TODO: fix this
          row.getValue("assigned_to_user")?.name ?? "Unassigned"
        }
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "assigned_account",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned account" />
    ),

    cell: ({ row }) => (
      <div className="w-[250px]">
        {
          //@ts-ignore
          //TODO: fix this
          row.getValue("assigned_account")?.name ?? "Unassigned"
        }
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "assigned_lead",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned lead" />
    ),
    cell: ({ row }) => (
      <div className="w-[200px]">
        {(() => {
          //@ts-ignore
          const lead = row.getValue("assigned_lead");
          if (!lead) return <span className="text-muted-foreground/50 text-xs italic font-medium">Unassigned</span>;
          //@ts-ignore
          const name = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown Lead";
          return (
            <div className="flex items-center space-x-2 w-max px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-bold">
                {name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold">{name}</span>
            </div>
          )
        })()}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },

  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/opportunities/${row.original.id}`}>
        <div className="w-[250px] overflow-hidden">{row.getValue("name")}</div>
      </Link>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "expected_revenue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Revenue" />
    ),

    cell: ({ row }) => {
      return (
        <div>
          {typeof row.original.expected_revenue === "number"
            ? row.original.expected_revenue.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })
            : "N/A"}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "next_step",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next step" />
    ),

    cell: ({ row }) => (
      <div className="w-[150px]">{row.getValue("next_step")}</div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
