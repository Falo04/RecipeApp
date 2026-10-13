FROM node:23 AS final

WORKDIR /app

RUN <<EOF
set -e
apt-get update
apt-get install -y wget default-jre-headless
EOF

RUN corepack enable

COPY ./frontend .

RUN chown -R node:node /app

USER node
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN pnpm install --frozen-lockfile

CMD ["pnpm", "run", "dev"]
