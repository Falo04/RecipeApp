FROM debian:trixie-slim AS build-swagger

WORKDIR /app

RUN <<EOF
set -e
apt-get update
apt-get install wget -y
EOF

RUN <<EOF
set -e
wget https://github.com/swagger-api/swagger-ui/archive/refs/tags/v5.18.2.tar.gz
tar xf v5.18.2.tar.gz
mv swagger-ui-5.18.2/dist swagger-ui
EOF

FROM node:25-trixie-slim AS build-frontend

WORKDIR /app

COPY ./frontend/package.json .
COPY ./frontend/package-lock.json .
COPY ./frontend/ .

RUN --mount=type=cache,target=./node_modules/ \
  <<EOF
set -e
npm clean-install
npm run build
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
