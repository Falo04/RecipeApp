//! Represents a recipe.

use std::borrow::Cow;

use futures_util::TryStreamExt;
use rorm::and;
use rorm::conditions;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::models::account::AccountUuid;
use crate::models::recipes::db::RecipeModel;
use crate::models::recipes::db::RecipeModelInsert;

pub(in crate::models) mod db;

#[derive(Debug, Clone)]
pub struct Recipe {
    pub uuid: RecipeUuid,

    /// The name of the recipe, with a maximum length of 255 characters.  Must be unique.
    pub name: MaxStr<255>,

    /// A longer description of the recipe, with a maximum length of 255 characters.
    pub description: MaxStr<255>,

    /// An optional foreign key referencing a `User` model.
    pub user: AccountUuid,

    pub created_at: OffsetDateTime,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct RecipeUuid(pub Uuid);

impl Recipe {
    pub async fn query_total(exe: impl Executor<'_>) -> ApiResult<i64> {
        rorm::query(exe, RecipeModel.uuid.count()).one().await?
    }

    pub async fn query_all(
        exe: impl Executor<'_>,
        page: GetPageRequest,
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

    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        uuid: RecipeUuid,
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

    pub async fn update(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
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

    pub async fn delete(exe: impl Executor<'_>, uuid: RecipeUuid) -> ApiResult<()> {
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
