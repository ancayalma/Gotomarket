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
} from "@tanstack/react-table";
import { useTableSettings } from "@/hooks/use-table-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";

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
import TaskCard from "./TaskCard";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { Badge } from "@/components/ui/badge";
import { statuses, priorities } from "../data/data";
import moment from "moment";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function TasksDataTable<TData, TValue>({
  columns,
  data,
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
  } = useTableSettings("crm-tasks-list-table-settings", isMobile);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [hide, setHide] = React.useState(false);

  const viewMode = savedViewMode as ViewMode;

  const table = useReactTable({
    data,
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

  return (
    <div className="space-y-4 w-full overflow-hidden">

      {hide ? (
        <div className="flex gap-2 text-sm text-muted-foreground">
          This content is hidden now. Click on <PanelTopOpen className="inline h-4 w-4" /> to show content
        </div>
      ) : (
        <>
          <DataTableToolbar
            table={table}
            viewMode={viewMode}
            setViewMode={setViewMode}
            hide={hide}
            setHide={setHide}
          />

          {/* Table View */}
          {viewMode === "table" && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto bg-background/50 backdrop-blur-sm">
                <Table className="table-fixed w-full border-collapse">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead
                              key={header.id}
                              className="relative min-w-0 h-10 px-2 group overflow-visible"
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
                              className="py-2 truncate min-w-0"
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

              {/* Mobile Card View for Table Mode */}
              <div className="md:hidden space-y-3">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TaskCard key={row.id} task={row.original as any} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No results.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Compact Grid View */}
          {viewMode === "compact" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const task = row.original as any;
                  const status = statuses.find((s) => s.value === task.taskStatus);
                  const priority = priorities.find((p) => p.value === task.priority);
                  return (
                    <div
                      key={row.id}
                      className="group border rounded-lg bg-card p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="font-medium text-sm truncate">{task.title || "Untitled"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {task.assigned_user?.name || "Unassigned"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.dueDateAt ? moment(task.dueDateAt).format("MMM D") : "—"}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {status && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
                              {status.label}
                            </Badge>
                          )}
                          {priority && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                              {priority.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results.
                </div>
              )}
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TaskCard key={row.id} task={row.original as any} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results.
                </div>
              )}
            </div>
          )}

          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}


