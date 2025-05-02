use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::prelude::ForeignModelByField;
use rorm::Model;
use uuid::Uuid;

use super::recipe::Recipe;
use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::Steps;

#[derive(Model)]
pub struct RecipeSteps {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    pub step: MaxStr<1024>,

    pub index: i16,
}

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
