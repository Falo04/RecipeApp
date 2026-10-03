//! Represents an ingredient in a recipe.

use galvyn::core::re_exports::rorm;
use galvyn::rorm::conditions;
use galvyn::rorm::conditions::Condition;
use galvyn::rorm::db::Executor;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::MaxStr;
use tracing::instrument;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::ingredients::db::__IngredientModel_ValueSpaceImpl;
use crate::models::ingredients::db::IngredientModel;
use crate::utils::typed_uuid::TypedUuid;

pub(in crate::models) mod db;

/// Domain representation of ingredient.
#[derive(Debug, Clone)]
pub struct Ingredient {
    /// Stable identifier for this ingredient.
    pub uuid: IngredientUuid,

    /// The name of the ingredient
    pub name: MaxStr<255>,
}

pub type IngredientUuid = TypedUuid<Ingredient>;

impl Ingredient {
    /// Fetches all ingredients ordered by name.
    #[instrument(name = "Ingredient::query_all", skip(db))]
    pub async fn query_all(db: impl Executor<'_>) -> DatabaseResult<Vec<Self>> {
        Self::query_by_condition(db, |_| conditions::Value::Bool(true)).await
    }

    /// Inserts a new ingredient into the database if one doesn't already exist.
    ///
    /// This function attempts to retrieve an ingredient by its name from the database.
    /// If an ingredient with the given name exists, it's returned. Otherwise, a new
    /// ingredient is inserted with a generated UUID and its name, and the UUID is returned.
    #[instrument(name = "Ingredient::query_uuid_or_create", skip(tx))]
    pub async fn query_uuid_or_create(
        tx: &mut Transaction,
        name: MaxStr<255>,
    ) -> DatabaseResult<IngredientUuid> {
        if let Some(ingredient) = Self::query_by_condition(&mut *tx, |m| m.name.equals(&name))
            .await?
            .into_iter()
            .next()
        {
            return Ok(ingredient.uuid);
        }

        let ingredient = rorm::insert(&mut *tx, IngredientModel)
            .single(&IngredientModel {
                uuid: Uuid::new_v4(),
                name,
            })
            .await?;

        Ok(IngredientUuid::new(ingredient.uuid))
    }

    /// Query ingredients by a condition, ordered by name
    async fn query_by_condition<'cond, C>(
        db: impl Executor<'_>,
        cond: impl FnOnce(__IngredientModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        Ok(rorm::query(db, IngredientModel)
            .order_asc(IngredientModel.name)
            .condition(cond(IngredientModel))
            .all()
            .await?
            .into_iter()
            .map(Self::from)
            .collect())
    }
}

impl From<IngredientModel> for Ingredient {
    fn from(model: IngredientModel) -> Self {
        Self {
            uuid: IngredientUuid::new(model.uuid),
            name: model.name,
        }
    }
}
