import { createFileRoute, Link } from "@tanstack/react-router";
import { Api } from "@/api/api.tsx";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import type { SimpleRecipe } from "@/api/model/recipe.interface.ts";
import { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { Info } from "lucide-react";
import { Text } from "@/components/ui/text.tsx";

/**
 * The properties for {@link RecipeOverviewForTag}
 */
export type RecipeOverviewForTagProps = object;

/**
 * Shows all recipes that are tagged to this tag
 */
export default function RecipeOverviewForTag() {
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
                        <Text className="hover:text-foreground overflow-hidden text-ellipsis">{row.original.name}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "description",
                header: () => <span>{tg("table.description")}</span>,
                cell: ({ row }) => <Text className={"overflow-hidden text-ellipsis"}>{row.original.description}</Text>,
            },
            {
                accessorKey: "action",
                header: () => <div className="flex justify-end">{tg("table.action")}</div>,
                cell: ({ row }) => (
                    <div className={"flex justify-end pr-4"}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
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

    return <DataTable filterTag={t("input.filter")} data={data.items} columns={columns} />;
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/recipe")({
    component: RecipeOverviewForTag,
    loader: async ({ params }) => {
        const res = await Api.tags.getRecipesByTag(params.tagId);
        if (res.error) {
            toast.error(res.error.message);
            return;
        }
        return res.data;
    },
});
