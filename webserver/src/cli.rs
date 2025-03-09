use clap::Parser;
use clap::Subcommand;

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
