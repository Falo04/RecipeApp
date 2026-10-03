use galvyn::core::Module;
use galvyn::core::re_exports::axum::extract::Path;
use galvyn::core::stuff::api_error::ApiError;
use galvyn::core::stuff::api_error::ApiResult;
use galvyn::core::stuff::api_error::FormErrors;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::stuff::schema::List;
use galvyn::core::stuff::schema::SingleUuid;
use galvyn::delete;
use galvyn::get;
use galvyn::post;
use galvyn::put;
use galvyn::rorm::Database;

use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::tags::schema::CreateOrUpdateTag;
use crate::http::handler::tags::schema::CreateOrUpdateTagErrors;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::websockets::schema::WsServerMsg;
use crate::models::recipes::Recipe;
use crate::models::tags::Tag;
use crate::models::tags::TagInsertParams;
use crate::models::tags::TagName;
use crate::models::tags::TagUpdateParams;
use crate::models::tags::TagUuid;
use crate::modules::websocket::WebsocketManager;

/// Retrieves all tags with pagination support.
#[get("/all")]
pub async fn get_all_tags() -> ApiResult<ApiJson<List<SimpleTag>>> {
    let mut tx = Database::global().start_transaction().await?;
    let result = Tag::query_all(&mut tx).await?;
    tx.commit().await?;

    Ok(ApiJson(List {
        list: result.into_iter().map(SimpleTag::from).collect(),
    }))
}

/// Retrieves all recipes with a specific tag.
#[post("/{tag_uuid}/recipes")]
pub async fn get_recipes_by_tag(
    Path(tag_uuid): Path<TagUuid>,
) -> ApiResult<ApiJson<List<SimpleRecipeWithTags>>> {
    let mut tx = Database::global().start_transaction().await?;
    let recipes = Recipe::query_by_tag(&mut tx, tag_uuid).await?;
    tx.commit().await?;

    Ok(ApiJson(List {
        list: recipes
            .into_iter()
            .map(SimpleRecipeWithTags::from)
            .collect(),
    }))
}

/// Creates a tag.
#[post("/")]
pub async fn create_tag(
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<ApiJson<SingleUuid>, CreateOrUpdateTagErrors> {
    let mut tx = Database::global().start_transaction().await?;

    let mut errors = FormErrors::<CreateOrUpdateTagErrors>::new();
    let Some(name) = TagName::new(&mut tx, request.name).await? else {
        errors.name_already_exists = true;
        return errors.fail();
    };

    let tag = Tag::create(
        &mut tx,
        TagInsertParams {
            name,
            color: request.color,
        },
    )
    .await?;

    tx.commit().await?;
    WebsocketManager::global().send_to_all(WsServerMsg::TagsChanged {});
    Ok(ApiJson(SingleUuid {
        uuid: tag.uuid.into_inner(),
    }))
}

/// Update a tag.
#[put("/{tag_uuid}")]
pub async fn update_tag(
    Path(tag_uuid): Path<TagUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<(), CreateOrUpdateTagErrors> {
    let mut tx = Database::global().start_transaction().await?;

    let Some(mut tag) = Tag::query_by_uuid(&mut tx, tag_uuid).await? else {
        return Err(ApiError::bad_request("Invalid tag uuid"));
    };
    let name = TagName::new(&mut tx, request.name.clone()).await?;

    let mut errors = FormErrors::<CreateOrUpdateTagErrors>::new();
    if name.is_none() && request.name != *tag.name {
        errors.name_already_exists = true;
        return errors.fail();
    }

    tag.update(
        &mut tx,
        TagUpdateParams {
            name,
            color: Some(request.color),
        },
    )
    .await?;

    tx.commit().await?;
    WebsocketManager::global().send_to_all(WsServerMsg::TagsChanged {});
    Ok(())
}

/// Delete a tag.
#[delete("/{tag_uuid}")]
pub async fn delete_tag(Path(tag_uuid): Path<TagUuid>) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let Some(tag) = Tag::query_by_uuid(&mut tx, tag_uuid).await? else {
        return Err(ApiError::bad_request("Invalid tag uuid"));
    };

    tag.delete(&mut tx).await?;
    tx.commit().await?;

    WebsocketManager::global().send_to_all(WsServerMsg::TagsChanged {});
    Ok(())
}
