use super::schema::Step;
use crate::models::recipe_steps::RecipeStep;

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
