//! Represents a tag with a name and color.
mod impls;

use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::DbEnum;
use rorm::Model;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::models::recipes::Recipe;

/// Represents a tag with a unique name and associated color.
#[derive(Model)]
pub struct Tag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the tag, enforced to be unique across all tags.
    ///
    /// It has a maximum length of 255 characters.
    #[rorm(unique)]
    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

/// Represents a tag associated with a recipe.
///
/// This struct defines a relationship between a `Recipe` and a `Tag`.
#[derive(Model)]
pub struct RecipeTag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing a `Recipe` object.
    ///
    /// Deleting this tag will also delete the associated recipe.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    /// A foreign key referencing a `Tag` object.
    ///
    /// Deleting this tag will also delete the associated tag.
    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<Tag>,
}

/// Represents different tag colors, each associated with a numerical value.
///
/// This enum defines a set of colors that can be used to represent tags.
#[derive(DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema, PartialEq, PartialOrd)]
pub enum TagColors {
    Red = 0,
    Orange = 1,
    Amber = 2,
    Yellow = 3,
    Lime = 4,
    Green = 5,
    Emerald = 6,
    Teal = 7,
    Cyan = 8,
    Sky = 9,
    Blue = 10,
    Indigo = 11,
    Violet = 12,
    Purple = 13,
    Fuchsia = 14,
    Pink = 15,
    Rose = 16,
    Zinc = 17,
}
