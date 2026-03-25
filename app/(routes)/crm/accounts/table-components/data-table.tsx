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
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { AccountCard } from "./account-card";
import { Account } from "../table-data/schema";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { AccountDetailsModal } from "./account-details-modal";

import { ViewToggle, ViewMode } from "@/components/ViewToggle";
import { useTableSettings } from "@/hooks/use-table-settings";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  industries: any[];
  users: any[];
}

export function AccountDataTable<TData, TValue>({
  columns,
  data,
  industries,
  users,
}: DataTableProps<TData, TValue>) {
  // Mobile detection using shared hook
  const isMobile = useIsMobile();

  const {
    columnVisibility,
    setColumnVisibility,
    sorting,
    setSorting,
    columnSizing,
    setColumnSizing,
    viewMode: savedViewMode,
    setViewMode,
  } = useTableSettings("crm-accounts-table-settings", isMobile);

  const viewMode = savedViewMode as ViewMode;

  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [hide, setHide] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });



  const filteredData = React.useMemo(() => {
    if (!dateRange.from && !dateRange.to) return data;

    return data.filter((account: any) => {
      const date = account.createdAt ? new Date(account.createdAt) : null;
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
    getFacetedRowModel: getFacetedRowModel(),
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

  const currentView = isMobile ? "card" : viewMode;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-3">
        <div className="flex-1 w-full">
          <DataTableToolbar table={table} onDateFilterChange={setDateRange} />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Layout Toggles (Desktop Only) */}
          {!isMobile && (
            <ViewToggle value={viewMode} onChange={setViewMode} />
          )}

          {hide ? (
            <PanelTopOpen
              onClick={() => setHide(!hide)}
              className="text-muted-foreground cursor-pointer"
            />
          ) : (
            <PanelTopClose
              onClick={() => setHide(!hide)}
              className="text-muted-foreground cursor-pointer"
            />
          )}
        </div>
      </div>

      {hide ? (
        <div className="flex gap-2 text-muted-foreground text-sm italic">
          Content hidden. Click the icon to expand.
        </div>
      ) : (
        <>
          {currentView === "card" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <AccountCard key={row.id} row={row as unknown as Row<Account>} onClick={(acc) => setSelectedAccount(acc)} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No results found.
                  </div>
                )}
              </div>
              <DataTablePagination table={table} />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto bg-background/50 backdrop-blur-sm">
                <Table className="table-fixed w-full border-collapse">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead
                              key={header.id}
                              className={`${currentView === "compact" ? "h-8 py-1" : ""} relative min-w-0 h-10 px-2 group overflow-visible`}
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
                          onClick={() => setSelectedAccount(row.original as unknown as Account)}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
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
              <DataTablePagination table={table} />
            </>
          )}
        </>
      )}

      <AccountDetailsModal 
        account={selectedAccount} 
        onClose={() => setSelectedAccount(null)} 
      />
    </div>
  );
}
