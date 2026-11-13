FROM node:26.13.1@sha256:e18c3ccdf7d71619990b0e85639f506e2028a95410999cab24cc373cbd10e0ac AS final

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
