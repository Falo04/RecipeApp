//! Utilities for configuring tracing

use std::any::Any;
use std::panic;
use std::panic::Location;

use opentelemetry::trace::TraceError;
use opentelemetry::trace::TracerProvider;
use opentelemetry::Key;
use opentelemetry::KeyValue;
use opentelemetry::Value;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::runtime;
use opentelemetry_sdk::trace;
use opentelemetry_sdk::Resource;
use tracing::error;
use tracing::Subscriber;
use tracing_subscriber::registry::LookupSpan;
use tracing_subscriber::Layer;

use crate::config::Config;

/// Tracing layer exporting OpenTelemetry traces
///
/// The layer is not configurable yet and only suited for development.
/// It should simply work out of the box with a local jaeger instance.
pub fn opentelemetry_layer<S: Subscriber + for<'span> LookupSpan<'span>>(
    config: &Config,
) -> Result<impl Layer<S>, TraceError> {
    let provider = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(config.otel_exporter_otlp_endpoint.clone()),
        )
        .with_trace_config(
            trace::Config::default().with_resource(Resource::new([KeyValue {
                key: Key::from_static_str("service.name"),
                value: Value::from("food-dev"),
            }])),
        )
        .install_batch(runtime::Tokio)
        .expect("Couldn't create OTLP tracer");

    let tracer = provider.tracer("food-dev");

    Ok(tracing_opentelemetry::layer()
        // .with_threads(false) // It's a tokio worker anyway
        // .with_tracked_inactivity(false)
        .with_tracer(tracer))
}

/// Initializes the global panic hook to output tracing events instead of writing to stdout
pub fn init_tracing_panic_hook() {
    panic::set_hook(Box::new(panic_hook))
}

/// The panic hook set by [`init_tracing_panic_hook`]
fn panic_hook(info: &panic::PanicHookInfo) {
    let msg = payload_as_str(info.payload());
    let location = info.location();

    error!(
        panic.file = location.map(Location::file),
        panic.line = location.map(Location::line),
        panic.column = location.map(Location::column),
        panic.msg = msg,
        "Panic"
    );
}

/// Copied from the std's default hook (v1.81.0)
fn payload_as_str(payload: &dyn Any) -> &str {
    if let Some(&s) = payload.downcast_ref::<&'static str>() {
        s
    } else if let Some(s) = payload.downcast_ref::<String>() {
        s.as_str()
    } else {
        "Box<dyn Any>"
    }
}
