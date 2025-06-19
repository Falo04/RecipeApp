use galvyn::core::GalvynRouter;

use crate::http::handler::recipes;

mod handler;
mod impls;
pub mod schema;

pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .handler(recipes::handler::get_all_recipes)
        .handler(recipes::handler::get_recipe)
        .handler(recipes::handler::create_recipe)
        .handler(recipes::handler::update_recipe)
        .handler(recipes::handler::delete_recipe)
        .handler(recipes::handler::search_recipes)
}
