import SubmenuLayout from "@/components/layouts/submenu-layout";
import { RecipeForm } from "@/components/recipe-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * The properties for {@link CreateRecipe}
 */
export type CreateRecipeProps = {};

/**
 * Renders a recipe creation form within a submenu layout.
 */
export function CreateRecipe(_props: CreateRecipeProps) {
    const [t] = useTranslation("recipe");

    const navigate = useNavigate();

    return (
        <SubmenuLayout heading={t("heading.create-heading")} navigate={() => navigate({ to: "/app/recipes" })}>
            <RecipeForm navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })} />
        </SubmenuLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
