"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { InvoiceCard } from "./invoice-card";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Bug } from "lucide-react";
import { useTableSettings } from "@/hooks/use-table-settings";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function InvoiceDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // Mobile detection using shared hook
  const isMobile = useIsMobile();
  const router = useRouter();

  const {
    columnVisibility,
    setColumnVisibility,
    sorting,
    setSorting,
    columnSizing,
    setColumnSizing,
    viewMode: savedViewMode,
    setViewMode,
  } = useTableSettings("crm-invoices-table-settings", isMobile);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  const viewMode = savedViewMode as ViewMode;
  const currentView = isMobile ? "card" : viewMode;

  const filteredData = React.useMemo(() => {
    if (!dateRange.from && !dateRange.to) return data;

    return data.filter((item: any) => {
      const date = item.date_created ? new Date(item.date_created) :
        item.date_due ? new Date(item.date_due) : null;

      if (!date) return true;

      if (dateRange.from && dateRange.to) {
        return date >= dateRange.from && date <= dateRange.to;
      }
      if (dateRange.from) {
        return date >= dateRange.from;
      }
      if (dateRange.to) {
        return date <= dateRange.to;
      }
      return true;
    });
  }, [data, dateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnSizing,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  // Force grid view on mobile
  React.useEffect(() => {
    if (isMobile) {
      setViewMode("card");
    }
  }, [isMobile, setViewMode]);

  // ... inside component ...

  // Refetch logic moved to SyncInvoiceCard.tsx as per user request

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 w-full">
          <DataTableToolbar table={table} onDateFilterChange={setDateRange} />
        </div>
        <div className="flex items-center ml-4 gap-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>
      {currentView === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <InvoiceCard key={row.id} row={row as unknown as Row<any>} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto bg-background/50 backdrop-blur-sm">
          <Table className="table-fixed w-full border-collapse">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={`${currentView === "compact" ? "py-1 h-8" : ""} relative min-w-0 h-10 px-2 group overflow-visible`}
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex items-center h-full w-full">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-4 cursor-col-resize select-none touch-none z-10 flex justify-center items-center group-hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? "opacity-100" : "opacity-0"}`}
                          >
                            <div className={`w-[2px] h-full ${header.column.getIsResizing() ? "bg-primary" : "bg-border group-hover:bg-primary/50"}`} />
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`${currentView === "compact" ? "py-1" : ""} truncate min-w-0`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <DataTablePagination table={table} />
    </div>
  );
}
