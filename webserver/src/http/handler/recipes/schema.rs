//! Represents all recipe responses and requests.

use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::core::stuff::schema::GetPageRequest;
use galvyn::rorm::fields::types::MaxStr;

use crate::http::handler::account::schema::SimpleAccount;
use crate::http::handler::ingredients::schema::FullIngredient;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::account::AccountUuid;
use crate::models::recipe_steps::RecipeStepUuid;
use crate::models::recipes::RecipeUuid;
use crate::models::tags::TagUuid;

/// Represents a simple recipe with associated tags.
///
/// This struct contains information about a recipe, including its unique identifier,
/// name, description, and a list of associated tags.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleRecipeWithTags {
    /// The identifier for the recipe.
    pub uuid: RecipeUuid,

    /// The name of the recipe (string, maximum length 255).
    pub name: MaxStr<255>,

    /// The description of the recipe (string, maximum length 1024).
    pub description: MaxStr<255>,

    /// A vector of `SimpleTag` objects representing the tags associated with the recipe.
    pub tags: Vec<SimpleTag>,
}

/// Represents a complete recipe with all associated details.
///
/// This struct contains information about a recipe, including its unique identifier,
/// name, description, user, tags, ingredients, and steps.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct FullRecipe {
    /// The identifier for the recipe.
    pub uuid: RecipeUuid,

    /// The name of the recipe (string, maximum length 255).
    pub name: MaxStr<255>,

    /// The description of the recipe (string, maximum length 1024).
    pub description: MaxStr<255>,

    /// An optional reference to a simple user object associated with the recipe.
    pub user: SimpleAccount,

    /// A vector of `SimpleTag` objects representing the tags associated with the recipe.
    pub tags: Vec<SimpleTag>,

    /// A vector of `RecipeIngredients` objects representing
    /// the ingredients associated with the recipe.
    pub ingredients: Vec<FullIngredient>,

    /// A vector of `Steps` objects representing the steps associated with the recipe.
    pub steps: Vec<Step>,
}

/// Represents a single step in a process.
///
/// This struct will be used for Response and Request.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Step {
    /// An optional UUID representing the step
    ///
    /// In case of a request:
    /// - if Some(uuid), the mapping must be updated because it already exists
    /// - if None, the mapping must be created
    ///
    /// In case of a response: The uuid must be set.
    pub uuid: Option<RecipeStepUuid>,

    /// The actual value of the step (string, maximum length 255).
    pub step: MaxStr<255>,

    /// Representing the step's position in the sequence.
    pub index: i16,
}

/// Represents the request body for creating a new recipe.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct CreateOrUpdateRecipe {
    /// The name of the recipe
    pub name: MaxStr<255>,

    /// the description of the recipe
    pub description: MaxStr<255>,

    /// Optional user which is associated with the recipe.
    ///
    /// Optional because if authentication is disabled, I don't know who created the recipe.
    /// If authentication is enabled, user must be set.
    pub user: Option<AccountUuid>,

    /// Vector of tag Uuids.
    pub tags: Vec<TagUuid>,

    /// Vector of all `RecipeIngredients`.
    pub ingredients: Vec<FullIngredient>,

    /// Vector of all `Steps`.
    pub steps: Vec<Step>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GetAllRecipesRequest {
    /// Page request
    #[serde(flatten)]
    pub page: GetPageRequest,

    /// Search for recipe name
    pub filter_name: Option<String>,
}
