use std::fs;
use std::net::SocketAddr;

use ::tracing::level_filters::LevelFilter;
use clap::Parser;
use clap::Subcommand;
use galvyn::core::re_exports::rorm;
use galvyn::core::DatabaseSetup;
use galvyn::rorm::Database;
use galvyn::rorm::DatabaseConfiguration;
use galvyn::Galvyn;
use galvyn::GalvynSetup;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::Layer;

use crate::config::DB;
use crate::config::SERVER_ADDRESS;
use crate::config::SERVER_PORT;
use crate::http::server;
use crate::modules::oidc::OpenIdConnect;
use crate::modules::websockets::WebsocketManager;

mod config;
mod http;
mod models;
mod modules;

/// Represents the command-line arguments parsed by the program.
///
/// This struct holds the parsed command and any subcommands.
#[derive(Parser)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Command,
}

/// Represents a command with subcommands.
///
/// This enum defines the different commands available in the application.
#[derive(Subcommand)]
pub enum Command {
    Start,
    Migrate { migrations_dir: String },
    MakeMigrations { migrations_dir: String },
}

/// Main function to start the application.
///
/// This function initializes the configuration, logging, and handles the application's main command-line interaction.
/// It parses command-line arguments and executes the corresponding command.
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    if let Err(errors) = config::load_env() {
        for error in errors {
            eprintln!("error: {error}");
        }
        return Err("Failed to load configuration".into());
    }

    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("INFO")))
        .with(tracing_forest::ForestLayer::default().with_filter(LevelFilter::DEBUG))
        .init();

    let cli = Cli::parse();

    match cli.command {
        Command::Start => start().await?,
        Command::Migrate { migrations_dir } => {
            rorm::cli::migrate::run_migrate_custom(
                rorm::cli::config::DatabaseConfig {
                    last_migration_table_name: None,
                    driver: DB.clone(),
                },
                migrations_dir,
                false,
                None,
            )
            .await?
        }
        Command::MakeMigrations { migrations_dir } => {
            use std::io::Write;

            /// Defines the path to the model JSON file.
            ///
            /// This constant specifies the location of the JSON file containing model definitions.
            /// The file is expected to be located at "/tmp/.models.json".
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

/// Starts the Galvyn server.
///
/// This function initializes the Galvyn server with the provided database configuration
/// and routes, then starts the server listening on the specified address and port.
async fn start() -> Result<(), Box<dyn std::error::Error>> {
    Galvyn::builder(GalvynSetup::default())
        .register_module::<Database>(DatabaseSetup::Custom(DatabaseConfiguration::new(
            DB.clone(),
        )))
        .register_module::<WebsocketManager>(())
        .register_module::<OpenIdConnect>(())
        .init_modules()
        .await?
        .add_routes(server::initialize())
        .start(SocketAddr::from((
            *SERVER_ADDRESS.get(),
            *SERVER_PORT.get(),
        )))
        .await?;

    Ok(())
}
