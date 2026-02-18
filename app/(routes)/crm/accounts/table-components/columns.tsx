"use client";

import { ColumnDef } from "@tanstack/react-table";

import { statuses } from "../table-data/data";
import { Account } from "../table-data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import moment from "moment";
import Link from "next/link";

export const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <div className="">
        {moment(row.getValue("createdAt")).format("YY/MM/DD-HH:mm")}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 140,
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),

    cell: ({ row }) => (
      <div className="truncate">
        {
          //@ts-ignore
          //TODO: fix this
          row.getValue("assigned_to_user")?.name ?? "Unassigned"
        }
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 150,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/accounts/${row.original?.id}`}>
        <div className="truncate font-medium">
          {
            //@ts-ignore
            //TODO: fix this
            row.getValue("name")
          }
        </div>
      </Link>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 250,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),

    cell: ({ row }) => <div className="truncate">{row.getValue("email")}</div>,
    enableSorting: true,
    enableHiding: true,
    size: 200,
  },
  {
    accessorKey: "contacts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Account contact" />
    ),

    cell: ({ row }) => (
      <div className="truncate">
        {row.original.contacts && row.original.contacts.length > 0 ? (
          <div className="flex flex-col truncate">
            <span className="font-medium text-xs text-muted-foreground truncate">{row.original.contacts.length} Contacts</span>
            <span className="truncate text-xs">
              {row.original.contacts[0].first_name} {row.original.contacts[0].last_name}
              {row.original.contacts.length > 1 && ` +${row.original.contacts.length - 1}`}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic truncate">No contacts</span>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
    size: 180,
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
        <div className="flex items-center truncate">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{status.label}</span>
        </div>
      );
    },
    size: 120,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    size: 120,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
