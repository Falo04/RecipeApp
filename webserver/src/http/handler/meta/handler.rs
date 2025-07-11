use galvyn::core::stuff::api_json::ApiJson;
use galvyn::get;

use crate::config::AUTHENTICATION_ENABLED;
use crate::http::common::errors::ApiResult;
use crate::http::handler::meta::schema::MetaResponse;

/// Retrieves the meta-information for the application.
///
/// This endpoint returns a JSON object containing meta-information,
#[get("/")]
pub async fn get_meta() -> ApiResult<ApiJson<MetaResponse>> {
    Ok(ApiJson(MetaResponse {
        authentication_enabled: *AUTHENTICATION_ENABLED,
    }))
}
