# ─── Stage 1: Build shared package ───────────────────────────────────────────
FROM node:20-alpine AS shared-builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/

# Install only shared deps
RUN pnpm install --frozen-lockfile --filter @interview-library/shared

# Copy shared source and build
COPY packages/shared ./packages/shared
RUN pnpm --filter @interview-library/shared build

# ─── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile --filter backend --filter @interview-library/shared

# Copy built shared package
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist

# Copy backend source
COPY apps/backend ./apps/backend
COPY packages/shared/src ./packages/shared/src

# Build backend
RUN pnpm --filter backend build

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production deps only
RUN pnpm install --frozen-lockfile --filter backend --filter @interview-library/shared --prod

# Copy built artifacts
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 4000

CMD ["node", "apps/backend/dist/main"]
