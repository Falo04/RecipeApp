use std::fs;

use clap::Parser;
use dotenv::dotenv;
use rorm::Database;
use rorm::DatabaseDriver;
use tracing::init_tracing_panic_hook;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use crate::cli::Cli;
use crate::cli::Command;
use crate::config::Config;
use crate::tracing::opentelemetry_layer;

mod cli;
mod config;
mod http;
mod models;
mod tracing;

async fn start(config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    galvyn_core::module::registry::Registry::builder()
        .register_module::<Database>()
        .init()
        .await?;

    http::server::run(config).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let config = Config::init();

    let registry = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("INFO")))
        .with(tracing_subscriber::fmt::layer());

    let registry = registry.with(opentelemetry_layer(&config)?);

    registry.init();
    init_tracing_panic_hook();

    let cli = Cli::parse();

    match cli.command {
        Command::Start => start(&config).await?,
        Command::Migrate { migrations_dir } => {
            rorm::cli::migrate::run_migrate_custom(
                rorm::cli::config::DatabaseConfig {
                    last_migration_table_name: None,
                    driver: get_db_driver(&config),
                },
                migrations_dir,
                false,
                None,
            )
            .await?
        }
        Command::MakeMigrations { migrations_dir } => {
            use std::io::Write;

            // Temporay file to store models in
            const MODELS: &str = "/tmp/.models.json";

            let mut file = fs::File::create(MODELS)?;
            rorm::write_models(&mut file)?;
            file.flush()?;

            rorm::cli::make_migrations::run_make_migrations(
                rorm::cli::make_migrations::MakeMigrationsOptions {
                    models_file: MODELS.to_string(),
                    migration_dir: migrations_dir,
                    name: None,
                    non_interactive: false,
                    warnings_disabled: false,
                },
            )?;

            fs::remove_file(MODELS)?;
        }
    }

    Ok(())
}

fn get_db_driver(config: &Config) -> DatabaseDriver {
    DatabaseDriver::Postgres {
        name: config.database.name.clone(),
        host: config.database.host.clone(),
        port: config.database.port,
        user: config.database.user.clone(),
        password: config.database.password.clone(),
    }
}
