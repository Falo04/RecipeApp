use super::schema::RecipeIngredients;
use super::schema::RecipeSearchResponse;
use super::schema::SimpleRecipe;
use super::schema::Steps;
use crate::models::ingredients::Ingredients;
use crate::models::recipes::Recipe;
use crate::models::recipes::RecipeSteps;

impl From<Recipe> for SimpleRecipe {
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            description: value.description,
        }
    }
}

impl From<Recipe> for RecipeSearchResponse {
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
        }
    }
}

impl From<RecipeSteps> for Steps {
    fn from(value: RecipeSteps) -> Self {
        Self {
            uuid: Some(value.uuid),
            step: value.step,
            index: value.index,
        }
    }
}

impl From<Ingredients> for RecipeIngredients {
    fn from(value: Ingredients) -> Self {
        Self {
            uuid: Some(value.uuid),
            name: value.name,
            unit: value.unit,
            amount: value.amount,
        }
    }
}
