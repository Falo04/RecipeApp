//! Recipes domain model and database access layer.

use std::ops::Deref;

use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::rorm::conditions;
use galvyn::rorm::conditions::Condition;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::MaxStr;
use galvyn::rorm::prelude::ForeignModelByField;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::ingredients::IngredientUuid;
use crate::models::recipes::db::__RecipeModel_ValueSpaceImpl;
use crate::models::recipes::db::RecipeIngredientModel;
use crate::models::recipes::db::RecipeModel;
use crate::models::recipes::db::RecipeModelPatch;
use crate::models::recipes::db::RecipeStepModel;
use crate::models::recipes::db::RecipeTagModel;
use crate::models::recipes::ingredients::RecipeIngredient;
use crate::models::recipes::ingredients::RecipeIngredientInsertParams;
use crate::models::recipes::steps::RecipeStep;
use crate::models::recipes::steps::RecipeStepInsertParams;
use crate::models::tags::Tag;
use crate::models::tags::TagUuid;
use crate::models::user::UserUuid;
use crate::utils::typed_uuid::TypedUuid;
use crate::utils::update_builder::TrackedUpdateBuilder;

pub(in crate::models) mod db;
pub mod ingredients;
pub mod steps;

/// A simple recipe, which contains only necessary information
#[derive(Debug, Clone)]
pub struct Recipe {
    /// Recipe UUID
    pub uuid: RecipeUuid,
    /// The name of the recipe
    pub name: RecipeName,
    /// A longer description of the recipe.
    pub description: MaxStr<255>,
    /// The user who created the recipe
    pub user: UserUuid,
    /// All tags to filter after it, ordered by name
    pub tags: Vec<Tag>,
}

pub type RecipeUuid = TypedUuid<Recipe>;

/// A full recipe which contains all information about a recipe, which
/// includes ingredients, steps and tags.
#[derive(Debug, Clone)]
pub struct FullRecipe {
    /// Primary key
    pub uuid: RecipeUuid,
    /// The name of the recipe
    pub name: RecipeName,
    /// A longer description of the recipe.
    pub description: MaxStr<255>,
    /// The user who created the recipe
    pub user: UserUuid,
    /// All ingredients the recipe needs, ordered by name
    pub ingredients: Vec<RecipeIngredient>,
    /// All steps to cook this recipe, ordered by index
    pub steps: Vec<RecipeStep>,
    /// All tags to filter after it, ordered by name
    pub tags: Vec<Tag>,
}

/// The unique name of a recipe
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RecipeName(MaxStr<255>);

impl RecipeName {
    /// Claims `name` for a recipe, returning `None` if another recipe already uses it
    ///
    /// This is only a check for friendly errors, the unique constraint
    /// in the database is the actual guarantee.
    pub async fn new(tx: &mut Transaction, name: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = rorm::query(&mut *tx, RecipeModel.uuid)
            .condition(RecipeModel.name.equals(&name))
            .optional()
            .await?
            .is_some();

        Ok((!taken).then_some(Self(name)))
    }
}

impl Deref for RecipeName {
    type Target = MaxStr<255>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<RecipeName> for MaxStr<255> {
    fn from(value: RecipeName) -> Self {
        value.0
    }
}

impl Recipe {
    /// List all recipes ordered by name.
    #[instrument(name = "Recipe::query_all", skip(tx))]
    pub async fn query_all(tx: &mut Transaction) -> DatabaseResult<Vec<Self>> {
        Self::query_by_condition(tx, |_m| conditions::Value::Bool(true)).await
    }

    /// Fetch a single recipe by its UUID.
    #[instrument(name = "Recipe::query_by_uuid", skip(tx))]
    pub async fn query_by_uuid(
        tx: &mut Transaction,
        uuid: RecipeUuid,
    ) -> DatabaseResult<Option<Self>> {
        Ok(
            Self::query_by_condition(tx, |m| m.uuid.equals(uuid.into_inner()))
                .await?
                .into_iter()
                .next(),
        )
    }

    /// List recipes that use any of the given ingredients.
    #[instrument(name = "Recipe::query_by_ingredients", skip(tx))]
    pub async fn query_by_ingredients(
        tx: &mut Transaction,
        ingredient_uuids: &[IngredientUuid],
    ) -> DatabaseResult<Vec<Self>> {
        if ingredient_uuids.is_empty() {
            return Ok(vec![]);
        }

        let recipe_uuids: Vec<Uuid> = rorm::query(&mut *tx, RecipeIngredientModel.recipe)
            .condition(
                RecipeIngredientModel.ingredient.r#in(
                    ingredient_uuids
                        .iter()
                        .map(|i| i.into_inner())
                        .collect::<Vec<_>>(),
                ),
            )
            .all()
            .await?
            .into_iter()
            .map(|r| r.0)
            .collect();

        Self::query_by_condition(tx, |m| m.uuid.r#in(recipe_uuids)).await
    }

    /// List recipes associated with a specific tag.
    #[instrument(name = "Recipe::query_by_tag", skip(tx))]
    pub async fn query_by_tag(tx: &mut Transaction, uuid: TagUuid) -> DatabaseResult<Vec<Self>> {
        let recipe_uuids: Vec<Uuid> = rorm::query(&mut *tx, RecipeTagModel.recipe)
            .condition(RecipeTagModel.tag.equals(uuid.into_inner()))
            .all()
            .await?
            .into_iter()
            .map(|r| r.0)
            .collect();

        Self::query_by_condition(tx, |m| m.uuid.r#in(recipe_uuids)).await
    }

    /// Queries recipes by a condition, ordered by name
    async fn query_by_condition<'cond, C>(
        tx: &mut Transaction,
        cond: impl FnOnce(__RecipeModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        let models = rorm::query(&mut *tx, RecipeModel)
            .condition(cond(RecipeModel))
            .order_asc(RecipeModel.name)
            .all()
            .await?;

        let uuids: Vec<RecipeUuid> = models.iter().map(|m| RecipeUuid::new(m.uuid)).collect();
        let mut tags = Tag::query_by_recipes(&mut *tx, &uuids).await?;

        Ok(models
            .into_iter()
            .map(|m| {
                let tags = tags.remove(&RecipeUuid::new(m.uuid)).unwrap_or_default();
                Self {
                    tags,
                    ..Self::from(m)
                }
            })
            .collect())
    }

    /// Create and return a new recipe.
    #[instrument(name = "Recipe::create", skip(tx))]
    pub async fn create(tx: &mut Transaction, params: RecipeCreateParams) -> DatabaseResult<Self> {
        let model = rorm::insert(&mut *tx, RecipeModel)
            .single(&RecipeModelPatch {
                uuid: Uuid::new_v4(),
                user: ForeignModelByField(params.user.into_inner()),
                name: params.name.into(),
                description: params.description,
            })
            .await?;
        let mut recipe = Recipe::from(model);

        RecipeStep::create_bulk(&mut *tx, recipe.uuid, params.steps).await?;
        RecipeIngredient::create_bulk(&mut *tx, recipe.uuid, params.ingredients).await?;
        recipe.replace_tags(tx, &params.tags).await?;

        Ok(recipe)
    }

    /// Update a recipe.
    ///
    /// Fields which are `None` in `params` are left unchanged.
    /// Steps, ingredients and tags are replaced as a whole.
    #[instrument(name = "Recipe::update", skip(tx))]
    pub async fn update(
        &mut self,
        tx: &mut Transaction,
        params: RecipeUpdateParams,
    ) -> DatabaseResult<()> {
        if let Some(builder) = TrackedUpdateBuilder::new(&mut *tx)
            .set_if_some(RecipeModel.name, &mut self.name, params.name)
            .set_if_some(
                RecipeModel.description,
                &mut self.description,
                params.description,
            )
            .finish()
        {
            builder
                .condition(RecipeModel.uuid.equals(self.uuid.into_inner()))
                .await?;
        }

        if let Some(steps) = params.steps {
            rorm::delete(&mut *tx, RecipeStepModel)
                .condition(RecipeStepModel.recipe.equals(self.uuid.into_inner()))
                .await?;
            RecipeStep::create_bulk(&mut *tx, self.uuid, steps).await?;
        }

        if let Some(ingredients) = params.ingredients {
            rorm::delete(&mut *tx, RecipeIngredientModel)
                .condition(RecipeIngredientModel.recipe.equals(self.uuid.into_inner()))
                .await?;
            RecipeIngredient::create_bulk(&mut *tx, self.uuid, ingredients).await?;
        }

        if let Some(tags) = params.tags {
            self.replace_tags(tx, &tags).await?;
        }

        Ok(())
    }

    /// Replace all tags of this recipe and reload them
    async fn replace_tags(&mut self, tx: &mut Transaction, tags: &[TagUuid]) -> DatabaseResult<()> {
        rorm::delete(&mut *tx, RecipeTagModel)
            .condition(RecipeTagModel.recipe.equals(self.uuid.into_inner()))
            .await?;

        let models: Vec<_> = tags
            .iter()
            .map(|tag| RecipeTagModel {
                uuid: Uuid::new_v4(),
                recipe: ForeignModelByField(self.uuid.into_inner()),
                tag: ForeignModelByField(tag.into_inner()),
            })
            .collect();
        if !models.is_empty() {
            rorm::insert(&mut *tx, RecipeTagModel)
                .return_nothing()
                .bulk(&models)
                .await?;
        }

        self.tags = Tag::query_by_recipes(tx, &[self.uuid])
            .await?
            .remove(&self.uuid)
            .unwrap_or_default();

        Ok(())
    }

    /// Delete a recipe by UUID.
    #[instrument(name = "Recipe::delete", skip(tx))]
    pub async fn delete(self, tx: &mut Transaction) -> DatabaseResult<()> {
        rorm::delete(tx, RecipeModel)
            .condition(RecipeModel.uuid.equals(self.uuid.into_inner()))
            .await?;
        Ok(())
    }
}

impl FullRecipe {
    /// Queries a [`FullRecipe`] by an uuid
    #[instrument(name = "FullRecipe::query_by_uuid", skip(tx))]
    pub async fn query_by_uuid(
        tx: &mut Transaction,
        uuid: RecipeUuid,
    ) -> DatabaseResult<Option<Self>> {
        Ok(
            Self::query_by_condition(tx, |m| m.uuid.equals(uuid.into_inner()))
                .await?
                .into_iter()
                .next(),
        )
    }

    /// Queries [`FullRecipe`]s by a condition, ordered by name
    async fn query_by_condition<'cond, C>(
        tx: &mut Transaction,
        cond: impl FnOnce(__RecipeModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        let recipes = Recipe::query_by_condition(&mut *tx, cond).await?;

        let uuids: Vec<RecipeUuid> = recipes.iter().map(|r| r.uuid).collect();
        let mut ingredients = RecipeIngredient::query_by_recipes(&mut *tx, &uuids).await?;
        let mut steps = RecipeStep::query_by_recipes(&mut *tx, &uuids).await?;

        Ok(recipes
            .into_iter()
            .map(|r| Self {
                ingredients: ingredients.remove(&r.uuid).unwrap_or_default(),
                steps: steps.remove(&r.uuid).unwrap_or_default(),
                uuid: r.uuid,
                name: r.name,
                description: r.description,
                user: r.user,
                tags: r.tags,
            })
            .collect())
    }
}

/// The parameters required to create a new [`Recipe`]
#[derive(Debug, Clone)]
pub struct RecipeCreateParams {
    /// The unique name of the recipe
    pub name: RecipeName,
    /// A longer description of the recipe
    pub description: MaxStr<255>,
    /// The user who created the recipe
    pub user: UserUuid,
    /// All ingredients the recipe needs
    pub ingredients: Vec<RecipeIngredientInsertParams>,
    /// All steps to cook this recipe
    pub steps: Vec<RecipeStepInsertParams>,
    /// All tags of the recipe
    pub tags: Vec<TagUuid>,
}

/// The parameters to update a [`Recipe`], `None` leaves a field unchanged
#[derive(Debug, Clone, Default)]
pub struct RecipeUpdateParams {
    /// The new unique name of the recipe
    pub name: Option<RecipeName>,
    /// The new description of the recipe
    pub description: Option<MaxStr<255>>,
    /// Replaces all ingredients of the recipe
    pub ingredients: Option<Vec<RecipeIngredientInsertParams>>,
    /// Replaces all steps of the recipe
    pub steps: Option<Vec<RecipeStepInsertParams>>,
    /// Replaces all tags of the recipe
    pub tags: Option<Vec<TagUuid>>,
}

impl From<RecipeModel> for Recipe {
    fn from(value: RecipeModel) -> Self {
        Self {
            uuid: RecipeUuid::new(value.uuid),
            name: RecipeName(value.name),
            description: value.description,
            user: UserUuid::new(value.user.0),
            tags: vec![],
        }
    }
}
