use galvyn::core::re_exports::axum::middleware;
use galvyn::core::GalvynRouter;

use crate::http::middleware::auth_required_layer::auth_required_layer;

pub mod account;
pub mod ingredients;
pub mod oidc;
pub mod recipes;
pub mod tags;
pub mod websockets;

pub fn initialize() -> GalvynRouter {
    let auth_not_required = GalvynRouter::new().nest("/oidc", oidc::initialize());

    let auth_required = GalvynRouter::new()
        .nest("/recipes", recipes::initialize())
        .nest("/account", account::initialize())
        .nest("/tags", tags::initialize())
        .nest("/ingredients", ingredients::initialize())
        .nest("/websocket", websockets::initialize());

    GalvynRouter::new().nest(
        "/v1",
        GalvynRouter::new()
            .merge(auth_required.layer(middleware::from_fn(auth_required_layer)))
            .merge(auth_not_required),
    )
}
