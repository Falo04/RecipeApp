import { Api } from "@/api/api";
import type { Page } from "@/api/model/global.interface";
import React, { useEffect } from "react";
import { toast } from "sonner";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

/**
 * Represents the context for managing and interacting with recipes.
 * It contains the current list of recipes and a function to reset the context.
 */
export type RecipesContext = {
    recipes: Page<SimpleRecipeWithTags>;

    reset: () => void;
};

/**
 * A React context provider for managing recipes-related data.
 * This context offers a centralized location to manage and access
 * recipe data
 *
 * It also includes a reset function for managing state.
 */
const RECIPES_CONTEXT = React.createContext<RecipesContext>({
    recipes: {
        items: [],
        limit: 999,
        total: 0,
        offset: 0,
    },
    reset: () => {},
});
/**
 * Represents a context object with display name and other potential properties.
 * This class is designed to hold and manage contextual information.
 *
 * It provides a way to easily access and modify the display name of the context.
 */
RECIPES_CONTEXT.displayName = "RecipesContext";
export default RECIPES_CONTEXT;

/**
 * Props for the recipesContext component.
 *
 * This object defines the configuration options for the recipesPovider.
 * It allows you to pass in child components that will be rendered
 * within the provider.
 */
type RecipesProviderProps = {
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * Provides a context with recipe data.
 * @param {RecipesProviderProps} props Props passed to the provider.
 */
export function RecipesProvider(props: RecipesProviderProps) {
    const [recipes, setRecipes] = React.useState<Page<SimpleRecipeWithTags> | "loading">("loading");
    let fetching = false;

    const fetchTags = async () => {
        if (fetching) return;
        fetching = true;

        const res = await Api.recipe.getAll(999, 0);
        if (res.error) {
            toast.error(res.error.message);
            return;
        }

        if (res.data) {
            setRecipes(res.data);
        }

        fetching = false;
    };

    useEffect(() => {
        fetchTags().then();
    }, []);

    if (recipes === "loading") {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <RECIPES_CONTEXT.Provider
            value={{
                recipes,
                reset: fetchTags,
            }}
        >
            {props.children}
        </RECIPES_CONTEXT.Provider>
    );
}
