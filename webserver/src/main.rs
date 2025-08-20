use std::fs;
use std::net::SocketAddr;

use ::tracing::info;
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::SaltString;
use argon2::Argon2;
use argon2::PasswordHasher;
use clap::Parser;
use clap::Subcommand;
use dotenv::dotenv;
use galvyn::core::DatabaseSetup;
use galvyn::rorm::Database;
use galvyn::rorm::DatabaseConfiguration;
use models::users::User;
use tracing::init_tracing_panic_hook;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

use crate::config::DB;
use crate::config::SERVER_ADDRESS;
use crate::config::SERVER_PORT;
use crate::http::server;
use crate::modules::oidc::OpenIdConnect;
use crate::modules::websockets::WebsocketManager;
use crate::tracing::opentelemetry_layer;

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
    CreateUser { email: String, display_name: String },
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
        Command::CreateUser {
            email,
            display_name,
        } => create_user(email, display_name).await?,
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

/// Creates a new user account.
///
/// This function prompts the user for a password,
/// hashes it, and inserts the user data into the database.
async fn create_user(
    email: String,
    display_name: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let db = Database::connect(DatabaseConfiguration {
        driver: DB.clone(),
        min_connections: 2,
        max_connections: 2,
    })
    .await?;
    let mut tx = db.start_transaction().await?;
    let mut password;
    loop {
        password = rpassword::prompt_password("Password: ").unwrap();
        if password == rpassword::prompt_password("Confirm Password: ").unwrap() {
            break;
        }
        println!("Password is incorrect, try again");
    }
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_ref(), &salt)?.to_string();
    info!("user with {email}, {display_name}, {hash} will be inserted");
    let uuid = rorm::insert(&mut tx, User)
        .return_primary_key()
        .single(&User {
            uuid: Uuid::new_v4(),
            display_name,
            mail: email,
            password: hash,
        })
        .await?;
    info!("created user with uuid: {uuid}");
    tx.commit().await?;
    db.close().await;
    Ok(())
}
