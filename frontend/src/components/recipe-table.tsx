import React, { Suspense } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
    CookingPotIcon,
    CopyIcon,
    LayoutGridIcon,
    LayoutListIcon,
    MoreHorizontalIcon,
    PenBoxIcon,
    PlusIcon,
    Settings2Icon,
    Trash2Icon,
} from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { TableHead } from "./ui/table";
import { DataTable, useDataTabel } from "./ui/data-table";
import { BadgeButton, badgeVariants } from "./ui/badge";
import type { VariantProps } from "class-variance-authority";
import { DeleteRecipeDialog } from "@/components/dialogs/delete-recipe.tsx";
import { Text } from "@/components/ui/text.tsx";
import { FilterBar } from "@/components/ui/filter-bar.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import type { SimpleRecipeWithTags } from "@/api/generated/model";

/**
 * The properties for {@link RecipeTable}
 */
export type RecipeTableProps = {
    /** Query param for searching recipe name */
    search: string;
    /** Where the filter/pagination should navigate to*/
    href: LinkProps["to"];
    /** Params for navigate */
    params?: LinkProps["params"];
    /** All recipes to show, the table filters, sorts and pages them */
    recipes: Array<SimpleRecipeWithTags>;
    /** Current page */
    page: number;
};

const LIMIT = 50;

/**
 * Table for recipes
 */
export default function RecipeTable(props: RecipeTableProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const navigate = useNavigate();

    const [openDelete, setOpenDelete] = React.useState<string | undefined>();

    const columns = React.useMemo<Array<ColumnDef<SimpleRecipeWithTags, string>>>(
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
                id: "description",
                accessorKey: "description",
                enableSorting: false,
                header: () => <TableHead>{tg("table.description")}</TableHead>,
                cell: ({ row }) => <Text>{row.original.description}</Text>,
            },
            {
                id: "tags",
                accessorFn: (recipe) => recipe.tags.map((tag) => tag.name).join(" "),
                enableSorting: false,
                header: () => <TableHead>{tg("table.tags")}</TableHead>,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {row.original.tags.map((tag) => (
                            <BadgeButton
                                key={tag.uuid}
                                data-nolink
                                variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                                onClick={async () => {
                                    await navigate({
                                        to: "/app/tags/$tagId",
                                        params: { tagId: tag.uuid },
                                        search: { page: 1, search: "" },
                                    });
                                }}
                            >
                                {tag.name}
                            </BadgeButton>
                        ))}
                    </div>
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
                            <DropdownMenuTrigger openOnHover render={<Button variant={"ghost"} />} data-nolink>
                                <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                                <MoreHorizontalIcon className={"w-5"} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={"end"}>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        await navigate({
                                            to: "/app/recipes/$recipeId/update",
                                            params: { recipeId: row.original.uuid },
                                        });
                                    }}
                                >
                                    <PenBoxIcon className={"me-2.5 size-4"} />
                                    {t("button.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                    <CopyIcon className={"me-2.5 size-4"} />
                                    {t("button.copy")}
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
        [t, tg, navigate],
    );

    const { table } = useDataTabel({
        data: props.recipes,
        columns,
        globalFilter: props.search,
        pageIndex: props.page - 1,
        pageSize: LIMIT,
        onPageChange: async (pageIndex) => {
            await navigate({
                to: props.href,
                params: props.params,
                search: { page: pageIndex + 1, search: props.search },
            });
        },
    });

    return (
        <>
            <FilterBar
                search={props.search}
                placeholder={t("label.placeholder")}
                onChange={async (search) => {
                    await navigate({ to: props.href, search: { page: 1, search }, params: props.params });
                }}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant={"outline"} />}>
                        <Settings2Icon className={"me-1.5 size-4 opacity-80"} />
                        {t("filter.view")}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenu>
                            <DropdownMenuLabel className={"flex items-center gap-2"}>
                                <LayoutGridIcon className="size-4" />
                                {t("filter.layout")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={"table"} className={"px-1 pb-1"}>
                                <DropdownMenuRadioItem value={"table"}>
                                    <LayoutListIcon className={"size-4"} />
                                    {t("filter.table")}
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value={"grid"}>
                                    <LayoutGridIcon className={"size-4"} />
                                    {t("filter.grid")}
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenu>
                    </DropdownMenuContent>
                </DropdownMenu>
            </FilterBar>
            {props.recipes.length === 0 ? (
                <Empty className={"border"}>
                    <EmptyHeader>
                        <EmptyMedia variant={"icon"}>
                            <CookingPotIcon />
                        </EmptyMedia>
                        <EmptyTitle>{t("empty.no-recipes")}</EmptyTitle>
                        <EmptyDescription>{t("empty.no-recipes-description")}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link to={"/app/recipes/create"} className={buttonVariants()}>
                            <PlusIcon />
                            {t("button.create")}
                        </Link>
                    </EmptyContent>
                </Empty>
            ) : (
                <DataTable
                    table={table}
                    rowHref={"/app/recipes/$recipeId"}
                    rowParams={(recipe) => ({ recipeId: recipe.uuid })}
                />
            )}

            {openDelete && (
                <Suspense>
                    <DeleteRecipeDialog recipe_uuid={openDelete} onClose={() => setOpenDelete(undefined)} />
                </Suspense>
            )}
        </>
    );
}
