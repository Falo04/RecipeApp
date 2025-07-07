import { Api } from "@/api/api";
import type { SimpleRecipe } from "@/api/model/recipe.interface";
import { DataTable } from "@/components/ui/data-table.tsx";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * The properties for {@link TagDetail}
 */
export type TagDetailProps = {};

/**
 * Renders a recipe overview table that is assigned to a specific tag
 */
export function TagDetail(_props: TagDetailProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    const columns: ColumnDef<SimpleRecipe>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <span>{tg("table.name")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <div className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[80ch]">
                            <span>{row.original.name}</span>
                        </div>
                    </Link>
                ),
            },
            {
                accessorKey: "description",
                header: () => <span>{tg("table.description")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <div className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[40ch]">
                            <span>{row.original.description}</span>
                        </div>
                    </Link>
                ),
            },
        ],
        [],
    );

    return <DataTable filterTag={t("input.filter")} data={data.items} columns={columns} />;
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/overview")({
    component: TagDetail,
    loader: async ({ params }) => {
        const res = await Api.tags.getRecipesByTag(params.tagId);
        if (res.error) {
            toast.error(res.error.message);
            return;
        }
        return res.data;
    },
});
