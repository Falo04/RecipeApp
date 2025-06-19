use axum::extract::Query;
use bcrypt::verify;
use futures_lite::StreamExt;
use galvyn::core::stuff::api_json::ApiJson;
use galvyn::core::Module;
use galvyn::get;
use galvyn::post;
use galvyn::rorm::Database;
use jsonwebtoken::encode;
use jsonwebtoken::EncodingKey;
use jsonwebtoken::Header;
use time::Duration;
use time::OffsetDateTime;

use super::schema::SimpleUser;
use super::schema::TokenDataReponse;
use super::schema::UserSignInRequest;
use crate::config::JWT;
use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::GetPageRequest;
use crate::http::common::schemas::Page;
use crate::http::extractors::authentication::Claims;
use crate::models::users::User;

/// Retrieves all users with pagination support.
///
/// This function queries the database for all `User` records and returns them as a paginated response.
///
/// # Arguments
///
/// * `Query<GetPageRequest>` - object containing pagination parameters such as limit and offset.
#[get("/")]
pub async fn get_all_users(
    pagination: Query<GetPageRequest>,
) -> ApiResult<ApiJson<Page<SimpleUser>>> {
    let items = rorm::query(Database::global(), User)
        .limit(pagination.limit)
        .offset(pagination.offset)
        .stream()
        .map(|result| result.map(SimpleUser::from))
        .try_collect()
        .await?;
    let total = rorm::query(Database::global(), User.uuid.count())
        .one()
        .await?;
    Ok(ApiJson(Page {
        items,
        limit: pagination.limit,
        offset: pagination.offset,
        total,
    }))
}

/// This function handles requests to the "/me" endpoint.
///
/// It takes a `User` object as input.
///
/// # Arguments
///
/// * `User` - a `User` object.
#[get("/me")]
pub async fn get_me(user: User) -> ApiResult<ApiJson<SimpleUser>> {
    Ok(ApiJson(SimpleUser::from(user)))
}

/// Signs in the current user and returns a JWT token.
///
/// This endpoint handles user login, verifies credentials, and returns a JWT token
/// for subsequent requests.
///
/// # Arguments
///
/// * `ApiJson<UserSignInRequest>` - A JSON object containing the user's email and password.
#[post("/login")]
pub async fn sign_in_me(
    ApiJson(request): ApiJson<UserSignInRequest>,
) -> ApiResult<ApiJson<TokenDataReponse>> {
    let mut tx = Database::global().start_transaction().await?;

    let user = match rorm::query(&mut tx, User)
        .condition(User.mail.equals(&request.email))
        .optional()
        .await?
    {
        Some(user) => user,
        None => return Err(ApiError::server_error("user id invalid")),
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
    let key = EncodingKey::from_secret(JWT.clone().as_bytes());

    let token = encode(&Header::default(), &claims, &key)
        .map_err(|_| ApiError::server_error("jwt encode error"))?;

    Ok(ApiJson(TokenDataReponse { token }))
}
