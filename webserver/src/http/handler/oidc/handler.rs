use galvyn::core::Module;
use galvyn::core::re_exports::axum::extract::Query;
use galvyn::core::re_exports::axum::response::Redirect;
use galvyn::core::re_exports::serde_json;
use galvyn::core::session::Session;
use galvyn::core::stuff::api_error::ApiError;
use galvyn::core::stuff::api_error::ApiResult;
use galvyn::get;
use galvyn::post;
use galvyn::rorm::Database;
use galvyn::rorm::fields::types::MaxStr;
use tracing::trace;

use crate::http::handler::oidc::schema::FinishOidcLoginRequest;
use crate::models::user::User;
use crate::models::user::UserEmail;
use crate::models::user::UserInsertParams;
use crate::models::user::UserName;
use crate::models::user::UserUpdateParams;
use crate::modules::oidc::OidcRequestState;
use crate::modules::oidc::OpenIdConnect;

/// Begin to log in with the oidc provider.
#[get("/begin-login")]
pub async fn begin_oidc_login(session: Session) -> ApiResult<Redirect> {
    let (auth_url, session_state) = OpenIdConnect::global().begin_login()?;

    session.insert(SESSION_KEY, session_state).await?;

    Ok(Redirect::temporary(auth_url.as_str()))
}

/// Redirected from oidc provider. Finish login.
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
    let user_name = UserName::new(&mut tx, display_name).await?;

    let email = claims.email().ok_or(ApiError::server_error(
        "Oidc provider did not provide the email claims",
    ))?;
    let email =
        MaxStr::new(email.to_string()).map_err(ApiError::map_server_error("Email is too long"))?;
    let email = UserEmail::new(&mut tx, email).await?;

    let existing_user = User::query_by_oidc(&mut tx, &issuer, &subject).await?;
    let user = match existing_user {
        Some(mut user) => {
            user.update(
                &mut tx,
                UserUpdateParams {
                    name: user_name,
                    email,
                },
            )
            .await?;
            user
        }
        None => {
            User::create(
                &mut tx,
                UserInsertParams {
                    name: user_name.ok_or(ApiError::bad_request("User name already taken"))?,
                    email: email.ok_or(ApiError::bad_request("Email address already taken"))?,
                    issuer,
                    subject,
                },
            )
            .await?
        }
    };

    tx.commit().await?;
    user.set_logged_in(&session).await?;
    Ok(Redirect::temporary("/"))
}

const SESSION_KEY: &str = "begin_oidc_login";

/// Log out the current user.
#[post("/logout")]
pub async fn logout(session: Session) -> ApiResult<()> {
    User::unset_logged_in(session).await?;
    Ok(())
}
