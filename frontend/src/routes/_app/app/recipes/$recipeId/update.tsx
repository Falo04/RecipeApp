import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import SubmenuLayout from "@/components/layouts/submenu-layout.tsx";
import { RecipeForm } from "@/components/recipe-form";
import { Api } from "@/api/api";
import { toast } from "sonner";

function UpdateRecipe() {
    const [t] = useTranslation("recipe");
    const { recipeId } = Route.useParams();

    const navigate = useNavigate();

    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    console.log(data);

    return (
        <SubmenuLayout
            heading={t("heading.update-heading")}
            navigate={() => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: recipeId } })}
        >
            <RecipeForm
                formData={data}
                navigate={(uuid) => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: uuid } })}
                onClose={() => navigate({ to: "/app/recipes/$recipeId", params: { recipeId: recipeId } })}
            />
        </SubmenuLayout>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/update")({
    component: UpdateRecipe,
    loader: async ({ params }) => {
        const res = await Api.recipe.getById(params.recipeId);
        if (res.error) {
            toast.error(res.error.message);
            return;
        }
        return res.data;
    },
});
