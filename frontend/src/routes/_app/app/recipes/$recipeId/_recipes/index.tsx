import { Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import React, { Suspense } from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import IngredientsGrid from "@/components/ingredients-grid.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { MoreHorizontalIcon, PenBoxIcon, Trash2Icon } from "lucide-react";
import { DeleteRecipeDialog } from "@/components/dialogs/delete-recipe.tsx";

/**
 * The properties for {@link RecipeDetail}
 */
export type RecipeDetailProps = object;

/**
 * Displays detailed information about a recipe.
 */
export function RecipeDetail() {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const [openDelete, setOpenDelete] = React.useState<string | undefined>();

    const navigate = useNavigate();
    const { recipe } = React.useContext(SINGLE_RECIPE_CONTEXT);

    return (
        <HeadingLayout
            heading={recipe.name}
            description={recipe.description}
            headingChildren={
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild data-nolink>
                        <Button variant={"ghost"} size={"icon"}>
                            <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                            <MoreHorizontalIcon className={"w-5"} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}>
                        <DropdownMenuItem
                            onSelect={async () => {
                                await navigate({
                                    to: "/app/recipes/$recipeId/update",
                                    params: { recipeId: recipe.uuid },
                                });
                            }}
                        >
                            <PenBoxIcon className={"me-2.5 size-4"} />
                            {t("button.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setOpenDelete(recipe.uuid)}>
                            <Trash2Icon className={"me-2.5 size-4"} />
                            {t("button.delete")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        >
            <div className={"grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-8"}>
                <div className={"col-span-1 flex flex-col gap-4 md:col-span-3"}>
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
                </div>
                <Card className={"bg-muted py-4"}>
                    <CardContent>
                        <IngredientsGrid withScrolling={false} ingredients={recipe.ingredients} />
                    </CardContent>
                </Card>
                <Card className={"bg-muted col-span-1 py-4 md:col-span-2"}>
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
            {openDelete && (
                <Suspense>
                    <DeleteRecipeDialog
                        recipe_uuid={openDelete}
                        onClose={async () => {
                            setOpenDelete(undefined);
                            await navigate({ to: "/app/recipes", search: { search: "", page: 0 } });
                        }}
                    />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes/")({
    component: RecipeDetail,
});
