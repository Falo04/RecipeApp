import { RecipeForm } from "@/components/recipe-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heading } from "@/components/ui/heading.tsx";
import { Separator } from "@/components/ui/separator.tsx";

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
        <div className={"flex h-full w-full flex-col gap-6"}>
            <div className={"flex w-full flex-col gap-2"}>
                <Heading>{t("heading.create")}</Heading>
                <Separator />
            </div>
            <RecipeForm navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })} />
        </div>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
