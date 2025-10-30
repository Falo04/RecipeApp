use galvyn::core::GalvynRouter;
use galvyn::openapi::OpenapiRouterExt;

mod handler;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .openapi_tag("Websocket")
        .handler(handler::open_websocket)
}
