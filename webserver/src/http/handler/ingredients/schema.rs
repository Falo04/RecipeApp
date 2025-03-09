use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::models::ingredients::Units;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleIngredient {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub unit: Units,
}
