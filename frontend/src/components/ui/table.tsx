import * as React from "react";
import { useNavigate, type LinkProps } from "@tanstack/react-router";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/utils/utils";

function Table({
    className,
    ...props
}: React.ComponentProps<"table"> & {
    wrapperClassName?: string;
}) {
    return (
        <div data-slot="table-container" className={"border-border relative w-full overflow-auto rounded-lg border"}>
            <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return (
        <thead
            data-slot="table-header"
            className={cn("bg-background sticky top-0 [&_tr]:border-b", className)}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
            {...props}
        />
    );
}

/**
 * The properties for {@link TableRow}
 */
export type TableRowProps = React.ComponentProps<"tr"> & {
    /** Where the row should navigate to when clicked */
    href?: LinkProps["to"];
    /** Params for href */
    params?: LinkProps["params"];
    /** Search params for href */
    search?: LinkProps["search"];
};

/**
 * A table row which optionally navigates to `href` when clicked.
 *
 * Clicks on elements marked with `data-nolink` are ignored.
 */
function TableRow({ className, href, params, search, onClick, ...props }: TableRowProps) {
    const navigate = useNavigate();

    return (
        <tr
            data-slot="table-row"
            className={cn(
                "hover:bg-background dark:hover-muted/50 data-[state=selected]:bg-muted border-b transition-colors hover:cursor-pointer",
                className,
            )}
            onClick={async (e) => {
                onClick?.(e);
                if (href === undefined || e.defaultPrevented) return;

                const target = e.target as HTMLElement;
                if (!target.closest("[data-nolink]") && e.currentTarget.contains(target)) {
                    await navigate({ to: href, params, search });
                }
            }}
            {...props}
        />
    );
}

/**
 * The properties for {@link TableHead}
 */
export type TableHeadProps = React.ComponentProps<"th"> & {
    /** Current sort direction of this column, `false` if it isn't sorted */
    sorted?: false | "asc" | "desc";
    /** When set, the header becomes a button which calls this to toggle the sorting */
    onSorting?: (event: unknown) => void;
};

/**
 * A table header cell which optionally renders a sort toggle
 */
function TableHead({ className, sorted, onSorting, children, ...props }: TableHeadProps) {
    return (
        <th
            data-slot="table-head"
            className={cn(
                "text-muted-foreground bg-muted h-10 px-4 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className,
            )}
            {...props}
        >
            {onSorting ? (
                <button type={"button"} className={"flex items-center gap-1"} onClick={onSorting}>
                    {children}
                    {sorted === "asc" && <ArrowUpIcon className={"size-3.5"} />}
                    {sorted === "desc" && <ArrowDownIcon className={"size-3.5"} />}
                </button>
            ) : (
                children
            )}
        </th>
    );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                "bg-muted/50 p-3 px-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className,
            )}
            {...props}
        />
    );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
    return (
        <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
    );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
