import { Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import React, { Suspense } from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { CookingPotIcon, LucideCarrot, MoreHorizontalIcon, PenBoxIcon, Trash2Icon } from "lucide-react";
import { DeleteRecipeDialog } from "@/components/dialogs/delete-recipe.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export type RecipeDetailProps = object;

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
                    <DropdownMenuTrigger render={<Button variant={"ghost"} size={"icon"} />}>
                        <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                        <MoreHorizontalIcon className={"w-5"} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}>
                        <DropdownMenuItem
                            onClick={async () => {
                                await navigate({
                                    to: "/app/recipes/$recipeId/update",
                                    params: { recipeId: recipe.uuid },
                                });
                            }}
                        >
                            <PenBoxIcon className={"me-2.5 size-4"} />
                            {t("button.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenDelete(recipe.uuid)}>
                            <Trash2Icon className={"me-2.5 size-4"} />
                            {t("button.delete")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        >
            {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                        <Link
                            to="/app/tags/$tagId"
                            params={{ tagId: tag.uuid }}
                            search={{ page: 1, search: "" }}
                            key={tag.uuid}
                        >
                            <Badge variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                                {tag.name}
                            </Badge>
                        </Link>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                {/* Ingredients */}
                <Card className="bg-muted/40 py-4">
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <LucideCarrot className="text-muted-foreground size-4 shrink-0" />
                            <Subheading level={2}>{t("heading.ingredients")}</Subheading>
                        </div>
                        <Separator />
                        {recipe.ingredients.length === 0 ? (
                            <Text className="text-center">{tg("empty.none")}</Text>
                        ) : (
                            <div className="flex flex-col divide-y">
                                {recipe.ingredients.map((ingredient) => (
                                    <div key={ingredient.uuid} className="flex items-center gap-3 py-2">
                                        <span className="text-muted-foreground w-24 shrink-0 text-right text-sm">
                                            {ingredient.amount} {ingredient.unit}
                                        </span>
                                        <span className="text-sm">{ingredient.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Steps */}
                <Card className="bg-muted/40 col-span-1 py-4 md:col-span-2">
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <CookingPotIcon className="text-muted-foreground size-4 shrink-0" />
                            <Subheading level={2}>{t("heading.steps")}</Subheading>
                        </div>
                        <Separator />
                        {recipe.steps.length === 0 ? (
                            <Text className="text-center">{tg("empty.none")}</Text>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {recipe.steps.map((step) => (
                                    <div key={step.uuid} className="flex items-start gap-3">
                                        <div className="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                            {step.index + 1}
                                        </div>
                                        <Text className="flex-1">{step.step}</Text>
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
