# syntax=docker/dockerfile:1

# ── 1) Base: pnpm + turbo ──────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@9 turbo@2

# ── 2) Prune: se queda solo con lo que "web" necesita ──────
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune web --docker

# ── 3) Install: instala dependencias del subset ya podado ─
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ── 4) Build: compila el Next.js en modo standalone ────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ENV NEXT_TELEMETRY_DISABLED=1

# Estas variables quedan "horneadas" en el bundle del navegador,
# por eso van como ARG/build-time y no solo en el .env de runtime
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

RUN pnpm turbo run build --filter=web

# ── 5) Runner: imagen final con el output standalone ───────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get({host:'localhost',port:3000,timeout:2000},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
