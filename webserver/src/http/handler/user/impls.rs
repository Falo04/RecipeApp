use crate::models::user::User;

use super::schema::SimpleUser;

impl From<User> for SimpleUser {
    fn from(value: User) -> Self {
        Self {
            uuid: value.uuid,
            display_name: value.display_name,
            email: value.mail,
        }
    }
}
