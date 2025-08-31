//! Recipes domain model and database access layer.

use std::borrow::Cow;

use futures_util::TryStreamExt;
use rorm::and;
use rorm::conditions;
use rorm::conditions::DynamicCollection;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use time::OffsetDateTime;
use tracing::instrument;
use uuid::Uuid;

use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::models::account::AccountUuid;
use crate::models::recipe_ingredients::db::RecipeIngredientModel;
use crate::models::recipes::db::RecipeModel;
use crate::models::recipes::db::RecipeModelInsert;
use crate::models::tags::db::RecipeTagModel;
use crate::models::tags::TagUuid;

pub(in crate::models) mod db;

/// Domain representation of a recipe.
///
/// This struct mirrors the database model (RecipeModel) but is decoupled from
/// the ORM's generated types.
#[derive(Debug, Clone)]
pub struct Recipe {
    pub uuid: RecipeUuid,

    /// The name of the recipe. Must be unique.
    pub name: MaxStr<255>,

    /// A longer description of the recipe.
    pub description: MaxStr<255>,

    /// An optional foreign key referencing a `User` model.
    pub user: AccountUuid,

    pub created_at: OffsetDateTime,
}

/// Type‑safe new type around Uuid for recipe identifiers.
#[derive(Debug, Clone, Copy, Hash, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
pub struct RecipeUuid(pub Uuid);

impl Recipe {
    /// Return the total number of recipes in the database.
    #[instrument(name = "Recipe::query_total", skip(exe))]
    pub async fn query_total(exe: impl Executor<'_>) -> ApiResult<i64> {
        Ok(rorm::query(exe, RecipeModel.uuid.count()).one().await?)
    }

    /// List recipes with optional name filter and pagination.
    #[instrument(name = "Recipe::query_all", skip(exe))]
    pub async fn query_all(
        exe: impl Executor<'_>,
        page: &GetPageRequest,
        filter_name: Option<String>,
    ) -> ApiResult<Vec<Self>> {
        let condition = and![filter_name.map(|name| conditions::Binary {
            operator: conditions::BinaryOperator::Like,
            fst_arg: conditions::Column(RecipeModel.name),
            snd_arg: conditions::Value::String(Cow::Owned(format!(
                "%{}%",
                name.replace('_', "\\_")
                    .replace('%', "\\%")
                    .replace('\\', "\\\\")
            )))
        }),];

        let result: Vec<_> = rorm::query(exe, RecipeModel)
            .condition(&condition)
            .order_asc(RecipeModel.name)
            .limit(page.limit)
            .offset(page.offset)
            .stream()
            .map_ok(|model| Recipe::from(model))
            .try_collect()
            .await?;

        Ok(result)
    }

    /// Fetch a single recipe by its UUID.
    #[instrument(name = "Recipe::query_uuid", skip(exe))]
    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        uuid: &RecipeUuid,
    ) -> ApiResult<Option<Self>> {
        match rorm::query(exe, RecipeModel)
            .condition(RecipeModel.uuid.equals(uuid.0))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Recipe::from(model))),
            None => Ok(None),
        }
    }

    /// List recipes that use any of the given ingredients.
    #[instrument(name = "Recipe::query_by_ingredient", skip(exe))]
    pub async fn query_by_ingredient(
        exe: impl Executor<'_>,
        page: &GetPageRequest,
        filter_name: Option<String>,
        ingredient_uuids: &Vec<Uuid>,
    ) -> ApiResult<Vec<Self>> {
        let condition = DynamicCollection::or(
            ingredient_uuids
                .iter()
                .map(|uuid| RecipeIngredientModel.ingredients.equals(uuid))
                .collect(),
        );

        let condition = and![
            Some(condition),
            filter_name.map(|name| conditions::Binary {
                operator: conditions::BinaryOperator::Like,
                fst_arg: conditions::Column(RecipeIngredientModel.recipe.name),
                snd_arg: conditions::Value::String(Cow::Owned(format!(
                    "%{}%",
                    name.replace('_', "\\_")
                        .replace('%', "\\%")
                        .replace('\\', "\\\\")
                ))),
            })
        ];

        let result: Vec<_> = rorm::query(
            exe,
            (
                RecipeIngredientModel.ingredients,
                RecipeIngredientModel.recipe.query_as(RecipeModel),
            ),
        )
        .condition(&condition)
        .limit(page.limit)
        .offset(page.offset)
        .stream()
        .map_ok(|(_, recipe)| Recipe::from(recipe))
        .try_collect()
        .await?;

        Ok(result)
    }

    /// List recipes associated with a specific tag.
    #[instrument(name = "Recipe::query_by_tag", skip(exe))]
    pub async fn query_by_tag(
        exe: impl Executor<'_>,
        tag_uuid: &TagUuid,
        page: &GetPageRequest,
        filter_name: Option<String>,
    ) -> ApiResult<Vec<Self>> {
        let condition = and![
            filter_name.map(|name| conditions::Binary {
                operator: conditions::BinaryOperator::Like,
                fst_arg: conditions::Column(RecipeTagModel.recipe.name),
                snd_arg: conditions::Value::String(Cow::Owned(format!(
                    "%{}%",
                    name.replace('_', "\\_")
                        .replace('%', "\\%")
                        .replace('\\', "\\\\")
                ))),
            }),
            Some(RecipeTagModel.tag.equals(tag_uuid.0)),
        ];

        let result: Vec<_> = rorm::query(exe, RecipeTagModel.recipe.query_as(RecipeModel))
            .condition(&condition)
            .order_asc(RecipeTagModel.recipe.name)
            .limit(page.limit)
            .offset(page.offset)
            .stream()
            .map_ok(Recipe::from)
            .try_collect()
            .await?;

        Ok(result)
    }

    /// Fetch a recipe by its unique name.
    #[instrument(name = "Recipe::query_by_name", skip(exe))]
    pub async fn query_by_name(exe: impl Executor<'_>, name: &str) -> ApiResult<Option<Self>> {
        match rorm::query(exe, RecipeModel)
            .condition(RecipeModel.name.equals(name))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Recipe::from(model))),
            None => Ok(None),
        }
    }

    /// Create and return a new recipe.
    #[instrument(name = "Recipe::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        name: MaxStr<255>,
        description: MaxStr<255>,
        user: AccountUuid,
    ) -> ApiResult<Self> {
        let model = rorm::insert(exe, RecipeModel)
            .single(&RecipeModelInsert {
                uuid: Uuid::new_v4(),
                user: ForeignModelByField(user.0),
                name,
                description,
                created_at: OffsetDateTime::now_utc(),
            })
            .await?;
        Ok(Recipe::from(model))
    }

    /// Update a recipe's name and description.
    #[instrument(name = "Recipe::update", skip(exe))]
    pub async fn update(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
        name: MaxStr<255>,
        description: MaxStr<255>,
    ) -> ApiResult<()> {
        rorm::update(exe, RecipeModel)
            .set(RecipeModel.name, name)
            .set(RecipeModel.description, description)
            .condition(RecipeModel.uuid.equals(recipe_uuid.0))
            .await?;
        Ok(())
    }

    /// Delete a recipe by UUID.
    #[instrument(name = "Recipe::delete", skip(exe))]
    pub async fn delete(exe: impl Executor<'_>, uuid: &RecipeUuid) -> ApiResult<()> {
        rorm::delete(exe, RecipeModel)
            .condition(RecipeModel.uuid.equals(uuid.0))
            .await?;
        Ok(())
    }
}

impl From<RecipeModel> for Recipe {
    fn from(model: RecipeModel) -> Self {
        Self {
            uuid: RecipeUuid(model.uuid),
            name: model.name,
            description: model.description,
            created_at: model.created_at,
            user: AccountUuid(model.user.0),
        }
    }
}
