import HeadingLayout from "@/components/layouts/heading-layout";
import { CreateTagDialog } from "@/components/dialogs/create-tag";
import { Button } from "@/components/ui/button";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, PenBoxIcon, PlusIcon, TagIcon, Trash2Icon } from "lucide-react";
import { Text } from "@/components/ui/text.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { TableHead } from "@/components/ui/table.tsx";
import { DataTable, useDataTabel } from "@/components/ui/data-table.tsx";
import { FilterBar } from "@/components/ui/filter-bar.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { EditTagDialog } from "@/components/dialogs/edit-tag.tsx";
import { DeleteTagDialog } from "@/components/dialogs/delete-tag";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { useGetAllTags } from "@/api/generated";
import type { SimpleTag } from "@/api/generated/model";

/**
 * The properties for {@link TagsOverview}
 */
export type TagsOverviewProps = object;

const LIMIT = 50;

/**
 * Renders a tag overview table.
 */
export function TagsOverview() {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const { search, page } = Route.useSearch();
    const { data: tags = [] } = useGetAllTags({ query: { select: (res) => res.list } });

    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState<SimpleTag>();
    const [openDelete, setOpenDelete] = React.useState<string | undefined>(undefined);

    const columns = React.useMemo<Array<ColumnDef<SimpleTag, string>>>(
        () => [
            {
                id: "name",
                accessorKey: "name",
                header: ({ column }) => (
                    <TableHead sorted={column.getIsSorted()} onSorting={column.getToggleSortingHandler()}>
                        {tg("table.name")}
                    </TableHead>
                ),
                cell: ({ row }) => <Text>{row.original.name}</Text>,
            },
            {
                id: "color",
                accessorKey: "color",
                header: ({ column }) => (
                    <TableHead sorted={column.getIsSorted()} onSorting={column.getToggleSortingHandler()}>
                        {tg("table.color")}
                    </TableHead>
                ),
                cell: ({ row }) => (
                    <Badge variant={row.original.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                        {row.original.color}
                    </Badge>
                ),
            },
            {
                id: "actions",
                enableSorting: false,
                header: () => (
                    <TableHead className={"w-0"}>
                        <span className={"sr-only"}>{tg("accessibility.actions")}</span>
                    </TableHead>
                ),
                cell: ({ row }) => (
                    <div className={"-ms-3 flex items-center justify-end"}>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                openOnHover
                                render={<Button variant={"ghost"} size={"icon"} />}
                                data-nolink
                            >
                                <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                                <MoreHorizontalIcon className={"w-5"} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={"end"}>
                                <DropdownMenuItem
                                    onClick={() =>
                                        setOpenEdit({
                                            uuid: row.original.uuid,
                                            name: row.original.name,
                                            color: row.original.color,
                                        })
                                    }
                                >
                                    <PenBoxIcon className={"me-2.5 size-4"} />
                                    {t("button.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setOpenDelete(row.original.uuid)}>
                                    <Trash2Icon className={"me-2.5 size-4"} />
                                    {t("button.delete")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [t, tg],
    );

    const { table } = useDataTabel({
        data: tags,
        columns,
        initialSorting: [{ id: "name", desc: false }],
        globalFilter: search,
        pageIndex: page - 1,
        pageSize: LIMIT,
        onPageChange: async (pageIndex) => {
            await navigate({ to: "/app/tags", search: { page: pageIndex + 1, search } });
        },
    });

    return (
        <HeadingLayout
            breadcrumbs={[{ label: tg("menu.tags") }]}
            heading={t("heading.overview-title")}
            description={t("heading.overview-description")}
            headingChildren={
                <Button onClick={() => setOpenCreate(true)}>
                    <div className={"flex items-center gap-1"}>
                        <PlusIcon size={"size-4"} />
                        {isMobile ? t("button.create-short") : t("button.create")}
                    </div>
                </Button>
            }
        >
            <FilterBar
                search={search}
                placeholder={t("label.placeholder")}
                onChange={async (search) => {
                    await navigate({ to: "/app/tags", search: { page: 1, search } });
                }}
            />
            {tags.length === 0 ? (
                <Empty className={"border"}>
                    <EmptyHeader>
                        <EmptyMedia variant={"icon"}>
                            <TagIcon />
                        </EmptyMedia>
                        <EmptyTitle>{t("empty.no-tags")}</EmptyTitle>
                        <EmptyDescription>{t("empty.no-tags-description")}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button onClick={() => setOpenCreate(true)}>
                            <PlusIcon />
                            {t("button.create")}
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <DataTable
                    table={table}
                    rowHref={"/app/tags/$tagId"}
                    rowParams={(tag) => ({ tagId: tag.uuid })}
                    rowSearch={() => ({ page: 1, search: "" })}
                />
            )}

            {openCreate && (
                <Suspense>
                    <CreateTagDialog
                        onClose={() => {
                            setOpenCreate(false);
                        }}
                    />
                </Suspense>
            )}
            {openEdit && (
                <Suspense>
                    <EditTagDialog tag={openEdit} onClose={() => setOpenEdit(undefined)} />
                </Suspense>
            )}
            {openDelete && (
                <Suspense>
                    <DeleteTagDialog tag_uuid={openDelete} onClose={() => setOpenDelete(undefined)} />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

/**
 * Search props for tag overview
 */
type TagOverviewSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/tags/")({
    component: TagsOverview,
    validateSearch: (search: Record<string, unknown>): TagOverviewSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
});
