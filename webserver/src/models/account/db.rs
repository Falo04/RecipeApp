use rorm::fields::types::MaxStr;
use rorm::prelude::ForeignModel;
use rorm::Model;
use uuid::Uuid;

/// Represents an account in the system.
#[derive(Model, Clone, Debug)]
#[rorm(rename = "account")]
pub struct AccountModel {
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The user's display name.
    pub display_name: MaxStr<255>,

    /// The user's email
    pub email: MaxStr<255>,
}

/// An account managed by an open id connect provider
#[derive(Model, Clone, Debug)]
#[rorm(rename = "account_oidc")]
pub struct AccountOidcModel {
    /// Primary key
    #[rorm(primary_key)]
    pub uuid: Uuid,

    /// The reference to the account model
    #[rorm(on_delete = "Cascade", on_update = "Cascade")]
    pub account: ForeignModel<AccountModel>,

    /// Identifier for the Issuer i.e. the provider
    pub issuer: MaxStr<255>,

    /// A locally unique and never reassigned identifier within the Issuer for the End-User.
    pub subject: MaxStr<255>,
}
