//! Alternative for [`axum::Json`] which produces our [`ApiError`] in case of failure

use axum::body::Bytes;
use axum::extract::FromRequest;
use axum::extract::Request;
use axum::http::header;
use axum::http::HeaderValue;
use axum::response::IntoResponse;
use axum::Json;
use schemars::JsonSchema;
use serde::de::DeserializeOwned;
use serde::Serialize;
use swaggapi::as_responses::AsResponses;
use swaggapi::handler_argument::HandlerArgument;
use swaggapi::handler_argument::ShouldBeHandlerArgument;
use swaggapi::internals::SchemaGenerator;
use swaggapi::re_exports::mime;
use swaggapi::re_exports::openapiv3::Parameter;
use swaggapi::re_exports::openapiv3::RequestBody;
use swaggapi::re_exports::openapiv3::Responses;

use crate::http::common::errors::ApiError;

/// Alternative for [`Json`] which produces our [`ApiError`] in case of failure
#[derive(Copy, Clone, Default, Debug)]
pub struct ApiJson<T>(pub T);

impl<S, T: DeserializeOwned> FromRequest<S> for ApiJson<T>
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let bytes = <Bytes as FromRequest<S>>::from_request(req, state)
            .await
            .map_err(|err| {
                ApiError::server_error("Failed to buffer request body").with_source(err)
            })?;
        serde_json::from_slice(bytes.as_ref())
            .map(Self)
            .map_err(|error| {
                ApiError::bad_request("Failed to deserialize request body").with_source(error)
            })
    }
}

impl<T: Serialize> IntoResponse for ApiJson<T> {
    fn into_response(self) -> axum::response::Response {
        // Use a small initial capacity of 128 bytes like serde_json::to_vec
        // https://docs.rs/serde_json/1.0.82/src/serde_json/ser.rs.html#2189
        let mut buf = Vec::with_capacity(128);
        match serde_json::to_writer(&mut buf, &self.0) {
            Ok(()) => (
                [(
                    header::CONTENT_TYPE,
                    HeaderValue::from_static(mime::APPLICATION_JSON.as_ref()),
                )],
                buf,
            )
                .into_response(),
            Err(err) => ApiError::server_error("Failed to serialize response body")
                .with_source(err)
                .into_response(),
        }
    }
}

impl<T: Serialize + JsonSchema> AsResponses for ApiJson<T> {
    fn responses(gen: &mut SchemaGenerator) -> Responses {
        Json::<T>::responses(gen)
    }
}

impl<T> ShouldBeHandlerArgument for ApiJson<T> {}
impl<T: DeserializeOwned + JsonSchema> HandlerArgument for ApiJson<T> {
    fn request_body(gen: &mut SchemaGenerator) -> Option<RequestBody> {
        Json::<T>::request_body(gen)
    }
    fn parameters(gen: &mut SchemaGenerator, path: &[&str]) -> Vec<Parameter> {
        Json::<T>::parameters(gen, path)
    }
}
