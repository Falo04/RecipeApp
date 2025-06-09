//! Represents a recipe.
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
use crate::models::ingredients::RecipeIngredient;
use crate::models::tags::RecipeTag;

/// Represents a recipe
///
/// With details like name, description, user association, tags, ingredients, and steps.
#[derive(Model)]
pub struct Recipe {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the recipe, with a maximum length of 255 characters.  Must be unique.
    #[rorm(unique)]
    pub name: MaxStr<255>,

    /// A longer description of the recipe, with a maximum length of 255 characters.
    pub description: MaxStr<255>,

    /// An optional foreign key referencing a `User` model.
    pub user: Option<ForeignModel<User>>,

    /// A back-reference to the `RecipeTag` model
    ///
    /// Representing the tags associated with this recipe.
    pub tags: BackRef<field!(RecipeTag.recipe)>,

    /// A back-reference to the `RecipeIngredients` model
    ///
    /// Representing the ingredients used in this recipe.
    pub ingredients: BackRef<field!(RecipeIngredient.recipe)>,

    /// A back-reference to the `RecipeSteps` model
    ///
    /// Representing the steps involved in preparing this recipe.
    pub steps: BackRef<field!(RecipeStep.recipe)>,

    pub created_at: OffsetDateTime,
}

/// Represents a single step in a recipe.
///
/// This struct is used to store the individual steps of a recipe.
#[derive(Model)]
pub struct RecipeStep {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    /// The text of the step.
    ///
    /// It's a string with a maximum length of 256 characters.
    pub step: MaxStr<255>,

    /// The order of the step within the recipe.
    pub index: i16,
}

/// Represents a patch to update a `Recipe` model.
#[derive(Patch)]
#[rorm(model = "Recipe")]
pub struct RecipePatch {
    pub uuid: Uuid,
    pub name: MaxStr<255>,
    pub description: MaxStr<255>,
    pub user: Option<ForeignModel<User>>,
    pub created_at: OffsetDateTime,
}
