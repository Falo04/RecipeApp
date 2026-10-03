//! Account extrator which gets the account from the session
use galvyn::core::Module;
use galvyn::core::re_exports::axum::extract::FromRequestParts;
use galvyn::core::re_exports::axum::http::request::Parts;
use galvyn::core::session::Session;
use galvyn::core::stuff::api_error::ApiError;
use galvyn::rorm::Database;

use crate::models::user::SESSION_KEY;
use crate::models::user::User;
use crate::models::user::UserUuid;

impl<S> FromRequestParts<S> for User
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    /// Parses an HTTP request part to authenticate a user.
    ///
    /// This function takes a mutable `Parts` struct containing HTTP request parts
    /// and attempts to decode a JWT token from the Authorization header.
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        if let Some(CachedUser(user)) = parts.extensions.get() {
            return Ok(user.clone());
        }

        let session = parts
            .extensions
            .get::<Session>()
            .ok_or(ApiError::server_error("Can't extract session."))?;

        let user_uuid = session
            .get::<UserUuid>(SESSION_KEY)
            .await?
            .ok_or(ApiError::unauthorized("Missing account uuid in session"))?;

        let Some(user) = User::query_by_uuid(Database::global(), user_uuid).await? else {
            session.remove_value(SESSION_KEY).await?;
            session.save().await?;
            return Err(ApiError::unauthorized("Unknown account uuid in session"));
        };

        parts.extensions.insert(CachedUser(user.clone()));

        Ok(user)
    }
}

#[derive(Clone)]
struct CachedUser(User);
