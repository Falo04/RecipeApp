//! Handles the mapping of ingredients to a recipe using
use std::collections::HashSet;

use futures_lite::StreamExt;
use rorm::db::transaction::Transaction;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::handler::recipes::schema::RecipeIngredient as RecipeIngredientsDto;
use crate::models::ingredients::Ingredient;
use crate::models::ingredients::RecipeIngredient;

impl RecipeIngredient {
    /// Handles mapping ingredients to a recipe.
    ///
    /// It updates existing recipe ingredients mappings or inserts new ones as needed.
    /// It also deletes any mappings that are no longer present in the ingredient list.
    ///
    /// # Arguments
    ///
    /// * `transaction`: A mutable transaction object for database operations.
    /// * `recipe_uuid`: The UUID of the recipe to which the ingredients are being mapped.
    /// * `ingredients`: A vector of `RecipeIngredientsDto` objects representing the ingredients to be mapped.
    pub async fn handle_mapping(
        transaction: &mut Transaction,
        recipe_uuid: Uuid,
        ingredients: Vec<RecipeIngredientsDto>,
    ) -> Result<(), ApiError> {
        let existing_mappings: Vec<_> = rorm::query(&mut *transaction, RecipeIngredient)
            .condition(RecipeIngredient.recipe.equals(recipe_uuid))
            .stream()
            .try_collect()
            .await?;

        let existing_set: HashSet<Uuid> = existing_mappings.iter().map(|item| item.uuid).collect();
        let mut target_set: HashSet<Uuid> = HashSet::new();

        for item in ingredients {
            match item.uuid {
                Some(uuid) => {
                    if existing_mappings.iter().any(|map| map.uuid == uuid) {
                        let ingre_uuid =
                            Ingredient::ok_or_insert(&mut *transaction, item.name).await?;
                        rorm::update(&mut *transaction, RecipeIngredient)
                            .begin_dyn_set()
                            .set(
                                RecipeIngredient.ingredients,
                                ForeignModelByField(ingre_uuid),
                            )
                            .set(RecipeIngredient.amount, item.amount)
                            .set(RecipeIngredient.unit, item.unit)
                            .finish_dyn_set()?
                            .condition(RecipeIngredient.uuid.equals(uuid))
                            .await?;
                        target_set.insert(uuid);
                    }
                }
                None => {
                    let ingre_uuid = Ingredient::ok_or_insert(&mut *transaction, item.name).await?;
                    rorm::insert(&mut *transaction, RecipeIngredient)
                        .return_nothing()
                        .single(&RecipeIngredient {
                            uuid: Uuid::new_v4(),
                            recipe: ForeignModelByField(recipe_uuid),
                            ingredients: ForeignModelByField(ingre_uuid),
                            amount: item.amount,
                            unit: item.unit,
                        })
                        .await?;
                }
            }
        }

        let to_delete: Vec<Uuid> = existing_set.difference(&target_set).cloned().collect();

        for uuid in to_delete {
            rorm::delete(&mut *transaction, RecipeIngredient)
                .condition(RecipeIngredient.uuid.equals(uuid))
                .await?;
        }

        Ok(())
    }
}

impl Ingredient {
    /// Inserts a new ingredient into the database if one doesn't already exist.
    ///
    /// This function attempts to retrieve an ingredient by its name from the database.
    /// If an ingredient with the given name exists, it's returned. Otherwise, a new
    /// ingredient is inserted with a generated UUID and its name, and the UUID is returned.
    ///
    /// # Arguments
    ///
    /// * `transaction`: A mutable reference to the database transaction.
    /// * `name`: The name of the ingredient to search for.
    pub async fn ok_or_insert(
        transaction: &mut Transaction,
        name: MaxStr,
    ) -> Result<Uuid, ApiError> {
        let Some(ingredient) = rorm::query(&mut *transaction, Ingredient)
            .condition(Ingredient.name.equals(&*name))
            .optional()
            .await?
        else {
            return Ok(rorm::insert(&mut *transaction, Ingredient)
                .return_primary_key()
                .single(&Ingredient {
                    uuid: Uuid::new_v4(),
                    name,
                })
                .await?);
        };
        Ok(ingredient.uuid)
    }
}
