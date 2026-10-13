import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecipeForm } from "@/components/recipe-form";
import { useGetRecipe } from "@/api/generated";
import { Spinner } from "@/components/ui/spinner.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * The properties for {@link UpdateRecipe}
 */
export type UpdateRecipeProps = object;

/**
 * Updates the recipe data.
 */
export function UpdateRecipe() {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();
    const { recipeId } = Route.useParams();
    const { data: recipe } = useGetRecipe(recipeId);
    const navigate = useNavigate();

    if (!recipe) {
        return (
            <div className={"flex h-full items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <HeadingLayout
            breadcrumbs={[
                { label: tg("menu.recipes"), href: "/app/recipes", search: { page: 1, search: "" } },
                { label: recipe.name, href: "/app/recipes/$recipeId", params: { recipeId: recipe.uuid } },
                { label: t("button.edit") },
            ]}
            heading={t("heading.update")}
            description={t("heading.update-description")}
            headingChildren={
                <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={() =>
                        navigate({
                            to: "/app/recipes/$recipeId",
                            params: { recipeId: recipe.uuid },
                        })
                    }
                >
                    <XIcon />
                </Button>
            }
        >
            <RecipeForm
                formData={recipe}
                navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })}
            />
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/update")({
    component: UpdateRecipe,
});
