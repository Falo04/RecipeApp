use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::models::tags::TagColors;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleTag {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub color: TagColors,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateOrUpdateTag {
    pub name: MaxStr<255>,
    pub color: TagColors,
}
