FROM rust:1.100.0-alpine@sha256:de1e0058543a81ed7b046629167db587c67a94bdf37cce14eb27f0ec83baaffb AS builder

RUN apk add --no-cache musl-dev

RUN rustup target add aarch64-unknown-linux-musl

WORKDIR /build
COPY . .

RUN --mount=type=cache,target=/build/target/ \
  --mount=type=cache,target=/usr/local/cargo/registry/ \
  <<EOF
set -e
cargo build --target aarch64-unknown-linux-musl --release --locked --package webserver
cp -v /build/target/aarch64-unknown-linux-musl/release/webserver /build/service
EOF


FROM alpine:3.24.3@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a AS final

COPY --from=builder /build/service /usr/local/bin/service
COPY ./webserver/migrations /migrations

ENTRYPOINT ["/usr/local/bin/service"]
CMD ["start"]
