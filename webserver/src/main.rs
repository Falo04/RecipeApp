//! Webserver

#![deny(unsafe_code)]
#![warn(clippy::todo, clippy::as_conversions)]

use std::error::Error;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::net::SocketAddr;

use clap::Parser;
use galvyn::Galvyn;
use galvyn::GalvynSetup;
use galvyn::core::modules::database::DatabaseSetup;
use galvyn::error::GalvynError;
use galvyn::rorm::Database;
use galvyn::rorm::DatabaseConfiguration;

use crate::config::Config;
use crate::modules::oidc::OpenIdConnect;
use crate::modules::websocket::WebsocketManager;
#[cfg(debug_assertions)]
use crate::utils::rorm::make_migrations;
use crate::utils::rorm::migrate;

pub mod cli;
pub mod config;
pub mod http;
pub mod models;
pub mod modules;
pub mod tracing_init;
pub mod utils;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let cli = cli::Cli::parse();

    match cli.command {
        cli::Command::Start => start().await,
        #[cfg(debug_assertions)]
        cli::Command::MakeMigrations { migrations_dir } => make_migrations(migrations_dir)?,
    }

    Ok(())
}

/// Starts the server with config loading and tracing/OTel init
async fn start() -> ! {
    let config = match Config::load() {
        Ok(c) => c,
        Err(err) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    };

    let otel_provider = tracing_init::init(
        &config.otel_exporter_name,
        config.otel_exporter_endpoint.as_ref(),
    );

    if let Err(error) = migrate(&config.driver).await {
        tracing::error!(error.debug = ?error, error.display = %error, "failed to apply migrations");
        if let Some(otel_provider) = otel_provider
            && let Err(err) = otel_provider.shutdown()
        {
            eprintln!("failed to shutdown otel provider: {err}");
        }
        std::process::exit(1);
    }

    let run_galvyn = build_galvyn(config);

    let exit_code = match run_galvyn.await {
        Ok(()) => 0,
        Err(error) => {
            tracing::error!(error.debug = ?error, error.display = %error, "fatal error");
            1
        }
    };

    if let Some(otel_provider) = otel_provider
        && let Err(err) = otel_provider.shutdown()
    {
        eprintln!("failed to shutdown otel provider: {err}");
    }

    std::process::exit(exit_code);
}

/// Builds galvyn
async fn build_galvyn(config: Config) -> Result<(), GalvynError> {
    Galvyn::builder(GalvynSetup::default())
        .register_module::<Database>(DatabaseSetup::Custom(DatabaseConfiguration::new(
            config.driver,
        )))
        .register_module::<OpenIdConnect>(Some(config.oidc))
        .register_module::<WebsocketManager>(())
        .init_modules()
        .await?
        .add_listener(
            SocketAddr::new(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)), 8080),
            http::initialize(),
        )
        .start()
        .await
}
