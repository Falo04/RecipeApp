//! Domain model and data access helpers for ingredients attached to recipes.
use futures_util::TryStreamExt;
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::db::Executor;
use galvyn::rorm::prelude::ForeignModelByField;
use tracing::instrument;
use uuid::Uuid;

use crate::models::ingredients::IngredientUuid;
use crate::models::ingredients::Units;
use crate::models::recipe_ingredients::db::RecipeIngredientModel;
use crate::models::recipes::RecipeUuid;

pub(in crate::models) mod db;

/// A concrete ingredient entry within a specific recipe.
///
/// This type connects a recipe to an ingredient, along with the amount and
/// unit used in that recipe context.
#[derive(Debug, Clone)]
pub struct RecipeIngredient {
    /// Stable identifier for this recipe-ingredient association.
    pub uuid: RecipeIngredientUuid,

    /// The ingredient referenced by this entry.
    pub ingredients: IngredientUuid,

    /// The quantity of the ingredient used in the recipe.
    pub amount: i64,

    /// The unit of measurement for the quantity.
    pub unit: Units,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RecipeIngredientUuid(pub Uuid);

impl RecipeIngredient {
    /// Lists all ingredient entries for a given recipe.
    #[instrument(name = "RecipeIngredient::query_by_recipe", skip(exe))]
    pub async fn query_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
    ) -> anyhow::Result<Vec<Self>> {
        let result: Vec<_> = rorm::query(exe, RecipeIngredientModel)
            .condition(RecipeIngredientModel.recipe.equals(recipe_uuid.0))
            .stream()
            .map_ok(|model| RecipeIngredient::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    /// Creates a new ingredient entry for a recipe.
    #[instrument(name = "RecipeIngredient::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
        ingredient_uuid: IngredientUuid,
        amount: i64,
        unit: Units,
    ) -> anyhow::Result<RecipeIngredient> {
        let model = rorm::insert(exe, RecipeIngredientModel)
            .single(&RecipeIngredientModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(recipe_uuid.0),
                ingredients: ForeignModelByField(ingredient_uuid.0),
                amount,
                unit,
            })
            .await?;

        Ok(RecipeIngredient::from(model))
    }

    /// Removes a single ingredient entry from a recipe by its identifier.
    #[instrument(name = "RecipeIngredient::delete", skip(exe))]
    pub async fn delete(
        exe: impl Executor<'_>,
        recipe_ingredient_uuid: IngredientUuid,
    ) -> anyhow::Result<()> {
        rorm::delete(exe, RecipeIngredientModel)
            .condition(RecipeIngredientModel.uuid.equals(recipe_ingredient_uuid.0))
            .await?;
        Ok(())
    }

    /// Removes all ingredient entries associated with a recipe.
    #[instrument(name = "RecipeIngredient::delete_by_recipe", skip(exe))]
    pub async fn delete_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
    ) -> anyhow::Result<()> {
        rorm::delete(exe, RecipeIngredientModel)
            .condition(RecipeIngredientModel.recipe.equals(recipe_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<RecipeIngredientModel> for RecipeIngredient {
    fn from(model: RecipeIngredientModel) -> Self {
        Self {
            uuid: RecipeIngredientUuid(model.uuid),
            ingredients: IngredientUuid(model.ingredients.0),
            unit: model.unit,
            amount: model.amount,
        }
    }
}
