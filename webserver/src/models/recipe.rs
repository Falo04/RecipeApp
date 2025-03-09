use rorm::field;
use rorm::fields::types::MaxStr;
use rorm::prelude::BackRef;
use rorm::prelude::ForeignModel;
use rorm::Model;
use time::OffsetDateTime;
use uuid::Uuid;

use super::ingredients::Ingredient;
use super::ingredients::Units;
use super::tags::Tag;
use super::user::User;

#[derive(Model)]
pub struct Recipe {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,

    pub description: MaxStr<1024>,

    pub user: ForeignModel<User>,

    pub tags: BackRef<field!(RecipeTag.recipe)>,

    pub ingredients: BackRef<field!(RecipeIngredients.recipe)>,

    pub steps: BackRef<field!(RecipeSteps.recipe)>,

    pub created_at: OffsetDateTime,
}

#[derive(Model)]
pub struct RecipeTag {
    #[rorm(primary_key)]
    uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<Tag>,
}

#[derive(Model)]
pub struct RecipeIngredients {
    #[rorm(primary_key)]
    uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub ingredient: ForeignModel<Ingredient>,

    pub amount: i32,

    pub unit: Option<Units>,
}

#[derive(Model)]
pub struct RecipeSteps {
    #[rorm(primary_key)]
    uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub step: MaxStr<1024>,

    pub index: i16,
}
