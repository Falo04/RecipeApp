FROM debian:trixie-slim AS build

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

FROM nginx:alpine AS final

COPY --from=build /app/swagger-ui /usr/share/nginx/html/swagger-ui
COPY ./build/nginx/swagger-initializer.js /usr/share/nginx/html/swagger-ui/swagger-initializer.js
