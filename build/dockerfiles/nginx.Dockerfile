FROM debian:trixie-slim AS build-swagger

WORKDIR /app

RUN <<EOF
set -e
apt-get update
apt-get install wget -y
EOF

# renovate: datasource=npm depName=swagger-ui-dist
ARG SWAGGER_UI_VERSION=5.18.2

RUN <<EOF
set -e
wget https://github.com/swagger-api/swagger-ui/archive/refs/tags/v${SWAGGER_UI_VERSION}.tar.gz
tar xf v${SWAGGER_UI_VERSION}.tar.gz
mv swagger-ui-${SWAGGER_UI_VERSION}/dist swagger-ui
EOF

FROM node:26.13.0-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072 AS build-frontend

# renovate: datasource=npm depName=corepack
ARG COREPACK_VERSION=0.36.0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install --global corepack@${COREPACK_VERSION} && corepack enable

WORKDIR /app

COPY ./frontend/ .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store/ \
  <<EOF
set -e
pnpm install --frozen-lockfile
pnpm run build
mv ./dist /frontend
EOF

FROM nginx:alpine AS final

RUN <<EOF
set -e
update-ca-certificates
mkdir /certs
EOF

COPY --from=build-frontend /frontend /usr/share/nginx/html/frontend
COPY --from=build-swagger /app/swagger-ui /usr/share/nginx/html/swagger-ui
COPY ./build/nginx/swagger-initializer.js /usr/share/nginx/html/swagger-ui/swagger-initializer.js
