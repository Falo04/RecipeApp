import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type RowData,
    type SortingState,
} from "@tanstack/react-table";
import { TableHeader, TableRow, TableBody, TableCell, Table } from "./table.tsx";
import React from "react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "./pagination.tsx";
import type { LinkProps } from "@tanstack/react-router";
import { cn } from "cn";

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        /** Extra classes applied to every {@link TableCell} of this column */
        className?: string;
    }
}

export type UseDataTableParams<T> = {
    /** The list of data objects to show in the table */
    data: T[];
    /** List of column defintions */
    columns: ColumnDef<T, string>[];
    /**
     * Specifies how the sorting is initially done before user interaction
     *
     * This cannot be changed after mount
     */
    initialSorting?: SortingState;
    /**
     * Specifies by which column to group the items by.
     *
     * This cannot be changed after mount
     */
    groupBy?: string[];
    /**
     * The current page index (0-based). Pagination is controlled by
     * the calles site. Typically has a `page` URL search params.
     */
    pageIndex: number;
    /** Called with the new page index (0-based).
     *
     * Typically updates the `page` URL search params
     */
    onPageChange: (pageIndex: number) => void;
    /** HOw many items are at most in one page */
    pageSize?: number;
    /** Text to filter all rows by. Typically from a `search` URL search param */
    globalFilter?: string;
};

/** Sets up a TanStack table instance with sorting, filterting and pagination */
export function useDataTabel<T>(params: UseDataTableParams<T>) {
    const {
        data,
        columns,
        initialSorting = [],
        groupBy = [],
        pageIndex,
        onPageChange,
        pageSize = 25,
        globalFilter,
    } = params;
    const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
    const [isGrouped, setIsGrouped] = React.useState<boolean>(groupBy.length > 0);

    const initialSortingRef = React.useRef(initialSorting);
    const groupByRef = React.useRef(groupBy);

    const effectiveSorting = React.useMemo<SortingState>(() => {
        const base = sorting.length > 0 ? sorting : initialSortingRef.current;
        return isGrouped
            ? [
                  ...groupByRef.current
                      .filter((id) => !base.some((s) => s.id === id))
                      .map((id) => ({ id, desc: false })),
                  ...base,
              ]
            : base;
    }, [isGrouped, sorting]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting: effectiveSorting, pagination: { pageIndex, pageSize }, globalFilter },
        onSortingChange: setSorting,
        onPaginationChange: (updater) => {
            const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
            onPageChange(next.pageIndex);
        },
        globalFilterFn: "includesString",
        autoResetPageIndex: false,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const pageCount = table.getPageCount();
    const lastPageIndex = Math.max(pageCount - 1, 0);

    React.useEffect(() => {
        if (pageIndex > lastPageIndex) {
            onPageChange(lastPageIndex);
        }
    }, [pageIndex, lastPageIndex]);

    const setGrouping = React.useCallback(
        (grouped: boolean) => {
            setIsGrouped(grouped);
            table.setPageIndex(0);
        },
        [table],
    );

    return { table, isGrouped, setGrouping };
}

/**
 * The properties for {@link DataTable}
 */
export type DataTableProps<Row> = {
    /** Table to render */
    table: ReturnType<typeof useReactTable<Row>>;
    /**
     * When set, a separator is drawn between connsecutive rows
     * whose value for this column differ.
     */
    groupBy?: string[];
    /** Url each row should link to */
    rowHref?: LinkProps["to"];
    /** Url params for rowHref */
    rowParams?: (row: Row) => LinkProps["params"];
    /** Search params for rowHref */
    rowSearch?: (row: Row) => LinkProps["search"];
};

/**
 * The DataTable
 */
export function DataTable<Row>(props: DataTableProps<Row>) {
    const { table, groupBy } = props;
    const { rows } = table.getRowModel();
    const groupCol = groupBy?.[0];
    const colSpan = table.getAllLeafColumns().length;

    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();

    return (
        <div className={"flex flex-col gap-4"}>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <React.Fragment key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => {
                        const isGroupedBoundary =
                            groupCol !== undefined &&
                            i > 0 &&
                            row.getValue(groupCol) !== rows[i - 1]!.getValue(groupCol);

                        return (
                            <React.Fragment key={row.id}>
                                {isGroupedBoundary && (
                                    <tr>
                                        <td
                                            colSpan={colSpan}
                                            className="dark:boder-t-zinc-white/20 h-px border-t-2 border-t-zinc-300 p-0"
                                        />
                                    </tr>
                                )}
                                <TableRow
                                    href={props.rowHref}
                                    params={props.rowParams?.(row.original)}
                                    search={props.rowSearch?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cn(
                                                cell.column.columnDef.meta?.className,
                                                "overflow-hidden text-ellipsis whitespace-nowrap",
                                            )}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>

            <Pagination className={"py-2"}>
                <PaginationContent>
                    <PaginationItem onClick={() => table.previousPage()}>
                        <PaginationPrevious disabled={!table.getCanPreviousPage()} />
                    </PaginationItem>
                    {buildPageNumbers(pageIndex + 1, pageCount).map((item, idx) =>
                        item === "ellipses" ? (
                            <PaginationItem key={idx}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem
                                key={item}

                                onClick={() => table.setPageIndex(item - 1)}
                            >
                                <PaginationLink isActive={item === pageIndex + 1}>{item}</PaginationLink>
                            </PaginationItem>
                        ),
                    )}
                    <PaginationItem onClick={() => table.nextPage()}>
                        <PaginationNext disabled={!table.getCanNextPage()} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}

/** Returns page numbers (1-based) with "ellipses" sentinels for ellipses positions */
function buildPageNumbers(current: number, total: number): (number | "ellipses")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | "ellipses")[] = [1];
    if (current > 3) pages.push("ellipses");
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
        pages.push(p);
    }
    if (current < total - 2) pages.push("ellipses");
    pages.push(total);
    return pages;
}
