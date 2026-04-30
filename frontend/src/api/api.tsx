import {
    type CreateOrUpdateRecipe,
    type CreateOrUpdateTag,
    type GetAllRecipesByIngredientsRequest,
    type GetAllRecipesRequest,
    type GetAllTagsRequest,
    getAllIngredients,
    getAllRecipes,
    getAllTags,
    getMe,
    getRecipe,
    getRecipesByIngredients,
    getRecipesByTag,
    createRecipe,
    createTag,
    deleteRecipe,
    deleteTag,
    logout,
    updateRecipe,
    updateTag,
} from "@/api/generated";
import { ResponseError } from "@/api/custom-fetch";
import { ERROR_STORE } from "@/context/error-context.tsx";

export type UUID = string;

/**
 * Api wrapper containing various API endpoints.
 */
export const Api = {
    account: {
        getMe: async () => await callApi(getMe()),
    },
    oidc: {
        logout: async () => await callApi(logout()),
    },
    recipe: {
        getAll: async (request: GetAllRecipesRequest) => await callApi(getAllRecipes(request)),
        getById: async (uuid: string) => await callApi(getRecipe(uuid)),
        create: async (payload: CreateOrUpdateRecipe) => await callApi(createRecipe(payload)),
        update: async (uuid: string, payload: CreateOrUpdateRecipe) =>
            await callApi(updateRecipe(uuid, payload)),
        delete: async (uuid: string) => await callApi(deleteRecipe(uuid)),
    },
    tags: {
        getAll: async (request: GetAllTagsRequest) => await callApi(getAllTags(request)),
        getRecipesByTag: async (uuid: string, request: GetAllRecipesRequest) =>
            await callApi(getRecipesByTag(uuid, request)),
        create: async (payload: CreateOrUpdateTag) => await callApi(createTag(payload)),
        update: async (uuid: string, payload: CreateOrUpdateTag) =>
            await callApi(updateTag(uuid, payload)),
        delete: async (uuid: string) => await callApi(deleteTag(uuid)),
    },
    ingredients: {
        getAll: async () => await callApi(getAllIngredients()),
        getRecipes: async (payload: GetAllRecipesByIngredientsRequest) =>
            await callApi(getRecipesByIngredients(payload)),
    },
};

/**
 * Wraps a promise returned by the generated SDK which handles its errors and returns a {@link Result}
 *
 * @param promise The promise to wrap. This should be a promise defined in the generated part of the API
 *
 * @returns a new promise with a result that wraps errors from the API
 */
export async function callApi<T>(promise: Promise<T>): Promise<T> {
    try {
        return await promise;
    } catch (e) {
        let msg;
        if (e instanceof ResponseError) {
            msg = e.response.statusText;
        } else {
            // eslint-disable-next-line no-console
            console.error("Unknown error occurred:", e);
            msg = "Unknown error occurred";
        }
        ERROR_STORE.report(msg);
        throw msg;
    }
}
