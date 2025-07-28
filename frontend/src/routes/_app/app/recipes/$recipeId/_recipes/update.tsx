import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecipeForm } from "@/components/recipe-form";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import React from "react";
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
    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);
    const navigate = useNavigate();

    return (
        <HeadingLayout
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
