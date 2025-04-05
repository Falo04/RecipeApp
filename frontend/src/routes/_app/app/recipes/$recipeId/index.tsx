import { Api } from "@/api/api";
import { Heading, Subheading } from "@/components/base/heading";
import SubmenuLayout from "@/components/base/submenu-layout";
import { Text } from "@/components/base/text";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableHeader, TableRow, TableHead, TableCell, Table, TableBody } from "@/components/ui/table";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * The properties for {@link RecipeDetails}
 */
export type RecipeDetailProps = {};

/**
 * The RecipeDetails
 */
function RecipeDetail(props: RecipeDetailProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    return (
        <div className="mx-auto w-4xl">
            <SubmenuLayout
                heading={t("heading.detail-heading")}
                headingDescription={t("heading.detail-description")}
                hrefBack={"/app/recipes"}
            >
                <ScrollArea className="h-[75vh]">
                    <div className="flex flex-col gap-4">
                        <Heading>{data.name}</Heading>
                        <div className="min-h-[100px] rounded-lg border px-2">
                            <Text>{data.description}</Text>
                        </div>
                        <Subheading>{t("heading.ingredients")}</Subheading>
                        <div className="rounded-lg border px-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{tg("table.name")}</TableHead>
                                        <TableHead>{tg("table.amount")}</TableHead>
                                        <TableHead>{tg("table.unit")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.ingredients.map((ingre) => (
                                        <TableRow key={ingre.uuid}>
                                            <TableCell>{ingre.name}</TableCell>
                                            <TableCell>{ingre.amount}</TableCell>
                                            <TableCell>{ingre.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Subheading>{t("heading.steps")}</Subheading>
                            {data.steps.map((step) => (
                                <div key={step.uuid}>
                                    <Text>{t("heading.step") + step.index}</Text>
                                    <div className="min-h-[100px] rounded-lg border px-2">
                                        <Text>{step.step}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </SubmenuLayout>
        </div>
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
