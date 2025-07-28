//! Represents all ingredients responses and requests.

use galvyn::core::stuff::schema::GetPageRequest;
use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::http::common::schemas::List;
use crate::models::ingredients::Units;

/// Represent the request for all recipes with these ingredients
#[derive(Debug, Clone, Deserialize, Serialize, JsonSchema)]
pub struct AllIngredientsRequest {
    /// List of ingredients uuids
    pub uuids: List<Uuid>,
}

/// Represents the ingredients for a recipe.
///
/// This struct will be used for Response and Request.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RecipeIngredients {
    /// An optional UUID representing the ingredient mapping.
    ///
    /// In case of a request:
    /// - if Some(uuid), the mapping must be updated because it already exists.
    /// - if None, the mapping must be created.
    ///
    /// In case of a response: The uuid must be set.
    pub uuid: Option<Uuid>,

    /// The name of the ingredient,
    pub name: MaxStr<255>,

    /// The unit of the ingredient.
    pub unit: Units,

    /// The quantity of the ingredient.
    pub amount: i32,
}

/// Represents the response received after searching for ingredients.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleIngredient {
    /// The UUID for the ingredient.
    pub uuid: Uuid,
    /// The name of the ingredient.
    pub name: MaxStr<255>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GetAllRecipesByIngredientsRequest {
    /// Page request
    #[serde(flatten)]
    pub page: GetPageRequest,
    /// Name of recipes to filter for
    pub filter_name: Option<String>,
    /// List of ingredients to filter for
    pub filter_uuids: List<Uuid>,
}
