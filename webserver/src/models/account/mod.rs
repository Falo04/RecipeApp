//! Account domain model and session-backed authentication extractor.
pub(in crate::models) mod db;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use galvyn::core::session::Session;
use galvyn::core::Module;
use galvyn::rorm::Database;
use rorm::and;
use rorm::db::Executor;
use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModelByField;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use tracing::instrument;
use tracing::warn;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::common::schemas::ApiStatusCode;
use crate::models::account::db::AccountModel;
use crate::models::account::db::AccountOidcModel;

/// Domain representation of an account used across handlers and services.
#[derive(Clone, Debug)]
pub struct Account {
    pub uuid: AccountUuid,

    /// The user's display name.
    pub display_name: MaxStr<255>,

    /// The user's email
    pub email: MaxStr<255>,
}

/// Wrapper type to give stronger typing to account identifiers.
#[derive(Debug, Clone, Copy, Deserialize, Serialize, JsonSchema)]
pub struct AccountUuid(pub Uuid);

const SESSION_KEY: &str = "current_account";

impl Account {
    /// Marks this account as logged in by storing its UUID in the session.
    #[instrument(name = "Account::set_logged_in", skip(self))]
    pub async fn set_logged_in(&self, session: &Session) -> ApiResult<()> {
        session
            .insert(SESSION_KEY, self.uuid)
            .await
            .map_err(ApiError::map_server_error("Failed to write to session"))?;
        Ok(())
    }

    /// Clears the login state by removing the account UUID from the session.
    #[instrument(name = "Account::unset_logged_in")]
    pub async fn unset_logged_in(session: Session) -> ApiResult<()> {
        if let Some(_account_uuid) = session.remove::<Uuid>(SESSION_KEY).await? {
            if let Some(_session_id) = session.id() {
                // TODO
            } else {
                warn!("A session with data should have an id!");
            }
        }
        Ok(())
    }
}

impl Account {
    /// Looks up an account linked to the given OIDC issuer and subject.
    #[instrument(name = "Account::query_after_oidc", skip(exe))]
    pub async fn query_after_oidc(
        exe: impl Executor<'_>,
        issuer: &str,
        subject: &str,
    ) -> ApiResult<Option<Account>> {
        match rorm::query(exe, AccountOidcModel.account.query_as(AccountModel))
            .condition(and![
                AccountOidcModel.issuer.equals(issuer),
                AccountOidcModel.subject.equals(subject),
            ])
            .optional()
            .await?
        {
            Some(account_model) => Ok(Some(Account::from(account_model))),
            None => Ok(None),
        }
    }

    /// Fetches an account by its UUID.
    #[instrument(name = "Account::query_by_uuid", skip(exe))]
    pub async fn query_by_uuid(
        exe: impl Executor<'_>,
        account_uuid: &AccountUuid,
    ) -> ApiResult<Option<Account>> {
        match rorm::query(exe, AccountModel)
            .condition(AccountModel.uuid.equals(account_uuid.0))
            .optional()
            .await?
        {
            Some(account_model) => Ok(Some(Account::from(account_model))),
            None => Ok(None),
        }
    }

    /// Creates a new account record.
    #[instrument(name = "Account::create", skip(exe))]
    pub async fn create(
        exe: impl Executor<'_>,
        display_name: MaxStr<255>,
        email: MaxStr<255>,
    ) -> ApiResult<Account> {
        let account_model = rorm::insert(exe, AccountModel)
            .single(&AccountModel {
                uuid: Uuid::new_v4(),
                email,
                display_name,
            })
            .await?;

        Ok(Account::from(account_model))
    }

    /// Associates an existing account with an OIDC identity.
    #[instrument(name = "Account::create_oidc", skip(exe))]
    pub async fn create_oidc(
        exe: impl Executor<'_>,
        account_uuid: AccountUuid,
        issuer: MaxStr<255>,
        subject: MaxStr<255>,
    ) -> ApiResult<()> {
        rorm::insert(exe, AccountOidcModel)
            .single(&AccountOidcModel {
                uuid: Uuid::new_v4(),
                account: ForeignModelByField(account_uuid.0),
                subject,
                issuer,
            })
            .await?;
        Ok(())
    }

    /// Updates an existing account record.
    #[instrument(name = "Account::update", skip(exe))]
    pub async fn update(
        exe: impl Executor<'_>,
        account_uuid: &AccountUuid,
        display_name: MaxStr<255>,
    ) -> ApiResult<()> {
        rorm::update(exe, AccountModel)
            .set(AccountModel.display_name, display_name)
            .condition(AccountModel.uuid.equals(account_uuid.0))
            .await?;
        Ok(())
    }

    /// Deletes an account record.
    #[instrument(name = "Account::delete", skip(exe))]
    pub async fn delete(exe: impl Executor<'_>, account_uuid: AccountUuid) -> ApiResult<()> {
        rorm::delete(exe, AccountModel)
            .condition(AccountModel.uuid.equals(account_uuid.0))
            .await?;
        Ok(())
    }
}

impl From<AccountModel> for Account {
    fn from(account_model: AccountModel) -> Self {
        Account {
            uuid: AccountUuid(account_model.uuid),
            email: account_model.email,
            display_name: account_model.display_name,
        }
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

        let Some(account) =
            Account::query_by_uuid(Database::global(), &AccountUuid(account_uuid)).await?
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
