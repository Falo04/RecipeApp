use galvyn::core::GalvynRouter;
use galvyn::openapi::OpenapiRouterExt;

use crate::http::handler::account;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .openapi_tag("Account")
        .handler(account::handler::get_me)
}
