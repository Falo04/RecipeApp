//! This module holds the errors and the error conversion for handlers
//! that are returned from handlers

use std::error::Error;
use std::fmt;
use std::panic::Location;

use galvyn::core::handler::response_body::ResponseBody;
use galvyn::core::handler::response_body::ShouldBeResponseBody;
use galvyn::core::re_exports::axum::http::StatusCode;
use galvyn::core::re_exports::axum::response::IntoResponse;
use galvyn::core::re_exports::axum::response::Response;
use galvyn::core::re_exports::mime;
use galvyn::core::schema_generator::SchemaGenerator;
use galvyn::core::stuff::api_json::ApiJson;
use rorm::crud::update::UpdateBuilder;
use schemars::schema::Schema;
use thiserror::Error;
use tracing::debug;
use tracing::error;

use crate::http::common::schemas::ApiErrorResponse;
use crate::http::common::schemas::ApiStatusCode;

/// A type alias that includes the ApiError
pub type ApiResult<T> = Result<T, ApiError>;

/// The common error that is returned from the handlers
#[derive(Debug, Error)]
pub struct ApiError {
    /// Rough indication of the error reason (exposed to frontend)
    pub code: ApiStatusCode,
    /// An arbitrary string literal describing the error
    pub context: Option<&'static str>,
    /// Location where the error originated from
    pub location: &'static Location<'static>,
    /// The error's underlying source
    pub source: Option<Box<dyn Error + Send + Sync + 'static>>,
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.code {
            ApiStatusCode::Unauthenticated => write!(f, "Unauthenticated")?,
            ApiStatusCode::BadRequest | ApiStatusCode::InvalidJson => write!(f, "Bad Request")?,
            ApiStatusCode::InternalServerError => write!(f, "Server Error")?,
        }
        if let Some(context) = self.context {
            write!(f, " '{context}'")?;
        }
        if let Some(source) = &self.source {
            write!(f, " cause by '{source}'")?;
        }
        write!(f, " at '{}'", self.location)
    }
}

impl ApiError {
    /// Constructs a new `ApiError`
    #[track_caller]
    pub fn new(code: ApiStatusCode, context: &'static str) -> Self {
        Self {
            code,
            context: Some(context),
            location: Location::caller(),
            source: None,
        }
    }

    /// Constructs a new `ApiError` with [`ApiStatusCode::BadRequest`]
    #[track_caller]
    pub fn bad_request(context: &'static str) -> Self {
        Self::new(ApiStatusCode::BadRequest, context)
    }

    /// Constructs a new `ApiError` with [`ApiStatusCode::InternalServerError`]
    #[track_caller]
    pub fn server_error(context: &'static str) -> Self {
        Self::new(ApiStatusCode::InternalServerError, context)
    }

    /// Adds a source to the `ApiError`
    pub fn with_source(mut self, source: impl Error + Send + Sync + 'static) -> Self {
        self.source = Some(source.into());
        self
    }

    /// Creates a closure for wrapping any error into an `ApiError::server_error`
    #[track_caller]
    pub fn map_server_error<E: Error + Send + Sync + 'static>(
        context: &'static str,
    ) -> impl Fn(E) -> Self {
        move |error| Self::server_error(context).with_source(error)
    }

    /// Emit a tracing event `error!` or `debug!` describing the `ApiError`
    pub fn emit_tracing_event(&self) {
        let Self {
            code,
            context,
            location,
            source,
        } = &self;

        match code {
            ApiStatusCode::Unauthenticated
            | ApiStatusCode::BadRequest
            | ApiStatusCode::InvalidJson => {
                debug!(
                    error.code = ?code,
                    error.context = context,
                    error.file = location.file(),
                    error.line = location.line(),
                    error.column = location.column(),
                    error.display = source.as_ref().map(tracing::field::display),
                    error.debug = source.as_ref().map(tracing::field::debug),
                    "Client error"
                );
            }
            ApiStatusCode::InternalServerError => {
                error!(
                    error.code = ?code,
                    error.context = context,
                    error.file = location.file(),
                    error.line = location.line(),
                    error.column = location.column(),
                    error.display = source.as_ref().map(tracing::field::display),
                    error.debug = source.as_ref().map(tracing::field::debug),
                    "Server error"
                );
            }
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        self.emit_tracing_event();

        let res = (
            if (self.code as u16) == 1000 {
                StatusCode::UNAUTHORIZED
            } else if (self.code as u16) < 2000 {
                StatusCode::BAD_REQUEST
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            },
            ApiJson(ApiErrorResponse {
                status_code: self.code,
                message: match self.context {
                    Some(context) => context,
                    None => match self.code {
                        ApiStatusCode::Unauthenticated => "Unauthenticated",
                        ApiStatusCode::BadRequest => "Bad request",
                        ApiStatusCode::InvalidJson => "Invalid json",
                        ApiStatusCode::InternalServerError => "Internal server error",
                    },
                }
                .to_string(),
            }),
        );

        res.into_response()
    }
}

impl ShouldBeResponseBody for ApiError {}
impl ResponseBody for ApiError {
    fn body(
        generator: &mut SchemaGenerator,
    ) -> Vec<(StatusCode, Option<(mime::Mime, Option<Schema>)>)> {
        let schema = generator.generate::<ApiErrorResponse>();
        vec![
            (
                StatusCode::BAD_REQUEST,
                Some((mime::APPLICATION_JSON, Some(schema.clone()))),
            ),
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Some((mime::APPLICATION_JSON, Some(schema))),
            ),
        ]
    }
}

impl<'rf, E, M> From<UpdateBuilder<'rf, E, M, rorm::crud::update::columns::Empty>> for ApiError {
    #[track_caller]
    fn from(_value: UpdateBuilder<'rf, E, M, rorm::crud::update::columns::Empty>) -> Self {
        Self::bad_request("Nothing to update")
    }
}

/// Simple macro to reduce the noise of several identical `From` implementations
///
/// It takes a list of error types
/// which are supposed to be convertable into an [`ApiError::server_error`] simplicity.
macro_rules! impl_into_internal_server_error {
    ($($error:ty,)*) => {$(
        impl From<$error> for ApiError {
            #[track_caller]
            fn from(value: $error) -> Self {
                Self {
                    code: ApiStatusCode::InternalServerError,
                    context: None,
                    location: Location::caller(),
                    source: Some(value.into()),
                }
            }
        }
    )+};
}
impl_into_internal_server_error!(rorm::Error, tower_sessions::session::Error, tonic::Status,);
