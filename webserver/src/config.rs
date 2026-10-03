//! Configuration based on environment variables

use core::fmt;
use std::str::FromStr;

use galvyn::rorm::DatabaseDriver;
use openidconnect::ClientId;
use openidconnect::ClientSecret;
use openidconnect::IssuerUrl;
use openidconnect::RedirectUrl;
use url::Url;

use crate::modules::oidc::OidcConfig;

/// The path the oidc provider redirects to after a successful authorization
///
/// Has to match the route `finish_oidc_login` is mounted under.
const OIDC_REDIRECT_PATH: &str = "/api/frontend/v1/oidc/finish-login";

/// Tavern goblin config
#[derive(Debug)]
pub struct Config {
    /// The origin of the app
    pub origin: Url,
    /// Database config
    pub driver: DatabaseDriver,

    /// The otel exporter name
    pub otel_exporter_name: String,
    /// The otel exporter endpoint url
    pub otel_exporter_endpoint: Option<Url>,

    /// The oidc provider used to authenticate users
    pub oidc: OidcConfig,
}

impl Config {
    /// Loads [Config] from the environment
    pub fn load() -> Result<Self, ConfigErrors> {
        let mut loader = ConfigLoader::new();

        let origin = loader.require_as::<Url>("ORIGIN");

        let postgres_db = loader.require("POSTGRES_DB");
        let postgres_host = loader.optional("POSTGRES_HOST", "postgres");
        let posgres_user = loader.optional("POSTGRES_USER", "tavern-goblin");
        let postgres_password = loader.require("POSTGRES_PASSWORD");
        let postgres_port = loader.optional_as::<u16>("POSTGRES_PORT", "5432");

        let otel_exporter_name = loader.require("OTEL_EXPORTER_NAME");
        let otel_exporter_endpoint = loader.require_as::<Url>("OTEL_EXPORTER_ENDPOINT");

        let oidc_issuer_url = loader.require_as::<Url>("OIDC_ISSUER_URL");
        let oidc_client_id = loader.require("OIDC_CLIENT_ID");
        let oidc_client_secret = loader.require("OIDC_CLIENT_SECRET");

        // The provider redirects back to us, so the redirect url is our origin plus the callback's route
        let oidc_redirect_url =
            origin
                .as_ref()
                .and_then(|origin| match origin.join(OIDC_REDIRECT_PATH) {
                    Ok(url) => Some(url),
                    Err(error) => {
                        loader.invalid_value("ORIGIN", origin.as_str(), error.to_string());
                        None
                    }
                });

        loader.finish()?;

        Ok(Self {
            origin: origin.unwrap(),
            otel_exporter_name: otel_exporter_name.unwrap(),
            otel_exporter_endpoint,
            oidc: OidcConfig {
                url: IssuerUrl::from_url(oidc_issuer_url.unwrap()),
                client_id: ClientId::new(oidc_client_id.unwrap()),
                client_secret: ClientSecret::new(oidc_client_secret.unwrap()),
                redirect_url: RedirectUrl::from_url(oidc_redirect_url.unwrap()),
            },
            driver: DatabaseDriver::Postgres {
                name: postgres_db.unwrap(),
                host: postgres_host,
                user: posgres_user,
                password: postgres_password.unwrap(),
                port: postgres_port.unwrap(),
            },
        })
    }
}

/// Wrapper around environment loading
#[derive(Debug, Default)]
pub struct ConfigLoader {
    /// Collects all errors during environment loading
    errors: Vec<ConfigError>,
}

impl ConfigLoader {
    /// Creates a new [`ConfigLoader`]
    pub fn new() -> Self {
        Self::default()
    }

    /// Loads a required env variable and returns its value.
    /// Records a [`ConfigError::Missing`] if the variable is not set.
    pub fn require(&mut self, name: &str) -> Option<String> {
        match std::env::var(name) {
            Ok(v) => Some(v),
            Err(_) => {
                self.errors.push(ConfigError::Missing {
                    name: name.to_owned(),
                });
                None
            }
        }
    }

    /// Loads a required env variable and parses it into `T`.
    /// Returns `None` and records a [`ConfigError`] on missing or parse failure.
    /// After [`finish`](Self::finish) succeeds, every `None` returned here is unreachable.
    pub fn require_as<T: FromStr>(&mut self, name: &str) -> Option<T>
    where
        T::Err: std::fmt::Display,
    {
        match std::env::var(name) {
            Ok(value) => match value.parse::<T>() {
                Ok(v) => Some(v),
                Err(e) => {
                    self.errors.push(ConfigError::InvalidValue {
                        name: name.to_owned(),
                        value,
                        message: e.to_string(),
                    });
                    None
                }
            },
            Err(_) => {
                self.errors.push(ConfigError::Missing {
                    name: name.to_owned(),
                });
                None
            }
        }
    }

    /// Loads an env variable, returning `default` if it is not set.
    pub fn optional(&mut self, name: &str, default: &str) -> String {
        std::env::var(name).unwrap_or_else(|_| default.to_string())
    }

    /// Loads an env variable and parses it into `T`, using `default` if it is not set.
    /// Returns `None` and records a [`ConfigError::InvalidValue`] if parsing fails.
    /// After [`finish`](Self::finish) succeeds, every `None` returned here is unreachable.
    pub fn optional_as<T: FromStr>(&mut self, name: &str, default: &str) -> Option<T>
    where
        T::Err: std::fmt::Display,
    {
        let value = self.optional(name, default);
        match value.parse::<T>() {
            Ok(v) => Some(v),
            Err(e) => {
                self.errors.push(ConfigError::InvalidValue {
                    name: name.to_owned(),
                    value,
                    message: e.to_string(),
                });
                None
            }
        }
    }

    /// Records a [`ConfigError::InvalidValue`] for a value which failed a check
    /// outside of the loader's own parsing.
    pub fn invalid_value(&mut self, name: &str, value: &str, message: String) {
        self.errors.push(ConfigError::InvalidValue {
            name: name.to_owned(),
            value: value.to_owned(),
            message,
        });
    }

    /// Consumes the loader and returns `Ok(())` if no errors were accumulated,
    /// or `Err` with all collected [`ConfigError`]s otherwise.
    pub fn finish(self) -> Result<(), ConfigErrors> {
        if self.errors.is_empty() {
            Ok(())
        } else {
            Err(ConfigErrors(self.errors))
        }
    }
}

/// All errors which can occur during loading of env variables
#[derive(Debug)]
pub enum ConfigError {
    /// Env variable is missing
    Missing {
        /// Name of the missing environment variable
        name: String,
    },
    /// Env variable was an invalid value
    InvalidValue {
        /// Name of the env variable
        name: String,
        /// Value of the env variable
        value: String,
        /// Parse error
        message: String,
    },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::Missing { name } => write!(f, "Missing variable: {name}"),
            ConfigError::InvalidValue {
                name,
                value,
                message,
            } => {
                write!(f, "Invalid value '{value}' for {name}: {message}")
            }
        }
    }
}

/// All errors collected during a single [`Config::load`](super::Config::load) call.
pub struct ConfigErrors(Vec<ConfigError>);

impl ConfigErrors {
    /// Returns a slice of all errors which where collect during the
    /// [`Config::load()`](super::Config::load)
    pub fn errors(&self) -> &[ConfigError] {
        &self.0
    }
}

impl fmt::Display for ConfigErrors {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "missing or invalid environment variables:")?;
        for err in &self.0 {
            writeln!(f, "- {err}")?;
        }
        Ok(())
    }
}

impl fmt::Debug for ConfigErrors {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        fmt::Display::fmt(self, f)
    }
}
