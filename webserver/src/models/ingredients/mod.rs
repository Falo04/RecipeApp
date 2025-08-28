//! Represents an ingredient in a recipe.

use futures_util::TryStreamExt;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::DbEnum;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use uuid::Uuid;

use crate::http::common::errors::ApiResult;
use crate::models::ingredients::db::IngredientModel;

pub(in crate::models) mod db;

#[derive(Debug, Clone)]
pub struct Ingredient {
    pub uuid: Uuid,

    /// The name of the ingredient, with a maximum length of 255 characters.
    pub name: MaxStr<255>,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
pub struct IngredientUuid(pub Uuid);

impl Ingredient {
    pub async fn query_all(exe: impl Executor<'_>) -> ApiResult<Vec<Self>> {
        let items: Vec<_> = rorm::query(exe, IngredientModel)
            .order_asc(IngredientModel.name)
            .stream()
            .map_ok(|model| Ingredient::from(model))
            .try_collect()
            .await?;

        Ok(items)
    }

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
    #[instrument(name = "Ingredient::get_uuid_or_create", skip(exe))]
    pub async fn get_uuid_or_create(exe: impl Executor<'_>, name: MaxStr<255>) -> ApiResult<Uuid> {
        let Some(ingredient) = rorm::query(exe, IngredientModel)
            .condition(IngredientModel.name.equals(&*name))
            .optional()
            .await?
        else {
            rorm::insert(exe, IngredientModel)
                .single(&IngredientModel {
                    uuid: Uuid::new_v4(),
                    name,
                })
                .await?
        };
        Ok(ingredient.uuid)
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
