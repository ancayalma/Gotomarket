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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  accountId?: string;
}

export function TasksDataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { columns, data } = props;
  // Mobile detection
  const isMobile = useIsMobile();

  const {
    columnVisibility,
    setColumnVisibility,
    sorting,
    setSorting,
    columnSizing,
    setColumnSizing,
  } = useTableSettings(`${props.accountId || 'global'}-tasks-table-settings`, isMobile);

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

    return data.filter((task: any) => {
      const date = task.dueDateAt ? new Date(task.dueDateAt) : null;
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div></div>
        <div className="flex justify-end space-x-2">
          {hide ? (
            <PanelTopOpen
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          ) : (
            <PanelTopClose
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          )}
        </div>
      </div>

      {hide ? (
        <div className="flex gap-2">
          This content is hidden now. Click on <PanelTopOpen /> to show content
        </div>
      ) : (
        <>
          <DataTableToolbar table={table} onDateFilterChange={setDateRange} />
          <div className="rounded-md border overflow-x-auto bg-background/50 backdrop-blur-sm">
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
                          className="truncate min-w-0"
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
    </div>
  );
}
