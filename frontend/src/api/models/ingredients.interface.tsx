export interface Ingredients {
  uuid: string | null;
  name: string;
  unit: Units;
  amoutn: number;
}

export enum Units {
  Cup = "Cup",
  Gram = "Gram",
  Kilogram = "Kilogram",
  Milliliter = "Milliliter",
  Tablespoon = "Tablespoon",
  Teaspoon = "Teaspoon",
}
