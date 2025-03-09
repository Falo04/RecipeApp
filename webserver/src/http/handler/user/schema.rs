use schemars::JsonSchema;
use serde::Deserialize;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleUser {
    pub uuid: Uuid,
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UserSignInRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct TokenDataReponse {
    pub token: String,
}
