use std::ops::Deref;

use galvyn::core::re_exports::axum::extract::Path;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::delete;
use galvyn::get;
use galvyn::post;
use galvyn::put;
use galvyn::rorm::Database;
use tracing::debug;

use super::schema::CreateOrUpdateRecipe;
use super::schema::GetAllRecipesRequest;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::Page;
use crate::http::common::schemas::SingleUuid;
use crate::http::handler::account::schema::SimpleAccount;
use crate::http::handler::ingredients::schema::FullIngredient;
use crate::http::handler::recipes::schema::FullRecipe;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::recipes::schema::Step;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::websockets::schema::WsServerMsg;
use crate::models::account::Account;
use crate::models::ingredients::Ingredient;
use crate::models::recipe_ingredients::RecipeIngredient;
use crate::models::recipe_steps::RecipeStep;
use crate::models::recipes::Recipe;
use crate::models::recipes::RecipeUuid;
use crate::models::tags::Tag;
use crate::models::tags::TagUuid;
use crate::modules::websockets::WebsocketManager;

/// Retrieves all recipes with pagination support and associated tags.
#[post("/all")]
pub async fn get_all_recipes(
    ApiJson(pagination): ApiJson<GetAllRecipesRequest>,
) -> ApiResult<ApiJson<Page<SimpleRecipeWithTags>>> {
    let GetAllRecipesRequest { page, filter_name } = pagination;

    let mut tx = Database::global().start_transaction().await?;

    let recipes = Recipe::query_all(&mut tx, &page, filter_name).await?;
    let total = Recipe::query_total(&mut tx).await?;

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

    tx.commit().await?;

    Ok(ApiJson(Page {
        items: result,
        limit: page.limit,
        offset: page.offset,
        total,
    }))
}

/// Retrieves a recipe by its UUID.
#[get("/{uuid}")]
pub async fn get_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
) -> ApiResult<ApiJson<FullRecipe>> {
    let mut tx = Database::global().start_transaction().await?;

    let Some(recipe) = Recipe::query_by_uuid(&mut tx, &RecipeUuid { 0: recipe_uuid }).await? else {
        return Err(ApiError::bad_request("Recipe not found"));
    };

    let recipe_ingredients = RecipeIngredient::query_by_recipe(&mut tx, &recipe.uuid).await?;
    debug!(recipe_ingredients = ?recipe_ingredients, "recipe_ingredients");
    let mut full_ingredients = Vec::new();
    for recipe_ingredient in recipe_ingredients {
        let Some(ingredient) =
            Ingredient::query_by_uuid(&mut tx, &recipe_ingredient.ingredients).await?
        else {
            return Err(ApiError::bad_request("Ingredient not found"));
        };
        full_ingredients.push(FullIngredient {
            uuid: Some(recipe_ingredient.uuid.0),
            name: ingredient.name,
            amount: recipe_ingredient.amount,
            unit: recipe_ingredient.unit,
        })
    }

    let Some(account) = Account::query_by_uuid(&mut tx, &recipe.user).await? else {
        return Err(ApiError::bad_request("Account not found"));
    };

    let tags = Tag::query_by_recipe(&mut tx, &recipe.uuid).await?;
    let steps = RecipeStep::query_by_recipe(&mut tx, &recipe.uuid).await?;

    tx.commit().await?;

    let full_recipe = FullRecipe {
        uuid: recipe.uuid.0,
        name: recipe.name,
        description: recipe.description,
        user: SimpleAccount::from(account),
        ingredients: full_ingredients,
        tags: tags.into_iter().map(SimpleTag::from).collect(),
        steps: steps.into_iter().map(Step::from).collect(),
    };

    Ok(ApiJson(full_recipe))
}

/// Creates a new recipe.
#[post("/")]
pub async fn create_recipe(
    user: Account,
    ApiJson(request): ApiJson<CreateOrUpdateRecipe>,
) -> ApiResult<ApiJson<SingleUuid>> {
    let mut tx = Database::global().start_transaction().await?;

    if Recipe::query_by_name(&mut tx, request.name.deref())
        .await?
        .is_some()
    {
        return Err(ApiError::bad_request("Recipe name already exists"));
    }

    let recipe = Recipe::create(&mut tx, request.name, request.description, user.uuid).await?;

    RecipeStep::delete_by_recipe(&mut tx, &recipe.uuid).await?;
    for step in request.steps {
        RecipeStep::create(&mut tx, recipe.uuid, step.step, step.index).await?;
    }

    Tag::remove_from_recipe(&mut tx, recipe.uuid).await?;
    for tag in request.tags {
        Tag::add_to_recipe(&mut tx, &recipe.uuid, &TagUuid { 0: tag }).await?;
    }

    RecipeIngredient::delete_by_recipe(&mut tx, &recipe.uuid).await?;
    for ingredient in request.ingredients {
        let uuid = Ingredient::get_uuid_or_create(&mut tx, ingredient.name).await?;
        RecipeIngredient::create(
            &mut tx,
            recipe.uuid,
            uuid,
            ingredient.amount,
            ingredient.unit,
        )
        .await?;
    }

    tx.commit().await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::RecipesChanged {})
        .await;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::IngredientsChanged {})
        .await;

    Ok(ApiJson(SingleUuid {
        uuid: recipe.uuid.0,
    }))
}

/// Updates an existing recipe based on its UUID.
#[put("/{uuid}")]
pub async fn update_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateRecipe>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let recipe = Recipe::query_by_uuid(&mut tx, &RecipeUuid { 0: recipe_uuid })
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    RecipeStep::delete_by_recipe(&mut tx, &recipe.uuid).await?;
    for step in request.steps {
        RecipeStep::create(&mut tx, recipe.uuid, step.step, step.index).await?;
    }

    Tag::remove_from_recipe(&mut tx, recipe.uuid).await?;
    for tag in request.tags {
        Tag::add_to_recipe(&mut tx, &recipe.uuid, &TagUuid { 0: tag }).await?;
    }

    RecipeIngredient::delete_by_recipe(&mut tx, &recipe.uuid).await?;
    for ingredient in request.ingredients {
        let uuid = Ingredient::get_uuid_or_create(&mut tx, ingredient.name).await?;
        RecipeIngredient::create(
            &mut tx,
            recipe.uuid,
            uuid,
            ingredient.amount,
            ingredient.unit,
        )
        .await?;
    }

    Recipe::update(&mut tx, &recipe.uuid, request.name, request.description).await?;

    tx.commit().await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::RecipesChanged {})
        .await;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::IngredientsChanged {})
        .await;

    Ok(())
}

/// Deletes a recipe by its UUID.
#[delete("/{uuid}")]
pub async fn delete_recipe(
    Path(SingleUuid { uuid: recipe_uuid }): Path<SingleUuid>,
) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let recipe = Recipe::query_by_uuid(&mut tx, &RecipeUuid { 0: recipe_uuid })
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    Recipe::delete(&mut tx, &recipe.uuid).await?;

    tx.commit().await?;

    WebsocketManager::global()
        .send_to_all(WsServerMsg::RecipesChanged {})
        .await;

    Ok(())
}
