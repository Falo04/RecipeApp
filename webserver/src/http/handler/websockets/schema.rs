use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub enum WsServerMsg {
    RecipesChanged {},
    TagsChanged {},
    IngredientsChanged {},
}