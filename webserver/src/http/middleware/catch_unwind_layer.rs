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

#[derive(Clone)]
pub struct CatchUnwindLayer;

impl<S> Layer<S> for CatchUnwindLayer {
    type Service = CatchUnwindService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        CatchUnwindService {
            layer: self.clone(),
            inner,
        }
    }
}

#[derive(Clone)]
pub struct CatchUnwindService<S> {
    layer: CatchUnwindLayer,
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
