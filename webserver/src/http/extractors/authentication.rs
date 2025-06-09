//! This module handles user authentication using JWT tokens.
//! It retrieves user information based on a provided JWT token.
use axum::extract::FromRequestParts;
use axum::http::header;
use axum::http::request::Parts;
use galvyn::core::Module;
use galvyn::rorm::Database;
use jsonwebtoken::decode;
use jsonwebtoken::DecodingKey;
use jsonwebtoken::TokenData;
use jsonwebtoken::Validation;
use serde::Deserialize;
use serde::Serialize;
use tracing::info;
use uuid::Uuid;

use crate::config::JWT;
use crate::http::common::errors::ApiError;
use crate::http::common::schemas::ApiStatusCode;
use crate::models::users::User;

/// Represents a set of claims.
///
/// This struct is used to store claims related to authentication or authorization.
/// It contains the user Uuid identifier and an expiration time
#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    /// Represent the user uuid.
    pub uuid: Uuid,

    /// The expiration time of the claims.
    pub exp: usize,
}

/// This constant defines the prefix "Bearer " which is commonly used in
/// Authorization headers for API requests;
const BEARER: &str = "Bearer ";

impl<S> FromRequestParts<S> for User
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    /// Parses an HTTP request part to authenticate a user.
    ///
    /// This function takes a mutable `Parts` struct containing HTTP request parts
    /// and attempts to decode a JWT token from the Authorization header.
    ///
    /// # Arguments
    ///
    /// * `parts`: A mutable reference to a `Parts` struct containing the HTTP request parts.
    /// * `s`: A reference to a context object (unused in this implementation).
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .ok_or_else(|| {
                ApiError::new(
                    ApiStatusCode::Unauthenticated,
                    "Authorization header was not given",
                )
            })?
            .to_str()
            .map_err(|_| ApiError::server_error("Invalid AUTHORIZATION header format"))?;

        if auth_header.is_empty() {
            return Err(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "No valid token format, empty string",
            ));
        }

        if !auth_header.starts_with("Bearer ") {
            return Err(ApiError::server_error("Invalid token format"));
        }

        let token = auth_header[BEARER.len()..].trim();

        let token_data = decode_jwt(token)?;

        let Some(user) = rorm::query(Database::global(), User)
            .condition(User.uuid.equals(token_data.claims.uuid))
            .optional()
            .await?
        else {
            info!("user uuid not found: {}", token_data.claims.uuid);
            return Err(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "Unknown user uuid in session",
            ));
        };

        Ok(user)
    }
}

/// Decodes a JWT token and returns the decoded token data.
///
/// # Arguments
///
/// * `jwt`: The JWT token string to decode.
fn decode_jwt(jwt: &str) -> Result<TokenData<Claims>, ApiError> {
    let secret = JWT.clone().to_string();

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
        )
    })
}
