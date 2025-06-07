mod impls;

use rorm::field;
use rorm::fields::types::MaxStr;
use rorm::prelude::BackRef;
use rorm::prelude::ForeignModel;
use rorm::Model;
use rorm::Patch;
use time::OffsetDateTime;
use uuid::Uuid;

use super::users::User;
use crate::models::ingredients::Ingredients;
use crate::models::tags::Tag;

#[derive(Model)]
pub struct Recipe {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,

    pub description: MaxStr<1024>,

    pub user: Option<ForeignModel<User>>,

    pub tags: BackRef<field!(RecipeTag.recipe)>,

    pub ingredients: BackRef<field!(Ingredients.recipe)>,

    pub steps: BackRef<field!(RecipeSteps.recipe)>,

    pub created_at: OffsetDateTime,
}

#[derive(Model)]
pub struct RecipeSteps {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub step: MaxStr<256>,

    pub index: i16,
}

#[derive(Model)]
pub struct RecipeTag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<Tag>,
}

#[derive(Patch)]
#[rorm(model = "Recipe")]
pub struct RecipePatch {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub description: MaxStr<1024>,
    pub user: Option<ForeignModel<User>>,
    pub created_at: OffsetDateTime,
}
