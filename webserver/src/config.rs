//! Configuration based on environment variables

use std::sync::LazyLock;

use galvyn::core::stuff::env::EnvError;
use galvyn::core::stuff::env::EnvVar;
use galvyn::rorm::DatabaseDriver;
use openidconnect::ClientId;
use openidconnect::ClientSecret;
use openidconnect::IssuerUrl;
use openidconnect::RedirectUrl;

/// Load all environment variables declared in this module
///
/// Called at the beginning of `main` to gather and report all env errors at once.
pub fn load_env() -> Result<(), Vec<&'static EnvError>> {
    let mut errors = Vec::new();

    for result in [
        DB_HOST.load(),
        DB_PORT.load(),
        DB_NAME.load(),
        DB_USER.load(),
        DB_PASSWORD.load(),
        OIDC_DISCOVER_URL.load(),
        OIDC_CLIENT_ID.load(),
        OIDC_CLIENT_SECRET.load(),
        OIDC_REDIRECT_URL.load(),
    ] {
        errors.extend(result.err());
    }

    if !errors.is_empty() {
        return Err(errors);
    }
    Ok(())
}

/// The database host
pub static DB_HOST: EnvVar = EnvVar::required("DB_HOST");

/// The database port
pub static DB_PORT: EnvVar<u16> = EnvVar::required("DB_PORT");

/// The database name
pub static DB_NAME: EnvVar = EnvVar::required("DB_NAME");

/// The database user
pub static DB_USER: EnvVar = EnvVar::required("DB_USER");

/// The database password
pub static DB_PASSWORD: EnvVar = EnvVar::required("DB_PASSWORD");

/// Bundle of all database variables combined in `rorm`'s format
pub static DB: LazyLock<DatabaseDriver> = LazyLock::new(|| DatabaseDriver::Postgres {
    name: DB_NAME.clone(),
    user: DB_USER.clone(),
    host: DB_HOST.clone(),
    password: DB_PASSWORD.clone(),
    port: *DB_PORT,
});

/// The URL to use when discovering OpenID Connect (OIDC) configuration
pub static OIDC_DISCOVER_URL: EnvVar<IssuerUrl> = EnvVar::required("OIDC_DISCOVER_URL");

/// The OIDC client ID
pub static OIDC_CLIENT_ID: EnvVar<ClientId> = EnvVar::required("OIDC_CLIENT_ID");

/// The OIDC client secret
pub static OIDC_CLIENT_SECRET: EnvVar<ClientSecret> = EnvVar::required("OIDC_CLIENT_SECRET");

/// The URL to redirect to after OIDC login
pub static OIDC_REDIRECT_URL: EnvVar<RedirectUrl> = EnvVar::required("OIDC_REDIRECT_URL");

/// The endpoint to export opentelemetry traces to
///
/// This variable is defined in the opentelemetry specifications and used implicitly by our dependencies.
/// It is declared explicitly here to be easier to discover and change its default.
pub static OTEL_EXPORTER_OTLP_ENDPOINT: EnvVar =
    EnvVar::optional("OTEL_EXPORTER_OTLP_ENDPOINT", || {
        "http://jaeger-dev:4317".to_string()
    });
