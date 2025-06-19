use galvyn::core::GalvynRouter;

use crate::http::handler::users;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .handler(users::handler::get_all_users)
        .handler(users::handler::get_me)
}

pub fn login_initialize() -> GalvynRouter {
    GalvynRouter::new().handler(users::handler::sign_in_me)
}
