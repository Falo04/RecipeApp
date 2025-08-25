import type {
    CreateRecipeRequest,
    FullRecipe,
    GetAllRecipesRequest,
    SimpleRecipeWithTags,
    UpdateRecipeRequest,
} from "./model/recipe.interface";
import type { CreateOrUpdateTag, GetAllTagRequest, SimpleTag } from "./model/tag.interface";
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiError, ApiResponse, List, Page, SingleUuid } from "./model/global.interface";
import { ApiClient } from "./api-client";
import type { AllIngredientsRequest, SimpleIngredient } from "@/api/model/ingredients.interface.ts";
import type { SimpleAccount } from "@/api/model/account.interface.ts";

/**
 * Api wrapper containing various API endpoints.
 */
export const Api = {
    account: {
        getMe: async (): Promise<ApiResponse<SimpleAccount>> =>
            await callApi<SimpleAccount>({ method: "GET", url: "/account/me" }),
    },
    oidc: {
        logout: async (): Promise<ApiResponse<void>> => await callApi<void>({ method: "POST", url: "/oidc/logout" }),
    },
    recipe: {
        getAll: async (request: GetAllRecipesRequest): Promise<ApiResponse<Page<SimpleRecipeWithTags>>> =>
            await callApi<Page<SimpleRecipeWithTags>>({ method: "POST", url: "/recipes/all", data: request }),
        getById: async (uuid: string): Promise<ApiResponse<FullRecipe>> =>
            await callApi<FullRecipe>({ method: "GET", url: `/recipes/${uuid}` }),
        create: async (payload: CreateRecipeRequest): Promise<ApiResponse<SingleUuid>> =>
            await callApi<SingleUuid>({ method: "POST", url: "/recipes", data: payload }),
        update: async (uuid: string, payload: UpdateRecipeRequest): Promise<ApiResponse<SingleUuid>> =>
            await callApi({ method: "PUT", url: `/recipes/${uuid}`, data: payload }),
        delete: async (uuid: string) => await callApi({ method: "DELETE", url: `/recipes/${uuid}` }),
    },
    tags: {
        getAll: async (request: GetAllTagRequest): Promise<ApiResponse<Page<SimpleTag>>> =>
            await callApi<Page<SimpleTag>>({ method: "POST", url: "/tags/all", data: request }),
        getRecipesByTag: async (
            uuid: string,
            request: GetAllRecipesRequest,
        ): Promise<ApiResponse<Page<SimpleRecipeWithTags>>> =>
            await callApi<Page<SimpleRecipeWithTags>>({ method: "POST", url: `/tags/${uuid}/recipes`, data: request }),
        create: async (payload: CreateOrUpdateTag): Promise<ApiResponse<SingleUuid>> =>
            await callApi<SingleUuid>({ method: "POST", url: "/tags", data: payload }),
        update: async (uuid: string, payload: CreateOrUpdateTag) =>
            await callApi({
                method: "PUT",
                url: `/tags/${uuid}`,
                data: payload,
            }),
        delete: async (uuid: string) => await callApi({ method: "DELETE", url: `/tags/${uuid}` }),
    },
    ingredients: {
        getAll: async (): Promise<ApiResponse<List<SimpleIngredient>>> =>
            await callApi<List<SimpleIngredient>>({
                method: "GET",
                url: "/ingredients/all",
            }),
        getRecipes: async (payload: AllIngredientsRequest): Promise<ApiResponse<Page<SimpleRecipeWithTags>>> =>
            await callApi<Page<SimpleRecipeWithTags>>({
                method: "POST",
                url: "/ingredients/recipes",
                data: payload,
            }),
    },
};

/**
 * Calls an API endpoint and returns the response data.
 */
export async function callApi<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
        const { data } = await ApiClient.request<T>(config);

        return {
            data,
            error: null,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const { response } = axiosError;

            let apiError: ApiError = {
                status_code: 0,
                message: "http request failed",
            };

            if (response && response.statusText) {
                apiError.message = response.statusText;
                apiError.status_code = response.status;
            }

            if (axiosError.message) {
                apiError.message = axiosError.message;
                apiError.status_code = axiosError.status ?? 0;
            }

            if (response && response.data && (response.data as ApiError).message) {
                apiError = response.data as ApiError;
            }

            return {
                data: null,
                error: apiError,
            };
        }

        return {
            data: null,
            error: {
                status_code: 0,
                message: (error as Error).message,
            },
        };
    }
}
