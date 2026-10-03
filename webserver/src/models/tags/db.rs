use galvyn::rorm::Model;
use galvyn::rorm::fields::types::MaxStr;
use uuid::Uuid;

use crate::custom_db_enum;
use crate::models::tags::TagColors;

/// Represents a tag with a unique name and associated color.
#[derive(Model)]
#[rorm(rename = "tag")]
pub struct TagModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the tag.
    #[rorm(unique)]
    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

custom_db_enum!(
    enum: TagColors,
    variants: [Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose, Zinc],
    decoder: TagColorsDecoder
);
