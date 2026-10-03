//! Domain model and data access helpers for ingredients attached to recipes.

use galvyn::core::re_exports::rorm;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::ForeignModelByField;
use galvyn::rorm::fields::types::MaxStr;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::ingredients::Ingredient;
use crate::models::ingredients::IngredientUuid;
use crate::models::ingredients::Units;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::db::RecipeIngredientModel;

/// A concrete ingredient entry within a specific recipe.
///
/// This type connects a recipe to an ingredient, along with the amount and
/// unit used in that recipe context.
#[derive(Debug, Clone)]
pub struct RecipeIngredient {
    /// The ingredient referenced by this entry.
    pub ingredients: IngredientUuid,
    /// The quantity of the ingredient used in the recipe.
    pub amount: i64,
    /// The unit of measurement for the quantity.
    pub unit: Units,
}

impl RecipeIngredient {
    /// Insert a bulk of [`Ingredients`] for a [`Recipe`](crate::model::recipe::Recipe)
    pub(in crate::models::recipes) async fn create_bulk(
        tx: &mut Transaction,
        uuid: RecipeUuid,
        ingredients: Vec<RecipeIngredientInsertParams>,
    ) -> DatabaseResult<()> {
        let mut models = vec![];
        for i in ingredients {
            let ingredient = Ingredient::query_uuid_or_create(&mut *tx, i.name).await?;
            models.push(RecipeIngredientModel {
                uuid: Uuid::new_v4(),
                ingredient: ForeignModelByField(ingredient.into_inner()),
                recipe: ForeignModelByField(uuid.into_inner()),
                amount: i.amount,
                unit: i.unit,
            });
        }

        rorm::insert(tx, RecipeIngredientModel)
            .return_nothing()
            .bulk(&models)
            .await?;

        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct RecipeIngredientInsertParams {
    pub name: MaxStr<255>,
    pub amount: i64,
    pub unit: Units,
}

impl From<RecipeIngredientModel> for RecipeIngredient {
    fn from(model: RecipeIngredientModel) -> Self {
        Self {
            ingredients: IngredientUuid::new(model.ingredient.0),
            unit: model.unit,
            amount: model.amount,
        }
    }
}
