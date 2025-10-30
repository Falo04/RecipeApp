use galvyn::core::GalvynRouter;
use galvyn::openapi::OpenapiRouterExt;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .openapi_tag("Ingredients")
        .handler(handler::get_recipes_by_ingredients)
        .handler(handler::get_all_ingredients)
}
