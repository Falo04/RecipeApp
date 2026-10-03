//! Tags domain model and helpers.
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::conditions;
use galvyn::rorm::conditions::Condition;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::ForeignModelByField;
use tracing::instrument;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::db::RecipeTagModel;
use crate::models::tags::db::__TagModel_ValueSpaceImpl;
use crate::models::tags::db::TagModel;
use crate::utils::typed_uuid::TypedUuid;
use crate::utils::update_builder::TrackedUpdateBuilder;

pub(in crate::models) mod db;

/// Domain representation of a tag used to label recipes.
#[derive(Debug, Clone)]
pub struct Tag {
    pub uuid: TagUuid,

    pub name: MaxStr<255>,

    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

pub type TagUuid = TypedUuid<Tag>;

pub struct TagName(MaxStr<255>);

impl TagName {
    /// Claims `name` for a tag, returning `None` if another tag already uses it
    pub async fn new(tx: &mut Transaction, name: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = Tag::query_by_condition(tx, |m| m.name.equals(&name))
            .await?
            .into_iter()
            .next()
            .is_some();

        Ok((!taken).then_some(Self(name)))
    }
}

/// This enum defines a set of colors that can be used to represent tags.
#[derive(Debug, Copy, Clone, Serialize, Deserialize, JsonSchema)]
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

impl Tag {
    /// Query all tags associated with a given recipe.
    #[instrument(name = "Tag::query_by_recipe", skip(tx))]
    pub async fn query_by_recipe(
        tx: &mut Transaction,
        recipe_uuid: &RecipeUuid,
    ) -> DatabaseResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(tx, RecipeTagModel.tag.query_as(TagModel))
            .condition(RecipeTagModel.recipe.equals(recipe_uuid.into_inner()))
            .all()
            .await?
            .into_iter()
            .map(Self::from)
            .collect();

        Ok(result)
    }

    /// List tags with optional name filter and pagination support.
    pub async fn query_all(tx: &mut Transaction) -> DatabaseResult<Vec<Self>> {
        Self::query_by_condition(tx, |_| conditions::Value::Bool(true)).await
    }

    /// Fetch a tag by its UUID if it exists.
    pub async fn query_by_uuid(
        tx: &mut Transaction,
        tag_uuid: &TagUuid,
    ) -> DatabaseResult<Option<Self>> {
        Ok(
            Self::query_by_condition(tx, |m| m.uuid.equals(tag_uuid.into_inner()))
                .await?
                .into_iter()
                .next(),
        )
    }

    /// Find a tag by its unique name.
    pub async fn query_by_name(tx: &mut Transaction, name: &str) -> DatabaseResult<Option<Self>> {
        match rorm::query(tx, TagModel)
            .condition(TagModel.name.equals(name))
            .optional()
            .await?
        {
            Some(model) => Ok(Some(Tag::from(model))),
            None => Ok(None),
        }
    }

    /// Query tags by a condition
    pub async fn query_by_condition<'cond, C>(
        tx: &mut Transaction,
        cond: impl FnOnce(__TagModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        Ok(rorm::query(tx, TagModel)
            .condition(cond(TagModel))
            .all()
            .await?
            .into_iter()
            .map(Self::from)
            .collect())
    }

    /// Create a new tag.
    #[instrument(name = "Tag::create", skip(tx))]
    pub async fn create(tx: &mut Transaction, params: TagInsertParams) -> DatabaseResult<Self> {
        let model = rorm::insert(tx, TagModel)
            .single(&TagModel {
                uuid: Uuid::new_v4(),
                name: params.name,
                color: params.color,
            })
            .await?;
        Ok(Tag::from(model))
    }

    /// Update an existing tag.
    pub async fn update(
        &mut self,
        tx: &mut Transaction,
        params: TagUpdateParams,
    ) -> DatabaseResult<()> {
        let Some(builder) = TrackedUpdateBuilder::new(tx)
            .set_if_some(TagModel.name, &mut self.name, params.name)
            .set_if_some(TagModel.color, &mut self.color, params.color)
            .finish()
        else {
            return Ok(());
        };
        builder
            .condition(TagModel.uuid.equals(self.uuid.into_inner()))
            .await?;
        Ok(())
    }

    /// Delete a tag by its UUID.
    pub async fn delete(&self, tx: &mut Transaction) -> DatabaseResult<()> {
        rorm::delete(tx, TagModel)
            .condition(TagModel.uuid.equals(self.uuid.into_inner()))
            .await?;
        Ok(())
    }

    /// Attach a tag to a recipe.
    #[instrument(name = "Tag::add_to_recipe", skip(tx))]
    pub async fn add_to_recipe(
        tx: &mut Transaction,
        recipe_uuid: &RecipeUuid,
        tag_uuid: &TagUuid,
    ) -> DatabaseResult<()> {
        rorm::insert(tx, RecipeTagModel)
            .return_nothing()
            .single(&RecipeTagModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(recipe_uuid.into_inner()),
                tag: ForeignModelByField(tag_uuid.into_inner()),
            })
            .await?;
        Ok(())
    }

    /// Remove all tag associations for a recipe.
    #[instrument(name = "Tag::remove_from_recipe", skip(tx))]
    pub async fn remove_from_recipe(
        tx: &mut Transaction,
        recipe_uuid: RecipeUuid,
    ) -> DatabaseResult<()> {
        rorm::delete(tx, RecipeTagModel)
            .condition(RecipeTagModel.recipe.equals(recipe_uuid.into_inner()))
            .await?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct TagInsertParams {
    name: MaxStr<255>,
    color: TagColors,
}

#[derive(Debug, Clone, Default)]
pub struct TagUpdateParams {
    name: Option<MaxStr<255>>,
    color: Option<TagColors>,
}

impl From<TagModel> for Tag {
    fn from(model: TagModel) -> Self {
        Self {
            uuid: TagUuid::new(model.uuid),
            name: model.name,
            color: model.color,
        }
    }
}
