use axum::extract::Path;
use futures_lite::StreamExt;
use swaggapi::delete;
use swaggapi::get;
use swaggapi::post;
use uuid::Uuid;

use crate::global::GLOBAL;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::List;
use crate::http::common::schemas::SingleUuid;
use crate::http::extractors::api_json::ApiJson;
use crate::http::handler::tags::schema::CreateOrUpdateTag;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::tags::Tag;

#[get("/")]
pub async fn get_all_tags() -> ApiResult<ApiJson<List<SimpleTag>>> {
    let list: Vec<_> = rorm::query(&GLOBAL.db, Tag)
        .stream()
        .map(|result| result.map(SimpleTag::from))
        .try_collect()
        .await?;

    Ok(ApiJson(List { list }))
}

#[post("/")]
pub async fn create_tag(
    ApiJson(request): ApiJson<CreateOrUpdateTag>,
) -> ApiResult<ApiJson<SingleUuid>> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    if rorm::query(&mut tx, Tag)
        .condition(Tag.name.equals(&*request.name))
        .optional()
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request(
            "Tag already exists",
            Some("Tag already exists"),
        ));
    }

    let uuid = rorm::insert(&mut tx, Tag)
        .return_primary_key()
        .single(&Tag {
            uuid: Uuid::new_v4(),
            name: request.name,
        })
        .await?;

    tx.commit().await?;

    Ok(ApiJson(SingleUuid { uuid }))
}

#[delete("/{uuid}")]
pub async fn delete_tag(Path(SingleUuid { uuid: tag_uuid }): Path<SingleUuid>) -> ApiResult<()> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    let tag = rorm::query(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request(
            "NOT FOUND: Tag",
            Some("Tag not found"),
        ))?;

    rorm::delete(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag.uuid))
        .await?;

    tx.commit().await?;
    Ok(())
}
