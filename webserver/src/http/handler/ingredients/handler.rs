use galvyn::core::Module;
use galvyn::core::stuff::api_error::ApiResult;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::stuff::schema::List;
use galvyn::get;
use galvyn::rorm::Database;

use super::schema::SimpleIngredient;
use crate::models::ingredients::Ingredient;

/// Retrieves all ingredients.
#[get("/all")]
pub async fn get_all_ingredients() -> ApiResult<ApiJson<List<SimpleIngredient>>> {
    let mut tx = Database::global().start_transaction().await?;
    let items = Ingredient::query_all(&mut tx).await?;
    tx.commit().await?;

    Ok(ApiJson(List {
        list: items.into_iter().map(SimpleIngredient::from).collect(),
    }))
}
