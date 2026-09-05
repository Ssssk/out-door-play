FROM node:22-bookworm-slim

WORKDIR /app

ENV COREPACK_HOME=/tmp/corepack
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
RUN DATABASE_URL=mysql://build:build@127.0.0.1:3306/build \
    SHADOW_DATABASE_URL=mysql://build:build@127.0.0.1:3306/build_shadow \
    pnpm --filter @chumen/api build

ENV NODE_ENV=production
ENV PORT=3100
EXPOSE 3100

CMD ["pnpm", "--filter", "@chumen/api", "start"]
