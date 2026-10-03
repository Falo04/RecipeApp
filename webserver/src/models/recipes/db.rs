//! Database model for recipes

use galvyn::rorm::Model;
use galvyn::rorm::Patch;
use galvyn::rorm::field;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::BackRef;
use galvyn::rorm::prelude::ForeignModel;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::custom_db_enum;
use crate::models::ingredients::Units;
use crate::models::ingredients::db::IngredientModel;
use crate::models::tags::db::TagModel;
use crate::models::user::db::UserModel;

/// Represents a recipe model
///
/// With details like name, description, user association, tags, ingredients, and steps.
#[derive(Model)]
#[rorm(rename = "recipe")]
pub struct RecipeModel {
    /// Primary key
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The name of the recipe.
    #[rorm(unique)]
    pub name: MaxStr<255>,

    /// A longer description of the recipe.
    pub description: MaxStr<255>,

    /// A foreign key referencing a `User` model.
    pub user: ForeignModel<UserModel>,

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

    /// When the recipe was created
    #[rorm(auto_create_time)]
    pub created_at: OffsetDateTime,
}

/// Patch for recipes
#[derive(Debug, Patch)]
#[rorm(model = "RecipeModel")]
pub struct RecipeModelPatch {
    /// Primary key
    pub uuid: Uuid,
    /// The name of the recipe.
    pub name: MaxStr<255>,
    /// A longer description of the recipe.
    pub description: MaxStr<255>,
    /// A foreign key referencing a `User` model.
    pub user: ForeignModel<UserModel>,
}

/// Represents a tag associated with a recipe.
///
/// This struct defines a relationship between a `Recipe` and a `Tag`.
#[derive(Model)]
#[rorm(rename = "recipe_tag")]
pub struct RecipeTagModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing a `Recipe` object.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// A foreign key referencing a `Tag` object.
    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<TagModel>,
}

/// Represents a single step in a recipe.
///
/// This struct is used to store the individual steps of a recipe.
#[derive(Model)]
#[rorm(rename = "recipe_step")]
pub struct RecipeStepModel {
    /// Primary key
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// The text of the step.
    pub step: MaxStr<255>,

    /// The order of the step within the recipe.
    pub index: i16,
}

/// Represents the ingredients for a recipe.
///
/// This struct models the ingredients within a recipe, linking to the
/// `Recipe` and `Ingredients` models using foreign keys.
#[derive(Model)]
#[rorm(rename = "recipe_ingredient")]
pub struct RecipeIngredientModel {
    /// Pimary key
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// A foreign key referencing the `Recipe` model, indicating which recipe this ingredient belongs to.
    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<RecipeModel>,

    /// A foreign key referencing the `Ingredients` model, specifying the type of ingredient.
    pub ingredient: ForeignModel<IngredientModel>,

    /// The quantity of the ingredient.
    pub amount: i64,

    /// The unit of measurement for the ingredient.
    pub unit: Units,
}

custom_db_enum!(
    enum: Units,
    variants: [Cup, Gram, Kilogram, Liter, Milliliter, Tablespoon, Teaspoon, None],
    decoder: UnitsDecoder
);
