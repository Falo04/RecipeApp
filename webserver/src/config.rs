//! This module provides utilities for loading environment variables.
//!
//! It includes functionality for loading optional and required environment variables,
//! along with error handling for missing or malformed values.
//!
//! The module is designed to simplify the process of configuring applications
//! based on environment variables.
//!
//! It uses `OnceLock` to ensure that environment variables are loaded
//! only once, even if multiple parts of the application require them.
//!
//! The `env` module contains the core logic for handling environment variables.
//! It provides a `EnvVar` struct that encapsulates the name, default value,
//! and a `OnceLock` for storing the environment variable's value.
use std::clone::Clone;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::sync::LazyLock;

use galvyn::core::stuff::env::EnvError;
use galvyn::core::stuff::env::EnvVar;
use galvyn::rorm::DatabaseDriver;
use openidconnect::ClientId;
use openidconnect::ClientSecret;
use openidconnect::IssuerUrl;
use openidconnect::RedirectUrl;

/// Initializes the application configuration.
///
/// This function loads configuration values from shared variables
/// and returns an error if any of them fail to load.
pub fn load_env() -> Result<(), Vec<&'static EnvError>> {
    let mut errors = Vec::new();

    for result in [
        SERVER_ADDRESS.load(),
        SERVER_PORT.load(),
        DB_HOST.load(),
        DB_PORT.load(),
        DB_NAME.load(),
        DB_USER.load(),
        DB_PASSWORD.load(),
        DB_SCHEMA.load(),
        OTEL_ENDPOINT.load(),
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

/// This static variable stores the server address.
pub static SERVER_ADDRESS: EnvVar<IpAddr> =
    EnvVar::optional("SERVER_ADDRESS", || IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)));

/// Defines the port to listen on for the server.
pub static SERVER_PORT: EnvVar<u16> = EnvVar::optional("SERVER_PORT", || 8080);

/// Represents the database host environment variable.
pub static DB_HOST: EnvVar = EnvVar::required("DB_HOST");

/// This variable stores the port number for the database.
pub static DB_PORT: EnvVar<u16> = EnvVar::required("DB_PORT");

/// Defines the database name as an environment variable.
pub static DB_NAME: EnvVar = EnvVar::required("DB_NAME");

/// This variable holds the database username, retrieved from an environment variable.
pub static DB_USER: EnvVar = EnvVar::required("DB_USER");

/// This variable holds the database password.
pub static DB_PASSWORD: EnvVar = EnvVar::required("DB_PASSWORD");

/// Represents the database schema environment variable.
pub static DB_SCHEMA: EnvVar = EnvVar::required("DB_SCHEMA");

/// Defines an environment variable for the Jaeger OTLP endpoint.
pub static OTEL_ENDPOINT: EnvVar =
    EnvVar::optional("OTEL_ENDPOINT", || "http://jaeger-dev:4317".to_string());

/// Initializes the database connection using a lazy-loaded `DatabaseDriver`.
///
/// This code creates a `LazyLock` to ensure that the database connection
/// is only established when it is first necessary, reducing startup overhead.
/// The `DatabaseDriver` is initialized with the connection details
/// from the global constants `DB_NAME`, `DB_USER`, `DB_HOST`,
/// `DB_PASSWORD`, and `DB_PORT`.
pub static DB: LazyLock<DatabaseDriver> = LazyLock::new(|| DatabaseDriver::Postgres {
    name: DB_NAME.clone(),
    user: DB_USER.clone(),
    host: DB_HOST.clone(),
    password: DB_PASSWORD.clone(),
    port: *DB_PORT,
});

/// This variable stores the URL to use when discovering OpenID Connect (OIDC) configuration.
///
/// It is required and should be set to the URL of the OIDC provider's discovery endpoint.
/// The `EnvVar::required` ensures the variable is present in the environment.
pub static OIDC_DISCOVER_URL: EnvVar<IssuerUrl> = EnvVar::required("OIDC_DISCOVER_URL");

/// Defines an environment variable for the OIDC client ID.
///
/// This variable is required and should contain the client ID for the OIDC
/// client.
pub static OIDC_CLIENT_ID: EnvVar<ClientId> = EnvVar::required("OIDC_CLIENT_ID");

/// This variable defines the client secret used for OpenID Connect (OIDC) authentication.
///
/// It's configured via an environment variable named `OIDC_CLIENT_SECRECT`.
/// The `EnvVar::required` ensures that the variable is mandatory.
pub static OIDC_CLIENT_SECRET: EnvVar<ClientSecret> = EnvVar::required("OIDC_CLIENT_SECRET");

/// Defines an environment variable named `OIDC_REDIRECT_URL`.
///
/// This variable is required and specifies the URL to which the oidc client should return
pub static OIDC_REDIRECT_URL: EnvVar<RedirectUrl> = EnvVar::required("OIDC_REDIRECT_URL");
