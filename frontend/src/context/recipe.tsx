import { Api } from "@/api/api";
import type { Page } from "@/api/model/global.interface";
import type { FullRecipe } from "@/api/model/recipe.interface";
import type { SimpleTag } from "@/api/model/tag.interface";
import React, { useEffect } from "react";
import { toast } from "sonner";

export type RecipeContext = {
    recipe: FullRecipe;

    reset: () => void;
};

const Recipe_CONTEXT = React.createContext<RecipeContext>({
    recipe: {
        uuid: "",
        name: "",
        description: "",
        ingredients: [],
        steps: [],
        tags: [],
        user: {
            display_name: "",
            uuid: "",
            email: "",
        },
    },
    reset: () => {},
});
Recipe_CONTEXT.displayName = "RecipeContext";
export default Recipe_CONTEXT;

type RecipeProviderProps = {
    children: React.ReactNode | Array<React.ReactNode>;
};

// export function RecipeProvider(props: RecipeProviderProps) {
//     const [recipe, setRecipe] = React.useState<FullRecipe | "loading">("loading");
//     let fetching = false;
//
//     const fetchTags = async () => {
//         if (fetching) return;
//         fetching = true;
//
//         const res = await Api.recipe.();
//         if (res.error) {
//             toast.error(res.error.message);
//             return;
//         }
//
//         if (res.data) {
//             setTags(res.data);
//         }
//
//         fetching = false;
//     };
//
//     useEffect(() => {
//         fetchTags().then();
//     }, []);
//
//     if (tags === "loading") {
//         return <div>Loading...</div>;
//     }
//
//     return (
//         <TAGS_CONTEXT.Provider
//             value={{
//                 tags: tags,
//                 reset: fetchTags,
//             }}
//         >
//             {props.children}
//         </TAGS_CONTEXT.Provider>
//     );
// }
