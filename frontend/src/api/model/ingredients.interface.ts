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
}
