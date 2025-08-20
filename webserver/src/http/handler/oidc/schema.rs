use galvyn::core::stuff::schema::SchemaString;
use openidconnect::AuthorizationCode;
use openidconnect::CsrfToken;
use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct FinishOidcLoginRequest {
    pub code: SchemaString<AuthorizationCode>,
    pub state: SchemaString<CsrfToken>,
}
