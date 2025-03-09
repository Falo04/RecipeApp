use axum::Router;
use swaggapi::ApiContext;
use swaggapi::SwaggapiPageBuilder;

use super::middleware::auth_required::AuthRequiredLayer;

mod ingredients;
mod recipes;
mod tags;
mod users;

pub static FRONTEND_V1: SwaggapiPageBuilder = SwaggapiPageBuilder::new().title("Frontend");

pub fn initialize() -> ApiContext<Router> {
    let auth_not_required = ApiContext::new().nest(
        "/users",
        ApiContext::new()
            .tag("/jwt")
            .handler(users::handler::sign_in_me),
    );

    let auth_required = ApiContext::new()
        .nest(
            "/recipes",
            ApiContext::new()
                .tag("Recipes")
                .handler(recipes::handler::get_all_recipes)
                .handler(recipes::handler::get_recipe)
                .handler(recipes::handler::create_recipe)
                .handler(recipes::handler::update_recipe)
                .handler(recipes::handler::delete_recipe),
        )
        .nest(
            "/users",
            ApiContext::new()
                .tag("User")
                .handler(users::handler::get_all_users),
        );

    ApiContext::new().page(&FRONTEND_V1).nest(
        "/v1",
        ApiContext::new()
            .merge(auth_required.layer(AuthRequiredLayer))
            .merge(auth_not_required),
    )
}
