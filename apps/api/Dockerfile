# syntax=docker/dockerfile:1

# ── 1) Base: pnpm + turbo ──────────────────────────────────
FROM node:20-bookworm-slim AS base
RUN npm install -g pnpm@9 turbo@2

# ── 2) Prune: se queda solo con lo que "api" necesita ──────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune api --docker

# ── 3) Install: instala dependencias del subset ya podado ─
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ── 4) Build: compila NestJS + genera cliente Prisma ───────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter=api exec prisma generate
RUN pnpm turbo run build --filter=api

# ── 5) Runner: imagen final, sin herramientas de build ─────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd -r nestjs && useradd -r -g nestjs nestjs
COPY --from=builder --chown=nestjs:nestjs /app .
USER nestjs
WORKDIR /app/apps/api
EXPOSE 3001

# aplica migraciones pendientes y recién ahí levanta la API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:3001,path:'/api/v1',timeout:2000},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
