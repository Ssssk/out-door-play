FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV COREPACK_HOME=/tmp/corepack
ARG PNPM_REGISTRY=https://registry.npmjs.org
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
RUN pnpm config set registry "$PNPM_REGISTRY"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/mobile/package.json apps/mobile/package.json
RUN pnpm install --frozen-lockfile

COPY apps/admin apps/admin
COPY apps/mobile/src/static apps/mobile/src/static
COPY website website
RUN pnpm --filter @chumen/admin build

FROM nginx:1.27-alpine

COPY --from=build /app/website/dist /usr/share/nginx/html
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html/admin
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
