import { RecipeForm } from "@/components/recipe-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { XIcon } from "lucide-react";

/**
 * The properties for {@link CreateRecipe}
 */
export type CreateRecipeProps = object;

/**
 * Renders a recipe creation form within a submenu layout.
 */
export function CreateRecipe() {
    const [t] = useTranslation("recipe");

    const navigate = useNavigate();

    return (
        <HeadingLayout
            heading={t("heading.create")}
            description={t("heading.create-description")}
            headingChildren={
                <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={() =>
                        navigate({
                            to: "/app/recipes",
                            search: { page: 1, search: "" },
                        })
                    }
                >
                    <XIcon />
                </Button>
            }
        >
            <RecipeForm navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })} />
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/create")({
    component: CreateRecipe,
});
