use rorm::fields::types::MaxStr;
use rorm::DbEnum;
use rorm::Model;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

#[derive(Model)]
pub struct Tag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,

    pub color: TagColors,
}

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
