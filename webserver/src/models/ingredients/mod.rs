//! Represents an ingredient in a recipe.

use futures_util::TryStreamExt;
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::db::Executor;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::ForeignModel;
use galvyn::rorm::DbEnum;
use tracing::instrument;
use uuid::Uuid;

use crate::models::ingredients::db::IngredientModel;

pub(in crate::models) mod db;

/// Domain representation of ingredient.
#[derive(Debug, Clone)]
pub struct Ingredient {
    /// Stable identifier for this ingredient.
    pub uuid: IngredientUuid,

    /// The name of the ingredient
    pub name: MaxStr<255>,
}

/// Strongly typed UUID for ingredients to avoid mixing IDs across domains.
#[derive(Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
pub struct IngredientUuid(Uuid);

impl IngredientUuid {
    /// Creates an instance of "*IngredientUuid*"
    pub fn from_model(model: ForeignModel<IngredientModel>) -> Self {
        Self(model.0)
    }
    /// Gets underlying UUID
    pub fn get_inner(&self) -> Uuid {
        self.0
    }
}

impl Ingredient {
    /// Fetches all ingredients ordered by name.
    #[instrument(name = "Ingredient::query_all", skip(exe))]
    pub async fn query_all(exe: impl Executor<'_>) -> anyhow::Result<Vec<Self>> {
        let items: Vec<_> = rorm::query(exe, IngredientModel)
            .order_asc(IngredientModel.name)
            .stream()
            .map_ok(|model| Ingredient::from(model))
            .try_collect()
            .await?;

        Ok(items)
    }

    /// Looks up a single ingredient by its UUID.
    ///
    /// Returns None if there is no matching record.
    #[instrument(name = "Ingredient::query_by_uuid", skip(exe))]
    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        uuid: &IngredientUuid,
    ) -> anyhow::Result<Option<Self>> {
        let ingredient = rorm::query(exe, IngredientModel)
            .condition(IngredientModel.uuid.equals(uuid.0))
            .optional()
            .await?;
        Ok(ingredient.map(Self::from))
    }

    /// Inserts a new ingredient into the database if one doesn't already exist.
    ///
    /// This function attempts to retrieve an ingredient by its name from the database.
    /// If an ingredient with the given name exists, it's returned. Otherwise, a new
    /// ingredient is inserted with a generated UUID and its name, and the UUID is returned.
    #[instrument(name = "Ingredient::get_uuid_or_create", skip(exe))]
    pub async fn get_uuid_or_create(
        exe: impl Executor<'_>,
        name: MaxStr<255>,
    ) -> anyhow::Result<IngredientUuid> {
        let mut guard = exe.ensure_transaction().await?;
        let ingredient = rorm::query(guard.get_transaction(), IngredientModel)
            .condition(IngredientModel.name.equals(&name))
            .optional()
            .await?;

        if let Some(ingredient) = ingredient {
            return Ok(IngredientUuid(ingredient.uuid));
        }

        let ingredient = rorm::insert(guard.get_transaction(), IngredientModel)
            .single(&IngredientModel {
                uuid: Uuid::new_v4(),
                name,
            })
            .await?;

        Ok(IngredientUuid(ingredient.uuid))
    }
}

/// Represents different units of measurement.
///
/// This enum defines various units for quantities, allowing for flexible and
/// consistent handling of measurements.  Each variant corresponds to a specific
/// unit of measurement.
#[derive(
    DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema, PartialEq, PartialOrd, Eq, Ord,
)]
pub enum Units {
    Cup = 0,
    Gram = 1,
    Kilogram = 2,
    Liter = 3,
    Milliliter = 4,
    Tablespoon = 5,
    Teaspoon = 6,
    /// if the user doesn't want to specific a unit
    ///
    /// e.g., 1 egg
    None = 7,
}

impl From<IngredientModel> for Ingredient {
    fn from(model: IngredientModel) -> Self {
        Self {
            uuid: IngredientUuid { 0: model.uuid },
            name: model.name,
        }
    }
}
