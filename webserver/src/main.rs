use std::fs;

use ::tracing::info;
use bcrypt::hash;
use bcrypt::DEFAULT_COST;
use clap::Parser;
use clap::Subcommand;
use dotenv::dotenv;
use global::GlobalChan;
use global::GLOBAL;
use http::server;
use models::user::User;
use rorm::Database;
use rorm::DatabaseConfiguration;
use rorm::DatabaseDriver;
use tracing::init_tracing_panic_hook;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

use crate::config::Config;
use crate::tracing::opentelemetry_layer;

mod config;
mod global;
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
    let config = Config::init();

    let registry = tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or(EnvFilter::new("INFO")))
        .with(tracing_subscriber::fmt::layer());

    let registry = registry.with(opentelemetry_layer(&config)?);

    registry.init();
    init_tracing_panic_hook();

    let cli = Cli::parse();

    match cli.command {
        Command::Start => {
            let db = Database::connect(DatabaseConfiguration {
                driver: get_db_driver(&config),
                min_connections: 2,
                max_connections: 8,
            })
            .await?;

            GLOBAL.init(GlobalChan {
                db,
                jwt: config.jwt.clone(),
                authentication_enabled: config.authentication_enabled,
            });

            server::run(&config).await?;

            GLOBAL.db.clone().close().await;
        }
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
        Command::CreateUser {
            email,
            display_name,
        } => {
            let db = Database::connect(DatabaseConfiguration {
                driver: get_db_driver(&config),
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
