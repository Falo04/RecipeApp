import { Heading, Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import React from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { useElementHeight } from "@/hooks/element-height.ts";
import IngredientsGrid from "@/components/ingredients-grid.tsx";

/**
 * The properties for {@link RecipeDetail}
 */
export type RecipeDetailProps = {};

/**
 * Displays detailed information about a recipe.
 *
 * @param _props
 */
export function RecipeDetail(_props: RecipeDetailProps) {
    const [t] = useTranslation("recipe");
    const [ref, height] = useElementHeight<HTMLDivElement>();

    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);

    return (
        <div className={"mx-auto h-full max-w-2xl overflow-hidden"} ref={ref}>
            <ScrollArea style={{ height: `${height - 10}px` }}>
                <div className={"flex h-full flex-col justify-center gap-8 lg:gap-8"}>
                    {/* Some testing with images
                    <img
                        className={"h-40 w-60 place-self-center rounded-lg object-cover lg:h-80 lg:w-full"}
                        src={""}
                    />
                    */}
                    <Heading>{recipe.name}</Heading>
                    {recipe.tags.length > 0 && (
                        <div className={"flex gap-2"}>
                            {recipe.tags.map((tag) => (
                                <Link to="/app/tags/$tagId" params={{ tagId: tag.uuid }} key={tag.uuid}>
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
                    <Text>{recipe.description}</Text>
                    <IngredientsGrid withScrolling={false} ingredients={recipe.ingredients} />
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
                </div>
            </ScrollArea>
        </div>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/general")({
    component: RecipeDetail,
});
