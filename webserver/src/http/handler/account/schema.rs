use rorm::fields::types::MaxStr;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleAccount {
    pub uuid: Uuid,
    pub email: MaxStr<255>,
    pub display_name: MaxStr<255>,
}
