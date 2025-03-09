use bcrypt::verify;
use futures_lite::StreamExt;
use jsonwebtoken::encode;
use jsonwebtoken::EncodingKey;
use jsonwebtoken::Header;
use swaggapi::get;
use swaggapi::post;
use time::Duration;
use time::OffsetDateTime;

use super::schema::SimpleUser;
use super::schema::TokenDataReponse;
use super::schema::UserSignInRequest;
use crate::global::GLOBAL;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::List;
use crate::http::extractors::api_json::ApiJson;
use crate::http::extractors::authentication::Claims;
use crate::models::user::User;

#[get("/")]
pub async fn get_all_users() -> ApiResult<ApiJson<List<SimpleUser>>> {
    let list = rorm::query(&GLOBAL.db, User)
        .stream()
        .map(|result| result.map(SimpleUser::from))
        .try_collect()
        .await?;
    Ok(ApiJson(List { list }))
}

#[post("/login")]
pub async fn sign_in_me(
    ApiJson(request): ApiJson<UserSignInRequest>,
) -> ApiResult<ApiJson<TokenDataReponse>> {
    let mut tx = GLOBAL.db.start_transaction().await?;

    let user = match rorm::query(&mut tx, User)
        .condition(User.mail.equals(&request.email))
        .optional()
        .await?
    {
        Some(user) => user,
        None => return Err(ApiError::server_error("user not found")),
    };

    if !verify(&request.password, &user.password)
        .map_err(|_| ApiError::server_error("bycrpt error"))?
    {
        return Err(ApiError::bad_request("Wrong password"));
    }

    let exp = OffsetDateTime::now_utc()
        .checked_add(Duration::hours(4))
        .expect("valid timestamp")
        .unix_timestamp() as usize;

    let claims = Claims {
        uuid: user.uuid,
        exp,
    };
    let key = EncodingKey::from_secret(GLOBAL.jwt.as_bytes());

    let token = encode(&Header::default(), &claims, &key)
        .map_err(|_| ApiError::server_error("jwt encode error"))?;

    Ok(ApiJson(TokenDataReponse { token }))
}
