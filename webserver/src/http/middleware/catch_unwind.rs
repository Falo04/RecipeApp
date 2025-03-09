//! Middleware which catches stack unwinding cased by a panic
//! and converts it into a `500` response and a logged error.

use std::any::Any;
use std::convert::Infallible;
use std::panic::AssertUnwindSafe;

use axum::extract::Request;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::response::Response;
use futures_lite::FutureExt;
use tower::Service;
use tracing::info;

use crate::http::common::schemas::ApiErrorResponse;
use crate::http::common::schemas::ApiStatusCode;
use crate::http::extractors::api_json::ApiJson;
use crate::impl_axum_layer;

/// Middleware which catches stack unwinding cased by a panic
/// and converts it into a `500` response and a logged error.
#[derive(Copy, Clone, Debug)]
pub struct CatchUnwindLayer;
impl_axum_layer!(CatchUnwindLayer => CatchUnwindService);
impl CatchUnwindLayer {
    /// Method invoked by [`impl_axum_layer`] for each request
    async fn call<S>(self, mut inner: S, request: Request) -> Result<Response, Infallible>
    where
        S: Service<Request, Error = Infallible> + Clone + Send + 'static,
        S::Response: IntoResponse,
        S::Future: Send + 'static,
    {
        match AssertUnwindSafe(inner.call(request)).catch_unwind().await {
            Ok(response) => Ok(response.into_response()),
            Err(payload) => {
                info!(msg = payload_as_str(payload.as_ref()), "caught panic");
                Ok((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    ApiJson(ApiErrorResponse {
                        status_code: ApiStatusCode::InternalServerError,
                        message: "Internal server error occurred".to_string(),
                    }),
                )
                    .into_response())
            }
        }
    }
}

/// Copied from the std's default hook (v1.81.0)
fn payload_as_str(payload: &dyn Any) -> &str {
    if let Some(&s) = payload.downcast_ref::<&'static str>() {
        s
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.as_str()
    } else {
        "Box<dyn Any>"
    }
}
