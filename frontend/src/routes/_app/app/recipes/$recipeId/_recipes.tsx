import { createFileRoute, Outlet } from "@tanstack/react-router";
import SINGLE_RECIPE_CONTEXT, { SingleRecipeProvider } from "@/context/recipe.tsx";

/**
 * The properties for {@link SingleRecipeView}
 */
export type SingleRecipeViewProps = object;

/**
 * The Layout for a single recipe
 */
export default function SingleRecipeView() {
    const { recipeId } = Route.useParams();

    return (
        <SingleRecipeProvider uuid={recipeId}>
            <SINGLE_RECIPE_CONTEXT.Consumer>{() => <Outlet />}</SINGLE_RECIPE_CONTEXT.Consumer>
        </SingleRecipeProvider>
    );
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes")({
    component: SingleRecipeView,
});
