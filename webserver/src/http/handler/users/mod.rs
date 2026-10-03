use galvyn::core::GalvynRouter;
use galvyn::openapi::OpenapiRouterExt;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .openapi_tag("Account")
        .handler(handler::get_me)
}
