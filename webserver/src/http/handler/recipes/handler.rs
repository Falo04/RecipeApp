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

use super::schema::CreateOrUpdateRecipe;
use super::schema::CreateOrUpdateRecipeErrors;
use crate::http::handler::ingredients::schema::FullIngredient;
use crate::http::handler::recipes::schema::FullRecipe;
use crate::http::handler::recipes::schema::SimpleRecipeWithTags;
use crate::http::handler::recipes::schema::Step;
use crate::http::handler::tags::schema::SimpleTag;
use crate::http::handler::users::schema::SimpleUser;
use crate::http::handler::websockets::schema::WsServerMsg;
use crate::models::recipes;
use crate::models::recipes::Recipe;
use crate::models::recipes::RecipeCreateParams;
use crate::models::recipes::RecipeName;
use crate::models::recipes::RecipeUpdateParams;
use crate::models::recipes::RecipeUuid;
use crate::models::recipes::ingredients::RecipeIngredientInsertParams;
use crate::models::recipes::steps::RecipeStepInsertParams;
use crate::models::user::User;
use crate::modules::websocket::WebsocketManager;

/// Retrieves all recipes with their associated tags.
#[get("/all")]
pub async fn get_all_recipes() -> ApiResult<ApiJson<List<SimpleRecipeWithTags>>> {
    let mut tx = Database::global().start_transaction().await?;
    let recipes = Recipe::query_all(&mut tx).await?;
    tx.commit().await?;

    Ok(ApiJson(List {
        list: recipes
            .into_iter()
            .map(SimpleRecipeWithTags::from)
            .collect(),
    }))
}

/// Retrieves a recipe by its UUID.
#[get("/{recipe_uuid}")]
pub async fn get_recipe(Path(recipe_uuid): Path<RecipeUuid>) -> ApiResult<ApiJson<FullRecipe>> {
    let mut tx = Database::global().start_transaction().await?;

    let Some(recipe) = recipes::FullRecipe::query_by_uuid(&mut tx, recipe_uuid).await? else {
        return Err(ApiError::bad_request("Recipe not found"));
    };

    let Some(user) = User::query_by_uuid(&mut tx, recipe.user).await? else {
        return Err(ApiError::bad_request("User not found"));
    };

    tx.commit().await?;

    Ok(ApiJson(FullRecipe {
        uuid: recipe.uuid,
        name: recipe.name.into(),
        description: recipe.description,
        user: SimpleUser::from(user),
        ingredients: recipe
            .ingredients
            .into_iter()
            .map(FullIngredient::from)
            .collect(),
        tags: recipe.tags.into_iter().map(SimpleTag::from).collect(),
        steps: recipe.steps.into_iter().map(Step::from).collect(),
    }))
}

/// Creates a new recipe.
#[post("/")]
pub async fn create_recipe(
    user: User,
    ApiJson(request): ApiJson<CreateOrUpdateRecipe>,
) -> ApiResult<ApiJson<SingleUuid>, CreateOrUpdateRecipeErrors> {
    let mut tx = Database::global().start_transaction().await?;

    let mut errors = FormErrors::<CreateOrUpdateRecipeErrors>::new();
    let Some(name) = RecipeName::new(&mut tx, request.name).await? else {
        errors.name_already_exists = true;
        return errors.fail();
    };

    let recipe = Recipe::create(
        &mut tx,
        RecipeCreateParams {
            name,
            description: request.description,
            user: user.uuid,
            ingredients: ingredient_params(request.ingredients),
            steps: step_params(request.steps),
            tags: request.tags,
        },
    )
    .await?;

    tx.commit().await?;

    WebsocketManager::global().send_to_all(WsServerMsg::RecipesChanged {});
    WebsocketManager::global().send_to_all(WsServerMsg::IngredientsChanged {});

    Ok(ApiJson(SingleUuid {
        uuid: recipe.uuid.into_inner(),
    }))
}

/// Updates an existing recipe based on its UUID.
#[put("/{recipe_uuid}")]
pub async fn update_recipe(
    Path(recipe_uuid): Path<RecipeUuid>,
    ApiJson(request): ApiJson<CreateOrUpdateRecipe>,
) -> ApiResult<(), CreateOrUpdateRecipeErrors> {
    let mut tx = Database::global().start_transaction().await?;

    let mut recipe = Recipe::query_by_uuid(&mut tx, recipe_uuid)
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    let name = if request.name != *recipe.name {
        let Some(name) = RecipeName::new(&mut tx, request.name).await? else {
            let mut errors = FormErrors::<CreateOrUpdateRecipeErrors>::new();
            errors.name_already_exists = true;
            return errors.fail();
        };
        Some(name)
    } else {
        None
    };

    recipe
        .update(
            &mut tx,
            RecipeUpdateParams {
                name,
                description: Some(request.description),
                ingredients: Some(ingredient_params(request.ingredients)),
                steps: Some(step_params(request.steps)),
                tags: Some(request.tags),
            },
        )
        .await?;

    tx.commit().await?;

    WebsocketManager::global().send_to_all(WsServerMsg::RecipesChanged {});
    WebsocketManager::global().send_to_all(WsServerMsg::IngredientsChanged {});

    Ok(())
}

/// Deletes a recipe by its UUID.
#[delete("/{recipe_uuid}")]
pub async fn delete_recipe(Path(recipe_uuid): Path<RecipeUuid>) -> ApiResult<()> {
    let mut tx = Database::global().start_transaction().await?;

    let recipe = Recipe::query_by_uuid(&mut tx, recipe_uuid)
        .await?
        .ok_or(ApiError::bad_request("Invalid recipe uuid"))?;

    recipe.delete(&mut tx).await?;
    tx.commit().await?;

    WebsocketManager::global().send_to_all(WsServerMsg::RecipesChanged {});

    Ok(())
}

fn ingredient_params(ingredients: Vec<FullIngredient>) -> Vec<RecipeIngredientInsertParams> {
    ingredients
        .into_iter()
        .map(|i| RecipeIngredientInsertParams {
            name: i.name,
            amount: i.amount,
            unit: i.unit,
        })
        .collect()
}

fn step_params(steps: Vec<Step>) -> Vec<RecipeStepInsertParams> {
    steps
        .into_iter()
        .map(|s| RecipeStepInsertParams {
            step: s.step,
            index: s.index,
        })
        .collect()
}
