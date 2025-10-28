use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub enum WsServerMsg {
    RecipesChanged,
    TagsChanged,
    IngredientsChanged,
}
