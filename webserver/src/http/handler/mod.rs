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
            .handler(recipes::handler::get_all_recipes),
    );

    ApiContext::new()
        .page(&FRONTEND_V1)
        .nest("/v1", ApiContext::new().merge(auth_required))
}
