import { Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import React from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import IngredientsGrid from "@/components/ingredients-grid.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";

/**
 * The properties for {@link RecipeDetail}
 */
export type RecipeDetailProps = object;

/**
 * Displays detailed information about a recipe.
 */
export function RecipeDetail() {
    const [t] = useTranslation("recipe");

    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);

    return (
        <HeadingLayout heading={t("heading.recipe", { object: recipe.name })} description={recipe.description}>
            <div className={"grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-8"}>
                <Card className={"bg-muted py-4"}>
                    <CardContent>
                        {recipe.tags.length > 0 && (
                            <div className={"flex gap-2"}>
                                {recipe.tags.map((tag) => (
                                    <Link
                                        to="/app/tags/$tagId"
                                        params={{ tagId: tag.uuid }}
                                        search={{ page: 1, search: "" }}
                                        key={tag.uuid}
                                    >
                                        <Badge
                                            variant={
                                                tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]
                                            }
                                            key={tag.uuid}
                                        >
                                            {tag.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <IngredientsGrid withScrolling={false} ingredients={recipe.ingredients} />
                    </CardContent>
                </Card>
                <Card className={"bg-muted py-4"}>
                    <CardContent>
                        {recipe.steps.length > 0 && (
                            <div className={"flex flex-col gap-4"}>
                                <Subheading>{t("heading.steps")}</Subheading>
                                {recipe.steps.map((step) => (
                                    <div key={step.uuid} className={"flex items-start gap-2"}>
                                        <Subheading>{step.index + 1}</Subheading>
                                        <Text className={"px-2"}>{step.step}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/")({
    component: RecipeDetail,
});
