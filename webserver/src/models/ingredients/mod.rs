use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::DbEnum;
use rorm::Model;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use crate::models::recipes::Recipe;

pub mod impls;

#[derive(Model)]
pub struct Ingredients {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub name: MaxStr<255>,

    pub amount: i32,

    pub unit: Units,
}

#[derive(
    DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema, PartialEq, PartialOrd, Eq, Ord,
)]
pub enum Units {
    Cup = 0,
    Gram = 1,
    Kilogram = 2,
    Liter = 3,
    Milliliter = 4,
    Tablespoon = 5,
    Teaspoon = 6,
}
