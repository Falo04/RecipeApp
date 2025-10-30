use galvyn::core::GalvynRouter;
use galvyn::openapi::OpenapiRouterExt;

use crate::http::handler::tags;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .openapi_tag("Tags")
        .handler(tags::handler::get_all_tags)
        .handler(tags::handler::get_recipes_by_tag)
        .handler(tags::handler::create_tag)
        .handler(tags::handler::update_tag)
        .handler(tags::handler::delete_tag)
}
