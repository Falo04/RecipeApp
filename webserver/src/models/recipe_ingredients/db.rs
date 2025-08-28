use rorm::prelude::ForeignModel;
use rorm::Model;
use uuid::Uuid;

use crate::models::ingredients::db::IngredientModel;
use crate::models::recipes::db::RecipeModel;

/// Represents the ingredients for a recipe.
///
/// This struct models the ingredients within a recipe, linking to the
/// `Recipe` and `Ingredients` models using foreign keys.
#[derive(Model)]
#[rorm(rename = "RecipeIngredient")]
pub struct RecipeIngredientModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model, indicating which recipe this ingredient belongs to.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// A foreign key referencing the `Ingredients` model, specifying the type of ingredient.
    pub ingredients: ForeignModel<IngredientModel>,

    /// The quantity of the ingredient.
    pub amount: i32,

    /// The unit of measurement for the ingredient.
    pub unit: crate::models::ingredients::db::Units,
}
