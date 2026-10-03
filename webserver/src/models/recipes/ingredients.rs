//! Domain model and data access helpers for ingredients attached to recipes.

use std::collections::HashMap;

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
use crate::models::ingredients::Ingredient;
use crate::models::ingredients::db::IngredientModel;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::db::RecipeIngredientModel;

/// A concrete ingredient entry within a specific recipe.
///
/// This type connects a recipe to an ingredient, along with the amount and
/// unit used in that recipe context.
#[derive(Debug, Clone)]
pub struct RecipeIngredient {
    /// The ingredient referenced by this entry.
    pub ingredient: Ingredient,
    /// The quantity of the ingredient used in the recipe.
    pub amount: i64,
    /// The unit of measurement for the quantity.
    pub unit: Units,
}

/// Represents different units of measurement.
///
/// This enum defines various units for quantities, allowing for flexible and
/// consistent handling of measurements.  Each variant corresponds to a specific
/// unit of measurement.
///
/// The variant names are stored in the database, renaming one requires a migration.
#[derive(Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
pub enum Units {
    Cup = 0,
    Gram = 1,
    Kilogram = 2,
    Liter = 3,
    Milliliter = 4,
    Tablespoon = 5,
    Teaspoon = 6,
    Piece = 7,
}

impl RecipeIngredient {
    /// Query all ingredients of the given recipes
    pub(in crate::models::recipes) async fn query_by_recipes(
        tx: &mut Transaction,
        uuids: &[RecipeUuid],
    ) -> DatabaseResult<HashMap<RecipeUuid, Vec<Self>>> {
        if uuids.is_empty() {
            return Ok(HashMap::new());
        }

        let result: Vec<_> = rorm::query(
            tx,
            (
                RecipeIngredientModel,
                RecipeIngredientModel.ingredient.query_as(IngredientModel),
            ),
        )
        .condition(
            RecipeIngredientModel
                .recipe
                .r#in(uuids.iter().map(|r| r.into_inner()).collect::<Vec<_>>()),
        )
        .order_asc(RecipeIngredientModel.ingredient.name)
        .all()
        .await?
        .into_iter()
        .map(|(ri, i)| {
            (
                RecipeUuid::new(ri.recipe.0),
                Self {
                    ingredient: Ingredient::from(i),
                    amount: ri.amount,
                    unit: ri.unit,
                },
            )
        })
        .collect();

        let mut map: HashMap<RecipeUuid, Vec<Self>> = HashMap::new();
        for (r, i) in result {
            map.entry(r).or_default().push(i);
        }

        Ok(map)
    }

    /// Insert a bulk of [`RecipeIngredient`]s for a [`Recipe`](crate::models::recipes::Recipe)
    ///
    /// Ingredients which don't exist yet are created.
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

        if models.is_empty() {
            return Ok(());
        }

        rorm::insert(tx, RecipeIngredientModel)
            .return_nothing()
            .bulk(&models)
            .await?;

        Ok(())
    }
}

/// The parameters required to add an ingredient to a recipe
#[derive(Debug, Clone)]
pub struct RecipeIngredientInsertParams {
    /// Name of the ingredient, it is created if it doesn't exist yet
    pub name: MaxStr<255>,
    /// The quantity of the ingredient
    pub amount: i64,
    /// The unit of measurement for the quantity
    pub unit: Units,
}
