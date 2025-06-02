import { Api } from "@/api/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import HeadingLayout from "@/components/layouts/heading-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table.tsx";
import type { ColumnDef } from "@tanstack/react-table";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface";
import { useMemo } from "react";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import { Text } from "@/components/ui/text.tsx";

/**
 * The properties for {@link FoodOverview}
 */
export type FoodOverviewProps = {};

/**
 * The FoodOverview
 */
function FoodOverview(_props: FoodOverviewProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    // const { offset, limit } = Route.useSearch();

    const columns: ColumnDef<SimpleRecipeWithTags>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <span>{tg("table.name")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <Text className="overflow-hidden text-ellipsis">{row.original.name}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "description",
                header: () => <span>{tg("table.description")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <Text className={"overflow-hidden text-ellipsis"}>{row.original.description}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "tags",
                header: () => <span>{tg("table.tags")}</span>,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {row.original.tags.map((tag) => (
                            <Link to="/app/tag/$tagId" params={{ tagId: tag.uuid }} key={tag.uuid}>
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
        ],
        [],
    );

    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            headingDescription={t("heading.overview-description")}
            headingChildren={
                <Link to={"/app/recipes/create"}>
                    <Button>{t("button.create")}</Button>
                </Link>
            }
        >
            <DataTable filterTag={t("input.filter")} columns={columns} data={data.items} />
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/")({
    component: FoodOverview,
    loader: async () => {
        const res = await Api.recipe.getAll(50, 0);

        if (res.error) {
            toast.error(res.error.message);
            return;
        }

        return res.data;
    },
});
