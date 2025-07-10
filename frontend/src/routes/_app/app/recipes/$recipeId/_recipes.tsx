import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Tab, TabMenu } from "@/components/ui/tab-menu.tsx";
import SINGLE_RECIPE_CONTEXT, { SingleRecipeProvider } from "@/context/recipe.tsx";

/**
 * The properties for {@link SingleRecipeView}
 */
export type SingleRecipeViewProps = {};

/**
 * The Layout for a single recipe
 *
 * @param _props
 */
export default function SingleRecipeView(_props: SingleRecipeViewProps) {
    const [tg] = useTranslation();

    const { recipeId } = Route.useParams();

    return (
        <SingleRecipeProvider uuid={recipeId}>
            <SINGLE_RECIPE_CONTEXT.Consumer>
                {(_ctx) => (
                    <TabMenu>
                        <Tab to={"/app/recipes/$recipeId/general"} params={{ recipeId }}>
                            {tg("tab.general")}
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
