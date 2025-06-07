use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::Executor;
use rorm::prelude::ForeignModelByField;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::Steps;
use crate::models::recipes::RecipeSteps;
use crate::models::recipes::RecipeTag;

impl RecipeSteps {
    pub async fn handle_mapping(
        executor: impl Executor<'_>,
        recipe_uuid: Uuid,
        steps: Vec<Steps>,
    ) -> Result<(), ApiError> {
        let mut guard = executor.ensure_transaction().await?;

        let existing_mappings: Vec<_> = rorm::query(guard.get_transaction(), RecipeSteps)
            .condition(RecipeSteps.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|item| item.uuid).collect();
        let mut target_set: HashSet<Uuid> = HashSet::new();

        for item in steps {
            match item.uuid {
                Some(uuid) => {
                    if existing_mappings.iter().any(|map| map.uuid == uuid) {
                        rorm::update(guard.get_transaction(), RecipeSteps)
                            .begin_dyn_set()
                            .set(RecipeSteps.step, item.step)
                            .finish_dyn_set()?
                            .condition(RecipeSteps.uuid.equals(uuid))
                            .await?;
                        target_set.insert(uuid);
                    }
                }
                None => {
                    rorm::insert(guard.get_transaction(), RecipeSteps)
                        .return_nothing()
                        .single(&RecipeSteps {
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
            rorm::delete(guard.get_transaction(), RecipeSteps)
                .condition(RecipeSteps.uuid.equals(uuid))
                .await?;
        }

        Ok(())
    }
}

impl RecipeTag {
    pub async fn create_or_delete_mappings(
        executor: impl Executor<'_>,
        recipe_uuid: Uuid,
        tags_uuid: &[Uuid],
    ) -> Result<(), rorm::Error> {
        let mut guard = executor.ensure_transaction().await?;

        // Fetch existing mappings for the given recipes
        let existing_mappings: Vec<_> = rorm::query(guard.get_transaction(), RecipeTag)
            .condition(RecipeTag.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|map| map.tag.0).collect();
        let target_set: HashSet<Uuid> = tags_uuid.iter().cloned().collect();

        // Determine which tags need to be added or removed
        let to_insert: Vec<Uuid> = target_set.difference(&existing_set).cloned().collect();
        let to_delete: Vec<Uuid> = existing_set.difference(&target_set).cloned().collect();

        // Insert new mappings
        for tag_uuid in to_insert {
            rorm::insert(guard.get_transaction(), RecipeTag)
                .return_nothing()
                .single(&RecipeTag {
                    uuid: Uuid::new_v4(),
                    recipe: ForeignModelByField(recipe_uuid),
                    tag: ForeignModelByField(tag_uuid),
                })
                .await?;
        }

        // Delete old mappings
        for tag_uuid in to_delete {
            rorm::delete(guard.get_transaction(), RecipeTag)
                .condition(RecipeTag.uuid.equals(tag_uuid))
                .await?;
        }

        guard.commit().await?;
        Ok(())
    }
}
