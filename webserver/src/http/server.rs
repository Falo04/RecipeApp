use std::net::SocketAddr;

use axum::routing::get;
use axum::Json;
use axum::Router;
use futures_lite::StreamExt;
use signal_hook::consts::TERM_SIGNALS;
use signal_hook_tokio::Signals;
use swaggapi::ApiContext;
use swaggapi::PageOfEverything;
use swaggapi::SwaggapiPage;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::trace::DefaultMakeSpan;
use tower_http::trace::DefaultOnResponse;
use tower_http::trace::TraceLayer;
use tracing::error;
use tracing::info;
use tracing::info_span;
use tracing::instrument;
use tracing::Instrument;
use tracing::Level;

use super::middleware::catch_unwind::CatchUnwindLayer;
use crate::config::SERVER_ADDRESS;
use crate::config::SERVER_PORT;
use crate::http::handler;
use crate::http::handler::FRONTEND_V1;

#[instrument(skip_all, ret)]
pub async fn run() -> std::io::Result<()> {
    let router = Router::new()
        .merge(ApiContext::new().nest("/api", handler::initialize()))
        .nest("/docs", {
            Router::new()
                .route(
                    "/openapi.json",
                    get(|| async { Json(PageOfEverything.openapi()) }),
                )
                .route(
                    "/frontend_v1.json",
                    get(|| async { Json((&FRONTEND_V1).openapi()) }),
                )
        })
        .layer(
            ServiceBuilder::new()
                .layer(
                    TraceLayer::new_for_http()
                        .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                        .on_response(DefaultOnResponse::new().level(Level::INFO))
                        .on_failure(()),
                )
                .layer(CatchUnwindLayer),
        );

    let socket_addr = SocketAddr::new(SERVER_ADDRESS.clone(), *SERVER_PORT);

    info!("Start to listen on http://{socket_addr}");
    let listener = TcpListener::bind(socket_addr).await?;
    axum::serve(listener, router)
        .with_graceful_shutdown(handle_signals().instrument(info_span!("signals")))
        .await?;

    Ok(())
}

/// Function await for any OS signal in the [`TERM_SIGNALS`] list.
async fn handle_signals() {
    let Ok(mut signals) = Signals::new(TERM_SIGNALS) else {
        error!("Could not register signals");
        return;
    };
    let handle = signals.handle();

    if let Some(signal) = signals.next().await {
        info!("Received signal {signal}, exiting ..");
    }

    handle.close();
}
