use axum::extract::FromRequestParts;
use galvyn::core::re_exports::axum::http::request::Parts;
use galvyn::core::session::Session;
use galvyn::core::Module;
use galvyn::rorm::Database;
use tracing::warn;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::ApiStatusCode;
use crate::models::account::Account;

const SESSION_KEY: &str = "current_account";

impl Account {
    pub async fn set_logged_in(&self, session: &Session) -> ApiResult<()> {
        session
            .insert(SESSION_KEY, self.uuid)
            .await
            .map_err(ApiError::map_server_error("Failed to write to session"))?;
        Ok(())
    }

    pub async fn unset_logged_in(&self, session: &Session) -> ApiResult<()> {
        if let Some(account_uuid) = session.remove::<Uuid>(SESSION_KEY).await? {
            if let Some(session_id) = session.id() {
                // TODO
            } else {
                warn!("A session with data should have an id!");
            }
        }
        Ok(())
    }
}

impl<S> FromRequestParts<S> for Account
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    /// Parses an HTTP request part to authenticate a user.
    ///
    /// This function takes a mutable `Parts` struct containing HTTP request parts
    /// and attempts to decode a JWT token from the Authorization header.
    ///
    /// # Arguments
    ///
    /// * `parts`: A mutable reference to a `Parts` struct containing the HTTP request parts.
    /// * `s`: A reference to a context object (unused in this implementation).
    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        if let Some(CachedAccount(account)) = parts.extensions.get() {
            return Ok(account.clone());
        }

        let session = parts
            .extensions
            .get::<Session>()
            .ok_or(ApiError::server_error("Can't extract session."))?;

        let account_uuid = session
            .get::<Uuid>(SESSION_KEY)
            .await?
            .ok_or(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "Missing account uuid in session",
            ))?;

        let Some(account) = rorm::query(Database::global(), Account)
            .condition(Account.uuid.equals(account_uuid))
            .optional()
            .await?
        else {
            session.remove_value(SESSION_KEY).await?;
            session.save().await?;
            return Err(ApiError::new(
                ApiStatusCode::Unauthenticated,
                "Unknown account uuid in session",
            ));
        };

        parts.extensions.insert(CachedAccount(account.clone()));

        Ok(account)
    }
}

#[derive(Clone)]
struct CachedAccount(Account);
