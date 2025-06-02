import { Api } from "@/api/api";
import { Subheading } from "@/components/ui/heading.tsx";
import SubmenuLayout from "@/components/layouts/submenu-layout";
import { Text } from "@/components/ui/text.tsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";

/**
 * The properties for {@link RecipeDetail}
 */
export type RecipeDetailProps = {};

/**
 * The RecipeDetails
 */
function RecipeDetail(_props: RecipeDetailProps) {
    const [t] = useTranslation("recipe");

    const navigate = useNavigate();

    const { recipeId } = Route.useParams();

    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    return (
        <SubmenuLayout
            heading={data.name}
            headingDescription={data.description}
            navigate={() => navigate({ to: "/app/recipes" })}
            editButton={() => navigate({ to: "/app/recipes/$recipeId/update", params: { recipeId: recipeId } })}
        >
            <ScrollArea className="h-[65vh]">
                <div className="flex flex-col gap-8">
                    <div className={"flex flex-col gap-2"}>
                        <Subheading>{t("heading.tags")}</Subheading>
                        <div className={"flex gap-2"}>
                            {data.tags.map((tag) => (
                                <Link to="/app/tag/$tagId" params={{ tagId: tag.uuid }} key={tag.uuid}>
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
                    </div>
                    <div className={"flex flex-col gap-2"}>
                        <Subheading>{t("heading.ingredients")}</Subheading>
                        <div className="px-2">
                            <ul
                                className={
                                    "list-inside list-disc gap-2 text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400"
                                }
                            >
                                {data.ingredients.map((ingredient) => (
                                    <li key={ingredient.uuid}>
                                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Subheading>{t("heading.steps")}</Subheading>
                        {data.steps.map((step) => (
                            <div key={step.uuid} className={"flex items-start gap-2"}>
                                <Subheading>{step.index + 1}</Subheading>
                                <div className="px-2">
                                    <Text>{step.step}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </SubmenuLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/")({
    component: RecipeDetail,
    loader: async ({ params }) => {
        const res = await Api.recipe.getById(params.recipeId);
        if (res.error) {
            toast.error(res.error.message);
            return;
        }
        return res.data;
    },
});
