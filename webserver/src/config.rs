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

use openidconnect::ClientId;
use openidconnect::ClientSecret;
use openidconnect::IssuerUrl;
use openidconnect::RedirectUrl;
use rand::distr::Alphanumeric;
use rand::distr::SampleString;
use rorm::DatabaseDriver;

use crate::config::env::EnvError;
use crate::config::env::EnvVar;

/// Initializes the application configuration.
///
/// This function loads configuration values from shared variables
/// and returns an error if any of them fail to load.
pub fn init() -> Result<(), Vec<&'static EnvError>> {
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
        JWT.load(),
        AUTHENTICATION_ENABLED.load(),
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

/// This static variable defines the JWT (JSON Web Token) used for authentication.
pub static JWT: EnvVar =
    EnvVar::optional("JWT", || Alphanumeric.sample_string(&mut rand::rng(), 32));

/// Represents the state of authentication.
pub static AUTHENTICATION_ENABLED: EnvVar<bool> =
    EnvVar::optional("AUTHENTICATION_ENABLED", || false);

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

/// Represents an environment variable with a specified type.
mod env {
    use std::env;
    use std::env::VarError;
    use std::ops::Deref;
    use std::sync::OnceLock;

    use serde::de::DeserializeOwned;
    use thiserror::Error;

    /// Represents an environment variable with a default value.
    ///
    /// This struct provides a way to access environment variables, offering
    /// a default value if the variable is not found. It uses `OnceLock`
    /// for thread-safe access to the variable's value, preventing race
    /// conditions when multiple parts of the application attempt to read
    /// the same environment variable.
    pub struct EnvVar<T = String> {
        /// A `OnceLock` containing the resolved value of the environment variable.
        ///
        /// The `Result<T, EnvError>` type allows for handling potential
        /// errors during the value retrieval process.
        value: OnceLock<Result<T, EnvError>>,

        /// A `&'static str` representing the name of the environment variable.
        name: &'static str,

        /// An `Option<fn() -> T>` that, if provided, will be called to
        /// produce a default value if the environment variable is not found.
        default: Option<fn() -> T>,
    }

    impl<T: DeserializeOwned> EnvVar<T> {
        /// Creates a new `Required` instance with the given name.
        ///
        /// This function initializes a `Required` instance, storing the provided `name`
        /// as a string, creating a new `OnceLock` for its value, and setting the
        /// default value to `None`.
        ///
        /// # Arguments
        ///
        /// * `name`: A static string slice representing the name of the required value.
        pub const fn required(name: &'static str) -> Self {
            Self {
                name,
                value: OnceLock::new(),
                default: None,
            }
        }

        /// Creates a new `Optional` value.
        ///
        /// This function initializes a new `Optional` instance with a given name and a default value function.
        /// The default value function is used if the `Optional`'s internal value is not explicitly set.
        ///
        /// # Arguments
        ///
        /// * `name`: A static string slice representing the name of the optional value.
        /// * `default`: A function that returns the default value.  This function is called if the value is not explicitly set.
        pub const fn optional(name: &'static str, default: fn() -> T) -> Self {
            Self {
                name,
                value: OnceLock::new(),
                default: Some(default),
            }
        }

        /// Retrieves a reference of the value.
        ///
        /// This function attempts to retrieve a reference of the value.
        /// If the value is `NONE`, it panics with the given error message.
        pub fn get(&self) -> &T {
            self.try_get().unwrap_or_else(|error| panic!("{error}"))
        }
        /// This function attempts to load the underlying data.
        pub fn load(&self) -> Result<(), &EnvError> {
            self.try_get().map(|_| ())
        }

        /// Attempts to retrieve the value associated with the given name.
        ///
        /// This method first tries to get the value from the environment.
        ///
        /// 1. If the value is not present, it attempts
        ///    to provide a default value if one is specified.
        /// 2. If the value is an empty string, and
        ///    a default is provided, it returns the default.
        /// 3. If the value is malformed, and
        ///    a default is provided, it returns the default.
        fn try_get(&self) -> Result<&T, &EnvError> {
            self.value
                .get_or_init(|| {
                    let value = match env::var(self.name) {
                        Ok(value) => value,
                        Err(VarError::NotPresent) => {
                            return match self.default {
                                Some(default) => Ok(default()),
                                None => {
                                    return Err(EnvError {
                                        name: self.name,
                                        reason: EnvErrorReason::Missing,
                                    })
                                }
                            }
                        }
                        Err(VarError::NotUnicode(_err)) => {
                            return Err(EnvError {
                                name: self.name,
                                reason: EnvErrorReason::Missing,
                            })
                        }
                    };

                    let is_empty = value.is_empty();
                    match serde_plain::from_str::<T>(&value) {
                        Ok(value) => Ok(value),
                        Err(err) => match self.default {
                            Some(default) if is_empty => Ok(default()),
                            _ => Err(EnvError {
                                name: self.name,
                                reason: EnvErrorReason::Malformed(err.to_string()),
                            }),
                        },
                    }
                })
                .as_ref()
        }
    }

    impl<T: DeserializeOwned> Deref for EnvVar<T> {
        type Target = T;
        /// This method provides a reference to the underlying target of this object.
        ///
        /// It is equivalent to calling the `get()` method.
        fn deref(&self) -> &Self::Target {
            self.get()
        }
    }

    /// Represents an error related to environment variables.
    ///
    /// This struct encapsulates information about an environment variable error,
    /// including the name of the variable that caused the error and the reason
    /// for the error.
    #[derive(Debug, Error, Clone)]
    #[error("Environment variable '{name}' is {reason}")]
    pub struct EnvError {
        /// Representing the name of the environment variable that caused the error.
        pub name: &'static str,

        /// An enum representing the specific reason for the error.
        pub reason: EnvErrorReason,
    }

    /// An enum representing the reasons for environment variable errors.
    ///
    /// This enum is used to provide more specific error messages when an
    /// environment variable is missing or malformed.
    #[derive(Debug, Error, Clone)]
    pub enum EnvErrorReason {
        #[error("not set")]
        Missing,

        #[error("malformed: {0}")]
        Malformed(String),
    }
}
