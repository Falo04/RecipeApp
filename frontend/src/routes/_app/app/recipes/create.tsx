import SubmenuLayout from "@/components/base/submenu-layout";
import { RecipeForm } from "@/components/recipe-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function CreateRecipe() {
    const [t] = useTranslation("recipe");

    const navigate = useNavigate();

    return (
        <SubmenuLayout heading={t("heading.create-heading")} navigate={() => navigate({ to: "/app/recipes" })}>
            <RecipeForm
                navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })}
                onClose={() => navigate({ to: "/app/recipes" })}
            />
        </SubmenuLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
