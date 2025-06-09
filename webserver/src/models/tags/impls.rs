use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::transaction::Transaction;
use rorm::prelude::ForeignModelByField;
use uuid::Uuid;

use crate::models::tags::RecipeTag;

impl RecipeTag {
    /// Creates or deletes mappings between recipes and tags.
    ///
    /// This function manages the relationship between recipes and tags within the database.
    /// It either inserts new mappings if they don't exist, or deletes existing mappings
    /// if the tags associated with a recipe have been removed.
    ///
    /// # Arguments
    ///
    /// * `executor`: An executor instance that handles database transactions.
    /// * `recipe_uuid`: The UUID of the recipe to update.
    /// * `tags_uuid`: A slice of UUIDs representing the tags to associate with the recipe.
    pub async fn create_or_delete_mappings(
        transaction: &mut Transaction,
        recipe_uuid: Uuid,
        tags_uuid: &[Uuid],
    ) -> Result<(), rorm::Error> {
        // Fetch existing mappings for the given recipes
        let existing_mappings: Vec<_> = rorm::query(&mut *transaction, RecipeTag)
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
            rorm::insert(&mut *transaction, RecipeTag)
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
            rorm::delete(&mut *transaction, RecipeTag)
                .condition(RecipeTag.uuid.equals(tag_uuid))
                .await?;
        }

        Ok(())
    }
}
