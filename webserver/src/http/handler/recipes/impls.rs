use super::schema::SimpleRecipeWithTags;
use super::schema::Step;
use crate::http::handler::ingredients::schema::FullIngredient;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::recipes::Recipe;
use crate::models::recipes::ingredients::RecipeIngredient;
use crate::models::recipes::steps::RecipeStep;

impl From<RecipeStep> for Step {
    /// Creates a new `Step` instance from a given `RecipeStep` instance.
    fn from(value: RecipeStep) -> Self {
        Self {
            uuid: Some(value.uuid),
            step: value.step,
            index: value.index,
        }
    }
}

impl From<RecipeIngredient> for FullIngredient {
    fn from(value: RecipeIngredient) -> Self {
        Self {
            uuid: Some(value.ingredient.uuid),
            name: value.ingredient.name,
            unit: value.unit,
            amount: value.amount,
        }
    }
}

impl From<Recipe> for SimpleRecipeWithTags {
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            description: value.description,
            tags: value.tags.into_iter().map(SimpleTag::from).collect(),
        }
    }
}
