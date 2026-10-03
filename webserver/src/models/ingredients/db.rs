//! Database model for ingredients

use galvyn::rorm::Model;
use galvyn::rorm::fields::types::MaxStr;
use uuid::Uuid;

/// Represents an ingredient with a unique identifier and name.
///
/// This struct is used to store information about individual ingredients.
#[derive(Model)]
#[rorm(rename = "ingredient")]
pub struct IngredientModel {
    /// Primary key
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the ingredient.
    #[rorm(unique)]
    pub name: MaxStr<255>,
}
