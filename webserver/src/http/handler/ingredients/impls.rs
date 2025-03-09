use super::schema::SimpleIngredient;
use crate::models::ingredients::Ingredient;

impl From<Ingredient> for SimpleIngredient {
    fn from(value: Ingredient) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            unit: value.unit,
        }
    }
}
