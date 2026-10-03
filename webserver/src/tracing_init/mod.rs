//! Tracing setup: stdout tree logging and optional OpenTelemetry export

use galvyn::core::re_exports::opentelemetry_sdk::trace::SdkTracerProvider;
use tracing_forest::util::LevelFilter;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::Layer;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use url::Url;

use crate::tracing_init::otel::opentelemetry_layer;

mod otel;

/// Initialize tracing with ForestLayer and OpenTelemetry export.
///
/// Returns the [`SdkTracerProvider`].
/// The caller **must** hold the returned provider alive for the lifetime of the application and
/// call [`SdkTracerProvider::shutdown`] before exit.
pub fn init(service_name: &str, otel_endpoint: Option<&Url>) -> Option<SdkTracerProvider> {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    let Some(otel_endpoint) = otel_endpoint else {
        return None;
    };

    let (otel_layer, provider) = opentelemetry_layer(service_name, otel_endpoint.as_str())
        .expect("Failed to initialize opentelemetry, this is a programmer or deployment error");

    tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_forest::ForestLayer::default().with_filter(LevelFilter::DEBUG))
        .with(otel_layer)
        .init();

    Some(provider)
}
