use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::Model;
use uuid::Uuid;

use crate::models::recipes::db::RecipeModel;

/// Represents a single step in a recipe.
///
/// This struct is used to store the individual steps of a recipe.
#[derive(Model)]
#[rorm(rename = "RecipeStep")]
pub struct RecipeStepModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// The text of the step.
    pub step: MaxStr<255>,

    /// The order of the step within the recipe.
    pub index: i16,
}
