//! Account domain model and session-backed authentication extractor.
pub(in crate::models) mod db;
mod extractor;

use std::fmt::Debug;
use std::ops::Deref;

use galvyn::core::Module;
use galvyn::core::re_exports::rorm;
use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::session;
use galvyn::core::session::Session;
use galvyn::rorm::and;
use galvyn::rorm::db::Executor;
use galvyn::rorm::db::transaction::Transaction;
use galvyn::rorm::fields::types::MaxStr;
use serde::Deserialize;
use serde::Serialize;
use time::OffsetDateTime;
use tracing::instrument;
use tracing::warn;
use uuid::Uuid;

use crate::models::DatabaseResult;
use crate::models::user::db::UserModel;
use crate::modules::websocket::WebsocketManager;
use crate::utils::typed_uuid::TypedUuid;
use crate::utils::update_builder::TrackedUpdateBuilder;

/// Domain representation of an account used across handlers and services.
#[derive(Clone, Debug)]
pub struct User {
    /// Primary key of the user
    pub uuid: UserUuid,
    /// Name of the user
    pub name: UserName,
    /// Email of the user
    pub email: UserEmail,
    /// Identifier for the Issuer i.e. the provider
    pub issuer: MaxStr<255>,
    /// A locally unique and never reassigned identifier
    /// within the Issuer for the End-User.
    pub subject: MaxStr<255>,
    /// When the user was created
    pub created_at: OffsetDateTime,
}

pub type UserUuid = TypedUuid<User>;

const SESSION_KEY: &str = "current_account";

impl User {
    /// Marks this account as logged in by storing its UUID in the session.
    #[instrument(name = "Account::set_logged_in", skip(self))]
    pub async fn set_logged_in(&self, session: &Session) -> Result<(), session::Error> {
        session.insert(SESSION_KEY, self.uuid).await?;
        Ok(())
    }

    /// Clears the login state by removing the account UUID from the session.
    #[instrument(name = "Account::unset_logged_in")]
    pub async fn unset_logged_in(session: Session) -> Result<(), session::Error> {
        if let Some(_account_uuid) = session.remove::<Uuid>(SESSION_KEY).await? {
            if let Some(session_id) = session.id() {
                WebsocketManager::global().close_session(session_id);
            } else {
                warn!("A session with data should have an id!");
            }
        }
        Ok(())
    }
}

impl User {
    /// Looks up an account linked to the given OIDC issuer and subject.
    #[instrument(name = "Account::query_by_oidc", skip(db))]
    pub async fn query_by_oidc(
        db: impl Executor<'_>,
        issuer: &str,
        subject: &str,
    ) -> DatabaseResult<Option<Self>> {
        let account = rorm::query(db, UserModel)
            .condition(and![
                UserModel.issuer.equals(issuer),
                UserModel.subject.equals(subject),
            ])
            .optional()
            .await?;
        Ok(account.map(Self::from))
    }

    /// Fetches an account by its UUID.
    #[instrument(name = "Account::query_by_uuid", skip(db))]
    pub async fn query_by_uuid(
        db: impl Executor<'_>,
        uuid: UserUuid,
    ) -> DatabaseResult<Option<Self>> {
        let account = rorm::query(db, UserModel)
            .condition(UserModel.uuid.equals(uuid.into_inner()))
            .optional()
            .await?;
        Ok(account.map(Self::from))
    }

    /// Creates a new account record.
    #[instrument(name = "Account::create", skip(tx))]
    pub async fn create(tx: &mut Transaction, params: UserInsertParams) -> DatabaseResult<Self> {
        let account_model = rorm::insert(tx, UserModel)
            .single(&UserModel {
                uuid: Uuid::new_v4(),
                name: *params.name,
                email: *params.email,
                subject: params.subject,
                issuer: params.issuer,
                created_at: OffsetDateTime::now_utc(),
            })
            .await?;

        Ok(User::from(account_model))
    }

    /// Updates an existing account record.
    #[instrument(name = "Account::update", skip(tx))]
    pub async fn update(
        &mut self,
        tx: &mut Transaction,
        params: UserUpdateParams,
    ) -> DatabaseResult<()> {
        let Some(builder) = TrackedUpdateBuilder::new(tx)
            .set_if_some(UserModel.name, &mut self.name, params.name)
            .set_if_some(UserModel.email, &mut self.email, params.email)
            .finish()
        else {
            return Ok(());
        };
        builder
            .condition(UserModel.uuid.equals(self.uuid.into_inner()))
            .await?;
        Ok(())
    }
}

/// The unique name of the user
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UserName(
    /// The validated name
    MaxStr<255>,
);

impl UserName {
    /// Claims `name` for a user, returning `None` if another user already uses it
    pub async fn new(tx: &mut Transaction, name: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = rorm::query(&mut *tx, UserModel.uuid)
            .condition(UserModel.name.equals(&name))
            .optional()
            .await?
            .is_some();

        Ok((!taken).then_some(Self(name)))
    }
}

impl Deref for UserName {
    type Target = MaxStr<255>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<UserName> for MaxStr<255> {
    fn from(value: UserName) -> Self {
        value.0
    }
}

/// The unique email of the user
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UserEmail(
    /// The validated email
    MaxStr<255>,
);

impl UserEmail {
    /// Claims `email` for a user, returning `None` if another user already uses it
    pub async fn new(tx: &mut Transaction, email: MaxStr<255>) -> DatabaseResult<Option<Self>> {
        let taken = rorm::query(&mut *tx, UserModel.uuid)
            .condition(UserModel.email.equals(&email))
            .optional()
            .await?
            .is_some();

        Ok((!taken).then_some(Self(email)))
    }
}

impl Deref for UserEmail {
    type Target = MaxStr<255>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<UserEmail> for MaxStr<255> {
    fn from(value: UserEmail) -> Self {
        value.0
    }
}

/// The parameters required to insert a new [User]
#[derive(Debug)]
pub struct UserInsertParams {
    /// Name of user
    pub name: UserName,
    /// Email of user
    pub email: UserEmail,
    /// Identifier for the Issuer i.e. the provider
    pub issuer: MaxStr<255>,
    /// A locally unique and never reassigned identifier
    /// within the Issuer for the End-User.
    pub subject: MaxStr<255>,
}

/// The parameters required to update a [User]
#[derive(Debug, Default)]
pub struct UserUpdateParams {
    /// Name of user
    pub name: Option<UserName>,
    /// Email of user
    pub email: Option<UserEmail>,
}

impl From<UserModel> for User {
    fn from(value: UserModel) -> Self {
        User {
            uuid: UserUuid::new(value.uuid),
            email: UserEmail(value.email),
            name: UserName(value.name),
            issuer: value.issuer,
            subject: value.subject,
            created_at: value.created_at,
        }
    }
}
