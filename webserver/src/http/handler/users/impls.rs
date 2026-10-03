use super::schema::SimpleUser;
use crate::models::user::User;

impl From<User> for SimpleUser {
    fn from(value: User) -> Self {
        Self {
            uuid: value.uuid,
            name: value.name,
            email: value.email,
        }
    }
}
