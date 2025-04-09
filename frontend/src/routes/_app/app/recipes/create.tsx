import SubmenuLayout from "@/components/base/submenu-layout";
import { RecipeForm } from "@/components/recipe-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function CreateRecipe() {
    const [t] = useTranslation("recipe");

    const navigate = useNavigate();

    return (
        <div className="mx-auto w-4xl">
            <SubmenuLayout
                heading={t("heading.create-heading")}
                headingDescription={t("heading.create-description")}
                navigate={() => navigate({ to: "/app/recipes" })}
            >
                <RecipeForm
                    navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })}
                    onClose={() => navigate({ to: "/app/recipes" })}
                />
            </SubmenuLayout>
        </div>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
