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

/// Creates a tag.
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

/// Update a tag.
#[put("/{uuid}")]
pub async fn update_tag(
    Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    if Tag::query_by_uuid(&mut tx, &TagUuid { 0: tag_uuid })
        .await?
        .is_none()
    {
        return Err(ApiError::bad_request("Invalid tag uuid"));
    }

    if let Some(tag) = Tag::query_by_name(&mut tx, request.name.deref()).await? {
        if tag.uuid.0 != tag_uuid {
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

/// Delete a tag.
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
