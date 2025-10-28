//! Represents all recipe responses and requests.

use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::core::stuff::schema::GetPageRequest;
use galvyn::rorm::fields::types::MaxStr;

use crate::models::tags::TagColors;
use crate::models::tags::TagUuid;

/// Represents a simple tag
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleTag {
    /// The UUID for the tag.
    pub uuid: TagUuid,

    /// The name of the tag (string, maximum length 255).
    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

/// Represents the structure for creating or updating a tag.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateOrUpdateTag {
    /// The name of the tag (string, maximum length 255).
    pub name: MaxStr<255>,

    /// The color associated with the tag, chosen from the `TagColors` enum.
    pub color: TagColors,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GetAllTagsRequest {
    /// Page request
    #[serde(flatten)]
    pub page: GetPageRequest,
    /// Search for tag name
    pub filter_name: Option<String>,
}
