use super::schema::SimpleRecipe;
use crate::models::recipe::Recipe;

impl From<Recipe> for SimpleRecipe {
    fn from(value: Recipe) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            description: value.description,
        }
    }
}
