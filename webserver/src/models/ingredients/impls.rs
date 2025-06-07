use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::transaction::Transaction;
use rorm::db::Executor;
use rorm::prelude::ForeignModelByField;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::RecipeIngredients;
use crate::models::ingredients::Ingredients;

impl Ingredients {
    pub async fn handle_mapping(
        transaction: &mut Transaction,
        recipe_uuid: Uuid,
        ingredients: Vec<RecipeIngredients>,
    ) -> Result<(), ApiError> {
        let mut guard = transaction.ensure_transaction().await?;
        // Fetch existing mappings from the database
        let existing_mappings: Vec<_> = rorm::query(guard.get_transaction(), Ingredients)
            .condition(Ingredients.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|item| item.uuid).collect();
        let mut target_set: HashSet<Uuid> = HashSet::new();

        for item in ingredients {
            match item.uuid {
                Some(uuid) => {
                    if existing_mappings.iter().any(|map| map.uuid == uuid) {
                        rorm::update(guard.get_transaction(), Ingredients)
                            .begin_dyn_set()
                            .set(Ingredients.name, item.name)
                            .set(Ingredients.amount, item.amount)
                            .set(Ingredients.unit, item.unit)
                            .finish_dyn_set()?
                            .condition(Ingredients.uuid.equals(uuid))
                            .await?;
                        target_set.insert(uuid);
                    }
                }
                None => {
                    rorm::insert(guard.get_transaction(), Ingredients)
                        .return_nothing()
                        .single(&Ingredients {
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
            rorm::delete(guard.get_transaction(), Ingredients)
                .condition(Ingredients.uuid.equals(uuid))
                .await?;
        }

        Ok(())
    }
}
