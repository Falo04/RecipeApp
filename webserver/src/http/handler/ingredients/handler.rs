use std::collections::HashSet;

use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::get;
use galvyn::post;
use rorm::Database;

use super::schema::GetAllRecipesByIngredientsRequest;
use super::schema::SimpleIngredient;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::List;
use crate::http::common::schemas::Page;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::tags::schema::SimpleTag;
use crate::models::ingredients::Ingredient;
use crate::models::recipe_ingredients::RecipeIngredient;
use crate::models::recipes::Recipe;
use crate::models::tags::Tag;

/// Retrieves recipes based on specified ingredients.
#[post("/recipes")]
pub async fn get_recipes_by_ingredients(
    ApiJson(request): ApiJson<GetAllRecipesByIngredientsRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipeWithTags>>> {
    let GetAllRecipesByIngredientsRequest {
        page,
        filter_name,
        filter_uuids,
    } = request;

    let mut tx = Database::global().start_transaction().await?;

    let mut recipes =
        Recipe::query_by_ingredient(&mut tx, &page, filter_name, &filter_uuids.list).await?;

    let mut recipe_uuids = HashSet::new();
    recipes.retain(|recipe| {
        let is_first = !recipe_uuids.contains(&recipe.uuid);
        recipe_uuids.insert(recipe.uuid);
        is_first
    });

    let mut result = Vec::new();

    for recipe in recipes {
        let ingredients = RecipeIngredient::query_by_recipe(&mut tx, &recipe.uuid).await?;

        if ingredients
            .iter()
            .all(|ingredient| !filter_uuids.list.contains(&ingredient.uuid.0))
        {
            continue;
        }

        let tags = Tag::query_by_recipe(&mut tx, &recipe.uuid).await?;

        result.push(SimpleRecipeWithTags {
            uuid: recipe.uuid.0,
            tags: tags.into_iter().map(SimpleTag::from).collect(),
            name: recipe.name,
            description: recipe.description,
        })
    }

    let total = result.len().try_into().unwrap_or_default();

    Ok(ApiJson(Page {
        items: result,
        limit: page.limit,
        offset: page.offset,
        total,
    }))
}

/// Retrieves all ingredients.
#[get("/all")]
pub async fn get_all_ingredients() -> ApiResult<ApiJson<List<SimpleIngredient>>> {
    let items = Ingredient::query_all(Database::global()).await?;
    let items: Vec<_> = items.into_iter().map(SimpleIngredient::from).collect();

    Ok(ApiJson(List { list: items }))
}
