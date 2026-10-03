//! Domain model and data access helpers for recipe steps.

use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::ForeignModelByField;
use galvyn::rorm::fields::types::MaxStr;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::db::RecipeStepModel;

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

impl RecipeStep {
    /// Insert a bulk of [`RecipeStep`] for a [`Recipe`](crate::model::recipe::Recipe)
    pub(in crate::models::recipes) async fn create_bulk(
        tx: &mut Transaction,
        uuid: RecipeUuid,
        steps: Vec<RecipeStepInsertParams>,
    ) -> DatabaseResult<()> {
        let models: Vec<_> = steps
            .into_iter()
            .map(|s| RecipeStepModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(uuid.into_inner()),
                step: s.step,
                index: s.index,
            })
            .collect();

        rorm::insert(tx, RecipeStepModel)
            .return_nothing()
            .bulk(&models)
            .await?;

        Ok(())
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
/// Strongly typed UUID wrapper for recipe steps to prevent cross-domain ID mix-ups.
pub struct RecipeStepUuid(Uuid);

#[derive(Debug, Clone)]
pub struct RecipeStepInsertParams {
    step: MaxStr<255>,
    index: i16,
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
