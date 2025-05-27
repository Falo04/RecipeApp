use swaggapi::get;

use crate::global::GLOBAL;
use crate::http::common::errors::ApiResult;
use crate::http::extractors::api_json::ApiJson;
use crate::http::handler::meta::schema::MetaResponse;

#[get("/")]
pub async fn get_meta() -> ApiResult<ApiJson<MetaResponse>> {
    Ok(ApiJson(MetaResponse {
        authentication_enabled: GLOBAL.authentication_enabled,
    }))
}
