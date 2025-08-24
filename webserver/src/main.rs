use std::fs;
use std::net::SocketAddr;

use clap::Parser;
use clap::Subcommand;
use dotenv::dotenv;
use galvyn::core::DatabaseSetup;
use galvyn::rorm::Database;
use galvyn::rorm::DatabaseConfiguration;
use tracing::init_tracing_panic_hook;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

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
mod tracing;

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
    dotenv().ok();
    if let Err(errors) = config::init() {
        for error in errors {
            eprintln!("error: {error}");
        }
        return Err("Failed to load configuration".into());
    }

    let registry = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("INFO")))
        .with(tracing_subscriber::fmt::layer());

    //let registry = registry.with(opentelemetry_layer()?);

    registry.init();
    init_tracing_panic_hook();

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
    galvyn::Galvyn::new()
        .register_module::<Database>(DatabaseSetup::Custom(DatabaseConfiguration::new(
            DB.clone(),
        )))
        .register_module::<WebsocketManager>(Default::default())
        .register_module::<OpenIdConnect>(Default::default())
        .init_modules()
        .await?
        .add_routes(server::initialize())
        .start(SocketAddr::new(*SERVER_ADDRESS, *SERVER_PORT))
        .await?;

    Ok(())
}
