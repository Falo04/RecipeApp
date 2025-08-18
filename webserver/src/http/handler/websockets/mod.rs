use galvyn::core::GalvynRouter;

mod handler;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new().handler(handler::open_websocket)
}
