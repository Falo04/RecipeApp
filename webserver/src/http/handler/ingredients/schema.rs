//! Represents all ingredients responses and requests.

use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::fields::types::MaxStr;

use crate::models::ingredients::IngredientUuid;
use crate::models::recipes::ingredients::Units;

/// Represents the ingredients for a recipe.
///
/// This struct will be used for Response and Request.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct FullIngredient {
    /// An optional UUID representing the ingredient mapping.
    ///
    /// In case of a request:
    /// - if Some(uuid), the mapping must be updated because it already exists.
    /// - if None, the mapping must be created.
    ///
    /// In case of a response: The uuid must be set.
    pub uuid: Option<IngredientUuid>,

    /// The name of the ingredient,
    pub name: MaxStr<255>,

    /// The unit of the ingredient.
    pub unit: Units,

    /// The quantity of the ingredient.
    pub amount: i64,
}

/// Represents the response received after searching for ingredients.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleIngredient {
    /// The UUID for the ingredient.
    pub uuid: IngredientUuid,
    /// The name of the ingredient.
    pub name: MaxStr<255>,
}
