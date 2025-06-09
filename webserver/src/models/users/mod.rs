use rorm::Model;
use uuid::Uuid;

/// Represents a user in the system.
#[derive(Model, Clone, Debug)]
pub struct User {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The user's email address (unique and up to 255 characters).
    #[rorm(unique, max_length = 255)]
    pub mail: String,

    /// The user's display name (up to 255 characters).
    #[rorm(max_length = 255)]
    pub display_name: String,

    /// The user's password (up to 1024 characters).
    #[rorm(max_length = 255)]
    pub password: String,
}
