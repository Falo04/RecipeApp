import { Heading, Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import React from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";

/**
 * The properties for {@link RecipeDetail}
 */
export type RecipeDetailProps = {};

/**
 * Displays detailed information about a recipe.
 */
export function RecipeDetail(_props: RecipeDetailProps) {
    const [t] = useTranslation("recipe");
    // const [ref, height] = useElementHeight<HTMLDivElement>();

    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);

    return (
        <div className={"grid grid-cols-1 gap-8 lg:grid-cols-2"}>
            <div className={"flex flex-col justify-center gap-4 lg:gap-8"}>
                <img
                    className={"h-40 w-60 place-self-center rounded-lg object-cover lg:h-80 lg:w-100"}
                    src={"/public/Unbenanntes_Projekt.png"}
                />
                <Heading>{recipe.name}</Heading>
                <div className={"flex gap-2"}>
                    {recipe.tags.map((tag) => (
                        <Link to="/app/tags/$tagId" params={{ tagId: tag.uuid }} key={tag.uuid}>
                            <Badge
                                variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                                key={tag.uuid}
                            >
                                {tag.name}
                            </Badge>
                        </Link>
                    ))}
                </div>
                <Text>{recipe.description}</Text>
            </div>
            <div className={"flex flex-col gap-8"}>
                <div className={"flex flex-col gap-2"}>
                    <Subheading>{t("heading.ingredients")}</Subheading>
                    {recipe.ingredients.map((ingredient) => (
                        <div className={"grid grid-cols-[125px_1fr] items-center gap-4 gap-y-4"} key={ingredient.uuid}>
                            <span className={"text-muted-foreground/80 text-right"}>
                                {ingredient.amount + " " + ingredient.unit}
                            </span>
                            <span className={"text-foreground/90"}>{ingredient.name}</span>
                        </div>
                    ))}
                    {recipe.ingredients.length === 0 && <Text>{t("description.ingredients-empty")}</Text>}
                </div>
                <div className="flex flex-col gap-2">
                    <Subheading>{t("heading.steps")}</Subheading>
                    {recipe.steps.map((step) => (
                        <div key={step.uuid} className={"flex items-start gap-2"}>
                            <Subheading>{step.index + 1}</Subheading>
                            <Text className={"px-2"}>{step.step}</Text>
                        </div>
                    ))}
                    {recipe.steps.length === 0 && <Text>{t("description.steps-empty")}</Text>}
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/info")({
    component: RecipeDetail,
});
