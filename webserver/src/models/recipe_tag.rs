use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::Executor;
use rorm::prelude::ForeignModel;
use rorm::prelude::ForeignModelByField;
use rorm::Model;
use uuid::Uuid;

use super::recipe::Recipe;
use super::tags::Tag;

#[derive(Model)]
pub struct RecipeTag {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    #[rorm(on_delete = "Cascade")]
    pub recipe: ForeignModel<Recipe>,

    #[rorm(on_delete = "Cascade")]
    pub tag: ForeignModel<Tag>,
}

impl RecipeTag {
    pub async fn create_or_delete_mappings(
        executor: impl Executor<'_>,
        recipe_uuid: Uuid,
        tags_uuid: &[Uuid],
    ) -> Result<(), rorm::Error> {
        let mut guard = executor.ensure_transaction().await?;

        // Fetch existing mappings for the given recipe
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
