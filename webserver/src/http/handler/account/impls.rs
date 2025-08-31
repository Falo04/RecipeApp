use super::schema::SimpleAccount;
use crate::models::account::Account;

impl From<Account> for SimpleAccount {
    fn from(value: Account) -> Self {
        Self {
            uuid: value.uuid.0,
            display_name: value.display_name,
            email: value.email,
        }
    }
}
