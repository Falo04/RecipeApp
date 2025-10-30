use std::sync::OnceLock;

use galvyn::core::GalvynRouter;
use galvyn::core::SchemalessJson;
use galvyn::get;
use galvyn::openapi::get_openapi_for_page;
use galvyn::openapi::OpenAPI;
use galvyn::openapi::OpenapiRouterExt;
use tower_http::trace::DefaultMakeSpan;
use tower_http::trace::TraceLayer;
use tracing::instrument;
use tracing::Level;

use crate::http::handler;

/// Openapi page for the frontend
pub struct FrontendApi;

#[get("/openapi.json")]
#[instrument]
pub async fn get_openapi() -> SchemalessJson<&'static OpenAPI> {
    SchemalessJson(galvyn::openapi::get_openapi())
}

#[get("/frontend_v1.json")]
#[instrument]
pub async fn get_frontend_openapi() -> SchemalessJson<&'static OpenAPI> {
    static CACHE: OnceLock<OpenAPI> = OnceLock::new();
    SchemalessJson(CACHE.get_or_init(|| get_openapi_for_page(FrontendApi)))
}

#[instrument(skip_all, ret)]
pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .nest("/api/v1", handler::initialize().openapi_page(FrontendApi))
        .nest(
            "/docs",
            GalvynRouter::new()
                .openapi_tag("Openapi")
                .handler(get_openapi)
                .handler(get_frontend_openapi),
        )
        .layer(TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().level(Level::INFO)))
}
