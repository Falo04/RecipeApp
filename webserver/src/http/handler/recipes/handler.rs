use std::sync::LazyLock;

use axum::extract::Path;
use futures_lite::StreamExt;
use galvyn_core::Module;
use regex::Regex;
use rorm::model::Identifiable;
use rorm::Database;
use swaggapi::delete;
use swaggapi::get;
use swaggapi::post;
use swaggapi::put;
use uuid::Uuid;

use super::schema::CreateRecipeErrors;
use super::schema::CreateRecipeRequest;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::FormResult;
use crate::http::common::schemas::List;
use crate::http::common::schemas::SingleUuid;
use crate::http::extractors::api_json::ApiJson;
use crate::http::handler::recipes::schema::SimpleRecipe;
use crate::http::handler::recipes::schema::UpdateRecipeRequest;
use crate::models::recipes::Recipe;

#[get("/")]
pub async fn get_all_recipes() -> ApiResult<ApiJson<List<SimpleRecipe>>> {
    let list = rorm::query(Database::global(), Recipe)
        .stream()
        .map(|result| result.map(SimpleRecipe::from))
        .try_collect()
        .await?;
    Ok(ApiJson(List { list }))
}

#[get("/{uuid}")]
pub async fn get_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
) -> ApiResult<ApiJson<SimpleRecipe>> {
    let mut tx = Database::global().start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe id"))?;

    tx.commit().await?;
    Ok(ApiJson(SimpleRecipe {
        uuid: recipe.uuid,
        name: recipe.name,
        description: recipe.description,
    }))
}

#[post("/")]
pub async fn create_recipe(
    ApiJson(request): ApiJson<CreateRecipeRequest>,
) -> ApiResult<ApiJson<FormResult<SingleUuid, CreateRecipeErrors>>> {
    static REGEX: LazyLock<Regex> =
        LazyLock::new(|| Regex::new("^[a-z0-9]+(?:-+[a-z0-9]+)*$").unwrap());
    if !REGEX.is_match(&request.name) {
        return Err(ApiError::bad_request(
            "recipe name contains invalid characters",
        ));
    }

    let mut tx = Database::global().start_transaction().await?;

    let existing = rorm::query(&mut tx, Recipe)
        .condition(Recipe.name.equals(&*request.name))
        .optional()
        .await?;

    if existing.is_some() {
        return Ok(ApiJson(FormResult::err(CreateRecipeErrors {
            name_not_unique: true,
        })));
    }

    let uuid = rorm::insert(&mut tx, Recipe)
        .return_primary_key()
        .single(&Recipe {
            uuid: Uuid::new_v4(),
            name: request.name,
            description: request.description,
        })
        .await?;

    tx.commit().await?;
    Ok(ApiJson(FormResult::ok(SingleUuid { uuid })))
}

#[put("/{uuid}")]
pub async fn update_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<UpdateRecipeRequest>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    rorm::update(&mut tx, Recipe)
        .begin_dyn_set()
        .set_if(Recipe.description, request.description)
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
    let mut tx = Database::global().start_transaction().await?;

    let recipe = rorm::query(&mut tx, Recipe)
        .condition(Recipe.uuid.equals(recipe_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    rorm::delete(&mut tx, Recipe)
        .condition(recipe.as_condition())
        .await?;

    tx.commit().await?;

    Ok(())
}
