use rorm::fields::types::MaxStr;

use crate::http::handler::ingredients::schema::IngredientSearchResponse;
use crate::http::handler::ingredients::schema::RecipeIngredients;
use crate::http::handler::recipes::schema::RecipeSearchResponse;
use crate::models::ingredients::Ingredient;
use crate::models::ingredients::RecipeIngredientModel;

impl RecipeIngredients {
    /// Creates a new `RecipeIngredient` instance.
    ///
    /// * `value`: `RecipeIngredient` model instance
    /// * `name`: the name of the `Ingredient.
    pub fn new(value: RecipeIngredientModel, name: MaxStr<255>) -> Self {
        Self {
            uuid: Some(value.uuid),
            name,
            unit: value.unit,
            amount: value.amount,
        }
    }
}

impl From<Ingredient> for IngredientSearchResponse {
    /// Creates a new `IngredientSearchResponse` instance from a given `Ingredient` instance.
    fn from(value: Ingredient) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
        }
    }
}
