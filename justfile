set shell := ["bash", "-euo", "pipefail", "-c"]
set dotenv-load := false

dev := "docker compose -f docker-compose-dev.yml"
prod := "docker compose -f docker-compose.yml"
frontend := "frontend"

# List all recipes
default:
    @just --list --unsorted

# ---------------------------------------------------------------- docker (dev)

[group('docker')]
[doc('docker compose for the dev stack, e.g. `just dev up -d --build`, `just dev logs -f webserver`')]
dev *args:
    {{ dev }} {{ args }}

[group('docker')]
[doc('Open a psql shell on the dev database')]
psql:
    {{ dev }} exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# ---------------------------------------------------------------- docker (prod)

[group('docker')]
[doc('docker compose for the production stack, e.g. `just prod up -d --build`')]
prod *args:
    {{ prod }} {{ args }}

# ---------------------------------------------------------------- codegen

[group('codegen')]
[doc('Create a new migration on the host (writes to webserver/migrations)')]
make-migrations:
    cargo run -- make-migrations webserver/migrations

[group('codegen')]
[doc('Regenerate the frontend API client from the running webserver (stack must be up)')]
gen-api:
    {{ dev }} exec frontend npm run gen-api

# ---------------------------------------------------------------- rust

[group('rust')]
[doc('Format Rust sources (needs the nightly toolchain for .rustfmt.toml)')]
fmt-rust:
    cargo +nightly fmt --all

[group('rust')]
[doc('Type check the whole workspace')]
check:
    cargo check --workspace --all-targets --all-features

[group('rust')]
[doc('Clippy over the whole workspace, warnings are errors')]
clippy:
    cargo clippy --workspace --all-targets --all-features -- -D warnings

[group('rust')]
[doc('Run the workspace test suite')]
test *args:
    cargo test --workspace --all-features {{ args }}

[group('rust')]
[doc('Audit dependencies for advisories, licenses and sources')]
deny:
    cargo deny check
