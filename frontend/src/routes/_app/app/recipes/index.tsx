import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table.tsx";
import type { ColumnDef } from "@tanstack/react-table";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface";
import React, { useMemo } from "react";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import { Text } from "@/components/ui/text.tsx";
import RECIPES_CONTEXT from "@/context/recipes.tsx";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";

/**
 * The properties for {@link FoodOverview}
 */
export type FoodOverviewProps = {};

/**
 * Renders a food overview table.
 */
export function FoodOverview(_props: FoodOverviewProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const data = React.useContext(RECIPES_CONTEXT);
    // const { offset, limit } = Route.useSearch();

    const columns: ColumnDef<SimpleRecipeWithTags>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <span>{tg("table.name")}</span>,
                cell: ({ row }) => <Text className="overflow-hidden text-ellipsis">{row.original.name}</Text>,
            },
            {
                accessorKey: "description",
                header: () => <span>{tg("table.description")}</span>,
                cell: ({ row }) => <Text className={"overflow-hidden text-ellipsis"}>{row.original.description}</Text>,
            },
            {
                accessorKey: "tags",
                header: () => <span>{tg("table.tags")}</span>,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {row.original.tags.map((tag) => (
                            <Link to="/app/tags/$tagId" params={{ tagId: tag.uuid }} key={tag.uuid}>
                                <Badge
                                    variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                                    key={tag.uuid}
                                >
                                    {tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                ),
            },
            {
                accessorKey: "action",
                header: () => <div className="flex justify-end">{tg("table.action")}</div>,
                cell: ({ row }) => (
                    <div className={"flex justify-end pr-4"}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link to={"/app/recipes/$recipeId/general"} params={{ recipeId: row.original.uuid }}>
                                    <Info className={"size-4"} />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tg("tooltip.info")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            headingChildren={
                <Link to={"/app/recipes/create"}>
                    <Button>{t("button.create")}</Button>
                </Link>
            }
        >
            <DataTable filterTag={t("input.filter")} columns={columns} data={data.recipes.items} />
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/")({
    component: FoodOverview,
});
