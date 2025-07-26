import type { Ingredients } from "./ingredients.interface";
import type { SimpleTag } from "./tag.interface";
import type { SimpleUser } from "./user.interface";

export interface SimpleRecipe {
    uuid: string;
    name: string;
    description: string;
}

export interface SimpleRecipeWithTags {
    uuid: string;
    name: string;
    description: string;
    tags: SimpleTag[];
}

export interface FullRecipe {
    uuid: string;
    name: string;
    description: string;
    user?: SimpleUser;
    tags: SimpleTag[];
    ingredients: Ingredients[];
    steps: Steps[];
}

export interface Steps {
    uuid?: string;
    step: string;
    index: number;
}

export interface CreateRecipeRequest {
    name: string;
    description: string;
    user?: string;
    tags: string[];
    ingredients: Ingredients[];
    steps: Steps[];
}

export interface UpdateRecipeRequest {
    name: string;
    description: string;
    user?: string;
    tags: string[];
    ingredients: Ingredients[];
    steps: Steps[];
}

export interface RecipeSearchRequest {
    name: string;
}

export interface RecipeSearchResponse {
    uuid: string;
    name: string;
}

export interface GetAllRecipesRequest {
    limit: number;
    offset: number;
    filter_name: string;
    filter_tag: string | undefined;
}
