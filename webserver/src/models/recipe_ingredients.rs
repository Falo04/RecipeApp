use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::DbEnum;
use rorm::Model;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

use super::recipe::Recipe;
use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::Ingredients;

#[derive(Model)]
pub struct RecipeIngredients {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub name: MaxStr<255>,

    pub amount: i32,

    pub unit: Units,
}

#[derive(
    DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema, PartialEq, PartialOrd, Eq, Ord,
)]
pub enum Units {
    Cup = 0,
    Gram = 1,
    Kilogram = 2,
    Liter = 3,
    Milliliter = 4,
    Tablespoon = 5,
    Teaspoon = 6,
}

impl RecipeIngredients {
    pub async fn handle_mapping(
        executor: impl Executor<'_>,
        recipe_uuid: Uuid,
        ingredients: Vec<Ingredients>,
    ) -> Result<(), ApiError> {
        let mut guard = executor.ensure_transaction().await?;
        // Fetch existing mappings from the database
        let existing_mappings: Vec<_> = rorm::query(guard.get_transaction(), RecipeIngredients)
            .condition(RecipeIngredients.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|item| item.uuid).collect();
        let mut target_set: HashSet<Uuid> = HashSet::new();

        for item in ingredients {
            match item.uuid {
                Some(uuid) => {
                    if existing_mappings.iter().any(|map| map.uuid == uuid) {
                        rorm::update(guard.get_transaction(), RecipeIngredients)
                            .begin_dyn_set()
                            .set(RecipeIngredients.name, item.name)
                            .set(RecipeIngredients.amount, item.amount)
                            .set(RecipeIngredients.unit, item.unit)
                            .finish_dyn_set()?
                            .condition(RecipeIngredients.uuid.equals(uuid))
                            .await?;
                        target_set.insert(uuid);
                    }
                }
                None => {
                    rorm::insert(guard.get_transaction(), RecipeIngredients)
                        .return_nothing()
                        .single(&RecipeIngredients {
                            uuid: Uuid::new_v4(),
                            recipe: ForeignModelByField(recipe_uuid),
                            name: item.name,
                            amount: item.amount,
                            unit: item.unit,
                        })
                        .await?;
                }
            }
        }

        let to_delete: Vec<Uuid> = existing_set.difference(&target_set).cloned().collect();

        for uuid in to_delete {
            rorm::delete(guard.get_transaction(), RecipeIngredients)
                .condition(RecipeIngredients.uuid.equals(uuid))
                .await?;
        }

        Ok(())
    }
}
