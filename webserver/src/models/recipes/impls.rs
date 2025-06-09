use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::transaction::Transaction;
use rorm::prelude::ForeignModelByField;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::Step;
use crate::models::recipes::RecipeStep;

impl RecipeStep {
    /// Handles the mapping of recipe steps.
    ///
    /// This function processes a list of steps to update or insert into a database table
    /// representing recipe steps. It ensures that existing steps are accounted for,
    /// and inserts or updates the database accordingly.
    ///
    /// # Arguments
    ///
    /// * `executor`: An executor that provides transaction management capabilities.
    /// * `recipe_uuid`: The UUID of the recipe to which the steps belong.
    /// * `steps`: A vector of `Steps` structs, each containing information about a step to be processed.
    pub async fn handle_mapping(
        transaction: &mut Transaction,
        recipe_uuid: Uuid,
        steps: Vec<Step>,
    ) -> Result<(), ApiError> {
        let existing_mappings: Vec<_> = rorm::query(&mut *transaction, RecipeStep)
            .condition(RecipeStep.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|item| item.uuid).collect();
        let mut target_set: HashSet<Uuid> = HashSet::new();

        for item in steps {
            match item.uuid {
                Some(uuid) => {
                    if existing_mappings.iter().any(|map| map.uuid == uuid) {
                        rorm::update(&mut *transaction, RecipeStep)
                            .begin_dyn_set()
                            .set(RecipeStep.step, item.step)
                            .finish_dyn_set()?
                            .condition(RecipeStep.uuid.equals(uuid))
                            .await?;
                        target_set.insert(uuid);
                    }
                }
                None => {
                    rorm::insert(&mut *transaction, RecipeStep)
                        .return_nothing()
                        .single(&RecipeStep {
                            uuid: Uuid::new_v4(),
                            recipe: ForeignModelByField(recipe_uuid),
                            step: item.step,
                            index: item.index,
                        })
                        .await?;
                }
            }
        }

        let to_delete: Vec<Uuid> = existing_set.difference(&target_set).cloned().collect();

        for uuid in to_delete {
            rorm::delete(&mut *transaction, RecipeStep)
                .condition(RecipeStep.uuid.equals(uuid))
                .await?;
        }

        Ok(())
    }
}
