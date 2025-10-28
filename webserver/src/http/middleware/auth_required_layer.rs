//! This function implements an authentication layer for Axum routes.
//!
//! It attempts to extract a user from the incoming request. If successful,
//! it passes the request to the next handler in the chain. If an error
//! occurs during user extraction, it returns the error.

use galvyn::core::re_exports::axum::extract::FromRequestParts;
use galvyn::core::re_exports::axum::extract::Request;
use galvyn::core::re_exports::axum::middleware::Next;
use galvyn::core::re_exports::axum::response::Response;
use galvyn::core::stuff::api_error::ApiError;

use crate::models::account::Account;

/// This layer is responsible for authentication.
///
/// It first attempts to authenticate the request based on the request parts.
/// If authentication is successful, it passes the request to the next layer
/// in the request pipeline. If authentication fails, it returns an `ApiError`.
pub async fn auth_required_layer(req: Request, next: Next) -> Result<Response, ApiError> {
    let (mut parts, body) = req.into_parts();
    match Account::from_request_parts(&mut parts, &()).await {
        Ok(_user) => Ok(next.run(Request::from_parts(parts, body)).await),
        Err(rejection) => Err(rejection),
    }
}
