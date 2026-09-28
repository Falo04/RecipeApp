FROM rust:1.95.0-slim-trixie@sha256:e14e87345b4d5964ddcc3491d27ee046a0f23820f340c3c1e24da6880141f7c0 AS builder

RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends musl-tools
EOF

ENV CC_aarch64_unknown_linux_musl=musl-gcc

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


FROM dhi.io/alpine-base:3.23@sha256:27d91b0ae2dbb1bbf89398f4ee4564a0c7a14a82c34c8cffd3b2687033a9d97a AS final

COPY --from=builder /build/service /usr/local/bin/service
COPY ./webserver/migrations /migrations

ENTRYPOINT ["/usr/local/bin/service"]
CMD ["start"]
