//! Represents the metadata response.
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;

/// Represents the metadata response.
///
/// This struct contains a boolean value indicating whether authentication is enabled.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct MetaResponse {
    pub authentication_enabled: bool,
}
