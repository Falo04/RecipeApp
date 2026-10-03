//! Domain model and data access helpers for recipe steps.

use std::collections::HashMap;

use galvyn::core::re_exports::rorm;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::ForeignModelByField;
use galvyn::rorm::fields::types::MaxStr;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::db::RecipeStepModel;
use crate::utils::typed_uuid::TypedUuid;

/// A single instruction step within a recipe.
///
/// Steps are ordered and carry a concise textual description to guide the
/// preparation process.
#[derive(Debug, Clone)]
pub struct RecipeStep {
    /// Primary key
    pub uuid: RecipeStepUuid,

    /// The textual content of the step.
    pub step: MaxStr<255>,

    /// The position of the step within the recipe flow.
    pub index: i16,
}

pub type RecipeStepUuid = TypedUuid<RecipeStep>;

impl RecipeStep {
    /// Query all steps of the given recipes, ordered by their index
    pub(in crate::models::recipes) async fn query_by_recipes(
        tx: &mut Transaction,
        uuids: &[RecipeUuid],
    ) -> DatabaseResult<HashMap<RecipeUuid, Vec<Self>>> {
        if uuids.is_empty() {
            return Ok(HashMap::new());
        }

        let result: Vec<_> = rorm::query(tx, RecipeStepModel)
            .condition(
                RecipeStepModel
                    .recipe
                    .r#in(uuids.iter().map(|r| r.into_inner()).collect::<Vec<_>>()),
            )
            .order_asc(RecipeStepModel.index)
            .all()
            .await?
            .into_iter()
            .map(|s| (RecipeUuid::new(s.recipe.0), Self::from(s)))
            .collect();

        let mut map: HashMap<RecipeUuid, Vec<Self>> = HashMap::new();
        for (r, s) in result {
            map.entry(r).or_default().push(s);
        }
        Ok(map)
    }

    /// Insert a bulk of [`RecipeStep`] for a [`Recipe`](crate::models::recipes::Recipe)
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

        if models.is_empty() {
            return Ok(());
        }

        rorm::insert(tx, RecipeStepModel)
            .return_nothing()
            .bulk(&models)
            .await?;

        Ok(())
    }
}

/// The parameters required to insert a new [`RecipeStep`]
#[derive(Debug, Clone)]
pub struct RecipeStepInsertParams {
    /// The textual content of the step.
    pub step: MaxStr<255>,
    /// The position of the step within the recipe flow.
    pub index: i16,
}

impl From<RecipeStepModel> for RecipeStep {
    fn from(model: RecipeStepModel) -> Self {
        Self {
            uuid: RecipeStepUuid::new(model.uuid),
            index: model.index,
            step: model.step,
        }
    }
}
