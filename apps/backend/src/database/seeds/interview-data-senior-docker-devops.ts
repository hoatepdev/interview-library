import { QuestionLevel } from '../../database/entities/question.entity';

export interface QuestionSeed {
  title: string;
  answer: string;
  topicSlug: string;
  level: QuestionLevel;
  difficultyScore: number;
  displayOrder: number;
}

interface SeniorAnswer {
  short_answer: string;
  detailed_answer: string;
  trade_offs: Array<{
    approach: string;
    pros: string[];
    cons: string[];
  }>;
  real_world_example: string;
  red_flags: string[];
  follow_up_questions: string[];
}

function buildAnswer(answer: SeniorAnswer): string {
  return JSON.stringify(answer);
}

export const seniorDockerDevopsQuestions: QuestionSeed[] = [
  {
    title:
      'Your Kubernetes cluster is experiencing cascading pod failures during peak traffic. Pods are being OOMKilled and the cluster autoscaler is not reacting fast enough. How do you stabilize the cluster?',
    answer: buildAnswer({
      short_answer:
        'Immediate: set VPA or manually tune resource requests/limits to match actual usage. Medium-term: configure HPA with appropriate metrics, pre-scale before known traffic spikes using KEDA or scheduled scaling, and tune cluster autoscaler with lower scale-up delay. Root fix: profile memory usage per pod and eliminate memory leaks.',
      detailed_answer:
        'OOMKill cascading failures happen when: (1) pods have incorrect memory limits, (2) a traffic spike increases per-pod memory, (3) pods die faster than autoscaler can add nodes.\n\nImmediate stabilization:\n1. Temporarily raise memory limits to buy time: `kubectl set resources deployment/api --limits=memory=2Gi`\n2. Check current actual usage: `kubectl top pods --sort-by=memory`\n3. Identify the trigger: was it a memory leak, an input spike, or a new deployment with higher baseline?\n\nRoot cause: OOMKill means `limit < actual_usage`. Check if limits are misconfigured or if there\'s a memory leak.\n\nMemory limit tuning:\n- Do NOT set limits equal to requests — this prevents bursting\n- Set `requests` = P50 usage (normal operation)\n- Set `limits` = P99 usage + 20% headroom\n- For Java/JVM apps: set `Xmx` = limit × 0.75 (JVM needs off-heap memory too)\n\nHPA configuration for latency-sensitive services:\n```yaml\napiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nspec:\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target:\n        type: Utilization\n        averageUtilization: 60  # Scale up at 60% — gives headroom\n  behavior:\n    scaleUp:\n      stabilizationWindowSeconds: 0  # Scale up immediately on traffic spike\n      policies:\n      - type: Percent\n        value: 100  # Double pods in 60s if needed\n        periodSeconds: 60\n    scaleDown:\n      stabilizationWindowSeconds: 300  # Wait 5min before scaling down\n```\n\nCluster autoscaler tuning:\n- `--scale-up-delay`: reduce from 10min to 2min for faster node addition\n- `--max-node-provision-time`: set realistic expectation (c5.2xlarge takes ~3min on AWS)\n- Use Karpenter instead of cluster-autoscaler for sub-30-second node provisioning\n\nPre-scaling for known spikes:\n```yaml\n# KEDA ScaledObject with cron trigger\ntriggers:\n- type: cron\n  metadata:\n    timezone: "Asia/Ho_Chi_Minh"\n    start: "55 8 * * 1-5"  # Scale up at 8:55am weekdays\n    end: "30 18 * * 1-5"  # Scale down at 6:30pm\n    desiredReplicas: "20"\n```\n\nFault tolerance: configure PodDisruptionBudget to ensure at least 70% of pods are always available during disruptions:\n```yaml\nspec:\n  minAvailable: "70%"\n```',
      trade_offs: [
        {
          approach: 'Vertical Pod Autoscaler (VPA)',
          pros: ['Automatically right-sizes requests/limits', 'No code changes', 'Handles memory leaks by detecting growth'],
          cons: [
            'Requires pod restart to apply changes — brief downtime',
            'Not compatible with HPA on same deployment (CPU/memory)',
            'Conservative — reacts slowly to sudden spikes',
          ],
        },
        {
          approach: 'HPA with custom metrics (request rate, queue depth)',
          pros: [
            'Scales before resource exhaustion',
            'Can predict scaling needs from traffic patterns',
            'Works with HPA without conflicts',
          ],
          cons: [
            'Requires custom metric pipeline (Prometheus Adapter)',
            'More complex to configure',
            'Metrics lag can still cause brief overload',
          ],
        },
        {
          approach: 'Karpenter for node provisioning',
          pros: [
            '30-60s node provisioning vs 3-5min for cluster-autoscaler',
            'Bin-packing aware — fewer wasted resources',
            'Consolidation mode reduces costs during low traffic',
          ],
          cons: [
            'AWS-specific (limited multi-cloud support)',
            'Newer tool — less battle-tested than cluster-autoscaler',
            'Requires IAM permissions that some orgs restrict',
          ],
        },
      ],
      real_world_example:
        'A gaming platform had daily traffic spikes at 8pm when their daily tournament started. Pods would OOMKill in the first 10 minutes as player sessions multiplied simultaneously. Investigation: Node.js process was caching game state per-session in-memory, growing to 500MB under load vs 80MB baseline. Fix: (1) moved session state to Redis, (2) set memory limit to 256Mi (real usage with Redis), (3) added KEDA cron trigger to pre-scale to 30 pods at 7:50pm. OOMKills eliminated.',
      red_flags: [
        'Setting `resources.limits == resources.requests` — prevents bursting, causes premature OOMKill',
        'HPA scaleDown stabilizationWindow set to 0 — causes rapid scale oscillation',
        'No PodDisruptionBudget — deployments or node drains can take down too many pods simultaneously',
        'Not monitoring OOMKill events — they\'re silent in most dashboards unless explicitly tracked',
        'Cluster autoscaler trying to scale down while HPA is trying to scale up — check `--skip-nodes-with-local-storage` and annotations',
      ],
      follow_up_questions: [
        'What is the difference between requests and limits in Kubernetes and why does it matter for scheduling?',
        'How does KEDA differ from HPA and when would you use each?',
        'What is the Node.js heap size limit and how do you configure it in a container?',
        'How do you implement a PodDisruptionBudget strategy for a stateless API?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'You need to build a CI/CD pipeline that can deploy 50 microservices with zero downtime, including database migrations, across 3 environments (dev/staging/prod). What does the pipeline look like?',
    answer: buildAnswer({
      short_answer:
        'Use a monorepo-aware pipeline (Nx, Turborepo, or affected detection) to build only changed services, promote immutable container images through environments (same image, different config), run migrations with expand-migrate-contract pattern, and deploy with Argo CD using progressive delivery (Flagger canary + automated rollback).',
      detailed_answer:
        'Key principles: build once (immutable images tagged by commit SHA), promote through environments, deploy declaratively.\n\nPipeline stages:\n\n**Stage 1: Affected detection (every PR)**\n```yaml\n# GitHub Actions\n- name: Detect affected services\n  run: |\n    AFFECTED=$(npx nx affected:apps --base=main --head=HEAD --plain)\n    echo "AFFECTED=$AFFECTED" >> $GITHUB_ENV\n```\n\n**Stage 2: Build & test affected services**\n- Parallel jobs per affected service\n- Docker build with layer caching (GitHub Actions cache or ECR layer cache)\n- Run unit tests, integration tests, security scan (Trivy)\n- Tag image: `ecr.region.amazonaws.com/service:${COMMIT_SHA}`\n\n**Stage 3: Deploy to dev (auto on PR merge)**\n```yaml\n# ArgoCD Application set or Helm values override\ngit push: values-dev.yaml\n  image:\n    tag: ${COMMIT_SHA}\n```\n\n**Stage 4: Deploy to staging (auto, after dev health checks pass)**\n- Run smoke tests against staging\n- Run database migration as Kubernetes Job (NOT as init container — too many pods run it simultaneously)\n\n```yaml\napiVersion: batch/v1\nkind: Job\nmetadata:\n  name: migration-${COMMIT_SHA}\nspec:\n  template:\n    spec:\n      containers:\n      - name: migrate\n        image: backend:${COMMIT_SHA}\n        command: ["node", "dist/database/migrations/run-migrations.js"]\n      restartPolicy: Never\n  backoffLimit: 3\n```\n\n**Stage 5: Deploy to prod (manual approval + canary)**\n```yaml\n# Flagger canary config\napiVersion: flagger.app/v1beta1\nkind: Canary\nspec:\n  analysis:\n    interval: 1m\n    threshold: 5  # Max 5 failed checks before rollback\n    maxWeight: 50  # Max 50% canary traffic\n    stepWeight: 10  # Increase 10% per interval\n    metrics:\n    - name: request-success-rate\n      thresholdRange:\n        min: 99  # Roll back if success rate < 99%\n    - name: request-duration\n      thresholdRange:\n        max: 500  # Roll back if P99 > 500ms\n```\n\n**Database migration strategy (expand-migrate-contract):**\n- Expand: add new column nullable (backward compatible)\n- Migrate: deploy code that writes to both old + new column\n- Contract: remove old column after all instances updated\n- Never: rename columns or change types in a single deployment\n\n**Rollback strategy:**\n- Flagger automatic rollback on metric breach\n- Git revert → automatic pipeline re-runs\n- Migrations: no destructive migrations in forward direction (never DROP, only ADD)\n- Emergency: `kubectl rollout undo deployment/service-name`',
      trade_offs: [
        {
          approach: 'Canary deployment with traffic splitting',
          pros: [
            'Real user traffic validation',
            'Automatic rollback on metric breach',
            'Gradual risk exposure',
          ],
          cons: [
            'Requires service mesh (Istio, Linkerd) or ingress support',
            'Complex to configure',
            'Canary and stable versions run simultaneously (DB schema must be compatible)',
          ],
        },
        {
          approach: 'Blue-green deployment',
          pros: ['Instant cutover', 'Easy rollback (switch back to blue)', 'No mixed versions'],
          cons: [
            '2× infrastructure cost during deployment',
            'Cannot gradually shift traffic',
            'DB migrations still need backward compatibility',
          ],
        },
        {
          approach: 'Rolling deployment (Kubernetes default)',
          pros: ['Built-in to Kubernetes', 'No extra tools', 'Works for most cases'],
          cons: [
            'No traffic-based validation',
            'Rollback is slower (must roll forward with reverted image)',
            'Multiple versions active simultaneously during rollout',
          ],
        },
      ],
      real_world_example:
        'A B2B SaaS with 40 microservices moved from a manual deployment process (3h release cycle) to a GitOps pipeline with Argo CD. Key challenges: (1) 3 services had circular dependencies requiring coordinated deploys — solved by grouping them into an ApplicationSet with sync waves. (2) A database column rename caused downtime — solved by mandating expand-contract pattern in PR review checklist. (3) A bad deploy caused 15% error rate — Flagger auto-rolled back in 4 minutes. Release cycle: 25 minutes end-to-end.',
      red_flags: [
        'Running migrations as init containers — 10 pods start simultaneously, all run migrations in parallel',
        'Using `latest` image tag in production — cannot know what is deployed',
        'No smoke tests after staging deployment — issues reach prod',
        'Blocking migrations (DROP COLUMN, RENAME) without expand-contract — guaranteed downtime',
        'Not separating deploy and release — deploying to prod without canary or feature flags',
      ],
      follow_up_questions: [
        'What is the difference between GitOps and traditional CI/CD push-based deployments?',
        'How do you manage secrets in a GitOps pipeline without committing them to git?',
        'When would you choose Argo Rollouts over Flagger for progressive delivery?',
        'How do you coordinate database migrations across multiple application replicas?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A Docker image build pipeline is taking 25 minutes per service, blocking developer productivity. How do you optimize it to under 5 minutes?',
    answer: buildAnswer({
      short_answer:
        'Optimize layer caching (copy package.json before source code, use BuildKit cache mounts for node_modules), use multi-stage builds to minimize final image size, parallelize builds across services, and use registry-level layer caching with `--cache-from` to reuse layers across CI runs.',
      detailed_answer:
        'A 25-minute Docker build is almost always a cache miss problem. With correct caching, most builds should be 1-3 minutes.\n\nLayer cache optimization (most impactful):\n```dockerfile\n# ❌ BAD: every code change invalidates node_modules install\nCOPY . .\nRUN npm install\n\n# ✅ GOOD: package files rarely change — cache layer reused\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile\nCOPY . .  # Only this layer misses on code changes\nRUN pnpm build\n```\n\nBuildKit cache mounts (most powerful for monorepos):\n```dockerfile\n# syntax=docker/dockerfile:1\nRUN --mount=type=cache,target=/root/.pnpm-store \\\n    pnpm install --frozen-lockfile\n```\nThis keeps the pnpm store persistent across builds — even cache misses only download changed packages.\n\nMulti-stage build for production image:\n```dockerfile\n# Stage 1: Install all deps + build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN --mount=type=cache,target=/root/.pnpm-store pnpm install\nCOPY . .\nRUN pnpm build\n\n# Stage 2: Production image (no dev deps, no build tools)\nFROM node:20-alpine AS production\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY package.json ./\nUSER node  # Non-root user\nEXPOSE 3000\nCMD ["node", "dist/main.js"]\n```\nResult: 800MB builder image → 180MB production image. Smaller image = faster push/pull.\n\nRegistry cache with `--cache-from`:\n```yaml\n# GitHub Actions\n- name: Build\n  run: |\n    docker buildx build \\\n      --cache-from type=registry,ref=$ECR_REPO:cache \\\n      --cache-to type=registry,ref=$ECR_REPO:cache,mode=max \\\n      --tag $ECR_REPO:$COMMIT_SHA \\\n      --push .\n```\n`mode=max` caches ALL intermediate layers, not just the final stage. Even first build on a new runner reuses cache.\n\nParallelization for monorepos:\n```yaml\n# Build matrix for affected services\njobs:\n  build:\n    strategy:\n      matrix:\n        service: ${{ fromJson(env.AFFECTED_SERVICES) }}\n    steps:\n    - name: Build ${{ matrix.service }}\n      run: docker buildx build apps/${{ matrix.service }}\n```\n\nTypical time breakdown for 25min build:\n- `pnpm install`: 15min → 30s with cache mount\n- `tsc build`: 6min → 2min (incremental build or `--incremental` flag)\n- `docker push`: 4min → 45s with layer deduplication\n- Total: ~3-4 minutes',
      trade_offs: [
        {
          approach: 'Remote BuildKit cache (registry)',
          pros: [
            'Shared across all CI runners',
            'Works on ephemeral runners',
            'Most cache hits',
          ],
          cons: [
            'Requires registry that supports OCI cache (ECR, GCR, GHCR)',
            'Cache upload adds ~30s per build',
            'Storage costs for cached layers',
          ],
        },
        {
          approach: 'Local runner cache with persistent volume',
          pros: [
            'Zero network overhead',
            'Fastest cache hits',
            'No registry dependency',
          ],
          cons: [
            'Cache not shared across runners',
            'Self-hosted runners required',
            'Cache management (eviction) needed',
          ],
        },
        {
          approach: 'Kaniko or BuildKit daemon in cluster',
          pros: ['Secure rootless builds', 'Cache shared in cluster', 'Good for on-prem Kubernetes CI'],
          cons: ['Complex setup', 'Slower than Docker BuildKit locally', 'Debugging is harder'],
        },
      ],
      real_world_example:
        'A monorepo with 15 NestJS services had 25min builds because: (1) COPY . . before npm install invalidated cache on any code change, (2) no registry cache — every CI runner started cold, (3) TypeScript built all 15 services even when only 1 changed. Fixes: reordered Dockerfile layers, added ECR BuildKit cache, used nx affected to limit builds. P50 build time: 25min → 2.5min. Emergency hotfix deploys went from 35min to 4min.',
      red_flags: [
        'COPY . . before RUN npm install — guarantees cache miss on every commit',
        'Using `node:latest` base image — unpredictable, breaks on version bumps',
        'Single-stage Dockerfile with dev dependencies in production — 3-5× larger image',
        'Not using `.dockerignore` — copying node_modules into build context (huge!)',
        'Building all services on every commit — wasted compute and time',
      ],
      follow_up_questions: [
        'What is the difference between `--cache-from` and `--cache-to` in Docker BuildKit?',
        'How does Docker layer caching work and what causes a cache miss?',
        'What is a distroless base image and when should you use it?',
        'How do you securely pass build secrets (API keys) during Docker build?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your production Kubernetes cluster has high inter-pod latency that is degrading API response times. How do you diagnose the network bottleneck and fix it?',
    answer: buildAnswer({
      short_answer:
        'Use `kubectl exec` with netstat and ping to isolate whether latency is node-to-node, pod-to-pod, or service-to-service. Check CNI plugin performance, kube-proxy mode (iptables vs eBPF), cross-AZ traffic costs, and CPU throttling on networking-intensive pods.',
      detailed_answer:
        'Inter-pod latency has multiple possible root causes. Systematic elimination:\n\nStep 1 — Baseline measurement:\n```bash\n# From pod to pod latency\nkubectl exec -it pod-a -- ping -c 100 pod-b-ip\n# From pod to service latency\nkubectl exec -it pod-a -- curl -w "%{time_connect} %{time_total}\\n" http://service-b/health\n```\n\nStep 2 — Check if latency is cross-AZ:\n```bash\n# Check which node each pod is on\nkubectl get pods -o wide\n# Check node AZ\nkubectl get nodes -L topology.kubernetes.io/zone\n```\nCross-AZ traffic on AWS: 2-5ms extra latency + $0.01/GB transfer cost. Solution: use pod affinity to keep communicating pods in the same AZ, or use topology-aware routing.\n\nStep 3 — kube-proxy mode:\n```bash\n# Check if iptables or IPVS mode\nkubectl get configmap kube-proxy-config -n kube-system -o yaml | grep mode\n```\niptables mode has O(n) rule lookup for n services. With 500+ services, each packet traverses thousands of rules. Switch to IPVS (hash-based, O(1)) or use Cilium with eBPF (bypass kernel networking stack entirely).\n\nStep 4 — CPU throttling on networking pods:\n```bash\n# Check throttled CPU time on CNI pods\nkubectl top pods -n kube-system | grep -E "cilium|calico|flannel"\n```\nCNI pods with insufficient CPU get throttled, causing queueing delays.\n\nStep 5 — Service mesh overhead:\nIstio/Linkerd inject a sidecar proxy. Each request goes: app → sidecar → network → sidecar → app. Adds 0.2-2ms per hop. Check if service mesh is necessary for these high-throughput paths.\n\nFix options:\n1. **Topology-aware routing** (Kubernetes 1.21+): Keeps traffic within AZ automatically\n2. **Switch to Cilium with eBPF**: Bypasses iptables, reduces latency by 30-50%\n3. **Pod affinity rules**: Co-locate communicating services on same node (sub-millisecond)\n4. **IPVS mode** for kube-proxy: O(1) service lookup vs O(n)\n5. **Disable unnecessary service mesh** on internal high-throughput paths\n\nFor co-location on same node:\n```yaml\naffinity:\n  podAffinity:\n    preferredDuringSchedulingIgnoredDuringExecution:\n    - weight: 100\n      podAffinityTerm:\n        labelSelector:\n          matchLabels:\n            app: service-b\n        topologyKey: kubernetes.io/hostname\n```',
      trade_offs: [
        {
          approach: 'Cilium with eBPF (replace kube-proxy)',
          pros: ['30-50% latency reduction', 'Network policy enforcement in kernel', 'Hubble for observability'],
          cons: ['Requires kernel 5.4+', 'Complex migration from existing CNI', 'Steep learning curve'],
        },
        {
          approach: 'Pod affinity for co-location',
          pros: ['Sub-millisecond inter-pod communication', 'Simple to configure', 'No infrastructure change'],
          cons: [
            'Reduces scheduling flexibility',
            'Single node failure takes out both services',
            'Can cause resource imbalance',
          ],
        },
        {
          approach: 'Topology-aware service routing',
          pros: ['Automatic AZ-local routing', 'No application changes', 'Cost savings on cross-AZ traffic'],
          cons: [
            'May cause uneven load distribution',
            'Requires EndpointSlice controller',
            'Not granular enough for all use cases',
          ],
        },
      ],
      real_world_example:
        'A real-time bidding platform had 8ms P99 latency between bid router and decision engine services running on Kubernetes. Investigation: pods were in different AZs (cross-AZ = 3-4ms extra). Pods ran on nodes with iptables kube-proxy and 200+ services (thousands of iptables rules). Fix: (1) topology-aware routing → AZ-local traffic, (2) IPVS mode kube-proxy → O(1) lookup. P99 dropped to 1.8ms. Cross-AZ data transfer costs dropped by $2,400/month.',
      red_flags: [
        'Assuming latency is code-level without first measuring network layer',
        'Service mesh on all services including high-throughput internal paths — 2-4ms overhead per hop',
        'Not monitoring cross-AZ traffic costs — can be significant at scale',
        'iptables kube-proxy with 1000+ services — O(n) rule traversal severely degrades under load',
        'Running multiple CNI plugins simultaneously — causes conflicts and unpredictable behavior',
      ],
      follow_up_questions: [
        'What is eBPF and how does Cilium use it to improve Kubernetes networking?',
        'What is the difference between ClusterIP, NodePort, and LoadBalancer services?',
        'How do you implement network policies to restrict pod-to-pod communication?',
        'What is a service mesh and when is the overhead worth it?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you design a secrets management strategy for a multi-environment Kubernetes deployment that is both secure and developer-friendly?',
    answer: buildAnswer({
      short_answer:
        'Use an external secret store (AWS Secrets Manager, HashiCorp Vault) with External Secrets Operator to sync secrets into Kubernetes as native Secrets. Developers reference secret names in code, never values. Rotate secrets without redeployment using ESO refresh intervals. Different secret policies per environment.',
      detailed_answer:
        'The core principle: secrets never live in Git, never in environment variables in plain text, never passed as CI/CD pipeline variables visible in logs.\n\nArchitecture with External Secrets Operator (ESO):\n```yaml\n# ExternalSecret CRD — lives in Git (safe, no sensitive values)\napiVersion: external-secrets.io/v1beta1\nkind: ExternalSecret\nmetadata:\n  name: database-credentials\nspec:\n  refreshInterval: 1h  # Sync from secret store every hour\n  secretStoreRef:\n    name: aws-secrets-manager\n    kind: ClusterSecretStore\n  target:\n    name: database-credentials  # Creates this Kubernetes Secret\n    creationPolicy: Owner\n  data:\n  - secretKey: DB_PASSWORD\n    remoteRef:\n      key: prod/database\n      property: password\n  - secretKey: DB_HOST\n    remoteRef:\n      key: prod/database\n      property: host\n```\n\nResult: Kubernetes Secret `database-credentials` is created and kept in sync. Pods mount it as environment variables or files.\n\nSecret rotation without redeployment:\n1. Rotate secret in AWS Secrets Manager\n2. ESO detects change on next refresh interval (1h) or triggered manually\n3. ESO updates Kubernetes Secret\n4. Pods with `secretKeyRef` need restart (unless using mounted files — files update automatically)\n5. For zero-restart rotation: mount secrets as files, application watches file changes, reloads connection\n\nDeveloper workflow:\n```bash\n# Developers NEVER see actual secret values\n# They only see secret names\nkubectl get secret database-credentials -o yaml\n# Shows: DB_PASSWORD: <base64 encoded value>\n# To get value (requires RBAC permission):\nkubectl get secret database-credentials -o jsonpath=\'{.data.DB_PASSWORD}\' | base64 -d\n```\n\nRBAC for secrets:\n```yaml\n# Developers: can list/describe secrets (not get their values)\nrules:\n- apiGroups: [""]\n  resources: ["secrets"]\n  verbs: ["list", "describe"]  # NOT "get"\n```\n\nSEaled Secrets alternative (simpler for small teams):\n```bash\n# Encrypt secret locally — safe to commit to Git\nkubeseal --cert pub-cert.pem < secret.yaml > sealed-secret.yaml\n# Only cluster private key can decrypt — committed encrypted YAML is safe\ngit add sealed-secret.yaml\n```\n\nEnvironment-specific policies:\n- Dev: longer rotation period (30 days), relaxed access\n- Staging: mimics prod rotation (7 days)\n- Prod: automatic rotation enabled, strict RBAC, CloudTrail audit on every access',
      trade_offs: [
        {
          approach: 'External Secrets Operator + AWS Secrets Manager',
          pros: [
            'Central secret store with full audit trail',
            'Automatic rotation support',
            'Works across multiple clusters',
          ],
          cons: [
            'AWS dependency',
            'ESO adds complexity',
            'Sync delay between secret change and pod update',
          ],
        },
        {
          approach: 'HashiCorp Vault with Vault Agent Injector',
          pros: [
            'Cloud-agnostic',
            'Dynamic secrets (short-lived DB credentials)',
            'Fine-grained policies',
            'Secret leasing with TTLs',
          ],
          cons: [
            'Vault itself needs high-availability setup and management',
            'More complex to operate',
            'Vault outage = application cannot start (if not cached)',
          ],
        },
        {
          approach: 'Sealed Secrets (Bitnami)',
          pros: [
            'No external service dependency',
            'Simple — just CRDs',
            'Git-friendly encrypted secrets',
          ],
          cons: [
            'No secret rotation without re-encryption',
            'Cluster private key is single point of failure',
            'No audit trail for secret access',
          ],
        },
      ],
      real_world_example:
        'A healthcare SaaS needed HIPAA-compliant secrets management. Initial approach: secrets in `.env` files committed to private Git repo. After security audit: (1) migrated to AWS Secrets Manager with automatic rotation, (2) deployed External Secrets Operator, (3) implemented IAM roles for service accounts (IRSA) — pods authenticate to AWS via projected service account tokens, not static IAM keys. Audit log shows every secret access. HIPAA audit passed. Zero secrets in Git.',
      red_flags: [
        'Secrets committed to Git — even private repos get breached, Git history retains secrets after deletion',
        'Plain-text secrets in environment variables visible in `kubectl describe pod`',
        'Sharing secrets between environments (prod DB password used in staging)',
        'No secret rotation — breached credentials remain valid indefinitely',
        'CI/CD pipeline secrets printed in job logs with `set -x` or verbose mode',
      ],
      follow_up_questions: [
        'What is IRSA (IAM Roles for Service Accounts) and how does it eliminate static AWS credentials?',
        'How do you audit who accessed which secrets and when?',
        'What are dynamic secrets in HashiCorp Vault and when are they preferable to static ones?',
        'How do you handle secret rotation for a database with zero application downtime?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Production is down. Your monitoring shows high CPU on all Kubernetes nodes, but you cannot identify which workload is causing it. How do you diagnose and mitigate?',
    answer: buildAnswer({
      short_answer:
        'Use `kubectl top nodes` and `kubectl top pods` to identify the CPU-hungry pod, `kubectl exec` + `top`/`pidstat` inside the pod to identify the process, check recent deployments with `kubectl rollout history`, and use `kubectl debug` or ephemeral containers for in-depth profiling without restarting production pods.',
      detailed_answer:
        'High CPU across all nodes suggests either (a) a workload consuming resources it shouldn\'t, (b) a DDoS, (c) a runaway process after a bad deployment.\n\nStep 1 — Narrow down to pod:\n```bash\n# Sort by CPU consumption\nkubectl top pods --all-namespaces --sort-by=cpu\n# Check if specific namespace is the culprit\nkubectl top pods -n production --sort-by=cpu\n```\n\nStep 2 — Check recent deployments:\n```bash\n# What changed in the last hour?\nkubectl rollout history deployment --all -n production\n# If suspect deployment found:\nkubectl rollout undo deployment/suspicious-service -n production\n```\n\nStep 3 — Diagnose inside the container:\n```bash\n# Without installing anything in the container:\nkubectl exec -it pod-name -- top -b -n 1\n# Or use ephemeral debug container (non-disruptive)\nkubectl debug -it pod-name --image=nicolaka/netshoot --target=app-container\n# Inside debug container:\npidstat -p ALL 1  # Per-process CPU\nperf top -p PID  # What functions are consuming CPU\n```\n\nStep 4 — Profile Node.js process CPU:\n```bash\n# Generate CPU profile (30s) without restart\nkill -SIGUSR1 $(pgrep node)  # Starts CPU profiler\n# After 30s:\nkill -SIGUSR2 $(pgrep node)  # Stops and dumps profile\n# Copy profile from pod\nkubectl cp pod-name:/app/isolate-*.log ./cpu-profile.log\n```\n\nStep 5 — Mitigation while diagnosing:\n```bash\n# Temporarily limit CPU to reduce blast radius\nkubectl set resources deployment/service-name --limits=cpu=500m\n# Or if traffic-driven: scale down replicas of the suspect service\nkubectl scale deployment/service-name --replicas=1\n# If cross-cutting issue: cordon nodes to prevent new pods scheduling there\nkubectl cordon node-name\n```\n\nCommon CPU spike causes:\n- JSON.parse/stringify of very large objects in hot path\n- Regex catastrophic backtracking (ReDOS)\n- bcrypt with high cost factor on every request (should be cached)\n- Unbounded loops in event handlers\n- Memory pressure causing excessive GC (GC is CPU-intensive)\n- DDoS amplification via expensive endpoints (complex queries, file processing)\n\nFault tolerance: set `resources.limits.cpu` on all deployments. Without CPU limits, a single rogue pod can starve the node.',
      trade_offs: [
        {
          approach: 'Rollback immediately without diagnosing',
          pros: ['Fastest to restore service', 'Minimal prod impact'],
          cons: ['May not fix if issue is data-driven (bad request pattern)', 'Loses diagnostic information', 'May reintroduce if root cause unknown'],
        },
        {
          approach: 'Live debugging with ephemeral containers',
          pros: ['Root cause identified before fix', 'No service disruption', 'Reproducible fix'],
          cons: ['Extends outage duration', 'Requires kubectl debug support (K8s 1.18+)', 'Debug container may not have needed tools'],
        },
        {
          approach: 'Scale down suspect service + investigate',
          pros: ['Reduces CPU immediately', 'Allows investigation on surviving pods'],
          cons: ['Reduced capacity during investigation', 'Users may see errors if service is essential'],
        },
      ],
      real_world_example:
        'An e-commerce platform had all nodes spike to 95% CPU on Black Friday. `kubectl top pods` showed a recommendations service consuming 4 CPU cores (limit was 2 — because no limit was set). Investigation: a developer deployed a change that called `JSON.stringify(entireProductCatalog)` on every recommendation request — 50,000 product objects per request at 2,000 req/sec. Fix: rollback (2 minutes), then add CPU limit, then fix the serialization. Post-incident: CPU limits mandated for all deployments via OPA policy.',
      red_flags: [
        'No CPU limits on production workloads — one rogue pod can starve the entire node',
        'No recent-change correlation — always check deployments in last 2 hours when investigating spikes',
        'Restarting pods during a CPU incident without capturing profile first — loses diagnostic data',
        'Not having `kubectl top` (metrics-server) installed — blind to pod resource usage',
        'Using `docker stats` on nodes instead of Kubernetes-aware tooling — doesn\'t show pod metadata',
      ],
      follow_up_questions: [
        'What is CPU throttling in Kubernetes and how does it differ from OOMKill?',
        'How do you use async_hooks or Node.js Performance Hooks to profile CPU in production?',
        'What is a Kubernetes PriorityClass and how does it affect pod scheduling during resource contention?',
        'How would you set up automated alerting to catch CPU spikes before they cause outages?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement a cost-optimized Kubernetes cluster that handles variable workloads with 10× traffic spikes without over-provisioning baseline capacity?',
    answer: buildAnswer({
      short_answer:
        'Use Spot/Preemptible instances for stateless workloads (60-80% cost savings), on-demand nodes for stateful and system-critical workloads, Karpenter for fast scaling with bin-packing, and KEDA for scale-to-zero on off-hours workloads. Combine with Kubernetes cost visibility tools (Kubecost, OpenCost).',
      detailed_answer:
        'Cloud Kubernetes cost has three levers: instance type selection, right-sizing, and utilization.\n\nSpot instance architecture:\n```yaml\n# Karpenter NodePool for spot instances\napiVersion: karpenter.sh/v1beta1\nkind: NodePool\nspec:\n  template:\n    spec:\n      requirements:\n      - key: karpenter.sh/capacity-type\n        operator: In\n        values: ["spot", "on-demand"]  # Spot first, fallback to on-demand\n      - key: node.kubernetes.io/instance-type\n        operator: In\n        values: ["c5.2xlarge", "c5a.2xlarge", "c5n.2xlarge"]  # Diversify for spot availability\n  disruption:\n    consolidationPolicy: WhenUnderutilized\n    consolidateAfter: 30s  # Remove underutilized nodes quickly\n```\n\nWorkload disruption tolerance:\n```yaml\n# Stateless services — tolerate spot termination\nspec:\n  template:\n    metadata:\n      annotations:\n        karpenter.sh/do-not-disrupt: "false"  # Allow eviction for consolidation\n  strategy:\n    rollingUpdate:\n      maxUnavailable: 30%  # Can lose 30% of pods at once\n  \n# Critical services — on-demand only\nspec:\n  nodeSelector:\n    karpenter.sh/capacity-type: on-demand\n```\n\nKEDA scale-to-zero for batch/background jobs:\n```yaml\napiVersion: keda.sh/v1alpha1\nkind: ScaledObject\nspec:\n  minReplicaCount: 0  # Scale to zero when queue empty\n  maxReplicaCount: 50\n  triggers:\n  - type: rabbitmq\n    metadata:\n      queueName: email-notifications\n      queueLength: "10"  # Scale up when >10 messages waiting\n```\n\nRight-sizing with VPA in recommendation mode:\n```bash\n# VPA in Recommendation mode (does not change pods automatically)\nkubectl describe vpa my-deployment\n# Output:\n# Recommendation:\n#   Container Recommendations:\n#     Container: api\n#       Lower Bound: 100m cpu, 256Mi memory\n#       Target: 300m cpu, 512Mi memory  \n#       Upper Bound: 800m cpu, 1Gi memory\n```\nAdjust requests/limits based on VPA recommendation + 20% headroom.\n\nScheduled scaling for predictable patterns:\n```yaml\n# KEDA cron trigger — scale down nights and weekends\ntriggers:\n- type: cron\n  metadata:\n    timezone: "Asia/Ho_Chi_Minh"\n    start: "0 22 * * *"   # 10pm — scale to minimum\n    end: "0 8 * * 1-5"    # 8am weekdays — restore capacity\n    desiredReplicas: "2"   # Keep 2 for health checks\n```\n\nCost allocation:\n```bash\n# Kubecost — cost per namespace, deployment, team\nkubectl cost namespace production --window 7d\n```',
      trade_offs: [
        {
          approach: 'Spot instances for all workloads',
          pros: ['60-80% cost reduction', 'AWS SLA still applies to aggregate', 'Karpenter manages interruptions'],
          cons: [
            '2-minute termination notice — stateful workloads risk data loss',
            'Spot unavailability in specific AZs during high demand',
            'Need disruption-tolerant application design',
          ],
        },
        {
          approach: 'Scale-to-zero for all non-critical services',
          pros: ['Near-zero cost during off-hours', 'Dramatic savings for dev/staging', 'Forces stateless design'],
          cons: [
            'Cold start latency when scaling from zero (node provision + pod start = 1-3min)',
            'Not suitable for services with SLA requirements',
            'Complexity in managing warm-up',
          ],
        },
        {
          approach: 'Reserved instances for baseline + Spot for burst',
          pros: ['Predictable baseline cost', 'Up to 40% savings on reserved', 'Burst handled by spot'],
          cons: [
            '1-3 year commitment',
            'Wastes money if actual baseline is overestimated',
            'Reserved capacity tied to specific region/AZ',
          ],
        },
      ],
      real_world_example:
        'A data analytics company had Kubernetes clusters costing $45k/month. Cost audit: 40% of pods were batch jobs running off-hours but nodes stayed online 24/7. Fixes: (1) migrated batch jobs to KEDA scale-to-zero with RabbitMQ trigger, (2) moved all stateless APIs to 80% Spot / 20% on-demand with Karpenter, (3) scheduled dev/staging cluster to shut down nights and weekends. Monthly cost: $45k → $14k (-69%). Spot interruption rate: 3% (handled gracefully by rolling deployment strategy).',
      red_flags: [
        'Running stateful databases on Spot instances — interruption = data loss',
        'No disruption budget when using Spot — all pods can be terminated simultaneously',
        'Ignoring bin-packing — many half-utilized nodes costs more than fewer full nodes',
        'Not monitoring cost per team/service — engineers have no visibility into cost of their decisions',
        'Scale-to-zero for latency-sensitive user-facing services — cold start destroys UX',
      ],
      follow_up_questions: [
        'How do you handle Spot instance interruption gracefully for a stateless Node.js service?',
        'What is the difference between Karpenter consolidation and cluster-autoscaler scale-down?',
        'How do Kubernetes resource requests affect cluster scheduling and bin-packing?',
        'What is GKE Autopilot vs standard GKE and when would you choose each?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'You are designing observability for a distributed system with 20 microservices. How do you implement the three pillars of observability (logs, metrics, traces) without overwhelming teams with noise?',
    answer: buildAnswer({
      short_answer:
        'Use structured JSON logging with correlation IDs, Prometheus metrics with SLI/SLO alerting (not raw metric alerting), and OpenTelemetry distributed tracing with tail-based sampling. Route everything through a central collector (Grafana LGTM stack or Datadog) and define alert routing by team ownership.',
      detailed_answer:
        'The goal is actionable signals, not data maximalism. Three pillars:\n\n**Logs — structured and correlated:**\n```json\n// Every log line must have these fields\n{\n  "timestamp": "2024-01-15T10:23:45.123Z",\n  "level": "error",\n  "message": "Payment processing failed",\n  "service": "payment-service",\n  "traceId": "abc123",  // Links to trace\n  "spanId": "def456",\n  "requestId": "req-789",\n  "userId": "user-111",\n  "tenantId": "tenant-222",\n  "errorCode": "PAYMENT_DECLINED",\n  "durationMs": 340\n}\n```\n\nLog levels discipline:\n- ERROR: requires human action (PagerDuty)\n- WARN: expected errors, tracked in metrics\n- INFO: business events (payment completed, user registered)\n- DEBUG: disabled in production (sampling only)\n\n**Metrics — RED method per service:**\n- Rate: `http_requests_total` (counter)\n- Errors: `http_request_errors_total` (counter)\n- Duration: `http_request_duration_seconds` (histogram)\n\nSLO-based alerting (not threshold-based):\n```yaml\n# Alert on error budget burn, not raw error rate\n# If we burn 5% of weekly error budget in 1h, page immediately\nalert: ErrorBudgetBurnRateCritical\nexpr: |\n  sum(rate(http_errors_total[1h])) / sum(rate(http_requests_total[1h]))\n  > 36 * (1 - 0.999)  # 36× burn rate = burn weekly budget in 1h\nseverity: page\n```\n\nThis reduces alert fatigue: a 0.1% error rate doesn\'t page if SLO is 99%. A 2% error rate pages because it depletes error budget fast.\n\n**Traces — sampling strategy:**\n```typescript\nconst sampler = new ParentBasedSampler({\n  root: new CompositeSampler([\n    new AlwaysOnSampler(),              // Always trace: errors, slow requests\n    new TraceIdRatioBasedSampler(0.01), // 1% of everything else\n  ]),\n});\n```\n\nTail-based sampling (Grafana Tempo, Jaeger): decide to keep trace AFTER seeing all spans — keep 100% of error traces, 10% of slow traces, 0.1% of fast successful traces.\n\n**Reducing noise:**\n1. Group related microservices under one team — team owns alerts for their services\n2. Alert on symptoms (user-visible SLOs) not causes (CPU%, memory)\n3. Runbooks for every alert — if no runbook, don\'t alert\n4. Regular alert reviews — delete alerts that don\'t lead to action\n5. Maintenance windows — suppress alerts during planned deployments\n\n**Grafana LGTM stack:**\n- Loki: logs\n- Grafana: dashboards\n- Tempo: traces\n- Mimir/Prometheus: metrics\n\nAll correlated by traceId — click from log → trace → flamegraph → related logs.',
      trade_offs: [
        {
          approach: 'Datadog (all-in-one SaaS)',
          pros: ['Zero infra to manage', 'Excellent APM/trace correlation', 'ML-based anomaly detection'],
          cons: ['Expensive at scale ($500k+/year for large systems)', 'Vendor lock-in', 'Data egress for high-cardinality metrics'],
        },
        {
          approach: 'Grafana LGTM (open-source, self-hosted)',
          pros: ['Free software', 'Full data control', 'Highly customizable'],
          cons: ['Significant ops overhead', 'Requires dedicated platform team', 'Integration more complex'],
        },
        {
          approach: 'OpenTelemetry Collector (vendor-agnostic)',
          pros: ['Can route to any backend', 'Standardized instrumentation', 'Avoids vendor lock-in'],
          cons: ['Additional component to manage', 'Collector can be a SPOF', 'Configuration complexity'],
        },
      ],
      real_world_example:
        'A logistics company had 200+ Prometheus alerts across 15 services, with teams receiving 50+ pages/day. Alert fatigue was so high that real incidents were missed. Overhaul: (1) converted all alerts to SLO error budget burn rates, (2) deleted 160 alerts that fired but led to no action, (3) added trace correlation — every alert link opened a pre-filtered trace view. Alerts: 200 → 40. Pages/day: 50 → 6. Mean time to detect critical incidents: 12 minutes → 4 minutes.',
      red_flags: [
        'Alerting on every 1% CPU spike — noise that desensitizes on-call engineers',
        'Unstructured log messages — cannot query or correlate across services',
        'No correlation ID between logs and traces — impossible to trace a request across services',
        'Sampling 100% of traces in production — storage costs explode, performance impact',
        'One mega-dashboard for all services — no ownership, no actionable signal',
      ],
      follow_up_questions: [
        'What is the difference between SLI, SLO, and SLA?',
        'How do you implement error budget policies that balance reliability and feature velocity?',
        'What is exemplar support in Prometheus and how does it enable trace-metric correlation?',
        'How would you design on-call rotations and escalation policies for 20 microservices?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A Docker container running a Node.js service keeps failing with "permission denied" errors when writing to a volume mount in production Kubernetes, but works locally. How do you diagnose and fix this?',
    answer: buildAnswer({
      short_answer:
        'The root cause is a UID/GID mismatch between the container process and the volume mount owner. Debug with `kubectl exec` to check file ownership and running UID. Fix with an initContainer to chown the volume, or set `securityContext.runAsUser` + `fsGroup` in the pod spec to match the volume owner.',
      detailed_answer:
        'This is one of the most common Kubernetes volume permission issues.\n\nDiagnosis:\n```bash\n# Check what UID the container runs as\nkubectl exec -it pod-name -- id\n# Output: uid=1000(node) gid=1000(node) ...\n\n# Check volume mount ownership\nkubectl exec -it pod-name -- ls -la /data\n# Output: drwxr-xr-x 2 root root 4096 ... .\n# Problem: directory owned by root (0:0), process runs as 1000:1000\n\n# Check if running as root (security problem)\nkubectl exec -it pod-name -- whoami\n```\n\nWhy it works locally: Docker Desktop on Mac/Windows maps volume permissions differently — usually runs as root by default.\n\nSolution 1 — securityContext with fsGroup:\n```yaml\nspec:\n  securityContext:\n    runAsUser: 1000  # Run as non-root user\n    runAsGroup: 1000\n    fsGroup: 1000    # All files in volumes owned by this GID\n    # Kubernetes mounts volume and runs `chown -R 1000 /data` automatically\n```\n\nSolution 2 — initContainer for explicit chown:\n```yaml\ninitContainers:\n- name: volume-permissions\n  image: busybox:1.35\n  command: ["sh", "-c", "chown -R 1000:1000 /data"]\n  volumeMounts:\n  - name: data-volume\n    mountPath: /data\n  securityContext:\n    runAsUser: 0  # initContainer runs as root to chown\ncontainers:\n- name: app\n  securityContext:\n    runAsUser: 1000  # Main container runs as non-root\n```\n\nSolution 3 — Dockerfile user setup:\n```dockerfile\nFROM node:20-alpine\n\n# Create app user with specific UID\nRUN addgroup -g 1000 appgroup && \\\n    adduser -u 1000 -G appgroup -D appuser\n\n# Create and set permissions for data directory\nRUN mkdir -p /data && chown -R appuser:appgroup /data\n\nUSER appuser\n```\n\nNFS/EFS volumes: fsGroup doesn\'t work with NFS — must use initContainer approach. EFS has additional considerations with NFS access point UID/GID settings.\n\nSecurity best practices:\n```yaml\nsecurityContext:\n  runAsNonRoot: true     # Fails if container tries to run as root\n  readOnlyRootFilesystem: true  # Forces explicit volume mounts for writeable paths\n  allowPrivilegeEscalation: false\n  capabilities:\n    drop: ["ALL"]  # Drop all Linux capabilities\n```',
      trade_offs: [
        {
          approach: 'fsGroup in pod securityContext',
          pros: ['Simple one-liner fix', 'Kubernetes-native', 'Works for most volume types'],
          cons: [
            'Recursively chowns entire volume on every pod start — slow for large volumes',
            'Does not work with NFS/EFS mounts',
            'May conflict with volume provisioner defaults',
          ],
        },
        {
          approach: 'initContainer chown',
          pros: ['Explicit control', 'Works with NFS/EFS', 'Can target specific subdirectories'],
          cons: ['Adds pod startup time', 'initContainer needs root — requires privilege in pod', 'More YAML to maintain'],
        },
        {
          approach: 'Fix Dockerfile USER instruction',
          pros: ['Root cause fix', 'Consistent across environments', 'No Kubernetes-specific workarounds'],
          cons: ['Requires image rebuild', 'All environments must use same UID', 'Upstream images may not support custom UIDs'],
        },
      ],
      real_world_example:
        'A NestJS service wrote upload files to a persistent volume. In local Docker Compose, it ran as root (uid=0) and worked fine. In Kubernetes (GKE Autopilot), all containers are forced to run as non-root. The pod kept crashing with `EACCES: permission denied, mkdir /uploads/temp`. Fix: added `securityContext.fsGroup: 1000` to match the `node` user\'s GID in the Docker image. Pod startup: +2s for fsGroup chown on an empty volume (negligible). Works without any code change.',
      red_flags: [
        'Running containers as root (uid=0) in production — violates least privilege principle',
        'Using `chmod 777` on mounted volumes as a quick fix — opens security vulnerabilities',
        'Not testing with Kubernetes security context locally — works locally but fails in prod',
        'Ignoring `runAsNonRoot: true` admission webhook failures — means containers were running as root',
        'Not documenting the expected UID/GID in the Dockerfile — other developers hit same issue',
      ],
      follow_up_questions: [
        'What is the difference between `runAsUser`, `runAsGroup`, and `fsGroup` in Kubernetes securityContext?',
        'How does `fsGroup` behavior differ between Kubernetes 1.20+ and earlier versions?',
        'What are Linux capabilities and why should containers drop all capabilities by default?',
        'How do you implement Pod Security Standards (baseline, restricted) cluster-wide?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement infrastructure as code for a multi-region, multi-environment AWS setup with Terraform, ensuring state isolation, drift detection, and safe concurrent deployments?',
    answer: buildAnswer({
      short_answer:
        'Use separate Terraform state files per environment and region (S3 backend with DynamoDB locking), organize with workspaces or directory-per-environment structure, implement drift detection with scheduled `terraform plan` runs, and use Terraform Cloud or Atlantis for safe concurrent operations with PR-based plan previews.',
      detailed_answer:
        'Multi-region, multi-environment Terraform has three critical concerns: state isolation, team collaboration, and drift detection.\n\nState isolation strategy:\n```\nterraform/\n  modules/          # Reusable modules\n    vpc/\n    eks-cluster/\n    rds/\n  environments/\n    dev/\n      us-east-1/\n        main.tf\n        backend.tf    # S3 bucket: tf-state-dev-us-east-1\n      ap-southeast-1/\n        main.tf\n    staging/\n      us-east-1/\n    prod/\n      us-east-1/\n      ap-southeast-1/  # Multi-region prod\n```\n\nBackend with state locking:\n```hcl\n# backend.tf\nterraform {\n  backend "s3" {\n    bucket         = "my-terraform-state-prod-us-east-1"\n    key            = "eks-cluster/terraform.tfstate"\n    region         = "us-east-1"\n    encrypt        = true\n    dynamodb_table = "terraform-state-locks"  # Prevents concurrent applies\n    \n    # Access via assume_role — no static credentials\n    role_arn = "arn:aws:iam::123456789:role/TerraformStateRole"\n  }\n}\n```\n\nDrift detection:\n```yaml\n# GitHub Actions scheduled workflow\nname: Drift Detection\non:\n  schedule:\n    - cron: \'0 6 * * *\'  # Daily at 6am\njobs:\n  detect-drift:\n    strategy:\n      matrix:\n        environment: [dev, staging, prod]\n        region: [us-east-1, ap-southeast-1]\n    steps:\n    - name: Terraform Plan\n      run: |\n        cd environments/${{ matrix.environment }}/${{ matrix.region }}\n        terraform plan -detailed-exitcode\n        # Exit code 2 = changes detected (drift)\n      continue-on-error: true\n    - name: Notify on drift\n      if: steps.plan.outputs.exitcode == 2\n      uses: slack-notify\n      with:\n        message: "DRIFT DETECTED in ${{ matrix.environment }}/${{ matrix.region }}"\n```\n\nAtlantis for team collaboration:\n- PR comment `/plan` → Atlantis runs plan, posts output to PR\n- PR comment `/apply` → Only after approval, Atlantis applies\n- Prevents two people from applying to same environment simultaneously (locking)\n- Applies in CI context — no individual has `terraform apply` permission locally\n\nModule versioning:\n```hcl\nmodule "eks" {\n  source  = "terraform-aws-modules/eks/aws"\n  version = "~> 19.21"  # Pinned minor version\n}\n\n# Internal modules\nmodule "vpc" {\n  source = "git::https://github.com/org/tf-modules.git//vpc?ref=v2.3.1"\n}\n```\n\nImmutable infrastructure: never modify running resources manually. All changes go through PR → Atlantis plan → approve → apply.',
      trade_offs: [
        {
          approach: 'Directory-per-environment (no workspaces)',
          pros: [
            'Clear separation',
            'Different backends per env',
            'Accidental prod apply is obvious (you have to cd into prod/)',
          ],
          cons: ['Code duplication between environments', 'Harder to keep environments in sync'],
        },
        {
          approach: 'Terraform workspaces',
          pros: ['Single configuration, multiple states', 'Less code duplication'],
          cons: [
            'Easy to apply to wrong workspace (prod by mistake)',
            'All workspaces share the same backend bucket',
            'Harder to have different providers per env',
          ],
        },
        {
          approach: 'Terragrunt (DRY wrapper)',
          pros: ['Eliminates duplication with inheritance', 'Manages remote state automatically', 'Clear dependency ordering between modules'],
          cons: ['Another tool to learn', 'Debugging Terragrunt is harder', 'Interpolation can be confusing'],
        },
      ],
      real_world_example:
        'A payments startup had one Terraform repo with all environments in a single state file. A developer ran `terraform apply` intending to update dev, accidentally targeted prod, and modified the production RDS instance settings (downtime). Fix: split state by environment+region, Atlantis for all applies (no local apply to prod), require two approvals for prod plans. Post-incident: zero unauthorized prod changes for 18 months. Drift detection catches manual AWS console changes within 24 hours.',
      red_flags: [
        'Single Terraform state file for all environments — one bad apply affects everything',
        'No state locking — concurrent applies corrupt state file',
        'Hard-coded credentials in Terraform config — use IAM roles and assume_role',
        'Manual changes to AWS console without updating Terraform — creates drift that breaks next apply',
        'No module versioning — upstream module changes break everything on next init',
      ],
      follow_up_questions: [
        'What is Terraform state and why is it important to never edit it manually?',
        'How do you handle Terraform state for resources that cannot be recreated (databases, VPCs)?',
        'What is the difference between `terraform taint` and `terraform import`?',
        'How would you migrate from manually managed AWS infrastructure to Terraform without downtime?',
      ],
    }),
    topicSlug: 'docker-devops',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
];
