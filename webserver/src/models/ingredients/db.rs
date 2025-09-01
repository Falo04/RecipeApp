use rorm::fields::types::MaxStr;
use rorm::Model;
use uuid::Uuid;

/// Represents an ingredient with a unique identifier and name.
///
/// This struct is used to store information about individual ingredients.
#[derive(Model)]
#[rorm(rename = "ingredient")]
pub struct IngredientModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the ingredient.
    #[rorm(unique)]
    pub name: MaxStr<255>,
}
