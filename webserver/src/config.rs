use std::clone::Clone;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::sync::LazyLock;

use rand::distr::Alphanumeric;
use rand::distr::SampleString;
use rorm::DatabaseDriver;

use crate::config::env::EnvError;
use crate::config::env::EnvVar;

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
    ] {
        errors.extend(result.err());
    }

    if !errors.is_empty() {
        return Err(errors);
    }
    Ok(())
}

pub static SERVER_ADDRESS: EnvVar<IpAddr> =
    EnvVar::optional("SERVER_ADDRESS", || IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)));

pub static SERVER_PORT: EnvVar<u16> = EnvVar::optional("SERVER_PORT", || 8432);

pub static DB_HOST: EnvVar = EnvVar::required("DB_HOST");
pub static DB_PORT: EnvVar<u16> = EnvVar::required("DB_PORT");
pub static DB_NAME: EnvVar = EnvVar::required("DB_NAME");
pub static DB_USER: EnvVar = EnvVar::required("DB_USER");
pub static DB_PASSWORD: EnvVar = EnvVar::required("DB_PASSWORD");
pub static DB_SCHEMA: EnvVar = EnvVar::required("DB_SCHEMA");

pub static JWT: EnvVar =
    EnvVar::optional("JWT", || Alphanumeric.sample_string(&mut rand::rng(), 32));

pub static AUTHENTICATION_ENABLED: EnvVar<bool> =
    EnvVar::optional("AUTHENTICATION_ENABLED", || false);

pub static OTEL_ENDPOINT: EnvVar =
    EnvVar::optional("OTEL_ENDPOINT", || "http://jaeger-dev:4317".to_string());

pub static DB: LazyLock<DatabaseDriver> = LazyLock::new(|| DatabaseDriver::Postgres {
    name: DB_NAME.clone(),
    user: DB_USER.clone(),
    host: DB_HOST.clone(),
    password: DB_PASSWORD.clone(),
    port: *DB_PORT,
});

mod env {
    use std::env;
    use std::env::VarError;
    use std::ops::Deref;
    use std::sync::OnceLock;

    use serde::de::DeserializeOwned;
    use thiserror::Error;

    pub struct EnvVar<T = String> {
        value: OnceLock<Result<T, EnvError>>,

        name: &'static str,
        default: Option<fn() -> T>,
    }

    impl<T: DeserializeOwned> EnvVar<T> {
        pub const fn required(name: &'static str) -> Self {
            Self {
                name,
                value: OnceLock::new(),
                default: None,
            }
        }
        pub const fn optional(name: &'static str, default: fn() -> T) -> Self {
            Self {
                name,
                value: OnceLock::new(),
                default: Some(default),
            }
        }

        pub fn get(&self) -> &T {
            self.try_get().unwrap_or_else(|error| panic!("{error}"))
        }
        pub fn load(&self) -> Result<(), &EnvError> {
            self.try_get().map(|_| ())
        }

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
        fn deref(&self) -> &Self::Target {
            self.get()
        }
    }

    #[derive(Debug, Error, Clone)]
    #[error("Environment variable '{name}' is {reason}")]
    pub struct EnvError {
        pub name: &'static str,
        pub reason: EnvErrorReason,
    }

    #[derive(Debug, Error, Clone)]
    pub enum EnvErrorReason {
        #[error("not set")]
        Missing,

        #[error("malformed: {0}")]
        Malformed(String),
    }
}
