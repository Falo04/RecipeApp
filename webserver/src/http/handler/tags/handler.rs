use std::borrow::Cow;
use std::collections::HashMap;

use axum::extract::Path;
use futures_util::TryStreamExt;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::delete;
use galvyn::post;
use galvyn::put;
use galvyn::rorm::Database;
use rorm::and;
use rorm::conditions;
use rorm::conditions::DynamicCollection;
use uuid::Uuid;

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
use crate::models::tags::RecipeTag;
use crate::models::tags::Tag;
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

    let condition = and![filter_name.map(|name| conditions::Binary {
        operator: conditions::BinaryOperator::Like,
        fst_arg: conditions::Column(Tag.name),
        snd_arg: conditions::Value::String(Cow::Owned(format!(
            "%{}%",
            name.replace('_', "\\_")
                .replace('%', "\\%")
                .replace('\\', "\\\\")
        )))
    })];

    let items: Vec<_> = rorm::query(Database::global(), Tag)
        .condition(condition)
        .order_asc(Tag.name)
        .limit(page.limit)
        .offset(page.offset)
        .stream()
        .map_ok(SimpleTag::from)
        .try_collect()
        .await?;

    let total = rorm::query(Database::global(), Tag.uuid.count())
        .one()
        .await?;

    Ok(ApiJson(Page {
        items,
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

    let condition = and![
        filter_name.map(|name| conditions::Binary {
            operator: conditions::BinaryOperator::Like,
            fst_arg: conditions::Column(RecipeTag.recipe.name),
            snd_arg: conditions::Value::String(Cow::Owned(format!(
                "%{}%",
                name.replace('_', "\\_")
                    .replace('%', "\\%")
                    .replace('\\', "\\\\")
            ))),
        }),
        Some(RecipeTag.tag.equals(tag_uuid)),
    ];

    let total = rorm::query(Database::global(), RecipeTag.uuid.count())
        .condition(&condition)
        .one()
        .await?;

    let items: Vec<_> = rorm::query(Database::global(), RecipeTag.recipe.query_as(Recipe))
        .condition(&condition)
        .order_asc(RecipeTag.recipe.name)
        .limit(page.limit)
        .offset(page.offset)
        .stream()
        .try_collect()
        .await?;

    let mut map: HashMap<Uuid, Vec<SimpleTag>> =
        HashMap::from_iter(items.iter().map(|rec| (rec.uuid, Vec::new())));

    if !items.is_empty() {
        let tags: Vec<_> = rorm::query(
            Database::global(),
            (RecipeTag.recipe, RecipeTag.tag.query_as(Tag)),
        )
        .condition(DynamicCollection::or(
            items
                .iter()
                .map(|recipe| RecipeTag.recipe.equals(recipe.uuid))
                .collect(),
        ))
        .stream()
        .map_ok(|(recipe, tag)| (recipe.0, SimpleTag::from(tag)))
        .try_collect()
        .await?;

        for (recipe_uuid, tag) in tags {
            map.entry(recipe_uuid).or_default().push(tag);
        }
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

    WebsocketManager::global()
        .send_to_all(WsServerMsg::TagsChanged {})
        .await;

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

    let tag = rorm::query(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag_uuid))
        .optional()
        .await?
        .ok_or(ApiError::bad_request("tag id invalid"))?;

    rorm::delete(&mut tx, Tag)
        .condition(Tag.uuid.equals(tag.uuid))
        .await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::TagsChanged {})
        .await;

    tx.commit().await?;
    Ok(())
}
