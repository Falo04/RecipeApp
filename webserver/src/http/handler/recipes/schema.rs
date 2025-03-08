use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleRecipe {
    pub uuid: Uuid,

    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
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
