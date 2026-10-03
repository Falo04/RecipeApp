use galvyn::core::stuff::api_error::ApiResult;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::get;

use crate::http::handler::users::schema::SimpleUser;
use crate::models::user::User;

/// This function handles requests to the "/me" endpoint.
#[get("/me")]
pub async fn get_me(user: User) -> ApiResult<ApiJson<SimpleUser>> {
    Ok(ApiJson(SimpleUser::from(user)))
}
