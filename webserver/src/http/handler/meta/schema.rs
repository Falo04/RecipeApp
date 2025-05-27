use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct MetaResponse {
    pub authentication_enabled: bool,
}
