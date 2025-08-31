use super::schema::SimpleIngredient;
use crate::models::ingredients::Ingredient;

impl From<Ingredient> for SimpleIngredient {
    /// Creates a new `IngredientSearchResponse` instance from a given `Ingredient` instance.
    fn from(value: Ingredient) -> Self {
        Self {
            uuid: value.uuid.0,
            name: value.name,
        }
    }
}
