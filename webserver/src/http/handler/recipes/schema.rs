use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::http::handler::ingredients::schema::SimpleIngredient;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::users::schema::SimpleUser;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleRecipe {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct FullRecipe {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
    pub user: SimpleUser,
    pub tags: Vec<SimpleTag>,
    pub ingredients: Vec<SimpleIngredient>,
    pub steps: Vec<Steps>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Steps {
    pub step: MaxStr<1024>,
    pub index: i16,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateRecipeRequest {
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateRecipeErrors {
    /// The tag's name already exists
    pub name_not_unique: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UpdateRecipeRequest {
    pub description: Option<MaxStr<1024>>,
}
