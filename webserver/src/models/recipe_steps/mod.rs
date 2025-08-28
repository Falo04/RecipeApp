use futures_util::TryStreamExt;
use galvyn::core::stuff::api_error::ApiResult;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use uuid::Uuid;

use crate::models::ingredients::IngredientUuid;
use crate::models::recipe_steps::db::RecipeStepModel;
use crate::models::recipes::RecipeUuid;

pub(in crate::models) mod db;

#[derive(Debug, Clone)]
pub struct RecipeStep {
    pub uuid: RecipeStepUuid,

    /// A foreign key referencing the `Recipe` model
    pub recipe: RecipeUuid,

    /// The text of the step.
    ///
    /// It's a string with a maximum length of 256 characters.
    pub step: MaxStr<255>,

    /// The order of the step within the recipe.
    pub index: i16,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct RecipeStepUuid(pub Uuid);

impl RecipeStep {
    #[instrument(name = "RecipeStep::query_by_recipe", skip(exe))]
    pub async fn query_all_for_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
    ) -> ApiResult<Vec<Self>> {
        let result = rorm::query(exe, RecipeStepModel)
            .condition(RecipeStepModel.recipe.equals(recipe_uuid.0))
            .stream()
            .map_ok(|model| RecipeStep::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    #[instrument(name = "RecipeStep::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
        step: MaxStr<255>,
        index: i16,
    ) -> ApiResult<RecipeStep> {
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

    #[instrument(name = "RecipeStep::delete", skip(exe))]
    pub async fn delete(exe: impl Executor<'_>, ingredient_uuid: IngredientUuid) -> ApiResult<()> {
        rorm::delete(exe, RecipeStepModel)
            .condition(RecipeStepModel.uuid.equals(ingredient_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<RecipeStepModel> for RecipeStep {
    fn from(model: RecipeStepModel) -> Self {
        Self {
            uuid: RecipeStepUuid(model.uuid),
            recipe: RecipeUuid(model.recipe.0),
            index: model.index,
            step: model.step,
        }
    }
}
