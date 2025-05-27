use rorm::field;
use rorm::fields::types::MaxStr;
use rorm::prelude::BackRef;
use rorm::prelude::ForeignModel;
use rorm::Model;
use rorm::Patch;
use time::OffsetDateTime;
use uuid::Uuid;

use super::recipe_ingredients::RecipeIngredients;
use super::recipe_steps::RecipeSteps;
use super::recipe_tag::RecipeTag;
use super::user::User;

#[derive(Model)]
pub struct Recipe {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(unique)]
    pub name: MaxStr<255>,

    pub description: MaxStr<1024>,

    pub user: Option<ForeignModel<User>>,

    pub tags: BackRef<field!(RecipeTag.recipe)>,

    pub ingredients: BackRef<field!(RecipeIngredients.recipe)>,

    pub steps: BackRef<field!(RecipeSteps.recipe)>,

    pub created_at: OffsetDateTime,
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
