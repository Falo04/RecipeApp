//! Layer for authentication

use axum::extract::FromRequestParts;
use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;

use crate::http::common::errors::ApiError;
use crate::models::users::User;

pub async fn auth_required_layer(req: Request, next: Next) -> Result<Response, ApiError> {
    let (mut parts, body) = req.into_parts();
    match User::from_request_parts(&mut parts, &()).await {
        Ok(_user) => Ok(next.run(Request::from_parts(parts, body)).await),
        Err(rejection) => Err(rejection),
    }
}
