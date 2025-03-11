use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::users::schema::SimpleUser;
use crate::models::recipe_ingredients::Units;

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
    pub ingredients: Vec<Ingredients>,
    pub steps: Vec<Steps>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Steps {
    pub uuid: Option<Uuid>,
    pub step: MaxStr<1024>,
    pub index: i16,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateRecipeRequest {
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
    pub user: Uuid,
    pub tags: Vec<Uuid>,
    pub ingredients: Vec<Ingredients>,
    pub steps: Vec<Steps>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UpdateRecipeRequest {
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
    pub user: Uuid,
    pub tags: Vec<Uuid>,
    pub ingredients: Vec<Ingredients>,
    pub steps: Vec<Steps>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Ingredients {
    pub uuid: Option<Uuid>,
    pub name: MaxStr<255>,
    pub unit: Units,
    pub amount: i32,
}
