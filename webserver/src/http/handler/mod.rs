use axum::middleware;
use galvyn::core::GalvynRouter;

use crate::config::AUTHENTICATION_ENABLED;
use crate::http::middleware::auth_required_layer::auth_required_layer;

pub mod ingredients;
pub mod meta;
pub mod recipes;
pub mod tags;
pub mod users;

pub fn initialize() -> GalvynRouter {
    let auth_not_required = GalvynRouter::new()
        .nest("/jwt", users::login_initialize())
        .nest("/meta", meta::initialize());

    let auth_required = GalvynRouter::new()
        .nest("/recipes", recipes::initialize())
        .nest("/users", users::initialize())
        .nest("/tags", tags::initialize())
        .nest("/ingredients", ingredients::initialize());

    if *AUTHENTICATION_ENABLED {
        GalvynRouter::new().nest(
            "/v1",
            GalvynRouter::new()
                .merge(auth_required.layer(middleware::from_fn(auth_required_layer)))
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
