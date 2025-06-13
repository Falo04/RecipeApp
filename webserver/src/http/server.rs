use galvyn::core::GalvynRouter;
use galvyn::core::SchemalessJson;
use galvyn::get;
use galvyn::openapi::OpenAPI;
use tower::ServiceBuilder;
use tower_http::trace::DefaultMakeSpan;
use tower_http::trace::DefaultOnResponse;
use tower_http::trace::TraceLayer;
use tracing::error;
use tracing::info;
use tracing::instrument;
use tracing::Level;

use crate::http::handler;
use crate::http::middleware::catch_unwind_layer::CatchUnwindLayer;

#[get("/openapi.json")]
pub async fn get_openapi() -> SchemalessJson<&'static OpenAPI> {
    error!("was called openapi.json");
    info!("was called openapi.json");
    SchemalessJson(galvyn::openapi::get_openapi())
}

#[instrument(skip_all, ret)]
pub fn initialize() -> GalvynRouter {
    GalvynRouter::new()
        .merge(GalvynRouter::new().nest("/api", handler::initialize()))
        .nest("/docs", GalvynRouter::new().handler(get_openapi))
        .layer(
            ServiceBuilder::new()
                .layer(
                    TraceLayer::new_for_http()
                        .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                        .on_response(DefaultOnResponse::new().level(Level::INFO))
                        .on_failure(()),
                )
                .layer(CatchUnwindLayer),
        )
}
