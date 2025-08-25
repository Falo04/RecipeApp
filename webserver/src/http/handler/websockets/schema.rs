use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub enum WsServerMsg {
    RecipesChanged,
    TagsChanged,
    IngredientsChanged,
}
