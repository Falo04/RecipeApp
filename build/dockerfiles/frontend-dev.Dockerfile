FROM node:26.13.0@sha256:19f8f8e74820809004eed8f88824ccfa76e89ae79cf0f6a7a38fddf3c470a5b7 AS final

WORKDIR /app

RUN <<EOF
set -e
apt-get update
apt-get install -y wget default-jre-headless
EOF

# renovate: datasource=npm depName=corepack
ARG COREPACK_VERSION=0.36.0
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install --global corepack@${COREPACK_VERSION} && corepack enable

COPY ./frontend .

RUN chown -R node:node /app

USER node
RUN pnpm install --frozen-lockfile

CMD ["pnpm", "run", "dev"]
