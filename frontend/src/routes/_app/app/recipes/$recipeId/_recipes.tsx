import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * The properties for {@link SingleRecipeView}
 */
export type SingleRecipeViewProps = object;

/**
 * The Layout for a single recipe
 */
export default function SingleRecipeView() {
    return <Outlet />;
}

export const Route = createFileRoute("/_app/app/recipes/$recipeId/_recipes")({
    component: SingleRecipeView,
});
