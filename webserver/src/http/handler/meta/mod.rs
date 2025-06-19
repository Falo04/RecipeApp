use galvyn::core::GalvynRouter;

use crate::http::handler::meta;

mod handler;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new().handler(meta::handler::get_meta)
}
