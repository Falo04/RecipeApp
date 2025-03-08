use std::net::SocketAddr;

use axum::routing::get;
use axum::Json;
use axum::Router;
use futures_lite::StreamExt;
use signal_hook::consts::TERM_SIGNALS;
use signal_hook_tokio::Signals;
use swaggapi::ApiContext;
use swaggapi::SwaggapiPage;
use tokio::net::TcpListener;
use tracing::error;
use tracing::info;
use tracing::info_span;
use tracing::instrument;
use tracing::Instrument;

use crate::config::Config;
use crate::http::handler;
use crate::http::handler::FRONTEND_V1;

#[instrument(skip_all, ret)]
pub async fn run(config: &Config) -> std::io::Result<()> {
    let router = Router::new()
        .merge(ApiContext::new().nest("/api", handler::initialize()))
        .nest("/docs", {
            Router::new().route(
                "/frontend_v1.json",
                get(|| async { Json((&FRONTEND_V1).openapi()) }),
            )
        });

    let socket_addr = SocketAddr::new(config.server.address, config.server.port);

    info!("Start to listen on http://{socket_addr}");
    println!("Start to listen on http://{socket_addr}");
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
