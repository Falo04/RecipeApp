//! Database model for accounts
use galvyn::rorm::Model;
use galvyn::rorm::fields::types::MaxStr;
use time::OffsetDateTime;
use uuid::Uuid;

/// Represents an account in the system.
#[derive(Model, Clone, Debug)]
#[rorm(rename = "user")]
pub struct UserModel {
    /// Primary key
    #[rorm(primary_key)]
    pub uuid: Uuid,
    /// Name of user
    #[rorm(unique)]
    pub name: MaxStr<255>,
    /// Email of user
    #[rorm(unique)]
    pub email: MaxStr<255>,
    /// Identifier for the Issuer i.e. the provider
    pub issuer: MaxStr<255>,
    /// A locally unique and never reassigned identifier
    /// within the Issuer for the End-User.
    pub subject: MaxStr<255>,
    /// When the user was created
    pub created_at: OffsetDateTime,
}
