//! This module provides a layer that catches unwind panics within an axum service.
//! It ensures that any panic within the service is gracefully handled and translated
//! into an internal server error response.
use std::any::Any;
use std::convert::Infallible;
use std::panic::AssertUnwindSafe;
use std::task::Context;
use std::task::Poll;

use axum::extract::Request;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::response::Response;
use futures_lite::future::Boxed;
use futures_lite::FutureExt;
use galvyn::core::stuff::api_json::ApiJson;
use tower::Layer;
use tower::Service;
use tracing::info;

use crate::http::common::schemas::ApiErrorResponse;
use crate::http::common::schemas::ApiStatusCode;

/// Represents a layer for catching unwind signals.
#[derive(Clone)]
pub struct CatchUnwindLayer;

impl<S> Layer<S> for CatchUnwindLayer {
    type Service = CatchUnwindService<S>;

    /// This method creates a new `CatchUnwindService` instance.
    fn layer(&self, inner: S) -> Self::Service {
        CatchUnwindService { inner }
    }
}

/// Represents a service that manages unwind-safe execution.
#[derive(Clone)]
pub struct CatchUnwindService<S> {
    inner: S,
}

impl<S> Service<Request> for CatchUnwindService<S>
where
    S: Service<Request, Response = Response, Error = Infallible> + Send + 'static,
    S::Response: IntoResponse,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = Infallible;
    type Future = Boxed<Result<Response, Infallible>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    /// Calls the inner call function and handles potential panics.
    ///
    /// This function wraps the `inner.call(request)` operation within an `async` block to
    /// handle panics gracefully. It uses `AssertUnwindSafe` to attempt to catch panics
    /// that might occur during the inner call. If a panic is caught, it logs the panic
    /// payload and returns an internal server error response.
    fn call(&mut self, request: Request) -> Self::Future {
        let fut = self.inner.call(request);
        Box::pin(async move {
            match AssertUnwindSafe(fut).catch_unwind().await {
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
        })
    }
}

/// Converts a payload of type `&dyn Any` to a `&str`.
///
/// This function attempts to cast the payload to a `&str` or `String`.
/// If successful, it returns a reference to the string.
/// If the payload is neither a `&str` nor a `String`, it returns the string "Box<dyn Any>".
fn payload_as_str(payload: &dyn Any) -> &str {
    if let Some(&s) = payload.downcast_ref::<&'static str>() {
        s
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.as_str()
    } else {
        "Box<dyn Any>"
    }
}
