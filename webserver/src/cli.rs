//! Definitions of the CLI arguments

use clap::Parser;
use clap::Subcommand;

use crate::utils::rorm::MIGRATION_DIR;

/// The cli
#[derive(Parser)]
pub struct Cli {
    /// The available subcommands
    #[clap(subcommand)]
    pub command: Command,
}

/// All available commands
#[derive(Subcommand)]
pub enum Command {
    /// Start the server
    Start,
    /// Create new migrations
    #[cfg(debug_assertions)]
    MakeMigrations {
        /// The directory where the migration files are located in
        #[clap(default_value_t = MIGRATION_DIR.to_string())]
        migrations_dir: String,
    },
}
