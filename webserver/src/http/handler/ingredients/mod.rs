use galvyn::core::GalvynRouter;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .handler(handler::get_recipes_by_ingredients)
        .handler(handler::search_recipes)
}
