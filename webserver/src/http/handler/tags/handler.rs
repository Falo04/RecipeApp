use axum::extract::Path;
use axum::extract::Query;
use futures_lite::StreamExt;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::delete;
use galvyn::get;
use galvyn::post;
use galvyn::put;
use galvyn::rorm::Database;
use rorm::and;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::http::common::schemas::Page;
use crate::http::common::schemas::SingleUuid;
use crate::http::handler::recipes::schema::SimpleRecipe;
use crate::http::handler::tags::schema::CreateOrUpdateTag;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::recipes::Recipe;
use crate::models::tags::RecipeTag;
use crate::models::tags::Tag;

/// Retrieves all tags with pagination support.
///
/// This function queries the database for all `Tag` records, applying pagination
/// based on the provided `pagination` request. It returns a paginated list of
/// `SimpleTag` objects along with the total number of tags.
///
/// # Arguments
///
/// * `Query<GetPageRequest>` - object containing the pagination parameters
#[get("/")]
pub async fn get_all_tags(
    pagination: Query<GetPageRequest>,
) -> ApiResult<ApiJson<Page<SimpleTag>>> {
    let items: Vec<_> = rorm::query(Database::global(), Tag)
        .order_asc(Tag.name)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .stream()
        .map(|result| result.map(SimpleTag::from))
        .try_collect()
        .await?;

    let total = rorm::query(Database::global(), Tag.uuid.count())
        .one()
        .await?;

    Ok(ApiJson(Page {
        items,
        limit: pagination.limit,
        offset: pagination.offset,
        total,
    }))
}

/// Retrieves a paginated list of recipes associated with a specific tag.
///
/// This function takes a UUID representing the tag and a pagination request as input.
/// It queries the database for recipes linked to that tag, applies pagination.
///
/// # Arguments
///
/// * `Path<SingleUuid>` - The UUID of the tag to filter recipes by.
/// * `Query<GetPageRequest>` - The pagination request.
#[get("/{uuid}/recipes")]
pub async fn get_recipes_by_tag(
    Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>,
    pagination: Query<GetPageRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipe>>> {
    let items: Vec<_> = rorm::query(Database::global(), RecipeTag.recipe.query_as(Recipe))
        .condition(RecipeTag.tag.equals(tag_uuid))
        .order_asc(RecipeTag.recipe.name)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .stream()
        .map(|result| result.map(SimpleRecipe::from))
        .try_collect()
        .await?;

    let total = rorm::query(Database::global(), RecipeTag.uuid.count())
        .condition(RecipeTag.tag.equals(tag_uuid))
        .one()
        .await?;

    Ok(ApiJson(Page {
        items,
        limit: pagination.limit,
        offset: pagination.offset,
        total,
    }))
}

/// Creates or updates a tag.
///
/// This endpoint takes a JSON request body containing the tag's name and color.
/// It inserts a new tag if one with the same name does not already exist.
///
/// # Arguments
///
/// * `ApiJson<CreateOrUpdateTag>` - The request body containing the tag data.
#[post("/")]
pub async fn create_tag(
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<ApiJson<SingleUuid>> {
    let mut tx = Database::global().start_transaction().await?;

    if rorm::query(&mut tx, Tag)
        .condition(Tag.name.equals(&*request.name))
        .optional()
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request("Tag already exists"));
    }

    let uuid = rorm::insert(&mut tx, Tag)
        .return_primary_key()
        .single(&Tag {
            uuid: Uuid::new_v4(),
            name: request.name,
            color: request.color,
        })
        .await?;

    tx.commit().await?;

    Ok(ApiJson(SingleUuid { uuid }))
}

#[put("/{uuid}")]
pub async fn update_tag(
    Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    if rorm::query(&mut tx, Tag)
        .condition(and![
            Tag.name.equals(&*request.name),
            Tag.uuid.not_equals(tag_uuid)
        ])
        .optional()
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request("Name already exists"));
    }

    rorm::update(&mut tx, Tag)
        .set(Tag.name, request.name)
        .set(Tag.color, request.color)
        .condition(Tag.uuid.equals(tag_uuid))
        .await?;

    tx.commit().await?;

    Ok(())
}

/// Deletes a tag from the database based on its UUID.
///
/// This function takes a UUID as input and attempts to delete the corresponding tag from the database.
///
/// # Arguments
///
/// * `Path<SingleUuid>` - The UUID of the tag to delete.
#[delete("/{uuid}")]
pub async fn delete_tag(Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let tag = rorm::query(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request("tag id invalid"))?;

    rorm::delete(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag.uuid))
        .await?;

    tx.commit().await?;
    Ok(())
}
