use std::collections::HashMap;
use std::collections::HashSet;

use axum::extract::Query;
use futures_util::TryStreamExt;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::get;
use galvyn::post;
use rorm::conditions::DynamicCollection;
use rorm::Database;
use uuid::Uuid;

use super::schema::AllIngredientsRequest;
use super::schema::SimpleIngredient;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::http::common::schemas::List;
use crate::http::common::schemas::Page;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::ingredients::Ingredient;
use crate::models::ingredients::RecipeIngredientModel;
use crate::models::recipes::Recipe;
use crate::models::tags::RecipeTag;
use crate::models::tags::Tag;

/// Retrieves recipes based on specified ingredients.
///
/// This function handles requests to `/recipes` and returns a list of recipes
/// that contain the provided ingredients. It constructs a query using the
/// provided UUIDs and then fetches all recipes matching the ingredient criteria.
#[post("/recipes")]
pub async fn get_recipes_by_ingredients(
    pagination: Query<GetPageRequest>,
    ApiJson(request): ApiJson<AllIngredientsRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipeWithTags>>> {
    let condition = DynamicCollection::or(
        request
            .uuids
            .list
            .iter()
            .map(|uuid| RecipeIngredientModel.ingredients.equals(uuid))
            .collect(),
    );

    let mut recipes_all: Vec<_> = rorm::query(
        Database::global(),
        (
            RecipeIngredientModel.ingredients,
            RecipeIngredientModel.recipe.query_as(Recipe),
        ),
    )
    .condition(&condition)
    .stream()
    .map_ok(|(_, recipe)| recipe)
    .try_collect()
    .await?;

    let mut seen = HashSet::new();
    recipes_all.retain(|recipe| {
        let is_first = !seen.contains(&recipe.uuid);
        seen.insert(recipe.uuid);
        is_first
    });

    let ingredients_mapping: Vec<_> = rorm::query(Database::global(), RecipeIngredientModel)
        .condition(&condition)
        .all()
        .await?;

    let mut recipes = Vec::new();
    for recipe in recipes_all {
        let ingredients_uuids: Vec<_> = ingredients_mapping
            .iter()
            .filter(|ingredient| ingredient.recipe.0 == recipe.uuid)
            .map(|ingredient| ingredient.ingredients.0)
            .collect();

        if ingredients_uuids
            .iter()
            .all(|uuid| request.uuids.list.contains(uuid))
        {
            recipes.push(recipe);
        }
    }

    let mut map: HashMap<Uuid, Vec<SimpleTag>> =
        HashMap::from_iter(recipes.iter().map(|rec| (rec.uuid, Vec::new())));

    if !recipes.is_empty() {
        let tags: Vec<_> = rorm::query(
            Database::global(),
            (RecipeTag.recipe, RecipeTag.tag.query_as(Tag)),
        )
        .condition(DynamicCollection::or(
            recipes
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

    let items: Vec<_> = recipes
        .into_iter()
        .map(|recipe| SimpleRecipeWithTags {
            uuid: recipe.uuid,
            name: recipe.name,
            description: recipe.description,
            tags: map.remove(&recipe.uuid).unwrap_or_default(),
        })
        .collect();

    let total = items.len().try_into().unwrap_or_default();

    Ok(ApiJson(Page {
        items,
        limit: pagination.limit,
        offset: pagination.offset,
        total,
    }))
}

/// Handles ingredient search requests.
///
/// This function takes a search query and retrieves ingredients from the database
/// that match the query.
///
/// # Arguments
///
/// * `IngredientSearchRequest` - object containing the search term
#[get("/all")]
pub async fn get_all_ingredients() -> ApiResult<ApiJson<List<SimpleIngredient>>> {
    let items: Vec<_> = rorm::query(Database::global(), Ingredient)
        .order_asc(Ingredient.name)
        .all()
        .await?
        .into_iter()
        .map(SimpleIngredient::from)
        .collect();

    Ok(ApiJson(List { list: items }))
}
