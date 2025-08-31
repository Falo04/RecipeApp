use std::ops::Deref;

use axum::extract::Path;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::delete;
use galvyn::post;
use galvyn::put;
use galvyn::rorm::Database;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::Page;
use crate::http::common::schemas::SingleUuid;
use crate::http::handler::recipes::schema::GetAllRecipesRequest;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::tags::schema::CreateOrUpdateTag;
use crate::http::handler::tags::schema::GetAllTagsRequest;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::websockets::schema::WsServerMsg;
use crate::models::recipes::Recipe;
use crate::models::tags::Tag;
use crate::models::tags::TagUuid;
use crate::modules::websockets::WebsocketManager;

/// Retrieves all tags with pagination support.
///
/// This function queries the database for all `Tag` records, applying pagination
/// based on the provided `pagination` request. It returns a paginated list of
/// `SimpleTag` objects along with the total number of tags.
///
/// # Arguments
///
/// * `Query<GetPageRequest>` - object containing the pagination parameters
#[post("/all")]
pub async fn get_all_tags(
    ApiJson(pagination): ApiJson<GetAllTagsRequest>,
) -> ApiResult<ApiJson<Page<SimpleTag>>> {
    let GetAllTagsRequest { page, filter_name } = pagination;

    let result = Tag::query_all(Database::global(), &page, filter_name).await?;
    let total = Tag::query_total(Database::global()).await?;

    Ok(ApiJson(Page {
        items: result.into_iter().map(SimpleTag::from).collect(),
        limit: page.limit,
        offset: page.offset,
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
#[post("/{uuid}/recipes")]
pub async fn get_recipes_by_tag(
    Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>,
    ApiJson(pagination): ApiJson<GetAllRecipesRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipeWithTags>>> {
    let GetAllRecipesRequest { page, filter_name } = pagination;

    let mut tx = Database::global().start_transaction().await?;

    let recipes =
        Recipe::query_by_tag(&mut tx, &TagUuid { 0: tag_uuid }, &page, filter_name).await?;

    let mut result = Vec::new();
    for recipe in recipes {
        let tags = Tag::query_by_recipe(&mut tx, &recipe.uuid).await?;

        result.push(SimpleRecipeWithTags {
            uuid: recipe.uuid.0,
            name: recipe.name,
            description: recipe.description,
            tags: tags.into_iter().map(SimpleTag::from).collect(),
        })
    }

    let total = Recipe::query_total(&mut tx).await?;

    tx.commit().await?;

    Ok(ApiJson(Page {
        items: result,
        limit: page.limit,
        offset: page.offset,
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

    if Tag::query_by_name(&mut tx, request.name.deref())
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request("Tag already exists"));
    }

    let tag = Tag::create(&mut tx, request.name, request.color).await?;

    tx.commit().await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::TagsChanged {})
        .await;

    Ok(ApiJson(SingleUuid { uuid: tag.uuid.0 }))
}

#[put("/{uuid}")]
pub async fn update_tag(
    Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    if Tag::query_by_uuid(&mut tx, &TagUuid { 0: tag_uuid })
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request("Invalid tag uuid"));
    }

    if let Some(tag) = Tag::query_by_name(&mut tx, request.name.deref()).await? {
        if tag.uuid.0 == tag_uuid {
            return Err(ApiError::bad_request("Tag name already exists"));
        }
    }

    Tag::update(
        &mut tx,
        &TagUuid { 0: tag_uuid },
        request.name,
        request.color,
    )
    .await?;

    tx.commit().await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::TagsChanged {})
        .await;

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

    if Tag::query_by_uuid(&mut tx, &TagUuid { 0: tag_uuid })
        .await?
        .is_none()
    {
        return Err(ApiError::bad_request("Invalid tag uuid"));
    }

    Tag::delete(&mut tx, &TagUuid { 0: tag_uuid }).await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::TagsChanged {})
        .await;

    tx.commit().await?;
    Ok(())
}
