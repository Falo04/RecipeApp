use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::Model;
use uuid::Uuid;

use crate::models::recipes::db::RecipeModel;
use crate::models::tags::TagColors;

/// Represents a tag with a unique name and associated color.
#[derive(Model)]
#[rorm(rename = "Tag")]
pub struct TagModel {
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
pub struct RecipeTagModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing a `Recipe` object.
    ///
    /// Deleting this tag will also delete the associated recipe.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// A foreign key referencing a `Tag` object.
    ///
    /// Deleting this tag will also delete the associated tag.
    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<TagModel>,
}
