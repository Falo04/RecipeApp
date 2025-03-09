use super::schema::SimpleTag;
use crate::models::tags::Tag;

impl From<Tag> for SimpleTag {
    fn from(value: Tag) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
        }
    }
}
