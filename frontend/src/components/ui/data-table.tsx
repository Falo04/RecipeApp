import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Button } from "./button.tsx";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, TableScrollArea, Table } from "./table.tsx";
import { type ColumnFiltersState, getFilteredRowModel } from "@tanstack/table-core";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import React from "react";
import { Input } from "@/components/ui/form.tsx";
import { useElementHeight } from "@/hooks/element-height.ts";

/**
 * The properties for {@link DataTable}
 */
export type DataTableProps<TData extends { uuid: string }, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    filterTag: string;
};

/**
 * The DataTable
 */
export function DataTable<TData extends { uuid: string }, TValue>(props: DataTableProps<TData, TValue>) {
    const [tg] = useTranslation();

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const isMobile = useIsMobile();

    const table = useReactTable({
        data: props.data,
        columns: props.columns,
        initialState: { pagination: { pageSize: isMobile ? 5 : 50 } },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div className={"flex h-full w-full flex-col justify-between gap-4"}>
            <div className={"flex h-full w-full flex-col gap-2"}>
                <div className={"flex items-center"}>
                    <Input
                        placeholder={props.filterTag}
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
                        className={"max-w-sm"}
                    />
                </div>
                <Table wrapperClassName={"overflow-clip"}>
                    <TableHeader className={"sticky top-0"}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            className={"whitespace-nowrap"}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{ width: cell.column.getSize() }}
                                            className={"whitespace-nowrap"}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={props.columns.length} className="h-24 text-center">
                                    {tg("table.no-result")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className={"flex items-center justify-between"}>
                <Select
                    onValueChange={(e) => {
                        table.setPageSize(Number(e));
                    }}
                    value={String(table.getState().pagination.pageSize)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[5, 10, 25, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={String(pageSize)}>
                                {pageSize}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
