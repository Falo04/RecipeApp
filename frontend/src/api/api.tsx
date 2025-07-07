import type { TokenDataResponse, UserSignInRequest } from "./model/jwt.interface";
import type { SimpleUser } from "./model/user.interface";
import type {
    CreateRecipeRequest,
    FullRecipe,
    RecipeSearchRequest,
    RecipeSearchResponse,
    SimpleRecipe,
    SimpleRecipeWithTags,
    UpdateRecipeRequest,
} from "./model/recipe.interface";
import type { CreateOrUpdateTag, SimpleTag } from "./model/tag.interface";
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiError, ApiResponse, List, Page, SingleUuid } from "./model/global.interface";
import { ApiClient } from "./api-client";
import type { MetaResponse } from "@/api/model/meta.interface.ts";
import type { AllIngredientsRequest, SimpleIngredient } from "@/api/model/ingredients.interface.ts";

export const Api = {
    meta: {
        get: async (): Promise<ApiResponse<MetaResponse>> =>
            await callApi<MetaResponse>({ method: "GET", url: "/meta" }),
    },
    jwt: {
        login: async (payload: UserSignInRequest): Promise<ApiResponse<TokenDataResponse>> =>
            await callApi<TokenDataResponse>({ method: "POST", url: "/jwt/login", data: payload }),
    },
    user: {
        getMe: async (): Promise<ApiResponse<SimpleUser>> =>
            await callApi<SimpleUser>({ method: "GET", url: "/users/me" }),
    },
    recipe: {
        getAll: async (limit: number, offset: number): Promise<ApiResponse<Page<SimpleRecipeWithTags>>> =>
            await callApi<Page<SimpleRecipeWithTags>>({ method: "GET", url: "/recipes", params: { limit, offset } }),
        getById: async (uuid: string): Promise<ApiResponse<FullRecipe>> =>
            await callApi<FullRecipe>({ method: "GET", url: `/recipes/${uuid}` }),
        create: async (payload: CreateRecipeRequest): Promise<ApiResponse<SingleUuid>> =>
            await callApi<SingleUuid>({ method: "POST", url: "/recipes", data: payload }),
        update: async (uuid: string, payload: UpdateRecipeRequest): Promise<ApiResponse<SingleUuid>> =>
            await callApi({ method: "PUT", url: `/recipes/${uuid}`, data: payload }),
        delete: async (uuid: string) => await callApi({ method: "DELETE", url: `/recipe/${uuid}` }),
        search: async (search: RecipeSearchRequest): Promise<ApiResponse<List<RecipeSearchResponse>>> =>
            await callApi({ method: "GET", url: `/recipes/search?name=${search.name}` }),
    },
    tags: {
        getAll: async (): Promise<ApiResponse<Page<SimpleTag>>> =>
            await callApi<Page<SimpleTag>>({ method: "GET", url: "/tags" }),
        getRecipesByTag: async (uuid: string): Promise<ApiResponse<Page<SimpleRecipe>>> =>
            await callApi<Page<SimpleRecipe>>({ method: "GET", url: `/tags/${uuid}/recipes` }),
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
