//! The data changes the websocket pushes to clients

use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;

/// A data change: one kind of data changed, without saying which record
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq)]
pub enum WsServerMsg {
    /// Recipes were created, updated or deleted
    RecipesChanged,
    /// Tags were created, updated or deleted
    TagsChanged,
    /// Ingredients were created
    IngredientsChanged,
}
