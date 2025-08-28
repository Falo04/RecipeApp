use rorm::fields::types::MaxStr;
use rorm::DbEnum;
use rorm::Model;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

/// Represents an ingredient with a unique identifier and name.
///
/// This struct is used to store information about individual ingredients.
#[derive(Model)]
#[rorm(rename = "Ingredient")]
pub struct IngredientModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the ingredient, with a maximum length of 255 characters.
    #[rorm(unique)]
    pub name: MaxStr<255>,
}
