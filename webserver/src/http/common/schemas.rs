use schemars::JsonSchema;
use schemars::JsonSchema_repr;
use serde::Deserialize;
use serde::Serialize;
use serde_repr::Deserialize_repr;
use serde_repr::Serialize_repr;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, JsonSchema)]
pub struct SingleUuid {
    #[allow(missing_docs)]
    pub uuid: Uuid,
}

/// # Optional
/// A single field which might be `null`.
///
/// ## Rust Usage
///
/// If you want to return an `ApiJson<Option<T>>` from your handler,
/// please use `ApiJson<Optional<T>>` instead.
///
/// It simply wraps the option into a struct with a single field
/// to ensure the json returned from a handler is always an object.
// #[derive(Debug, Clone, Copy, Deserialize, Serialize, JsonSchema)]
// pub struct Optional<T> {
//     #[allow(missing_docs)]
//     pub optional: Option<T>,
// }
// impl<T> Optional<T> {
//     /// Shorthand for `Optional { optional: Some(value) }`
//     pub fn some(value: T) -> Self {
//         Self {
//             optional: Some(value),
//         }
//     }
//
//     /// Shorthand for `Optional { optional: None }`
//     pub fn none() -> Self {
//         Self { optional: None }
//     }
// }
/// # List
/// A single field which is an array.
///
/// ## Rust Usage
///
/// If you want to return an `ApiJson<Vec<T>>` from your handler,
/// please use `ApiJson<List<T>>` instead.
///
/// It simply wraps the vector into a struct with a single field
/// to ensure the json returned from a handler is always an object.
#[derive(Debug, Clone, Deserialize, Serialize, JsonSchema)]
pub struct List<T> {
    #[allow(missing_docs)]
    pub list: Vec<T>,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GetPageRequest {
    /// The limit this page was requested with
    #[serde(default = "default_limit")]
    pub limit: u64,

    /// The offset this page was requested with
    #[serde(default = "default_offset")]
    pub offset: u64,
}

fn default_limit() -> u64 {
    50
}
fn default_offset() -> u64 {
    0
}

/// A page of items
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Page<T> {
    /// The page's items
    pub items: Vec<T>,

    /// The limit this page was requested with
    pub limit: u64,

    /// The offset this page was requested with
    pub offset: u64,

    /// The total number of items this page is a subset of
    pub total: i64,
}

/// The Status code that are returned throughout the API
#[derive(Debug, Clone, Copy, Deserialize_repr, Serialize_repr, JsonSchema_repr)]
#[repr(u16)]
#[allow(missing_docs)]
pub enum ApiStatusCode {
    Unauthenticated = 1000,
    BadRequest = 1001,
    InvalidJson = 1002,

    InternalServerError = 2000,
}

/// The response that is sent in a case of an error
#[derive(Debug, Clone, Deserialize, Serialize, JsonSchema)]
#[allow(missing_docs)]
pub struct ApiErrorResponse {
    /// The Status code for the error.
    ///
    /// Important: Does not match http status codes
    pub status_code: ApiStatusCode,
    /// A human-readable error message.
    ///
    /// May be used for displaying purposes
    pub message: String,
}
