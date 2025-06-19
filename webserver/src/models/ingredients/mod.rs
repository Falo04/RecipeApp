//! Represents an ingredient in a recipe.
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::DbEnum;
use rorm::Model;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::models::recipes::Recipe;

pub mod impls;

/// Represents an ingredient with a unique identifier and name.
///
/// This struct is used to store information about individual ingredients.
#[derive(Model)]
pub struct Ingredient {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the ingredient, with a maximum length of 255 characters.
    #[rorm(unique)]
    pub name: MaxStr<255>,
}

/// Represents the ingredients for a recipe.
///
/// This struct models the ingredients within a recipe, linking to the
/// `Recipe` and `Ingredients` models using foreign keys.
#[derive(Model)]
pub struct RecipeIngredientModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model, indicating which recipe this ingredient belongs to.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    /// A foreign key referencing the `Ingredients` model, specifying the type of ingredient.
    pub ingredients: ForeignModel<Ingredient>,

    /// The quantity of the ingredient.
    pub amount: i32,

    /// The unit of measurement for the ingredient.
    pub unit: Units,
}

/// Represents different units of measurement.
///
/// This enum defines various units for quantities, allowing for flexible and
/// consistent handling of measurements.  Each variant corresponds to a specific
/// unit of measurement.
#[derive(
    DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema, PartialEq, PartialOrd, Eq, Ord,
)]
pub enum Units {
    Cup = 0,
    Gram = 1,
    Kilogram = 2,
    Liter = 3,
    Milliliter = 4,
    Tablespoon = 5,
    Teaspoon = 6,
    /// if the user doesn't want to specific a unit
    ///
    /// e.g., 1 egg
    None = 7,
}
