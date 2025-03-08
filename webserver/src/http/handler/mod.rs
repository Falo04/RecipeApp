use axum::Router;
use swaggapi::ApiContext;
use swaggapi::SwaggapiPageBuilder;

mod recipes;

pub static FRONTEND_V1: SwaggapiPageBuilder = SwaggapiPageBuilder::new().title("Frontend");

pub fn initialize() -> ApiContext<Router> {
    let auth_required = ApiContext::new().nest(
        "/recipes",
        ApiContext::new()
            .tag("Recipes")
            .handler(recipes::handler::get_all_recipes)
            .handler(recipes::handler::get_recipe)
            .handler(recipes::handler::create_recipe)
            .handler(recipes::handler::update_recipe)
            .handler(recipes::handler::delete_recipe),
    );

    ApiContext::new()
        .page(&FRONTEND_V1)
        .nest("/v1", ApiContext::new().merge(auth_required))
}
