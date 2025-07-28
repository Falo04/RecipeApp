import { createFileRoute } from "@tanstack/react-router";
import { Api } from "@/api/api.tsx";
import { toast } from "sonner";
import RecipeTable from "@/components/recipe-table.tsx";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import SINGLE_TAG_CONTEXT from "@/context/tag.tsx";
import React from "react";

/**
 * The properties for {@link RecipeOverviewForTag}
 */
export type RecipeOverviewForTagProps = object;

const LIMIT = 50;

/**
 * Shows all recipes that are tagged to this tag
 */
export default function RecipeOverviewForTag() {
    const [t] = useTranslation("tag");

    const { tag } = React.useContext(SINGLE_TAG_CONTEXT);

    const { search, page } = Route.useSearch();
    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    return (
        <HeadingLayout
            heading={t("heading.tags-recipes-title", { object: tag.name })}
            description={t("heading.tags-recipes-description")}
        >
            <RecipeTable
                search={search}
                href={"/app/tags/$tagId"}
                params={{ tagId: tag.uuid }}
                data={data}
                page={page}
            />
        </HeadingLayout>
    );
}

type RecipesByTagSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/")({
    component: RecipeOverviewForTag,
    validateSearch: (search: Record<string, unknown>): RecipesByTagSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
    loader: async ({ deps, params }) => {
        const res = await Api.tags.getRecipesByTag(params.tagId, {
            limit: LIMIT,
            offset: (deps.page - 1) * LIMIT,
            filter_name: deps.search,
        });

        if (res.error) {
            toast.error(res.error.message);
            return;
        }

        return res.data;
    },
});
