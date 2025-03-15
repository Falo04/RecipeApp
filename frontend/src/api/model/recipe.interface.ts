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
  user: SimpleUser;
  tags: SimpleTag[];
  ingredients: Ingredients[];
  steps: Steps[];
}

export interface Steps {
  uuid: string | null;
  step: string;
  index: string;
}

export interface CreateRecipeRequest {
  name: string;
  description: string;
  user: SimpleUser;
  tags: SimpleTag[];
  ingredients: Ingredients[];
  steps: Steps[];
}

export interface UpdateRecipeRequest {
  name: string;
  description: string;
  user: SimpleUser;
  tags: SimpleTag[];
  ingredients: Ingredients[];
  steps: Steps[];
}
