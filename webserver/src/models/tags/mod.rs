//! Tags domain model and helpers.
use std::collections::HashMap;
use std::ops::Deref;

use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;
use galvyn::rorm::conditions;
use galvyn::rorm::conditions::Condition;
use galvyn::rorm::db::Executor;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::MaxStr;
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
    /// Primary key
    pub uuid: TagUuid,
    /// The name of the tag
    pub name: TagName,
    /// An enum representing the color associated with the tag.
    pub color: TagColors,
}

pub type TagUuid = TypedUuid<Tag>;

/// The unique name of a tag
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct TagName(MaxStr<255>);

impl TagName {
    /// Claims `name` for a tag, returning `None` if another tag already uses it
    ///
    /// This is only a check for friendly errors, the unique constraint
    /// in the database is the actual guarantee.
    pub async fn new(tx: &mut Transaction, name: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = rorm::query(&mut *tx, TagModel.uuid)
            .condition(TagModel.name.equals(&name))
            .optional()
            .await?
            .is_some();

        Ok((!taken).then_some(Self(name)))
    }
}

impl Deref for TagName {
    type Target = MaxStr<255>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<TagName> for MaxStr<255> {
    fn from(value: TagName) -> Self {
        value.0
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
    /// Query all tags associated with a given list of recipes.
    ///
    /// The tags are ordered by name.
    #[instrument(name = "Tag::query_by_recipes", skip(db))]
    pub async fn query_by_recipes(
        db: impl Executor<'_>,
        uuids: &[RecipeUuid],
    ) -> DatabaseResult<HashMap<RecipeUuid, Vec<Self>>> {
        if uuids.is_empty() {
            return Ok(HashMap::new());
        }

        let tags: Vec<_> = rorm::query(
            db,
            (RecipeTagModel.recipe, RecipeTagModel.tag.query_as(TagModel)),
        )
        .condition(
            RecipeTagModel
                .recipe
                .r#in(uuids.iter().map(|r| r.into_inner()).collect::<Vec<_>>()),
        )
        .order_asc(RecipeTagModel.tag.name)
        .all()
        .await?
        .into_iter()
        .map(|(recipe, t)| (RecipeUuid::new(recipe.0), Tag::from(t)))
        .collect();

        let mut map: HashMap<RecipeUuid, Vec<Self>> = HashMap::new();
        for (r, t) in tags {
            map.entry(r).or_default().push(t);
        }

        Ok(map)
    }

    /// List all tags ordered by name.
    #[instrument(name = "Tag::query_all", skip(db))]
    pub async fn query_all(db: impl Executor<'_>) -> DatabaseResult<Vec<Self>> {
        Self::query_by_condition(db, |_| conditions::Value::Bool(true)).await
    }

    /// Fetch a tag by its UUID if it exists.
    #[instrument(name = "Tag::query_by_uuid", skip(db))]
    pub async fn query_by_uuid(
        db: impl Executor<'_>,
        tag_uuid: TagUuid,
    ) -> DatabaseResult<Option<Self>> {
        Ok(
            Self::query_by_condition(db, |m| m.uuid.equals(tag_uuid.into_inner()))
                .await?
                .into_iter()
                .next(),
        )
    }

    /// Query tags by a condition, ordered by name
    async fn query_by_condition<'cond, C>(
        db: impl Executor<'_>,
        cond: impl FnOnce(__TagModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        Ok(rorm::query(db, TagModel)
            .condition(cond(TagModel))
            .order_asc(TagModel.name)
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
                name: params.name.into(),
                color: params.color,
            })
            .await?;
        Ok(Tag::from(model))
    }

    /// Update an existing tag.
    #[instrument(name = "Tag::update", skip(tx))]
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
    #[instrument(name = "Tag::delete", skip(tx))]
    pub async fn delete(self, tx: &mut Transaction) -> DatabaseResult<()> {
        rorm::delete(tx, TagModel)
            .condition(TagModel.uuid.equals(self.uuid.into_inner()))
            .await?;
        Ok(())
    }
}

/// The parameters required to create a new [`Tag`]
#[derive(Debug, Clone)]
pub struct TagInsertParams {
    /// The unique name of the tag
    pub name: TagName,
    /// The color of the tag
    pub color: TagColors,
}

/// The parameters to update a [`Tag`], `None` leaves a field unchanged
#[derive(Debug, Clone, Default)]
pub struct TagUpdateParams {
    /// The new unique name of the tag
    pub name: Option<TagName>,
    /// The new color of the tag
    pub color: Option<TagColors>,
}

impl From<TagModel> for Tag {
    fn from(model: TagModel) -> Self {
        Self {
            uuid: TagUuid::new(model.uuid),
            name: TagName(model.name),
            color: model.color,
        }
    }
}
