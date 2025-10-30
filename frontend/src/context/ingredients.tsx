import { Api } from "@/api/api";
import React, { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner.tsx";
import WS from "@/api/websockets.ts";
import type { SimpleIngredient } from "@/api/generated";

/**
 * Represents the context for managing and interacting with ingredients.
 * It contains the current list of ingredients and a function to reset the context.
 */
export type IngredientProvider = {
    ingredients: Array<SimpleIngredient>;

    reset: () => void;
};

/**
 * A React context provider for managing ingredients-related data.
 * This context offers a centralized location to manage and access
 * ingredient data
 *
 * It also includes a reset function for managing state.
 */
const INGREDIENTS_CONTEXT = React.createContext<IngredientProvider>({
    ingredients: [],
    reset: () => {},
});
/**
 * Represents a context object with display name and other potential properties.
 * This class is designed to hold and manage contextual information.
 *
 * It provides a way to easily access and modify the display name of the context.
 */
INGREDIENTS_CONTEXT.displayName = "IngredientsContext";
export default INGREDIENTS_CONTEXT;

/**
 * Props for the IngredientsContext component.
 *
 * This object defines the configuration options for the IngredientsPovider.
 * It allows you to pass in child components that will be rendered
 * within the provider.
 */
type IngredientProviderProps = {
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * Provides a context with ingredient data.
 * @param {IngredientProviderProps} props Props passed to the provider.
 */
export function IngredientProvider(props: IngredientProviderProps) {
    const [ingredients, setIngredients] = React.useState<Array<SimpleIngredient> | "loading">("loading");
    let fetching = false;

    const fetchTags = async () => {
        if (fetching) return;
        fetching = true;

        const res = await Api.ingredients.getAll();
        setIngredients(res.list);

        fetching = false;
    };

    useEffect(() => {
        fetchTags().then();

        const listener = WS.addEventListener("message.IngredientsChanged", () => {
            fetchTags().then();
        });

        return () => WS.removeEventListener(listener);
    }, []);

    if (ingredients === "loading") {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <INGREDIENTS_CONTEXT.Provider
            value={{
                ingredients,
                reset: fetchTags,
            }}
        >
            {props.children}
        </INGREDIENTS_CONTEXT.Provider>
    );
}
