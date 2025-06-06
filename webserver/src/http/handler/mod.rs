use galvyn::core::GalvynRouter;

use super::middleware::auth_required::AuthRequiredLayer;
use crate::config::AUTHENTICATION_ENABLED;

pub mod meta;
pub mod recipes;
pub mod tags;
pub mod users;

pub fn initialize() -> GalvynRouter {
    let auth_not_required = GalvynRouter::new()
        .nest(
            "/jwt",
            GalvynRouter::new().handler(users::handler::sign_in_me),
        )
        .nest(
            "/meta",
            GalvynRouter::new().handler(meta::handler::get_meta),
        );

    let auth_required = GalvynRouter::new()
        .nest(
            "/recipes",
            GalvynRouter::new()
                .handler(recipes::handler::get_all_recipes)
                .handler(recipes::handler::get_recipe)
                .handler(recipes::handler::create_recipe)
                .handler(recipes::handler::update_recipe)
                .handler(recipes::handler::delete_recipe)
                .handler(recipes::handler::search_recipes),
        )
        .nest(
            "/users",
            GalvynRouter::new()
                .handler(users::handler::get_all_users)
                .handler(users::handler::get_me),
        )
        .nest(
            "/tags",
            GalvynRouter::new()
                .handler(tags::handler::get_all_tags)
                .handler(tags::handler::get_recipes_by_tag)
                .handler(tags::handler::create_tag)
                .handler(tags::handler::delete_tag),
        );

    if AUTHENTICATION_ENABLED.clone() {
        GalvynRouter::new().nest(
            "/v1",
            GalvynRouter::new()
                .merge(auth_required.layer(AuthRequiredLayer))
                .merge(auth_not_required),
        )
    } else {
        GalvynRouter::new().nest(
            "/v1",
            GalvynRouter::new()
                .merge(auth_required)
                .merge(auth_not_required),
        )
    }
}
