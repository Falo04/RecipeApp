use axum::extract::Query;
use axum::response::Redirect;
use galvyn::core::session::Session;
use galvyn::core::Module;
use galvyn::get;
use galvyn::rorm::and;
use galvyn::rorm::Database;
use rorm::fields::types::MaxStr;
use rorm::model::Identifiable;
use rorm::prelude::ForeignModelByField;
use tracing::trace;
use uuid::Uuid;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::handler::oidc::schema::FinishOidcLoginRequest;
use crate::models::account::Account;
use crate::models::account::AccountOidc;
use crate::modules::oidc::OidcRequestState;
use crate::modules::oidc::OpenIdConnect;

#[get("/begin-login")]
pub async fn begin_oidc_login(session: Session) -> ApiResult<Redirect> {
    let (auth_url, session_state) = OpenIdConnect::global().begin_login()?;

    session.insert(SESSION_KEY, session_state).await?;

    Ok(Redirect::temporary(auth_url.as_str()))
}

#[get("/finish-login")]
pub async fn finish_oidc_login(
    session: Session,
    Query(request): Query<FinishOidcLoginRequest>,
) -> ApiResult<Redirect> {
    let session_state = session
        .remove(SESSION_KEY)
        .await?
        .ok_or(ApiError::bad_request("There is no unfinished login."))?;

    let claims = OpenIdConnect::global()
        .finish_login(
            session_state,
            OidcRequestState {
                state: request.state.0,
                code: request.code.0,
            },
        )
        .await?;

    trace!(claims = serde_json::to_string(&claims).unwrap_or_else(|error| error.to_string()));

    let mut tx = Database::global().start_transaction().await?;

    let issuer = MaxStr::new(claims.issuer().to_string())
        .map_err(ApiError::map_server_error("Issuer is too long"))?;

    let subject = MaxStr::new(claims.subject().to_string())
        .map_err(ApiError::map_server_error("Subject is too long"))?;

    let display_name = claims
        .name()
        .and_then(|localized| localized.get(None))
        .ok_or(ApiError::server_error(
            "Oidc provider did not provide the name claims",
        ))?;
    let display_name = MaxStr::new(display_name.to_string())
        .map_err(ApiError::map_server_error("Name is too long"))?;

    let email = claims.email().ok_or(ApiError::server_error(
        "Oidc provider did not provide the email claims",
    ))?;
    let email = MaxStr::new(display_name.to_string())
        .map_err(ApiError::map_server_error("Email is too long"))?;

    let existing_account = rorm::query(&mut tx, AccountOidc.account.query_as(Account))
        .condition(and![
            AccountOidc.issuer.equals(&*issuer),
            AccountOidc.subject.equals(&*subject),
        ])
        .optional()
        .await?;
    let account = if let Some(mut account) = existing_account {
        rorm::update(&mut tx, Account)
            .set(Account.display_name, display_name.clone())
            .condition(account.as_condition())
            .await?;
        account.display_name = display_name;
        account
    } else {
        let account = rorm::insert(&mut tx, Account)
            .single(&Account {
                uuid: Uuid::new_v4(),
                display_name,
                email,
            })
            .await?;

        rorm::insert(&mut tx, AccountOidc)
            .single(&AccountOidc {
                uuid: Uuid::new_v4(),
                account: ForeignModelByField(account.uuid),
                subject,
                issuer,
            })
            .await?;
        account
    };

    tx.commit().await?;

    account.set_logged_in(&session).await?;

    Ok(Redirect::temporary("/"))
}

const SESSION_KEY: &str = "begin_oidc_login";
