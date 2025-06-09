//! Defines data structures for API requests and responses.
use schemars::JsonSchema;
use schemars::JsonSchema_repr;
use serde::Deserialize;
use serde::Serialize;
use serde_repr::Deserialize_repr;
use serde_repr::Serialize_repr;
use uuid::Uuid;

/// Represents a single UUID.
///
/// This struct contains a single UUID value.
#[derive(Debug, Clone, Copy, Deserialize, Serialize, JsonSchema)]
pub struct SingleUuid {
    #[allow(missing_docs)]
    pub uuid: Uuid,
}

/// Represents a list of items of type `T`.
///
/// This struct is designed to hold a collection of items,
/// providing a structured way to represent lists in JSON and other data formats.
/// It implements traits for debugging, cloning, JSON deserialization, and JSON schema validation.
#[derive(Debug, Clone, Deserialize, Serialize, JsonSchema)]
pub struct List<T> {
    #[allow(missing_docs)]
    pub list: Vec<T>,
}

/// Represents the request structure for retrieving a paginated list of items.
///
/// This struct defines the parameters for requesting a specific page of data.

/// Default values are provided for `limit` and `offset` using the
/// `default_limit` and `default_offset` functions respectively.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct GetPageRequest {
    /// The maximum number of items to return in this page.
    #[serde(default = "default_limit")]
    pub limit: u64,

    /// The starting index of the items to return in this page.
    #[serde(default = "default_offset")]
    pub offset: u64,
}

/// Returns a default limit value of 999.
///
/// This function provides a sensible default value for a limit,
/// often used in scenarios where a specific value isn't known or
/// relevant.
fn default_limit() -> u64 {
    999
}

/// Returns a default offset value.
///
/// This function simply returns 0 as the default offset.
fn default_offset() -> u64 {
    0
}

/// Represents a paginated list of items.
///
/// This struct holds the items for a page, along with pagination metadata
/// such as the limit, offset, and total number of items.
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct Page<T> {
    /// A vector containing the items for this page.
    pub items: Vec<T>,

    /// The maximum number of items requested in this page.
    pub limit: u64,

    /// The starting offset for this page.
    pub offset: u64,

    /// The total number of items in the underlying dataset.
    pub total: i64,
}

/// Represents different HTTP status codes used in the API.
#[derive(Debug, Clone, Copy, Deserialize_repr, Serialize_repr, JsonSchema_repr)]
#[repr(u16)]
#[allow(missing_docs)]
pub enum ApiStatusCode {
    Unauthenticated = 1000,
    BadRequest = 1001,
    InvalidJson = 1002,

    InternalServerError = 2000,
}

/// Represents a generic API error response.
///
/// This struct provides a consistent way to represent errors returned by
/// the API, containing a status code and a human-readable message.
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
