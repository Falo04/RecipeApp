use galvyn::core::re_exports::schemars;
use galvyn::core::re_exports::schemars::JsonSchema;
use galvyn::core::re_exports::serde::Deserialize;
use galvyn::core::re_exports::serde::Serialize;

use crate::models::user::UserEmail;
use crate::models::user::UserName;
use crate::models::user::UserUuid;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct SimpleUser {
    pub uuid: UserUuid,
    pub email: UserEmail,
    pub name: UserName,
}
