import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Tab, TabMenu } from "@/components/ui/tab-menu.tsx";
import SINGLE_RECIPE_CONTEXT, { SingleRecipeProvider } from "@/context/recipe.tsx";

/**
 * The properties for {@link SingleRecipeView}
 */
export type SingleRecipeViewProps = object;

/**
 * The Layout for a single recipe
 */
export default function SingleRecipeView() {
    const [tg] = useTranslation();

    const { recipeId } = Route.useParams();

    return (
        <SingleRecipeProvider uuid={recipeId}>
            <SINGLE_RECIPE_CONTEXT.Consumer>
                {() => (
                    <TabMenu>
                        <Tab to={"/app/recipes/$recipeId/general"} params={{ recipeId }}>
                            {tg("tab.general")}
                        </Tab>
                        <Tab to={"/app/recipes/$recipeId/update"} params={{ recipeId }}>
                            {tg("tab.update")}
                        </Tab>
                    </TabMenu>
                )}
            </SINGLE_RECIPE_CONTEXT.Consumer>
        </SingleRecipeProvider>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes")({
    component: SingleRecipeView,
});
