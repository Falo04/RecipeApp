import type { List } from "@/api/model/global.interface.ts";

export interface Ingredients {
    uuid?: string;
    name: string;
    unit: Units;
    amount: number;
}

export enum Units {
    Cup = "Cup",
    Gram = "Gram",
    Kilogram = "Kilogram",
    Milliliter = "Milliliter",
    Tablespoon = "Tablespoon",
    Teaspoon = "Teaspoon",
    None = "None",
}

export interface SimpleIngredient {
    uuid: string;
    name: string;
}

export interface AllIngredientsRequest {
    limit: number;
    offset: number;
    filter_name: string | undefined;
    filter_uuids: List<string>;
}
