import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Api } from "@/api/api.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import RecipeTable from "@/components/recipe-table.tsx";
import { useEffect } from "react";
import WS from "@/api/websockets.ts";

/**
 * The properties for {@link FoodOverview}
 */
export type FoodOverviewProps = object;

const LIMIT = 50;

/**
 * Renders a food overview table.
 */
export function FoodOverview() {
    const [t] = useTranslation("recipe");

    const isMobile = useIsMobile();
    const router = useRouter();

    const { search, page } = Route.useSearch();
    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    useEffect(() => {
        const listener = WS.addEventListener("message.RecipesChanged", () => {
            router.invalidate({ sync: true });
        });

        return () => WS.removeEventListener(listener);
    }, []);

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            description={t("heading.overview-description")}
            headingChildren={
                <Link to={"/app/recipes/create"}>
                    <Button>
                        <div className={"flex items-center gap-1"}>
                            <PlusIcon size={"size-4"} />
                            {isMobile ? t("button.create-short") : t("button.create")}
                        </div>
                    </Button>
                </Link>
            }
        >
            <RecipeTable search={search} href={"/app/recipes"} data={data} page={page} />
        </HeadingLayout>
    );
}

type RecipeOverviewSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/recipes/")({
    component: FoodOverview,
    validateSearch: (search: Record<string, unknown>): RecipeOverviewSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
    loader: async ({ deps }) =>
        await Api.recipe.getAll({
            limit: LIMIT,
            offset: (deps.page - 1) * LIMIT,
            filter_name: deps.search,
        }),
});
