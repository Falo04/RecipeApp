use galvyn::rorm::field;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::BackRef;
use galvyn::rorm::prelude::ForeignModel;
use galvyn::rorm::Model;
use galvyn::rorm::Patch;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::models::account::db::AccountModel;
use crate::models::recipe_ingredients::db::RecipeIngredientModel;
use crate::models::recipe_steps::db::RecipeStepModel;
use crate::models::tags::db::RecipeTagModel;

/// Represents a recipe model
///
/// With details like name, description, user association, tags, ingredients, and steps.
#[derive(Model)]
#[rorm(rename = "recipe")]
pub struct RecipeModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the recipe.
    #[rorm(unique)]
    pub name: MaxStr<255>,

    /// A longer description of the recipe.
    pub description: MaxStr<255>,

    /// A foreign key referencing a `User` model.
    pub user: ForeignModel<AccountModel>,

    /// A back-reference to the `RecipeTag` model
    ///
    /// Representing the tags associated with this recipe.
    pub tags: BackRef<field!(RecipeTagModel.recipe)>,

    /// A back-reference to the `RecipeIngredients` model
    ///
    /// Representing the ingredients used in this recipe.
    pub ingredients: BackRef<field!(RecipeIngredientModel.recipe)>,

    /// A back-reference to the `RecipeSteps` model
    ///
    /// Representing the steps involved in preparing this recipe.
    pub steps: BackRef<field!(RecipeStepModel.recipe)>,

    pub created_at: OffsetDateTime,
}

#[derive(Debug, Patch)]
#[rorm(model = "RecipeModel")]
pub struct RecipeModelInsert {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub description: MaxStr<255>,
    pub user: ForeignModel<AccountModel>,
    pub created_at: OffsetDateTime,
}
