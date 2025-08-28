use futures_util::TryStreamExt;
use rorm::db::Executor;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use uuid::Uuid;

use crate::http::common::errors::ApiResult;
use crate::models::ingredients::db::Units;
use crate::models::ingredients::IngredientUuid;
use crate::models::recipe_ingredients::db::RecipeIngredientModel;
use crate::models::recipes::RecipeUuid;

pub(in crate::models) mod db;

#[derive(Debug, Clone)]
pub struct RecipeIngredient {
    pub uuid: RecipeIngredientUuid,

    /// A foreign key referencing the `Recipe` model, indicating which recipe this ingredient belongs to.
    pub recipe: RecipeUuid,

    /// A foreign key referencing the `Ingredients` model, specifying the type of ingredient.
    pub ingredients: IngredientUuid,

    /// The quantity of the ingredient.
    pub amount: i32,

    /// The unit of measurement for the ingredient.
    pub unit: Units,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct RecipeIngredientUuid(pub Uuid);

impl RecipeIngredient {
    #[instrument(name = "RecipeIngredient::query_by_recipe", skip(exe))]
    pub async fn query_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
    ) -> ApiResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(exe, RecipeIngredientModel)
            .condition(RecipeIngredientModel.recipe.equals(recipe_uuid.0))
            .stream()
            .map_ok(|model| RecipeIngredient::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    #[instrument(name = "RecipeIngredient::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
        ingredient_uuid: IngredientUuid,
        amount: i32,
        unit: Units,
    ) -> ApiResult<RecipeIngredient> {
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

    #[instrument(name = "RecipeIngredient::delete", skip(exe))]
    pub async fn delete(
        exe: impl Executor<'_>,
        recipe_ingredient_uuid: RecipeIngredientUuid,
    ) -> ApiResult<()> {
        rorm::delete(exe, RecipeIngredientModel)
            .condition(RecipeIngredientModel.uuid.equals(recipe_ingredient_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<RecipeIngredientModel> for RecipeIngredient {
    fn from(model: RecipeIngredientModel) -> Self {
        Self {
            uuid: RecipeIngredientUuid(model.uuid),
            recipe: RecipeUuid(model.recipe.0),
            ingredients: IngredientUuid(model.ingredients.0),
            unit: model.unit,
            amount: model.amount,
        }
    }
}
