//! Represents a tag with a name and color.

use futures_util::TryStreamExt;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use uuid::Uuid;

use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::models::recipes::RecipeUuid;
use crate::models::tags::db::RecipeTagModel;
use crate::models::tags::db::TagColors;
use crate::models::tags::db::TagModel;

pub(in crate::models) mod db;

#[derive(Debug, Clone)]
pub struct Tag {
    pub uuid: TagUuid,

    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct TagUuid(pub Uuid);
impl Tag {
    #[instrument(name = "Tag::query_by_recipe", skip(exe))]
    pub async fn query_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
    ) -> ApiResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(exe, RecipeTagModel.tag.query_as(TagModel))
            .condition(RecipeTagModel.recipe.equals(recipe_uuid.0))
            .stream()
            .map_ok(|model| Tag::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    pub async fn query_all(
        exe: impl Executor<'_>,
        page_request: GetPageRequest,
    ) -> ApiResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(exe, TagModel)
            .limit(page_request.limit)
            .offset(page_request.offset)
            .stream()
            .map_ok(|tag| Tag::from(tag))
            .try_collect()
            .await?;
        Ok(result)
    }

    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        tag_uuid: TagUuid,
    ) -> ApiResult<Option<Self>> {
        match rorm::query(exe, TagModel)
            .condition(TagModel.uuid.equals(tag_uuid.0))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Tag::from(model))),
            None => Ok(None),
        }
    }

    #[instrument(name = "Tag::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        name: MaxStr<255>,
        color: TagColors,
    ) -> ApiResult<Self> {
        let model = rorm::insert(exe, TagModel)
            .single(&TagModel {
                uuid: Uuid::new_v4(),
                name,
                color,
            })
            .await?;
        Ok(Tag::from(model))
    }

    pub async fn delete(exe: impl Executor<'_>, tag_uuid: TagUuid) -> ApiResult<()> {
        rorm::delete(exe, TagModel)
            .condition(TagModel.uuid.equals(tag_uuid.0))
            .await?;
        Ok(())
    }

    #[instrument(name = "Tag::add_to_recipe", skip(exe))]
    pub async fn add_to_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
        tag_uuid: TagUuid,
    ) -> ApiResult<()> {
        rorm::insert(exe, RecipeTagModel)
            .return_nothing()
            .single(&RecipeTagModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(recipe_uuid.0),
                tag: ForeignModelByField(tag_uuid.0),
            })
            .await?;
        Ok(())
    }

    #[instrument(name = "Tag::remove_all_tags_from_recipe", skip(exe))]
    pub async fn remove_all_tags_from_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
    ) -> ApiResult<()> {
        rorm::delete(exe, RecipeTagModel)
            .condition(RecipeTagModel.recipe.equals(recipe_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<TagModel> for Tag {
    fn from(model: TagModel) -> Self {
        Self {
            uuid: TagUuid(model.uuid),
            name: model.name,
            color: model.color,
        }
    }
}
