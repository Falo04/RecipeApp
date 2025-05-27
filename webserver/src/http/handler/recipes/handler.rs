use std::borrow::Cow;
use std::collections::HashMap;
use std::ops::Deref;
use std::ptr::read;
use std::sync::LazyLock;

use axum::extract::Path;
use axum::extract::Query;
use futures_lite::StreamExt;
use regex::Regex;
use rorm::conditions;
use rorm::conditions::DynamicCollection;
use rorm::model::Identifiable;
use rorm::prelude::ForeignModel;
use rorm::prelude::ForeignModelByField;
use swaggapi::delete;
use swaggapi::get;
use swaggapi::post;
use swaggapi::put;
use time::OffsetDateTime;
use uuid::Uuid;
use warp::test::request;

use super::schema::CreateRecipeRequest;
use crate::global::GLOBAL;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::http::common::schemas::List;
use crate::http::common::schemas::Page;
use crate::http::common::schemas::SingleUuid;
use crate::http::extractors::api_json::ApiJson;
use crate::http::handler::recipes::schema::FullRecipe;
use crate::http::handler::recipes::schema::Ingredients;
use crate::http::handler::recipes::schema::RecipeSearchRequest;
use crate::http::handler::recipes::schema::RecipeSearchResponse;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::recipes::schema::Steps;
use crate::http::handler::recipes::schema::UpdateRecipeRequest;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::users::schema::SimpleUser;
use crate::models::recipe::Recipe;
use crate::models::recipe::RecipePatch;
use crate::models::recipe_ingredients::RecipeIngredients;
use crate::models::recipe_steps::RecipeSteps;
use crate::models::recipe_tag::RecipeTag;
use crate::models::tags::Tag;
use crate::models::user::User;

#[get("/")]
pub async fn get_all_recipes(
    pagination: Query<GetPageRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipeWithTags>>> {
    let items: Vec<_> = rorm::query(&GLOBAL.db, Recipe)
        .order_asc(Recipe.name)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .stream()
        .try_collect()
        .await?;

    let total = rorm::query(&GLOBAL.db, Recipe.uuid.count()).one().await?;

    let mut map: HashMap<Uuid, Vec<SimpleTag>> =
        HashMap::from_iter(items.iter().map(|rec| (rec.uuid, Vec::new())));

    if total != 0 {
        rorm::query(&GLOBAL.db, (RecipeTag.recipe, RecipeTag.tag.query_as(Tag)))
            .condition(DynamicCollection::or(
                items
                    .iter()
                    .map(|recipe| RecipeTag.recipe.equals(recipe.uuid))
                    .collect(),
            ))
            .order_asc(RecipeTag.tag.name)
            .stream()
            .try_for_each(|result| {
                let (ForeignModelByField(recipe_uuid), tag) = result?;
                map.entry(recipe_uuid)
                    .or_default()
                    .push(SimpleTag::from(tag));
                Ok::<_, rorm::Error>(())
            })
            .await?;
    }

    let items = items
        .into_iter()
        .map(|recipe| SimpleRecipeWithTags {
            uuid: recipe.uuid,
            name: recipe.name,
            description: recipe.description,
            tags: map.remove(&recipe.uuid).unwrap_or_default(),
        })
        .collect();

    Ok(ApiJson(Page {
        items,
        limit: pagination.limit,
        offset: pagination.offset,
        total,
    }))
}

#[get("/{uuid}")]
pub async fn get_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
) -> ApiResult<ApiJson<FullRecipe>> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request(
            "NOT FOUND: recipe id:",
            Some("Recipe not found"),
        ))?;

    let user = match recipe.user {
        Some(user_uuid) => Some(
            rorm::query(&mut tx, User)
                .condition(User.uuid.equals(user_uuid.0))
                .optional()
                .await?
                .ok_or(ApiError::server_error(
                    "NOT FOUND: User not found from recipe",
                    None,
                ))?,
        ),
        None => None,
    };

    let tags: Vec<_> = rorm::query(&mut tx, RecipeTag.tag.query_as(Tag))
        .condition(RecipeTag.recipe.equals(recipe_uuid))
        .stream()
        .map(|result| result.map(SimpleTag::from))
        .try_collect()
        .await?;

    let ingredients: Vec<_> = rorm::query(&mut tx, RecipeIngredients)
        .condition(RecipeIngredients.recipe.equals(recipe_uuid))
        .stream()
        .map(|result| result.map(Ingredients::from))
        .try_collect()
        .await?;

    let steps: Vec<_> = rorm::query(&mut tx, RecipeSteps)
        .condition(RecipeSteps.recipe.equals(recipe_uuid))
        .stream()
        .map(|result| result.map(Steps::from))
        .try_collect()
        .await?;

    let full_recipe = FullRecipe {
        uuid: recipe_uuid,
        name: recipe.name,
        description: recipe.description,
        user: match user {
            Some(user) => Some(SimpleUser::from(user)),
            None => None,
        },
        ingredients,
        steps,
        tags,
    };

    Ok(ApiJson(full_recipe))
}

#[post("/")]
pub async fn create_recipe(
    ApiJson(request): ApiJson<CreateRecipeRequest>,
) -> ApiResult<ApiJson<SingleUuid>> {
    let mut tx = GLOBAL.db.start_transaction().await?;
    let recipe_uuid = Uuid::new_v4();

    // check for existing recipes with this name
    if rorm::query(&mut tx, Recipe)
        .condition(Recipe.name.equals(request.name.deref()))
        .optional()
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request(
            "Recipe name is not unique",
            Some("Recipe name is not unique"),
        ));
    }

    rorm::insert(&mut tx, Recipe)
        .return_nothing()
        .single(&RecipePatch {
            uuid: recipe_uuid,
            name: request.name,
            description: request.description,
            user: match request.user {
                Some(user) => Some(ForeignModelByField(user)),
                None => None,
            },
            created_at: OffsetDateTime::now_utc(),
        })
        .await?;

    RecipeTag::create_or_delete_mappings(&mut tx, recipe_uuid, &request.tags).await?;
    RecipeIngredients::handle_mapping(&mut tx, recipe_uuid, request.ingredients).await?;
    RecipeSteps::handle_mapping(&mut tx, recipe_uuid, request.steps).await?;

    tx.commit().await?;
    Ok(ApiJson(SingleUuid { uuid: recipe_uuid }))
}

#[put("/{uuid}")]
pub async fn update_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<UpdateRecipeRequest>,
) -> ApiResult<()> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request(
            "NOT FOUND: Invalid recipe uuid",
            Some("Recipe not found"),
        ))?;

    RecipeTag::create_or_delete_mappings(&mut tx, recipe_uuid, &request.tags).await?;
    RecipeIngredients::handle_mapping(&mut tx, recipe_uuid, request.ingredients).await?;
    RecipeSteps::handle_mapping(&mut tx, recipe_uuid, request.steps).await?;

    rorm::update(&mut tx, Recipe)
        .begin_dyn_set()
        .set_if(Recipe.name, Some(request.name))
        .set_if(Recipe.description, Some(request.description))
        .finish_dyn_set()?
        .condition(recipe.as_condition())
        .await?;

    tx.commit().await?;
    Ok(())
}

#[delete("/{uuid}")]
pub async fn delete_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
) -> ApiResult<()> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request(
            "NOT FOUND: Invalid recipe uuid",
            Some("Recipe not found"),
        ))?;

    rorm::delete(&mut tx, Recipe)
        .condition(recipe.as_condition())
        .await?;

    tx.commit().await?;
    Ok(())
}

#[get("/search")]
pub async fn search_recipes(
    search: Query<RecipeSearchRequest>,
) -> ApiResult<ApiJson<List<RecipeSearchResponse>>> {
    let items: Vec<_> = rorm::query(&GLOBAL.db, Recipe)
        .condition(conditions::Binary {
            operator: conditions::BinaryOperator::Like,
            fst_arg: conditions::Column(Recipe.name),
            snd_arg: conditions::Value::String(Cow::Owned(format!("%{}%", search.name))),
        })
        .order_asc(Recipe.name)
        .stream()
        .map(|result| result.map(RecipeSearchResponse::from))
        .try_collect()
        .await?;

    Ok(ApiJson(List { list: items }))
}
