use axum::extract::Path;
use axum::extract::Query;
use axum::response::Redirect;
use galvyn::core::session::Session;
use galvyn::core::Module;
use galvyn::get;
use tracing::trace;

use crate::http::common::errors::ApiError;
use crate::http::common::errors::ApiResult;
use crate::http::handler::oidc::schema::FinishOidcLoginRequest;
use crate::modules::oidc::OidcQueryParam;
use crate::modules::oidc::OidcRequestState;
use crate::modules::oidc::OpenIdConnect;

#[get("/begin-login/{side}")]
pub async fn begin_oidc_login(
    session: Session,
    Path(side): Path<OidcQueryParam>,
) -> ApiResult<Redirect> {
    let (auth_url, session_state) = OpenIdConnect::global().begin_login(side)?;

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

    let (claims, side) = OpenIdConnect::global()
        .finish_login(
            session_state,
            OidcRequestState {
                state: request.state.0,
                code: request.code.0,
            },
        )
        .await?;

    trace!(claims = serde_json::to_string(&claims).unwrap_or_else(|error| error.to_string()));

    Ok(Redirect::temporary("/"))
}

const SESSION_KEY: &str = "begin_oidc_login";
