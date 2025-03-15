use super::schema::Ingredients;
use super::schema::SimpleRecipe;
use super::schema::SimpleRecipeWithTags;
use super::schema::Steps;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::recipe::Recipe;
use crate::models::recipe_ingredients::RecipeIngredients;
use crate::models::recipe_steps::RecipeSteps;

impl From<Recipe> for SimpleRecipe {
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            description: value.description,
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

impl From<RecipeIngredients> for Ingredients {
    fn from(value: RecipeIngredients) -> Self {
        Self {
            uuid: Some(value.uuid),
            name: value.name,
            unit: value.unit,
            amount: value.amount,
        }
    }
}
