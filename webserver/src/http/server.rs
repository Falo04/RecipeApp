use galvyn::core::GalvynRouter;
use galvyn::core::SchemalessJson;
use galvyn::get;
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
pub async fn get_openapi() -> SchemalessJson<&'static OpenAPI> {
    SchemalessJson(galvyn::openapi::get_openapi())
}

#[instrument(skip_all, ret)]
pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .nest("/api", handler::initialize().openapi_page(FrontendApi))
        .nest(
            "/docs",
            GalvynRouter::new()
                .openapi_tag("Openapi")
                .handler(get_openapi),
        )
        .layer(TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().level(Level::INFO)))
}
