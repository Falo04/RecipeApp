use galvyn::core::GalvynRouter;

mod handler;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .handler(handler::begin_oidc_login)
        .handler(handler::finish_oidc_login)
        .handler(handler::logout)
}
