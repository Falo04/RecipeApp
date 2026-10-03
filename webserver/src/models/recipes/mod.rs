//! Recipes domain model and database access layer.

use std::collections::HashMap;

use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::rorm::and;
use galvyn::rorm::conditions;
use galvyn::rorm::conditions::Condition;
use galvyn::rorm::conditions::DynamicCollection;
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
use crate::models::tags::db::TagModel;
use crate::models::user::UserUuid;
use crate::utils::typed_uuid::TypedUuid;
use crate::utils::update_builder::TrackedUpdateBuilder;

pub(in crate::models) mod db;
pub mod ingredients;
pub mod steps;

/// A simple recipe, which contains only necessary information
#[derive(Debug)]
pub struct Recipe {
    /// Recipe UUID
    pub uuid: RecipeUuid,
    /// The name of the recipe
    pub name: RecipeName,
    /// A longer description of the recipe.
    pub description: MaxStr<255>,
    /// The user who created the recipe
    pub user: UserUuid,
}

pub type RecipeUuid = TypedUuid<Recipe>;

/// A full recipe which contains all information about a recipe, which
/// includes ingredients, steps and tags.
pub struct FullRecipe {
    /// Primary key
    pub uuid: RecipeUuid,
    /// The name of the recipe
    pub name: RecipeName,
    /// A longer description of the recipe.
    pub description: MaxStr<255>,
    /// The user who created the recipe
    pub user: UserUuid,
    /// All ingredients the recipe needs
    pub ingredients: Vec<RecipeIngredient>,
    /// All steps to cook this recipe
    pub steps: Vec<RecipeStep>,
    /// All tags to filter after it
    pub tags: Vec<Tag>,
}

/// The unique name of a recipe
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RecipeName(MaxStr<255>);

impl RecipeName {
    /// Claims `name` for a recipe, returning `None` if another tag already uses it
    pub async fn new(tx: &mut Transaction, name: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = Recipe::query_by_condition(tx, |m| m.name.equals(&name))
            .await?
            .into_iter()
            .next()
            .is_some();

        Ok((!taken).then_some(Self(name)))
    }
}

impl From<RecipeName> for MaxStr<255> {
    fn from(value: RecipeName) -> Self {
        value.0
    }
}

impl Recipe {
    /// List recipes with optional name filter and pagination.
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
    #[instrument(name = "Recipe::query_by_ingredient", skip(tx))]
    pub async fn query_by_ingredient(
        tx: &mut Transaction,
        ingredient_uuids: &Vec<IngredientUuid>,
    ) -> DatabaseResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(tx, RecipeIngredientModel.recipe.query_as(RecipeModel))
            .condition(and![DynamicCollection::or(
                ingredient_uuids
                    .iter()
                    .map(|uuid| RecipeIngredientModel.ingredient.equals(uuid.into_inner()))
                    .collect(),
            )])
            .all()
            .await?
            .into_iter()
            .map(|r| Self::from(r))
            .collect();

        Ok(result)
    }

    /// List recipes associated with a specific tag.
    #[instrument(name = "Recipe::query_by_tag", skip(tx))]
    pub async fn query_by_tag(tx: &mut Transaction, uuid: TagUuid) -> DatabaseResult<Vec<Self>> {
        let result: Vec<_> = rorm::query(tx, RecipeTagModel.recipe.query_as(RecipeModel))
            .condition(RecipeTagModel.tag.equals(uuid.into_inner()))
            .order_asc(RecipeTagModel.recipe.name)
            .all()
            .await?
            .into_iter()
            .map(Self::from)
            .collect();

        Ok(result)
    }

    /// Queries a recipe by its unique name.
    #[instrument(name = "Recipe::query_by_name", skip(tx))]
    pub async fn query_by_name(tx: &mut Transaction, name: &str) -> DatabaseResult<Option<Self>> {
        Ok(Self::query_by_condition(tx, |m| m.name.equals(name))
            .await?
            .into_iter()
            .next())
    }

    /// Queries recipes by a condition
    async fn query_by_condition<'cond, C>(
        tx: &mut Transaction,
        cond: impl FnOnce(__RecipeModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        Ok(rorm::query(tx, RecipeModel)
            .condition(cond(RecipeModel))
            .order_asc(RecipeModel.name)
            .all()
            .await?
            .into_iter()
            .map(Self::from)
            .collect())
    }

    /// Create and return a new recipe.
    #[instrument(name = "Recipe::create", skip(tx))]
    pub async fn create(tx: &mut Transaction, params: RecipeCreateParams) -> DatabaseResult<Self> {
        let model = rorm::insert(tx, RecipeModel)
            .single(&RecipeModelPatch {
                uuid: Uuid::new_v4(),
                user: ForeignModelByField(params.user.into_inner()),
                name: params.name,
                description: params.description,
            })
            .await?;

        RecipeStep::create_bulk(&mut *tx, RecipeUuid::new(model.uuid), params.steps).await?;
        RecipeIngredient::create_bulk(&mut *tx, RecipeUuid::new(model.uuid), params.ingredients)
            .await?;

        Ok(Recipe::from(model))
    }

    /// Update a recipe's name, description, all steps and all ingredients.
    #[instrument(name = "Recipe::update", skip(tx))]
    pub async fn update(
        &mut self,
        tx: &mut Transaction,
        params: RecipeUpdateParams,
    ) -> DatabaseResult<()> {
        let Some(builder) = TrackedUpdateBuilder::new(&mut *tx)
            .set_if_some(RecipeModel.name, &mut self.name, params.name)
            .set_if_some(
                RecipeModel.description,
                &mut self.description,
                params.description,
            )
            .finish()
        else {
            return Ok(());
        };
        builder
            .condition(RecipeModel.uuid.equals(self.uuid.into_inner()))
            .await?;

        rorm::delete(&mut *tx, RecipeStepModel)
            .condition(RecipeStepModel.recipe.equals(self.uuid.into_inner()))
            .await?;
        rorm::delete(&mut *tx, RecipeIngredientModel)
            .condition(RecipeIngredientModel.recipe.equals(self.uuid.into_inner()))
            .await?;

        RecipeStep::create_bulk(&mut *tx, self.uuid, params.steps).await?;
        RecipeIngredient::create_bulk(&mut *tx, self.uuid, params.ingredients).await?;

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

    /// Queries ['FullRecipe']s by a condition
    async fn query_by_condition<'cond, C>(
        tx: &mut Transaction,
        cond: impl FnOnce(__RecipeModel_ValueSpaceImpl) -> C,
    ) -> DatabaseResult<Vec<Self>>
    where
        C: Condition<'cond>,
    {
        let mut recipes: HashMap<_, _> = rorm::query(&mut *tx, RecipeModel)
            .condition(cond(RecipeModel))
            .all()
            .await?
            .into_iter()
            .map(|r| {
                (
                    r.uuid,
                    FullRecipe {
                        uuid: RecipeUuid::new(r.uuid),
                        name: RecipeName(r.name),
                        description: r.description,
                        user: UserUuid::new(r.user.0),
                        ingredients: vec![],
                        steps: vec![],
                        tags: vec![],
                    },
                )
            })
            .collect();

        let ingredients = rorm::query(&mut *tx, RecipeIngredientModel)
            .condition(RecipeIngredientModel.recipe.r#in(recipes.keys().collect()))
            .all()
            .await?;

        let steps = rorm::query(&mut *tx, RecipeStepModel)
            .condition(RecipeStepModel.recipe.r#in(recipes.keys().collect()))
            .all()
            .await?;

        let tags: HashMap<_, _> = rorm::query(
            &mut *tx,
            (RecipeTagModel, RecipeTagModel.tag.query_as(TagModel)),
        )
        .condition(RecipeTagModel.recipe.r#in(recipes.keys().collect()))
        .all()
        .await?
        .into_iter()
        .map(|(rt, t)| (rt.recipe, Tag::from(t)))
        .collect();

        for i in ingredients {
            if let Some(r) = recipes.get_mut(&i.recipe.0) {
                r.ingredients.push(RecipeIngredient::from(i));
            }
        }

        for s in steps {
            if let Some(r) = recipes.get_mut(&s.recipe.0) {
                r.steps.push(RecipeStep::from(s));
            }
        }

        for (r, t) in tags {
            if let Some(recipe) = recipes.get_mut(&r.0) {
                recipe.tags.push(t);
            }
        }

        Ok(recipes.into_values().collect())
    }
}

#[derive(Debug, Clone)]
pub struct RecipeCreateParams {
    name: MaxStr<255>,
    description: MaxStr<255>,
    user: UserUuid,
    ingredients: Vec<RecipeIngredientInsertParams>,
    steps: Vec<RecipeStepInsertParams>,
}

#[derive(Debug, Clone, Default)]
pub struct RecipeUpdateParams {
    name: Option<RecipeName>,
    description: Option<MaxStr<255>>,
    user: Option<UserUuid>,
    ingredients: Vec<RecipeIngredientInsertParams>,
    steps: Vec<RecipeStepInsertParams>,
}

impl From<RecipeModel> for Recipe {
    fn from(model: RecipeModel) -> Self {
        Self {
            uuid: RecipeUuid::new(model.uuid),
            name: RecipeName(model.name),
            description: model.description,
            user: UserUuid::new(model.user.0),
        }
    }
}
