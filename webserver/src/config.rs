use std::env;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::str::FromStr;

use serde::Deserialize;
use serde::Serialize;

/// Server related configuration.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct ServerConfig {
    pub address: IpAddr,
    pub port: u16,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct DBConfig {
    /// The address of the database server
    pub host: String,
    /// The port of the database server
    pub port: u16,
    /// The database name
    pub name: String,
    /// The user to use for the database connection
    pub user: String,
    /// Password for the user
    pub password: String,

    pub schema: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Config {
    pub server: ServerConfig,
    pub database: DBConfig,
    pub otel_exporter_otlp_endpoint: String,
    pub jwt: String,
}

impl Config {
    pub fn init() -> Config {
        let server_address = env::var("SERVER_ADDRESS").expect("SERVER_ADDRESS must be set");
        let server_port = env::var("SERVER_PORT").expect("SERVER_PORT must be set");

        let db_host = env::var("DB_HOST").expect("DB_HOST must be set");
        let db_port = env::var("DB_PORT").expect("DB_PORT must be set");
        let db_name = env::var("DB_DATABASE").expect("DB_DATABASE must be set");
        let db_user = env::var("DB_USERNAME").expect("DB_USERNAME must be set");
        let db_password = env::var("DB_PASSWORD").expect("DB_PASSWORD must be set");
        let db_schema = env::var("DB_SCHEMA").expect("DB_SCHEMA must be set");

        let jwt = env::var("JWT_TOKEN").expect("JWT_TOKEN must be set");

        Config {
            server: ServerConfig {
                address: IpAddr::from_str(&server_address)
                    .unwrap_or(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0))),
                port: server_port.parse().expect("SERVER_PORT must be a number"),
            },
            database: DBConfig {
                host: db_host,
                port: db_port.parse().expect("DB_PORT must be a number"),
                name: db_name,
                user: db_user,
                password: db_password,
                schema: db_schema,
            },
            otel_exporter_otlp_endpoint: "http://jaeger-dev:4317".to_string(),
            jwt,
        }
    }
}
