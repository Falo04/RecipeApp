import { Api } from "@/api/api";
import React, { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner.tsx";
import type { FullRecipe } from "@/api/generated";

/**
 * Represents the context for managing and interacting with a single recipe.
 * It contains the current single recipe and a function to reset the context.
 */
export type SingleRecipesContext = {
    recipe: FullRecipe;

    reset: () => void;
};

/**
 * A React context provider for managing single-recipe-related data.
 * This context offers a centralized location to manage and access
 * recipe data
 *
 * It also includes a reset function for managing state.
 */
const SINGLE_RECIPE_CONTEXT = React.createContext<SingleRecipesContext>({
    recipe: {
        uuid: "",
        name: "",
        description: "",
        steps: [],
        tags: [],
        user: { uuid: "", display_name: "", email: "" },
        ingredients: [],
    },
    reset: () => {},
});
/**
 * Represents a context object with display name and other potential properties.
 * This class is designed to hold and manage contextual information.
 *
 * It provides a way to easily access and modify the display name of the context.
 */
SINGLE_RECIPE_CONTEXT.displayName = "SingleRecipeContext";
export default SINGLE_RECIPE_CONTEXT;

/**
 * Props for the SingleRecipeProvider component.
 *
 * This object defines the configuration options for the singleRecipeProvider.
 * It allows you to pass in child components that will be rendered
 * within the provider.
 */
type SingleRecipeProviderProps = {
    uuid: string;
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * Provides a context with recipe data.
 * @param {SingleRecipeProviderProps} props Props passed to the provider.
 */
export function SingleRecipeProvider(props: SingleRecipeProviderProps) {
    const [recipe, setRecipe] = React.useState<FullRecipe | "loading">("loading");
    let fetching = false;

    const fetchTags = async () => {
        if (fetching) return;
        fetching = true;

        const res = await Api.recipe.getById(props.uuid);
        setRecipe(res);

        fetching = false;
    };

    useEffect(() => {
        fetchTags().then();
    }, []);

    if (recipe === "loading") {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <SINGLE_RECIPE_CONTEXT.Provider
            value={{
                recipe,
                reset: fetchTags,
            }}
        >
            {props.children}
        </SINGLE_RECIPE_CONTEXT.Provider>
    );
}
