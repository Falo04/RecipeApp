use galvyn::core::GalvynRouter;

use crate::http::handler::account;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new().handler(account::handler::get_me)
}
