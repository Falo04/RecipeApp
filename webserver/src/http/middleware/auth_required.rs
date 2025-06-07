use std::ops::ControlFlow;

use axum::extract::FromRequestParts;
use axum::extract::Request;
use axum::response::IntoResponse;
use axum::response::Response;

use crate::impl_simple_axum_layer;
use crate::models::users::User;

#[derive(Copy, Clone, Debug)]
pub struct AuthRequiredLayer;
impl_simple_axum_layer!(AuthRequiredLayer => AuthRequiredService);
impl AuthRequiredLayer {
    async fn simple_call(self, req: Request) -> ControlFlow<Response, Request> {
        let (mut parts, body) = req.into_parts();
        match User::from_request_parts(&mut parts, &()).await {
            Ok(_user) => ControlFlow::Continue(Request::from_parts(parts, body)),
            Err(rejection) => ControlFlow::Break(rejection.into_response()),
        }
    }
}
