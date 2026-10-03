use galvyn::core::GalvynRouter;

use crate::http::middleware::auth_required_layer::AuthRequiredLayer;

pub mod ingredients;
pub mod oidc;
pub mod recipes;
pub mod tags;
pub mod users;
pub mod websockets;

pub fn initialize() -> GalvynRouter {
    let without_auth = GalvynRouter::new().nest("/oidc", oidc::initialize());

    let with_auth = GalvynRouter::new()
        .nest("/recipes", recipes::initialize())
        .nest("/users", users::initialize())
        .nest("/tags", tags::initialize())
        .nest("/ingredients", ingredients::initialize())
        .nest("/websocket", websockets::initialize());

    without_auth.merge(with_auth.wrap(AuthRequiredLayer))
}
