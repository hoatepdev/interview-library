/**
 * Middle-Level Docker & DevOps Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: Docker, CI/CD, deployment, containerization, infrastructure basics.
 *
 * Topics: docker-devops (20)
 * Level: MIDDLE
 *
 * NOTE: This batch also creates the "docker-devops" topic if it doesn't exist.
 *
 * Usage: pnpm --filter backend seed:middle-docker-devops
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

export const newTopic = {
  name: "Docker & DevOps",
  slug: "docker-devops",
  description:
    "Docker, CI/CD pipelines, containerization, deployment strategies, infrastructure",
  icon: "Container",
  color: "#0EA5E9",
};

// ============================================
// DOCKER & DEVOPS — MIDDLE LEVEL (20 questions)
// ============================================

export const middleDockerDevopsQuestions: QuestionSeed[] = [
  // 1. Docker Fundamentals
  {
    title: "Explain the difference between a Docker image and a container",
    content:
      "What is the relationship between images and containers? How does the layered filesystem work? How do you inspect image layers?",
    answer: `**Image**: Read-only template with application code, dependencies, and config. Built from a Dockerfile.
**Container**: Running instance of an image. Has a writable layer on top.

\`\`\`
Image (read-only layers)         Container
┌──────────────────────┐    ┌──────────────────────┐
│  Layer 4: COPY app   │    │  Writable Layer      │ ← runtime changes
│  Layer 3: RUN npm ci │    │  Layer 4: COPY app   │
│  Layer 2: COPY pkg   │    │  Layer 3: RUN npm ci │
│  Layer 1: node:20    │    │  Layer 2: COPY pkg   │
└──────────────────────┘    │  Layer 1: node:20    │
                            └──────────────────────┘
\`\`\`

**Key differences**:
- Image = blueprint (class), Container = running instance (object)
- Multiple containers can share the same image
- Containers are ephemeral; images are stored in a registry

**Layered filesystem (UnionFS)**:
- Each Dockerfile instruction creates a new layer
- Layers are cached — if nothing changes, layer is reused
- Layers are shared between images (node:20 downloaded once)

**Inspecting layers**:
\`\`\`bash
# View image layers and sizes
docker history myapp:latest

# Inspect image metadata
docker inspect myapp:latest

# Analyze image size with dive
dive myapp:latest
\`\`\`

**Analogy**: Image is like a class definition; container is like an object instance. You can create many containers from one image, each with its own state.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 2. Multi-stage Builds
  {
    title: "How do multi-stage Docker builds work and why are they important?",
    content:
      "Explain multi-stage builds with a practical example. How do they reduce image size? What are the best practices?",
    answer: `**Multi-stage builds**: Use multiple FROM statements in one Dockerfile. Each FROM starts a new stage. Only the final stage becomes the image.

**Without multi-stage** (large image):
\`\`\`dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
# Image includes: source code, devDependencies, build tools = ~1.2GB
CMD ["node", "dist/main.js"]
\`\`\`

**With multi-stage** (small image):
\`\`\`dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# Copy only built output from builder stage
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
# Image: ~180MB (vs 1.2GB)
\`\`\`

**Three-stage for monorepos**:
\`\`\`dockerfile
# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS builder
COPY . .
RUN pnpm build

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
CMD ["node", "dist/main.js"]
\`\`\`

**Best practices**:
- Use \`-alpine\` or \`-slim\` base images
- Copy \`package.json\` + lockfile before source code (cache npm install layer)
- Use \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, tests
- Run as non-root user in production stage
- Pin exact base image versions (\`node:20.11.0-alpine\`, not \`node:latest\`)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 3. Docker Compose
  {
    title: "How do you use Docker Compose for local development?",
    content:
      "Explain docker-compose.yml structure, networking, volumes, health checks, and development-specific patterns.",
    answer: `**Docker Compose**: Define and run multi-container applications with a YAML file.

**Full-stack development setup**:
\`\`\`yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development        # Use dev stage from multi-stage Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app                   # Bind mount for hot reload
      - /app/node_modules        # Exclude node_modules from bind mount
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    command: pnpm start:dev

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myapp_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # init script
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/var/lib/redis/data

volumes:
  postgres_data:     # Named volume — persists across restarts
  redis_data:
\`\`\`

**Networking**:
- Compose creates a default network for all services
- Services reference each other by service name: \`postgres\`, \`redis\`
- \`depends_on\` controls startup order (not readiness — use \`healthcheck\`)

**Override file** for dev-specific config:
\`\`\`yaml
# docker-compose.override.yml (auto-merged)
services:
  app:
    volumes:
      - .:/app
    command: pnpm start:dev
  postgres:
    ports:
      - "5432:5432"   # Expose DB port locally for debugging
\`\`\`

**Common commands**:
\`\`\`bash
docker compose up -d           # Start all services in background
docker compose up -d postgres  # Start only postgres
docker compose logs -f app     # Follow app logs
docker compose exec app sh     # Shell into running container
docker compose down            # Stop and remove containers
docker compose down -v         # Also remove volumes (reset data)
docker compose build --no-cache  # Rebuild images from scratch
\`\`\`

**Environment variables**:
\`\`\`yaml
# Use .env file (auto-loaded by Compose)
services:
  app:
    env_file: .env              # Load from file
    environment:                # Or set directly (overrides .env)
      - DB_HOST=postgres
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 4. Docker Networking
  {
    title: "Explain Docker networking modes and how containers communicate",
    content:
      "What are bridge, host, and overlay networks? How do containers discover and communicate with each other?",
    answer: `**Network drivers**:

| Driver | Scope | Use Case |
|--------|-------|----------|
| bridge | Single host | Default. Containers on same host communicate. |
| host | Single host | Container shares host network. No port mapping needed. |
| overlay | Multi-host | Swarm/K8s. Containers across different hosts. |
| none | - | No networking. Fully isolated container. |

**Bridge network** (default):
\`\`\`bash
# Default bridge — containers can't resolve each other by name
docker run -d --name app1 myapp
docker run -d --name app2 myapp
# app1 can't reach app2 by name on default bridge

# Custom bridge — containers CAN resolve by name (recommended)
docker network create mynet
docker run -d --name app1 --network mynet myapp
docker run -d --name app2 --network mynet myapp
# app1 can reach app2: curl http://app2:3000
\`\`\`

**Docker Compose networking** — auto-creates a custom bridge:
\`\`\`yaml
services:
  api:
    image: myapi
    # Can reach db at hostname "db" and redis at "redis"
  db:
    image: postgres:16
  redis:
    image: redis:7
# All on the same auto-created network: <project>_default
\`\`\`

**Host network** — no isolation, max performance:
\`\`\`bash
docker run --network host myapp
# Container binds directly to host ports
# No port mapping needed (-p is ignored)
# Use case: high-performance networking, avoiding NAT overhead
\`\`\`

**Port mapping**:
\`\`\`bash
docker run -p 8080:3000 myapp
# Host port 8080 → Container port 3000

docker run -p 127.0.0.1:8080:3000 myapp
# Only accessible from localhost (not from external network)
\`\`\`

**DNS resolution inside containers**:
\`\`\`bash
# Inside a container on a custom bridge network:
nslookup db           # resolves to the db container's IP
ping redis            # resolves to the redis container's IP
curl http://api:3000  # HTTP request to the api container
\`\`\`

**Inspecting networks**:
\`\`\`bash
docker network ls                       # List networks
docker network inspect mynet            # Show connected containers, IPs
docker inspect app1 --format '{{.NetworkSettings.Networks}}'
\`\`\`

**Multi-network isolation**:
\`\`\`yaml
# Frontend can talk to API, but NOT directly to DB
services:
  frontend:
    networks: [frontend]
  api:
    networks: [frontend, backend]
  db:
    networks: [backend]

networks:
  frontend:
  backend:
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 5. Dockerfile Best Practices
  {
    title: "What are the key Dockerfile best practices for production?",
    content:
      "How do you write efficient, secure, and cacheable Dockerfiles? Cover layer ordering, security, and common mistakes.",
    answer: `**1. Order instructions for cache efficiency**:
\`\`\`dockerfile
# BAD: Any source change invalidates npm install cache
COPY . .
RUN npm install

# GOOD: Only re-install if package.json changes
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
\`\`\`

**2. Use .dockerignore**:
\`\`\`
# .dockerignore
node_modules
.git
.env
*.md
dist
coverage
.next
\`\`\`

**3. Run as non-root user**:
\`\`\`dockerfile
RUN addgroup -g 1001 -S appgroup && \\
    adduser -S appuser -u 1001 -G appgroup
USER appuser
# Never run production containers as root
\`\`\`

**4. Use specific image tags**:
\`\`\`dockerfile
# BAD:
FROM node:latest

# GOOD:
FROM node:20.11.0-alpine3.19
\`\`\`

**5. Minimize layers**:
\`\`\`dockerfile
# BAD: 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# GOOD: 1 layer + cleanup in same layer
RUN apt-get update && \\
    apt-get install -y --no-install-recommends curl && \\
    rm -rf /var/lib/apt/lists/*
\`\`\`

**6. Use HEALTHCHECK**:
\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
\`\`\`

**7. Handle signals for graceful shutdown**:
\`\`\`dockerfile
# Use exec form (not shell form) so signals reach the process
CMD ["node", "dist/main.js"]      # GOOD: node receives SIGTERM

# BAD: shell form — node doesn't receive SIGTERM
CMD node dist/main.js
\`\`\`

**8. Don't store secrets in images**:
\`\`\`dockerfile
# BAD: Secret baked into image layer (visible with docker history)
RUN echo "DB_PASSWORD=secret" > .env

# GOOD: Pass at runtime
# docker run -e DB_PASSWORD=secret myapp
# Or use Docker secrets / external secret manager
\`\`\`

**9. Use COPY, not ADD**:
\`\`\`dockerfile
# ADD has extra features (URL download, tar extraction) — usually unnecessary
COPY package.json ./    # Preferred — explicit and simple
\`\`\`

**10. Label images for metadata**:
\`\`\`dockerfile
LABEL org.opencontainers.image.source="https://github.com/org/repo"
LABEL org.opencontainers.image.version="1.2.3"
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 6. CI/CD Pipeline Design
  {
    title: "How do you design a CI/CD pipeline for a web application?",
    content:
      "Describe the stages of a typical CI/CD pipeline, from code push to production deployment. What tools and practices should you use?",
    answer: `**Typical pipeline stages**:
\`\`\`
Code Push → Lint → Test → Build → Security Scan → Deploy Staging → E2E Tests → Deploy Production
\`\`\`

**GitHub Actions example**:
\`\`\`yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test -- --coverage
      - run: pnpm build

      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  security:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm audit --production
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"

  deploy-staging:
    needs: [lint-and-test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
      - run: ./scripts/deploy.sh staging

  e2e-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm playwright test --project=staging

  deploy-production:
    needs: e2e-tests
    runs-on: ubuntu-latest
    environment: production  # requires manual approval
    steps:
      - uses: actions/download-artifact@v4
      - run: ./scripts/deploy.sh production
\`\`\`

**Key CI/CD practices**:

| Practice | Why |
|----------|-----|
| Run tests in parallel | Faster feedback |
| Cache dependencies | pnpm store, Docker layers |
| Fail fast | Lint before tests, unit before E2E |
| Environment protection | Manual approval for production |
| Immutable artifacts | Build once, deploy same artifact everywhere |
| Rollback strategy | Keep previous deployment ready |

**Branch strategy**:
- **Trunk-based**: Everyone merges to main, feature flags for WIP. Best for CI/CD.
- **Git Flow**: develop → feature → release → main. More process, slower.
- **GitHub Flow**: main + short-lived feature branches. Simple and effective.

**Environment promotion**:
\`\`\`
Build artifact → staging (auto) → production (manual approval)
Same Docker image promoted through environments — only env vars change.
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 7. Deployment Strategies
  {
    title: "Explain blue-green, canary, and rolling deployment strategies",
    content:
      "What are the trade-offs of each deployment strategy? How do you implement zero-downtime deployments?",
    answer: `**Rolling Deployment** — gradual replacement:
\`\`\`
Start:  [v1] [v1] [v1] [v1]
Step 1: [v2] [v1] [v1] [v1]    ← replace one at a time
Step 2: [v2] [v2] [v1] [v1]
Step 3: [v2] [v2] [v2] [v1]
Done:   [v2] [v2] [v2] [v2]
\`\`\`
**Pros**: No extra infrastructure, gradual. **Cons**: Mixed versions during rollout, slow rollback (must re-roll).

**Blue-Green Deployment** — two identical environments:
\`\`\`
Blue (current):  [v1] [v1] [v1]  ← currently receiving traffic
Green (new):     [v2] [v2] [v2]  ← deployed, tested, ready

Switch: Load balancer flips traffic from Blue → Green instantly
Rollback: Flip back to Blue
\`\`\`
**Pros**: Instant switch, instant rollback, full testing before live. **Cons**: Double infrastructure cost.

**Canary Deployment** — gradual traffic shift:
\`\`\`
Step 1:  [v1 v1 v1 v1] 95% traffic → v1
         [v2]           5% traffic → v2    ← canary

Step 2:  [v1 v1 v1]    75% → v1
         [v2 v2]        25% → v2           ← looking good

Step 3:  [v2 v2 v2 v2] 100% → v2          ← full rollout
\`\`\`
**Pros**: Real traffic testing, detect issues early with minimal impact. **Cons**: Complex routing, mixed versions, need good observability.

**Comparison**:

| Strategy | Downtime | Rollback Speed | Cost | Complexity |
|----------|----------|---------------|------|------------|
| Rolling | None | Slow (re-roll) | Low | Low |
| Blue-Green | None | Instant (flip) | High (2x) | Medium |
| Canary | None | Fast (route away) | Medium | High |

**Zero-downtime deployment checklist**:
1. Health checks — new instance must pass before receiving traffic
2. Graceful shutdown — drain connections on SIGTERM
3. DB migrations — must be backwards-compatible (expand-contract pattern)
4. Session handling — externalize sessions (Redis), don't store on server
5. Backward-compatible APIs — old and new versions coexist during rollout

**Database migration strategy** (expand-contract):
\`\`\`
Phase 1 (expand): ADD new column, keep old column
Phase 2 (migrate): Deploy code that writes to both columns
Phase 3 (contract): Remove old column after all instances updated
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 8. Docker Volumes and Data Persistence
  {
    title: "How do Docker volumes work and what are the different types?",
    content:
      "Explain named volumes, bind mounts, and tmpfs. When should you use each? How do you handle data persistence in containers?",
    answer: `**Three types of storage**:

**1. Named volumes** — managed by Docker, persistent:
\`\`\`bash
# Create and use
docker volume create mydata
docker run -v mydata:/var/lib/postgresql/data postgres:16

# Or inline (auto-created)
docker run -v postgres_data:/var/lib/postgresql/data postgres:16
\`\`\`
\`\`\`yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:   # Named volume — survives container removal
\`\`\`
**Use for**: Database data, file uploads, anything that must persist.

**2. Bind mounts** — maps host directory into container:
\`\`\`bash
docker run -v /host/path:/container/path myapp
docker run -v $(pwd)/src:/app/src myapp    # Current directory
\`\`\`
\`\`\`yaml
services:
  app:
    volumes:
      - ./src:/app/src          # Live code reload during development
      - /app/node_modules       # Exclude: use container's node_modules
\`\`\`
**Use for**: Development (hot reload), config files, sharing files between host and container.

**3. tmpfs** — temporary, in-memory only:
\`\`\`bash
docker run --tmpfs /tmp myapp
\`\`\`
\`\`\`yaml
services:
  app:
    tmpfs:
      - /tmp
      - /app/cache
\`\`\`
**Use for**: Secrets that shouldn't touch disk, temp files, caches.

**Comparison**:

| Type | Persists? | Performance | Host Access | Use Case |
|------|-----------|-------------|-------------|----------|
| Named volume | Yes | Good | Via docker volume | DB data, uploads |
| Bind mount | Yes (on host) | Good | Direct | Dev hot reload |
| tmpfs | No (memory) | Fastest | No | Secrets, temp |

**Managing volumes**:
\`\`\`bash
docker volume ls                  # List all volumes
docker volume inspect mydata      # Show details (mount point)
docker volume rm mydata           # Delete
docker volume prune               # Remove unused volumes

# Backup a volume
docker run --rm -v mydata:/data -v $(pwd):/backup alpine \\
  tar czf /backup/mydata-backup.tar.gz -C /data .

# Restore
docker run --rm -v mydata:/data -v $(pwd):/backup alpine \\
  tar xzf /backup/mydata-backup.tar.gz -C /data
\`\`\`

**Common pitfall — node_modules in bind mounts**:
\`\`\`yaml
volumes:
  - .:/app              # Bind mount entire project
  - /app/node_modules   # Anonymous volume — prevents host node_modules from overriding container's
\`\`\`
Without the anonymous volume, the host's \`node_modules\` (possibly built for macOS) would override the container's (built for Linux).`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 9. Container Security
  {
    title: "What are the key security practices for Docker containers?",
    content:
      "How do you secure Docker images and containers in production? Cover image scanning, runtime security, and secret management.",
    answer: `**1. Use minimal base images**:
\`\`\`dockerfile
# Distroless (Google): no shell, no package manager — smallest attack surface
FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app/dist /app
CMD ["app/main.js"]

# Alpine: small (~5MB) but has shell/apk
FROM node:20-alpine

# Compare sizes:
# node:20         ~1.1GB
# node:20-slim    ~250MB
# node:20-alpine  ~180MB
# distroless      ~120MB
\`\`\`

**2. Scan images for vulnerabilities**:
\`\`\`bash
# Trivy (most popular)
trivy image myapp:latest

# Docker Scout (built into Docker Desktop)
docker scout quickview myapp:latest

# In CI/CD pipeline:
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:latest
    severity: "CRITICAL,HIGH"
    exit-code: "1"             # Fail the build on critical/high CVEs
\`\`\`

**3. Run as non-root**:
\`\`\`dockerfile
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
USER app
\`\`\`

**4. Read-only filesystem**:
\`\`\`bash
docker run --read-only --tmpfs /tmp myapp
# Container can't write to filesystem except /tmp
\`\`\`

**5. Drop capabilities**:
\`\`\`bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
# Only allow binding to ports < 1024
\`\`\`

**6. Secret management**:
\`\`\`bash
# BAD: Environment variables (visible in docker inspect)
docker run -e DB_PASSWORD=secret myapp

# BETTER: Docker secrets (Swarm) or mounted files
docker secret create db_password ./secret.txt
docker service create --secret db_password myapp

# BEST: External secret manager
# AWS Secrets Manager, HashiCorp Vault, Doppler
# App fetches secrets at runtime, not stored in container
\`\`\`

**7. Don't run privileged containers**:
\`\`\`bash
# NEVER in production:
docker run --privileged myapp   # Full host access!

# Use seccomp/AppArmor profiles instead
docker run --security-opt seccomp=profile.json myapp
\`\`\`

**8. Pin dependencies in Dockerfile**:
\`\`\`dockerfile
# Pin base image digest (immutable reference)
FROM node:20.11.0-alpine3.19@sha256:abcdef1234...

# Pin system packages
RUN apk add --no-cache curl=8.5.0-r0
\`\`\`

**9. Limit resources**:
\`\`\`bash
docker run --memory=512m --cpus=1.0 myapp
# Prevents a single container from consuming all host resources
\`\`\`

**Security checklist**:
- [ ] Minimal base image (alpine/distroless)
- [ ] Non-root user
- [ ] Image scanning in CI
- [ ] No secrets in image layers
- [ ] Read-only filesystem where possible
- [ ] Resource limits
- [ ] Drop unnecessary capabilities
- [ ] Pin image versions`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 10. Environment Variables and Configuration
  {
    title: "How do you manage environment variables and configuration across environments?",
    content:
      "Explain the patterns for managing configuration in development, staging, and production. How do you handle secrets vs non-secret config?",
    answer: `**12-Factor App principle**: Store config in environment variables, not in code.

**Configuration hierarchy** (most specific wins):
\`\`\`
1. Runtime env vars (docker run -e, K8s ConfigMap/Secret)
2. .env.production / .env.staging files
3. .env.local (git-ignored, developer overrides)
4. .env (defaults, committed to repo)
5. Application defaults in code
\`\`\`

**Local development**:
\`\`\`bash
# .env (committed — safe defaults, no secrets)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug

# .env.local (git-ignored — developer overrides and local secrets)
DB_PASSWORD=my_local_password
OAUTH_CLIENT_SECRET=dev-secret
\`\`\`

**Docker Compose**:
\`\`\`yaml
services:
  app:
    env_file:
      - .env              # defaults
      - .env.local         # overrides (optional)
    environment:
      - DB_HOST=postgres   # highest priority — override for container networking
\`\`\`

**Production (Kubernetes)**:
\`\`\`yaml
# ConfigMap for non-secret config
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DB_HOST: "postgres-primary.db.svc.cluster.local"
  LOG_LEVEL: "info"
  NODE_ENV: "production"

# Secret for sensitive values
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DB_PASSWORD: "super-secret"
  SESSION_SECRET: "another-secret"
\`\`\`

**Validation at startup** (fail fast):
\`\`\`typescript
// NestJS ConfigModule with Joi validation
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_PASSWORD: Joi.string().required(),
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
        LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
      }),
      validationOptions: { abortEarly: true },
    }),
  ],
})
export class AppModule {}
// App crashes immediately if required vars are missing — don't discover at runtime
\`\`\`

**Secret management in production**:

| Approach | Security | Complexity |
|----------|----------|------------|
| .env files | Low | Low |
| CI/CD secrets (GitHub Actions) | Medium | Low |
| K8s Secrets (base64, not encrypted) | Medium | Medium |
| External Secrets Operator + Vault | High | High |
| AWS Secrets Manager / GCP Secret Manager | High | Medium |

**Best practice**: Non-secrets in ConfigMap/.env (committed). Secrets in a secret manager, injected at runtime. Never commit secrets to git.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 11. Container Orchestration Basics
  {
    title: "What problems does Kubernetes solve and when do you need it?",
    content:
      "Explain the core Kubernetes concepts (Pods, Deployments, Services) and when a team should adopt K8s vs simpler alternatives.",
    answer: `**What Kubernetes solves**:
- Automated container deployment and scaling
- Self-healing (restart failed containers)
- Service discovery and load balancing
- Rolling updates and rollbacks
- Secret and config management
- Resource management (CPU/memory limits)

**Core concepts**:

**Pod**: Smallest deployable unit — one or more containers sharing network/storage.
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: app
      image: myapp:1.2.3
      ports:
        - containerPort: 3000
\`\`\`

**Deployment**: Manages ReplicaSets of Pods. Handles scaling and rolling updates.
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3                    # Run 3 instances
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1               # 1 extra pod during update
      maxUnavailable: 0         # Never go below 3 ready pods
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: myapp:1.2.3
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits: { cpu: "500m", memory: "512Mi" }
          livenessProbe:
            httpGet: { path: /health/live, port: 3000 }
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
\`\`\`

**Service**: Stable network endpoint for a set of Pods.
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP   # Internal only. Use LoadBalancer for external.
\`\`\`

**When you DON'T need Kubernetes**:

| Situation | Better Alternative |
|-----------|-------------------|
| Small team (< 5 devs) | Docker Compose + single server |
| 1–3 services | Railway, Render, Fly.io |
| Serverless workload | AWS Lambda, Vercel |
| Low traffic, budget-conscious | VPS + Docker Compose |

**When you DO need Kubernetes**:
- 10+ microservices
- Auto-scaling based on load
- Multi-region deployment
- Strict availability requirements (99.99%+)
- Large team needing self-service deployment

**Simpler alternatives to self-managed K8s**:
- **Managed K8s**: EKS, GKE, AKS — no control plane management
- **PaaS**: Railway, Render, Fly.io — container deployment without K8s complexity
- **Docker Compose + Watchtower** — for single-server deployments with auto-updates`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 12. Logging in Containers
  {
    title: "How should you handle logging in Docker containers?",
    content:
      "Explain container logging best practices, log drivers, and centralized log aggregation.",
    answer: `**Rule #1**: Write logs to stdout/stderr — let Docker/K8s handle the rest.

\`\`\`typescript
// GOOD: stdout/stderr (Docker captures these automatically)
console.log(JSON.stringify({ level: 'info', message: 'Request received', requestId: '123' }));
console.error(JSON.stringify({ level: 'error', message: 'DB connection failed' }));

// BAD: Writing to files inside container
fs.writeFileSync('/var/log/app.log', message);
// Files are lost when container dies, can fill up disk
\`\`\`

**Why stdout?**
- Docker captures stdout/stderr via logging drivers
- \`docker logs <container>\` works out of the box
- Kubernetes collects from stdout and ships to centralized logging
- No file rotation needed
- Works with any log aggregation tool

**Docker log drivers**:
\`\`\`bash
# Default: json-file
docker run --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 myapp

# View logs
docker logs myapp
docker logs --tail 100 -f myapp
\`\`\`

**Structured JSON logging** (with pino):
\`\`\`typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info({ requestId: ctx.requestId, userId: ctx.userId, duration: 45 }, 'Request completed');
// {"level":"info","requestId":"abc-123","userId":"user-1","duration":45,"msg":"Request completed","time":1709000000}
\`\`\`

**Centralized log aggregation**:
\`\`\`
Containers (stdout) → Log collector → Central storage → Dashboard

Option A: ELK Stack
  Containers → Filebeat/Fluentd → Logstash → Elasticsearch → Kibana

Option B: Grafana Stack
  Containers → Promtail → Loki → Grafana

Option C: Managed
  Containers → CloudWatch / Datadog / New Relic
\`\`\`

**Kubernetes logging**:
\`\`\`yaml
# Fluentd DaemonSet collects from all node logs
# /var/log/containers/*.log → Fluentd → Elasticsearch/Loki/CloudWatch
\`\`\`

**Log levels**:
- **error**: Unexpected failures that need attention
- **warn**: Degraded but still functional
- **info**: Normal operations (request received, job completed)
- **debug**: Detailed debugging info (only in dev)

**Best practices**:
- Always use structured JSON (parseable by machines)
- Include request/trace IDs in every log line
- Set LOG_LEVEL via env var (info in prod, debug in dev)
- Don't log sensitive data (passwords, tokens, PII)
- Set max-size + max-file to prevent disk fill`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 13. Docker Health Checks
  {
    title: "How do you implement health checks for Docker containers?",
    content:
      "Explain Docker HEALTHCHECK, liveness vs readiness probes, and how orchestrators use health checks for service management.",
    answer: `**Docker HEALTHCHECK** in Dockerfile:
\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
\`\`\`

**Parameters**:
- \`interval\`: Time between checks (default 30s)
- \`timeout\`: Max time for check to complete (default 30s)
- \`start-period\`: Grace period for container startup (default 0s)
- \`retries\`: Consecutive failures before "unhealthy" (default 3)

**Container states**: starting → healthy → unhealthy

**Application health endpoint**:
\`\`\`typescript
// Basic health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Detailed health check (NestJS with Terminus)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  // Liveness: is the process alive?
  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Readiness: can it serve traffic?
  @Get('ready')
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.redis.pingCheck('redis', { timeout: 1000 }),
    ]);
  }
}
\`\`\`

**Kubernetes probes**:
\`\`\`yaml
containers:
  - name: app
    # Liveness: if this fails, K8s restarts the pod
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 15
      periodSeconds: 30
      failureThreshold: 3

    # Readiness: if this fails, K8s removes pod from service endpoints
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3

    # Startup: delays liveness/readiness until app is started
    startupProbe:
      httpGet:
        path: /health/live
        port: 3000
      failureThreshold: 30
      periodSeconds: 5          # Up to 150s to start
\`\`\`

**Docker Compose health checks**:
\`\`\`yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    depends_on:
      db:
        condition: service_healthy   # Wait for DB to be healthy
\`\`\`

**Common mistake**: Making health checks too heavy (querying tables, external APIs). Keep them lightweight — a DB ping, not a full query.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 14. Infrastructure as Code
  {
    title: "What is Infrastructure as Code (IaC) and why is it important?",
    content:
      "Explain the concept of IaC, compare Terraform vs Pulumi vs CloudFormation, and describe the benefits for team collaboration.",
    answer: `**Infrastructure as Code**: Define and manage infrastructure through configuration files instead of manual UI/CLI operations.

**Without IaC**: Click through AWS console, document steps in wiki (undocumented drift, unrepeatable, error-prone).

**With IaC**: Infrastructure is versioned, reviewed, tested, and reproducible.

**Terraform example**:
\`\`\`hcl
# main.tf — Provision a PostgreSQL RDS instance
provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "postgres" {
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  db_name              = "myapp"
  username             = "admin"
  password             = var.db_password    # from secrets
  skip_final_snapshot  = false

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
\`\`\`

**Workflow**:
\`\`\`bash
terraform init      # Download providers
terraform plan      # Preview changes (dry run)
terraform apply     # Apply changes
terraform destroy   # Tear down everything
\`\`\`

**Comparison**:

| Feature | Terraform | Pulumi | CloudFormation |
|---------|-----------|--------|---------------|
| Language | HCL | TypeScript/Python/Go | JSON/YAML |
| Multi-cloud | Yes | Yes | AWS only |
| State mgmt | Remote backend (S3) | Pulumi Cloud | AWS-managed |
| Learning curve | Medium (HCL) | Low (familiar languages) | High (verbose YAML) |
| Community | Largest | Growing | AWS-only |

**Benefits of IaC**:
- **Version control**: Review infra changes in PRs, just like code
- **Reproducibility**: Spin up identical environments (staging = production clone)
- **Disaster recovery**: Rebuild entire infrastructure from code
- **Documentation**: Code IS the documentation of what exists
- **Collaboration**: Teams review and approve infra changes

**State management**:
\`\`\`hcl
# Store Terraform state remotely (don't commit terraform.tfstate!)
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"    # Locking
    encrypt        = true
  }
}
\`\`\`

**IaC in CI/CD**:
\`\`\`
PR opened → terraform plan (comment on PR with changes)
PR merged → terraform apply (auto-deploy infra changes)
\`\`\`

**When to start with IaC**: Day 1 if possible. The longer you wait, the harder it is to import existing resources.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 15. Container Resource Management
  {
    title: "How do you set resource limits for Docker containers and why is it important?",
    content:
      "Explain CPU and memory limits, what happens when limits are exceeded, and how to right-size container resources.",
    answer: `**Why resource limits?**
Without limits, a single container can consume all host resources — starving other containers.

**Memory limits**:
\`\`\`bash
docker run --memory=512m --memory-swap=1g myapp
# --memory: hard limit on RAM
# --memory-swap: RAM + swap combined
# If container exceeds memory limit → OOMKilled (container crashes)
\`\`\`

**CPU limits**:
\`\`\`bash
docker run --cpus=1.5 myapp           # Can use 1.5 CPU cores max
docker run --cpu-shares=512 myapp     # Relative weight (default 1024)
\`\`\`

**Docker Compose**:
\`\`\`yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:        # guaranteed minimum
          cpus: "0.25"
          memory: 256M
\`\`\`

**Kubernetes resources**:
\`\`\`yaml
containers:
  - name: app
    resources:
      requests:              # Scheduling guarantee (K8s reserves this)
        cpu: "250m"          # 250 millicores = 0.25 CPU
        memory: "256Mi"
      limits:                # Hard ceiling
        cpu: "1000m"         # 1 full CPU core
        memory: "512Mi"      # OOMKilled if exceeded
\`\`\`

**What happens when limits are exceeded**:
- **Memory > limit**: Container is OOMKilled (exit code 137)
- **CPU > limit**: Container is throttled (slowed down, not killed)

**Node.js memory considerations**:
\`\`\`dockerfile
# Set Node.js heap size to match container memory limit
ENV NODE_OPTIONS="--max-old-space-size=384"
# Rule: set to ~75% of container memory limit
# Container: 512MB → Node heap: 384MB (leaves room for overhead)
\`\`\`

**Right-sizing resources**:
\`\`\`bash
# Monitor actual usage
docker stats                # Live CPU/memory/network per container

# Kubernetes
kubectl top pods            # Current CPU/memory usage
# Use Grafana + Prometheus for historical data
\`\`\`

**Sizing guidelines**:
1. Start with generous limits during development
2. Monitor actual usage under realistic load
3. Set requests = average usage
4. Set limits = peak usage + 25% headroom
5. Watch for OOMKilled events in logs

**Common mistake**: Setting memory limit too close to actual usage. GC pauses, traffic spikes, or memory fragmentation can push usage over the limit → random OOMKills.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 16. Monitoring and Alerting
  {
    title: "How do you set up monitoring and alerting for a production application?",
    content:
      "What metrics should you monitor? How do you set up alerts that are actionable and not noisy?",
    answer: `**The Four Golden Signals** (from Google SRE):
1. **Latency**: How long requests take (p50, p95, p99)
2. **Traffic**: Requests per second
3. **Errors**: Error rate (5xx / total requests)
4. **Saturation**: How full your resources are (CPU, memory, disk, connections)

**Metrics stack**: Prometheus (collect) + Grafana (visualize + alert)

**Application metrics** (prom-client for Node.js):
\`\`\`typescript
import { Counter, Histogram, Gauge } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});
\`\`\`

**Infrastructure metrics**:
- CPU usage per container/pod
- Memory usage and OOMKills
- Disk I/O and usage
- Network traffic
- Database connections (active, idle, waiting)
- Queue depth and processing rate

**Alerting rules** (actionable, not noisy):
\`\`\`yaml
# Prometheus alerting rules
groups:
  - name: app-alerts
    rules:
      # Error rate > 1% for 5 minutes
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical

      # P99 latency > 2 seconds for 10 minutes
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning

      # Pod restarting (OOMKilled, CrashLoopBackOff)
      - alert: PodRestarting
        expr: increase(kube_pod_container_status_restarts_total[1h]) > 3
        labels:
          severity: critical
\`\`\`

**Alert best practices**:
- **Every alert must be actionable**: If you can't do anything about it, it's not an alert
- **Use \`for\` duration**: Avoid alerting on transient spikes (require sustained problem)
- **Severity levels**: Critical (page someone), Warning (Slack notification), Info (dashboard only)
- **Alert on symptoms, not causes**: "High error rate" (symptom), not "DB CPU high" (cause)
- **Runbooks**: Link each alert to a runbook describing investigation steps

**Dashboard essentials**:
1. **Overview**: Request rate, error rate, p99 latency — "Are we healthy?"
2. **Infrastructure**: CPU, memory, disk per service
3. **Database**: Query time, connection pool, slow queries
4. **Queues**: Depth, processing rate, DLQ size
5. **Business**: Signups, orders, payments — "Is the business running?"`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 17. Git Branching and Workflow
  {
    title: "Explain Git branching strategies: trunk-based development vs Git Flow",
    content:
      "Compare trunk-based development, GitHub Flow, and Git Flow. Which strategy works best with CI/CD?",
    answer: `**Trunk-Based Development**:
\`\`\`
main ───●───●───●───●───●───●─── (always deployable)
         \\─●─/  \\─●─/  \\─●─/
          short-lived feature branches (< 1 day)
\`\`\`
- Everyone merges to \`main\` frequently (at least daily)
- Feature flags for work-in-progress features
- \`main\` is always deployable

**Pros**: Fast feedback, minimal merge conflicts, natural CI/CD fit.
**Cons**: Requires discipline, needs feature flags, risky for less experienced teams.

**GitHub Flow** (simplified):
\`\`\`
main ───●───────────●───────────●───
         \\─●─●─●─/ PR \\─●─●─/ PR
          feature/login   feature/search
\`\`\`
- \`main\` is deployable
- Feature branches from main → PR → merge to main
- Branches can live longer (days), but still short-lived

**Pros**: Simple, PR-based reviews, works for most teams.
**Cons**: Long-lived branches can cause merge conflicts.

**Git Flow** (traditional):
\`\`\`
main    ───●─────────────────────────●─── (releases only)
           │                          │
develop ───●───●───●───●───●───●──────●───
                \\─●─●─/      \\─●─/
               feature/x    feature/y
                                  \\── release/1.2 ──/
\`\`\`
- \`main\`: production releases
- \`develop\`: integration branch
- \`feature/*\`: branch from develop
- \`release/*\`: prepare release, merge to main + develop
- \`hotfix/*\`: patch main directly

**Pros**: Clear release process, separate dev/prod tracks.
**Cons**: Complex, slow, many long-lived branches, merge hell.

**Comparison**:

| Criteria | Trunk-Based | GitHub Flow | Git Flow |
|----------|------------|-------------|----------|
| CI/CD fit | Best | Good | Poor |
| Release cadence | Continuous | Continuous | Scheduled |
| Team size | Any | Small-Medium | Large |
| Merge conflicts | Minimal | Low | High |
| Complexity | Low | Low | High |
| Feature flags needed | Yes | Optional | No |

**Recommendation**:
- **Startup / small team**: Trunk-based or GitHub Flow
- **Large team, scheduled releases**: Git Flow (but consider moving away)
- **CI/CD-first**: Trunk-based development (industry trending this way)

**Convention**: Use conventional commits for automatic changelogs:
\`\`\`
feat: add user authentication
fix: resolve race condition in payment processing
docs: update API documentation
refactor: extract validation logic to shared module
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 18. SSL/TLS and HTTPS
  {
    title: "How does HTTPS/TLS work and how do you set it up for a web application?",
    content:
      "Explain the TLS handshake, certificate management, and practical setup patterns (Let's Encrypt, reverse proxy SSL termination).",
    answer: `**TLS Handshake** (simplified):
\`\`\`
1. Client → Server: "Hello, I support TLS 1.3, these cipher suites"
2. Server → Client: "Let's use TLS 1.3 + this cipher. Here's my certificate."
3. Client: Verifies certificate against trusted CAs
4. Client + Server: Key exchange (Diffie-Hellman) → shared secret
5. Both: Encrypt all subsequent traffic with shared symmetric key
\`\`\`

**Certificate types**:
- **DV (Domain Validation)**: Proves you own the domain. Free (Let's Encrypt). Most common.
- **OV (Organization Validation)**: Proves organization identity. Paid.
- **EV (Extended Validation)**: Highest trust. Company name in browser. Expensive.

**Let's Encrypt** (free, automated):
\`\`\`bash
# Using certbot
certbot certonly --webroot -w /var/www/html -d example.com -d www.example.com

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet
\`\`\`

**Nginx SSL termination** (most common pattern):
\`\`\`nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;  # Redirect HTTP → HTTPS
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;

    # HSTS: force HTTPS for 1 year
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://app:3000;          # Reverse proxy to app (HTTP internally)
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
\`\`\`

**Docker with Traefik** (automatic Let's Encrypt):
\`\`\`yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entryPoints.web.address=:80"
      - "--entryPoints.websecure.address=:443"
      - "--certificatesResolvers.le.acme.email=admin@example.com"
      - "--certificatesResolvers.le.acme.storage=/certs/acme.json"
      - "--certificatesResolvers.le.acme.httpChallenge.entryPoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - certs:/certs

  app:
    image: myapp
    labels:
      - "traefik.http.routers.app.rule=Host(\`example.com\`)"
      - "traefik.http.routers.app.tls.certresolver=le"
\`\`\`

**Architecture**:
\`\`\`
Client ──HTTPS──→ [Load Balancer / Nginx / Traefik] ──HTTP──→ [App containers]
                   SSL terminated here                Internal network (trusted)
\`\`\`

**Security headers** (in addition to HTTPS):
\`\`\`
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 19. Docker Debugging
  {
    title: "How do you debug issues in Docker containers?",
    content:
      "What tools and techniques do you use to debug container crashes, networking issues, and performance problems?",
    answer: `**Container won't start / crashes immediately**:
\`\`\`bash
# Check logs (even for crashed containers)
docker logs myapp
docker logs --tail 50 myapp

# Check exit code
docker inspect myapp --format '{{.State.ExitCode}}'
# Exit 0: normal shutdown
# Exit 1: application error
# Exit 137: OOMKilled (out of memory)
# Exit 139: Segfault
# Exit 143: SIGTERM (graceful shutdown)

# Run interactively to debug
docker run -it --entrypoint sh myapp:latest
# Now you're inside the container — check files, env, etc.
\`\`\`

**Inspect running container**:
\`\`\`bash
# Shell into running container
docker exec -it myapp sh

# Check processes
docker exec myapp ps aux

# Check environment variables
docker exec myapp env

# Check filesystem
docker exec myapp ls -la /app

# Real-time resource usage
docker stats myapp
\`\`\`

**Networking issues**:
\`\`\`bash
# Check container IP and networks
docker inspect myapp --format '{{.NetworkSettings.Networks}}'

# Test connectivity from inside container
docker exec myapp ping db
docker exec myapp wget -qO- http://api:3000/health
docker exec myapp nslookup redis

# Check port mappings
docker port myapp

# Check if port is actually listening inside container
docker exec myapp netstat -tlnp
\`\`\`

**Image debugging**:
\`\`\`bash
# Analyze image layers and wasted space
dive myapp:latest

# Check image history (what was built)
docker history myapp:latest

# Build with verbose output
docker build --progress=plain --no-cache -t myapp .
\`\`\`

**Common issues and fixes**:

| Problem | Likely Cause | Debug Command |
|---------|-------------|---------------|
| Container exits immediately | CMD fails, missing env var | \`docker logs\` |
| OOMKilled (exit 137) | Memory limit too low | \`docker stats\`, increase limit |
| Can't connect to other container | Wrong network, wrong hostname | \`docker network inspect\` |
| "EACCES permission denied" | Running as non-root, file owned by root | Check USER + file permissions |
| Build fails at COPY | .dockerignore missing, wrong context | Check build context |
| "Cannot find module" | node_modules not installed in container | Check Dockerfile RUN npm ci |

**docker-compose specific**:
\`\`\`bash
# View all logs interleaved
docker compose logs -f

# Rebuild and restart one service
docker compose up -d --build app

# Check service health status
docker compose ps

# View events (start, stop, die, health_status)
docker compose events
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },

  // 20. Reverse Proxy Patterns
  {
    title: "What is a reverse proxy and how is it used in production?",
    content:
      "Explain the role of Nginx/Caddy/Traefik as a reverse proxy. What problems does it solve? How do you configure it for a typical web application?",
    answer: `**Reverse Proxy**: Sits between clients and backend servers, forwarding requests on behalf of clients.

\`\`\`
Client → [Reverse Proxy (Nginx)] → App Server 1 (port 3000)
                                 → App Server 2 (port 3001)
                                 → Static files (from disk/CDN)
\`\`\`

**Problems it solves**:
1. **SSL termination**: Handle HTTPS at proxy, HTTP internally
2. **Load balancing**: Distribute traffic across multiple app instances
3. **Static file serving**: Serve CSS/JS/images directly (faster than Node.js)
4. **Compression**: gzip/brotli responses at proxy level
5. **Caching**: Cache responses to reduce backend load
6. **Security**: Hide backend topology, add rate limiting, block bad requests
7. **Routing**: Route different paths to different services

**Nginx configuration** for a typical app:
\`\`\`nginx
upstream app_servers {
    server app1:3000;
    server app2:3000;
    # Load balancing: round-robin (default), least_conn, ip_hash
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    # Static files (served directly by Nginx — not proxied to app)
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API requests → proxied to app servers
    location /api/ {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    location /api/auth/ {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://app_servers;
    }
}
\`\`\`

**Caddy** (auto HTTPS, simpler config):
\`\`\`
example.com {
    reverse_proxy app:3000
    file_server /static/* {
        root /var/www
    }
    encode gzip
}
# That's it. Caddy handles Let's Encrypt automatically.
\`\`\`

**Traefik** (Docker-native, auto-discovery):
\`\`\`yaml
services:
  app:
    labels:
      - "traefik.http.routers.app.rule=Host(\`example.com\`) && PathPrefix(\`/api\`)"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
\`\`\`

**Comparison**:

| Feature | Nginx | Caddy | Traefik |
|---------|-------|-------|---------|
| Auto HTTPS | No (manual certbot) | Yes (built-in) | Yes (built-in) |
| Config | Files | Caddyfile | Labels/YAML |
| Docker integration | Manual | Good | Best (auto-discovery) |
| Performance | Fastest | Fast | Fast |
| Learning curve | Medium | Low | Medium |`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "docker-devops",
  },
];
