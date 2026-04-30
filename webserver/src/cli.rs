//! Definitions of the CLI arguments

use clap::Parser;
use clap::Subcommand;

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
    /// Apply migrations to the database
    Migrate {
        /// The directory containing the migrations to apply
        #[clap(default_value_t = String::from("/migrations"))]
        migrations_dir: String,
    },
    /// Generate new migrations (debug builds only)
    #[cfg(debug_assertions)]
    MakeMigrations {
        /// The directory to write the migrations to
        #[clap(default_value_t = String::from("/migrations"))]
        migrations_dir: String,
    },
}
