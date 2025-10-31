//! Domain model and data access helpers for recipe steps.
use futures_util::TryStreamExt;
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::db::Executor;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::ForeignModelByField;
use tracing::instrument;
use uuid::Uuid;

use crate::models::ingredients::IngredientUuid;
use crate::models::recipe_steps::db::RecipeStepModel;
use crate::models::recipes::RecipeUuid;

pub(in crate::models) mod db;

/// A single instruction step within a recipe.
///
/// Steps are ordered and carry a concise textual description to guide the
/// preparation process.
#[derive(Debug, Clone)]
pub struct RecipeStep {
    /// Stable identifier for this recipe step.
    pub uuid: RecipeStepUuid,

    /// The textual content of the step.
    pub step: MaxStr<255>,

    /// The position of the step within the recipe flow.
    pub index: i16,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
/// Strongly typed UUID wrapper for recipe steps to prevent cross-domain ID mix-ups.
pub struct RecipeStepUuid(pub Uuid);

impl RecipeStep {
    /// Lists all steps belonging to a recipe.
    #[instrument(name = "RecipeStep::query_by_recipe", skip(exe))]
    pub async fn query_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
    ) -> anyhow::Result<Vec<Self>> {
        let result = rorm::query(exe, RecipeStepModel)
            .condition(RecipeStepModel.recipe.equals(recipe_uuid.0))
            .order_asc(RecipeStepModel.index)
            .stream()
            .map_ok(|model| RecipeStep::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    /// Creates a new step for a recipe.
    #[instrument(name = "RecipeStep::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
        step: MaxStr<255>,
        index: i16,
    ) -> anyhow::Result<RecipeStep> {
        let model = rorm::insert(exe, RecipeStepModel)
            .single(&RecipeStepModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(recipe_uuid.0),
                index,
                step,
            })
            .await?;

        Ok(RecipeStep::from(model))
    }

    /// Deletes a single step by its identifier.
    #[instrument(name = "RecipeStep::delete", skip(exe))]
    pub async fn delete(&self, exe: impl Executor<'_>) -> anyhow::Result<()> {
        rorm::delete(exe, RecipeStepModel)
            .condition(RecipeStepModel.uuid.equals(self.uuid.0))
            .await?;
        Ok(())
    }

    /// Deletes all steps associated with a recipe.
    #[instrument(name = "RecipeStep::delete_by_recipe", skip(exe))]
    pub async fn delete_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
    ) -> anyhow::Result<()> {
        rorm::delete(exe, RecipeStepModel)
            .condition(RecipeStepModel.recipe.equals(recipe_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<RecipeStepModel> for RecipeStep {
    fn from(model: RecipeStepModel) -> Self {
        Self {
            uuid: RecipeStepUuid(model.uuid),
            index: model.index,
            step: model.step,
        }
    }
}
