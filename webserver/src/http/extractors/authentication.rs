use axum::extract::FromRequestParts;
use axum::http::header;
use axum::http::request::Parts;
use jsonwebtoken::DecodingKey;
use jsonwebtoken::TokenData;
use jsonwebtoken::Validation;
use jsonwebtoken::decode;
use serde::Deserialize;
use serde::Serialize;
use swaggapi::re_exports::openapiv3::StatusCode;
use tracing::info;
use uuid::Uuid;

use crate::global::GLOBAL;
use crate::http::common::errors::ApiError;
use crate::http::common::schemas::ApiStatusCode;
use crate::models::user::User;

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub uuid: Uuid,
    pub exp: usize,
}

const BEARER: &str = "Bearer ";

impl<S> FromRequestParts<S> for User
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .ok_or_else(|| {
                ApiError::new(
                    ApiStatusCode::Unauthenticated,
                    "Authorization header was not given",
                    Some("Authorization header was not given"),
                )
            })?
            .to_str()
            .map_err(|_| ApiError::server_error("Invalid AUTHORIZATION header format", None))?;

        if auth_header.is_empty() {
            return Err(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "No valid token format, empty string",
                Some("No valid token format"),
            ));
        }

        if !auth_header.starts_with("Bearer ") {
            info!("auth_header: {auth_header}");
            return Err(ApiError::server_error("Invalid token format", None));
        }

        let token = auth_header[BEARER.len()..].trim();

        let token_data = decode_jwt(token)?;

        let Some(user) = rorm::query(&GLOBAL.db, User)
            .condition(User.uuid.equals(token_data.claims.uuid))
            .optional()
            .await?
        else {
            info!("user uuid not found: {}", token_data.claims.uuid);
            return Err(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "Unknown user UUID in session",
                None,
            ));
        };

        Ok(user)
    }
}

fn decode_jwt(jwt: &str) -> Result<TokenData<Claims>, ApiError> {
    let secret = GLOBAL.jwt.to_string();

    decode(
        jwt,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )
    .map_err(|e| {
        info!("secret: {secret}, token: {jwt}, error: {e}");
        ApiError::new(
            ApiStatusCode::Unauthenticated,
            "You are not an authorized user",
            None,
        )
    })
}
