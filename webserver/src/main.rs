use std::fs;
use std::net::SocketAddr;

use ::tracing::info;
use bcrypt::hash;
use bcrypt::DEFAULT_COST;
use clap::Parser;
use clap::Subcommand;
use dotenv::dotenv;
use galvyn::core::DatabaseSetup;
use http::server;
use models::user::User;
use rorm::Database;
use rorm::DatabaseConfiguration;
use tracing::init_tracing_panic_hook;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

use crate::config::DB;
use crate::config::SERVER_ADDRESS;
use crate::config::SERVER_PORT;
use crate::tracing::opentelemetry_layer;

mod config;
mod http;
mod models;
mod tracing;

#[derive(Parser)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Command,
}

#[derive(Subcommand)]
pub enum Command {
    Start,
    Migrate { migrations_dir: String },
    MakeMigrations { migrations_dir: String },
    CreateUser { email: String, display_name: String },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    if let Err(errors) = config::init() {
        for error in errors {
            eprintln!("error: {}", error);
        }
        return Err("Failed to load configuration".into());
    }

    let registry = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("INFO")))
        .with(tracing_subscriber::fmt::layer());

    let registry = registry.with(opentelemetry_layer()?);

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
        Command::CreateUser {
            email,
            display_name,
        } => create_user(email, display_name).await?,
    }

    Ok(())
}

async fn start() -> Result<(), Box<dyn std::error::Error>> {
    galvyn::Galvyn::new()
        .register_module::<Database>(DatabaseSetup::Custom(DatabaseConfiguration::new(
            DB.clone(),
        )))
        .init_modules()
        .await?
        .add_routes(server::initialize())
        .start(SocketAddr::new(SERVER_ADDRESS.clone(), *SERVER_PORT))
        .await?;

    Ok(())
}

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
    let hash = hash(password, DEFAULT_COST)?;
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
