import {
    AccountApi,
    Configuration,
    type CreateOrUpdateRecipe,
    type CreateOrUpdateTag,
    DefaultApi,
    type GetAllRecipesByIngredientsRequest,
    type GetAllRecipesRequest,
    type GetAllTagsRequest,
    IngredientsApi,
    RecipesApi,
    RequiredError,
    ResponseError,
    TagsApi,
} from "@/api/generated";
import { ERROR_STORE } from "@/context/error-context.tsx";

export type UUID = string;

const configuration = new Configuration({
    basePath: window.location.origin,
});

const accountApi = new AccountApi(configuration);
const oidcApi = new DefaultApi(configuration);
const recipeApi = new RecipesApi(configuration);
const tagsApi = new TagsApi(configuration);
const ingredientsApi = new IngredientsApi(configuration);

/**
 * Api wrapper containing various API endpoints.
 */
export const Api = {
    account: {
        getMe: async () => await callApi(accountApi.getMe()),
    },
    oidc: {
        logout: async () => await callApi(oidcApi.logout()),
    },
    recipe: {
        getAll: async (request: GetAllRecipesRequest) =>
            await callApi(recipeApi.getAllRecipes({ GetAllRecipesRequest: request })),
        getById: async (uuid: string) => await callApi(recipeApi.getRecipe({ uuid })),
        create: async (payload: CreateOrUpdateRecipe) =>
            await callApi(recipeApi.createRecipe({ CreateOrUpdateRecipe: payload })),
        update: async (uuid: string, payload: CreateOrUpdateRecipe) =>
            await callApi(recipeApi.updateRecipe({ uuid, CreateOrUpdateRecipe: payload })),
        delete: async (uuid: string) => await callApi(recipeApi.deleteRecipe({ uuid })),
    },
    tags: {
        getAll: async (request: GetAllTagsRequest) => await callApi(tagsApi.getAllTags({ GetAllTagsRequest: request })),
        getRecipesByTag: async (uuid: string, request: GetAllRecipesRequest) =>
            await callApi(tagsApi.getRecipesByTag({ uuid, GetAllRecipesRequest: request })),
        create: async (payload: CreateOrUpdateTag) => await callApi(tagsApi.createTag({ CreateOrUpdateTag: payload })),
        update: async (uuid: string, payload: CreateOrUpdateTag) =>
            await callApi(tagsApi.updateTag({ uuid, CreateOrUpdateTag: payload })),
        delete: async (uuid: string) => await callApi(tagsApi.deleteTag({ uuid })),
    },
    ingredients: {
        getAll: async () => await callApi(ingredientsApi.getAllIngredients()),
        getRecipes: async (payload: GetAllRecipesByIngredientsRequest) =>
            await callApi(ingredientsApi.getRecipesByIngredients({ GetAllRecipesByIngredientsRequest: payload })),
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
        } else if (e instanceof RequiredError) {
            // eslint-disable-next-line no-console
            console.error(e);
            msg = "The server's response didn't match the spec";
        } else {
            // eslint-disable-next-line no-console
            console.error("Unknown error occurred:", e);
            msg = "Unknown error occurred";
        }
        ERROR_STORE.report(msg);
        throw msg;
    }
}
