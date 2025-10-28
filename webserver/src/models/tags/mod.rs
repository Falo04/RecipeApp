//! Tags domain model and helpers.

use futures_util::TryStreamExt;
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::core::stuff::schema::GetPageRequest;
use galvyn::rorm::and;
use galvyn::rorm::db::Executor;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::ForeignModelByField;
use galvyn::rorm::DbEnum;
use tracing::instrument;
use uuid::Uuid;

use crate::models::recipes::RecipeUuid;
use crate::models::tags::db::RecipeTagModel;
use crate::models::tags::db::TagModel;

pub(in crate::models) mod db;

/// Domain representation of a tag used to label recipes.
#[derive(Debug, Clone)]
pub struct Tag {
    pub uuid: TagUuid,

    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

/// New type wrapper around Uuid to provide type safety for tag identifiers.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
pub struct TagUuid(pub Uuid);
impl Tag {
    /// Count all tags in the database.
    #[instrument(name = "Tag::query_total", skip(exe))]
    pub async fn query_total(exe: impl Executor<'_>) -> anyhow::Result<i64> {
        let total = rorm::query(exe, TagModel.uuid.count()).one().await?;
        Ok(total)
    }

    /// List all tags associated with a given recipe.
    #[instrument(name = "Tag::query_by_recipe", skip(exe))]
    pub async fn query_by_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
    ) -> anyhow::Result<Vec<Self>> {
        let result: Vec<_> = rorm::query(exe, RecipeTagModel.tag.query_as(TagModel))
            .condition(RecipeTagModel.recipe.equals(recipe_uuid.0))
            .stream()
            .map_ok(|model| Tag::from(model))
            .try_collect()
            .await?;
        Ok(result)
    }

    /// List tags with optional name filter and pagination support.
    pub async fn query_all(
        exe: impl Executor<'_>,
        page_request: &GetPageRequest,
        filter_name: Option<String>,
    ) -> anyhow::Result<Vec<Self>> {
        let condition = and![filter_name.map(|name| TagModel.name.contains_ignore_case(&name))];

        let result: Vec<_> = rorm::query(exe, TagModel)
            .condition(condition)
            .limit(page_request.limit)
            .offset(page_request.offset)
            .stream()
            .map_ok(|tag| Tag::from(tag))
            .try_collect()
            .await?;

        Ok(result)
    }

    /// Fetch a tag by its UUID if it exists.
    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        tag_uuid: &TagUuid,
    ) -> anyhow::Result<Option<Self>> {
        match rorm::query(exe, TagModel)
            .condition(TagModel.uuid.equals(tag_uuid.0))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Tag::from(model))),
            None => Ok(None),
        }
    }

    /// Find a tag by its unique name.
    pub async fn query_by_name(exe: impl Executor<'_>, name: &str) -> anyhow::Result<Option<Self>> {
        match rorm::query(exe, TagModel)
            .condition(TagModel.name.equals(name))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Tag::from(model))),
            None => Ok(None),
        }
    }

    /// Create a new tag.
    #[instrument(name = "Tag::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        name: MaxStr<255>,
        color: TagColors,
    ) -> anyhow::Result<Self> {
        let model = rorm::insert(exe, TagModel)
            .single(&TagModel {
                uuid: Uuid::new_v4(),
                name,
                color,
            })
            .await?;
        Ok(Tag::from(model))
    }

    /// Update an existing tag's name and color.
    pub async fn update(
        exe: impl Executor<'_>,
        tag_uuid: &TagUuid,
        name: MaxStr<255>,
        color: TagColors,
    ) -> anyhow::Result<()> {
        rorm::update(exe, TagModel)
            .set(TagModel.name, name)
            .set(TagModel.color, color)
            .condition(TagModel.uuid.equals(tag_uuid.0))
            .await?;
        Ok(())
    }

    /// Delete a tag by its UUID.
    pub async fn delete(exe: impl Executor<'_>, tag_uuid: &TagUuid) -> anyhow::Result<()> {
        rorm::delete(exe, TagModel)
            .condition(TagModel.uuid.equals(tag_uuid.0))
            .await?;
        Ok(())
    }

    /// Attach a tag to a recipe.
    #[instrument(name = "Tag::add_to_recipe", skip(exe))]
    pub async fn add_to_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: &RecipeUuid,
        tag_uuid: &TagUuid,
    ) -> anyhow::Result<()> {
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

    /// Remove all tag associations for a recipe.
    #[instrument(name = "Tag::remove_from_recipe", skip(exe))]
    pub async fn remove_from_recipe(
        exe: impl Executor<'_>,
        recipe_uuid: RecipeUuid,
    ) -> anyhow::Result<()> {
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

/// Represents different tag colors, each associated with a numerical value.
///
/// This enum defines a set of colors that can be used to represent tags.
#[derive(DbEnum, Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
pub enum TagColors {
    Red = 0,
    Orange = 1,
    Amber = 2,
    Yellow = 3,
    Lime = 4,
    Green = 5,
    Emerald = 6,
    Teal = 7,
    Cyan = 8,
    Sky = 9,
    Blue = 10,
    Indigo = 11,
    Violet = 12,
    Purple = 13,
    Fuchsia = 14,
    Pink = 15,
    Rose = 16,
    Zinc = 17,
}
