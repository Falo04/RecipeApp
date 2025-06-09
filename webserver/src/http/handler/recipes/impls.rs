use rorm::fields::types::MaxStr;

use super::schema::RecipeIngredient as RecipeIngredientsDto;
use super::schema::RecipeSearchResponse;
use super::schema::SimpleRecipe;
use super::schema::Step;
use crate::models::ingredients::RecipeIngredient;
use crate::models::recipes::Recipe;
use crate::models::recipes::RecipeStep;
impl From<Recipe> for SimpleRecipe {
    /// Creates a new `SimpleRecipe` instance from a given `Recipe` instance.
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            description: value.description,
        }
    }
}

impl From<Recipe> for RecipeSearchResponse {
    /// Creates a new `RecipeSearchResponse` instance from a given `Recipe` instance.
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
        }
    }
}

impl From<RecipeStep> for Step {
    /// Creates a new `RecipeSteps` instance from a given `Steps` instance.
    fn from(value: RecipeStep) -> Self {
        Self {
            uuid: Some(value.uuid),
            step: value.step,
            index: value.index,
        }
    }
}

impl RecipeIngredientsDto {
    /// Creates a new `RecipeIngredient` instance.
    ///
    /// * `value`: `RecipeIngredient` model instance
    /// * `name`: the name of the `Ingredient.
    pub fn new(value: RecipeIngredient, name: MaxStr<255>) -> Self {
        Self {
            uuid: Some(value.uuid),
            name,
            unit: value.unit,
            amount: value.amount,
        }
    }
}
