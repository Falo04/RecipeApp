use super::schema::SimpleRecipe;
use super::schema::Step;
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
