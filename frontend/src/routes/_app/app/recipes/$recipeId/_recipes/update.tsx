import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecipeForm } from "@/components/recipe-form";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import React from "react";

/**
 * The properties for {@link UpdateRecipe}
 */
export type UpdateRecipeProps = {};

/**
 * Updates the recipe data.
 *
 * @param _props
 */
export function UpdateRecipe(_props: UpdateRecipeProps) {
    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);
    const navigate = useNavigate();

    return (
        <RecipeForm
            formData={recipe}
            navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })}
        />
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/update")({
    component: UpdateRecipe,
});
