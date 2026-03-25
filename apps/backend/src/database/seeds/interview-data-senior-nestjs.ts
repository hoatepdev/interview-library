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

export const seniorNestjsQuestions: QuestionSeed[] = [
  {
    title:
      'Your NestJS monolith is growing to 50+ modules with circular dependency errors and slow startup time. How do you refactor it into a maintainable modular architecture?',
    answer: buildAnswer({
      short_answer:
        'Extract bounded contexts into feature modules with clear public APIs, use lazy loading for non-critical modules, break circular dependencies with shared kernel modules or dependency inversion, and instrument startup time per-module.',
      detailed_answer:
        'When a NestJS app hits 50+ modules, three problems emerge: circular dependencies (module A imports B which imports A), slow startup from synchronous initialization, and developer confusion about module boundaries.\n\nStep 1 — Audit the dependency graph: Use `nest info` or add custom startup logging to measure initialization time per module. Draw the dependency graph to find cycles.\n\nStep 2 — Extract shared kernel: Create a `CoreModule` or `SharedModule` with providers needed everywhere (config, logging, database connection). Mark it `@Global()` to avoid re-importing everywhere.\n\nStep 3 — Break cycles with forwardRef or inversion: `@Inject(forwardRef(() => ServiceB))` is a short-term fix. Long-term, introduce an event bus (NestJS EventEmitter or CQRS) so modules communicate through events rather than direct imports.\n\nStep 4 — Lazy load heavy modules: For admin panels or rarely-used features, use NestJS lazy module loading (`LazyModuleLoader`) to skip initialization until first request.\n\nStep 5 — Dynamic modules with configuration: Modules that need per-tenant or per-environment config should use `register()` or `registerAsync()` factory pattern.\n\nPerformance impact: A 50-module app might take 3-8 seconds to start. Lazy loading non-critical modules can cut this by 40-60%, critical for Kubernetes readiness probes.',
      trade_offs: [
        {
          approach: 'forwardRef() to break circular dependencies',
          pros: ['Quick fix', 'No architectural change needed', 'Works for genuine bidirectional relationships'],
          cons: [
            'Masks design problems',
            'Can cause initialization order issues',
            'Hard to test due to timing dependencies',
          ],
        },
        {
          approach: 'Event-driven decoupling with EventEmitter or CQRS',
          pros: ['Eliminates circular dependencies fundamentally', 'Better for audit trails', 'Enables async processing'],
          cons: [
            'Higher complexity',
            'Harder to trace request flow',
            'Event schema versioning becomes a concern',
          ],
        },
        {
          approach: 'Lazy module loading',
          pros: ['Faster startup', 'Reduced memory footprint at boot'],
          cons: [
            'First request latency spike',
            'Complexity in deciding which modules to lazy load',
            'Poor fit for modules used in every request',
          ],
        },
      ],
      real_world_example:
        'A fintech platform had AuthModule, NotificationsModule, and UsersModule all importing each other. Solution: extracted a SharedKernelModule with UserRepository and EventBusService. AuthModule and NotificationsModule both import SharedKernelModule and communicate via events. Startup time dropped from 6.2s to 2.8s after lazy-loading the ReportsModule (used only by admins).',
      red_flags: [
        'Using @Global() on business logic modules — only truly shared infrastructure should be global',
        'More than 3 levels of forwardRef() — indicates fundamental boundary confusion',
        'Putting all providers in a single AppModule instead of feature modules',
        'Not having any module unit tests — makes refactoring blind',
        'Synchronous I/O in module initialization (e.g., reading config files synchronously)',
      ],
      follow_up_questions: [
        'How do you share TypeORM repositories across modules without coupling?',
        'When would you consider splitting a NestJS app into microservices?',
        'How do you handle shared DTOs and interfaces in a modular architecture?',
        'What is the difference between a dynamic module and a lazy module in NestJS?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A production NestJS service is failing health checks intermittently under load due to database connection pool exhaustion. How do you diagnose and fix this?',
    answer: buildAnswer({
      short_answer:
        'Instrument TypeORM pool metrics, identify leaked connections (long-running queries, missing transaction cleanup, N+1 without timeouts), tune pool size based on actual concurrency, and add circuit breakers to prevent cascading failures.',
      detailed_answer:
        'Connection pool exhaustion typically manifests as `connection timeout` errors after a queue wait, with health checks failing because they also need a connection.\n\nDiagnosis steps:\n1. Query pg_stat_activity to see active/idle connections per application and query duration:\n   `SELECT state, count(*), max(now() - query_start) FROM pg_stat_activity GROUP BY state`\n2. Check TypeORM pool config — default `max: 10` is often too low for production\n3. Instrument pool events: TypeORM DataSource emits `acquire`, `release`, `connect` events\n4. Look for transaction leaks: any code that opens a transaction but doesn\'t release on all code paths\n5. Check for long-running queries holding connections (EXPLAIN ANALYZE + pg_stat_activity)\n\nCommon causes in NestJS:\n- `@Transaction()` interceptors that don\'t clean up on exceptions\n- Missing `finally` blocks in service methods that acquire connections manually\n- N+1 query loops each acquiring a separate connection\n- Slow queries causing connections to stack up\n\nFix strategy:\n1. Tune pool size: `max = (available_connections * 0.9) / replicas`. For a PostgreSQL server with `max_connections=100` and 3 app replicas: `floor(90/3) = 30` per replica\n2. Set `acquireTimeoutMillis` and `idleTimeoutMillis` to avoid silent hangs\n3. Add query timeout at the TypeORM level: `connectTimeoutMS: 5000`\n4. Use `DataSource.query()` wrapped in try-finally for guaranteed release\n5. Add health check with a separate minimal pool (size 2) dedicated to health endpoints\n\nThroughput impact: Each waiting request blocks a thread (via libuv). At 100 concurrent users with pool of 10 and avg query 200ms: theoretical max throughput = 10/0.2 = 50 req/s before queuing begins.',
      trade_offs: [
        {
          approach: 'Increase pool size',
          pros: ['Simple fix', 'Immediate relief', 'No code changes'],
          cons: [
            'PostgreSQL has global connection limits (shared_buffers, max_connections)',
            'Too many connections degrade Postgres performance',
            'Does not fix the root cause of leaks',
          ],
        },
        {
          approach: 'PgBouncer connection pooler in transaction mode',
          pros: [
            'Multiplexes hundreds of app connections into few server connections',
            'Handles pool management externally',
            'Works well with autoscaling',
          ],
          cons: [
            'Session-level features (LISTEN/NOTIFY, prepared statements, SET LOCAL) break in transaction mode',
            'Adds infrastructure complexity',
            'Latency overhead (~0.1ms per query)',
          ],
        },
        {
          approach: 'Separate read/write connection pools',
          pros: [
            'Read replica reduces primary load',
            'Separate pools prevent read queries starving write operations',
          ],
          cons: [
            'Replication lag causes stale reads',
            'More complex TypeORM configuration',
            'Need read-your-writes consistency strategy',
          ],
        },
      ],
      real_world_example:
        'An e-commerce NestJS service had intermittent 503s during flash sales. Investigation: a promotions service loop was doing N+1 queries inside a transaction interceptor, each holding a connection for 800ms. With 15 concurrent requests, the pool of 10 saturated instantly. Fix: (1) batch queries with QueryBuilder IN clause, (2) moved transaction boundary to only wrap the write portion, (3) added PgBouncer in front of Postgres. P99 latency dropped from 4.2s to 340ms.',
      red_flags: [
        'Using `synchronize: true` in production (causes schema locks)',
        'Not setting `acquireTimeoutMillis` — connections queue indefinitely',
        'Transaction interceptors without explicit rollback on error',
        'Using a single DataSource for both health checks and business logic',
        'Ignoring `idle in transaction` connections in pg_stat_activity',
      ],
      follow_up_questions: [
        'How does TypeORM handle connection pooling differently from Prisma?',
        'What are the implications of using PgBouncer in session mode vs transaction mode?',
        'How do you implement read/write splitting in NestJS with TypeORM?',
        'How would you detect and alert on connection pool saturation before it causes outages?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'You need to implement a multi-tenant NestJS API where each tenant has isolated data and rate limits, but shares the same codebase and infrastructure. What architecture do you choose?',
    answer: buildAnswer({
      short_answer:
        'Use a request-scoped tenant context extracted from JWT claims or subdomain, inject it via a custom TenantModule, and choose between shared schema (row-level security), separate schemas per tenant, or separate databases based on isolation requirements and tenant count.',
      detailed_answer:
        'Multi-tenancy in NestJS involves three concerns: data isolation, request routing, and rate limiting per tenant.\n\nTenant identification strategies:\n1. Subdomain: `tenant1.app.com` — extract from `request.headers.host`\n2. JWT claim: `{ tenantId: "tenant1" }` — extracted in auth guard\n3. Header: `X-Tenant-ID` — simpler for B2B APIs\n\nNestJS implementation:\n\n```typescript\n@Injectable({ scope: Scope.REQUEST })\nexport class TenantContext {\n  tenantId: string;\n}\n\n@Injectable()\nexport class TenantGuard implements CanActivate {\n  canActivate(ctx: ExecutionContext): boolean {\n    const req = ctx.switchToHttp().getRequest();\n    const tenantContext = this.moduleRef.get(TenantContext, { strict: false });\n    tenantContext.tenantId = req.user.tenantId; // from JWT\n    return true;\n  }\n}\n```\n\nData isolation models:\n1. Row-level isolation (shared schema): Add `tenant_id` column to all tables, use PostgreSQL Row Level Security (RLS) with `SET LOCAL app.tenant_id = $1` per transaction. Best for 1000s of tenants.\n2. Schema-per-tenant: Each tenant gets their own PostgreSQL schema (`tenant1.users`, `tenant2.users`). Set `search_path` per connection. Better isolation, enables per-tenant migrations. Best for <500 tenants.\n3. Database-per-tenant: Maximum isolation, supports different PostgreSQL versions or configs per tenant. Only feasible for large enterprise tenants (10s-100s).\n\nDynamic TypeORM with schema-per-tenant:\n```typescript\nasync getDataSource(tenantId: string): Promise<DataSource> {\n  if (this.connections.has(tenantId)) return this.connections.get(tenantId);\n  const ds = new DataSource({ ...baseConfig, schema: `tenant_${tenantId}` });\n  await ds.initialize();\n  this.connections.set(tenantId, ds);\n  return ds;\n}\n```\n\nRate limiting per tenant:\nUse NestJS Throttler with a custom storage backend (Redis) keyed by `tenantId:endpoint`. Override `getTracker()` to use tenant ID instead of IP.\n\nThroughput consideration: With schema-per-tenant and 100 tenants, you may need 100 connection pools × pool_size connections. PgBouncer with `pool_mode=transaction` is essential here.',
      trade_offs: [
        {
          approach: 'Shared schema with row-level security',
          pros: [
            'Single connection pool',
            'No per-tenant migration needed',
            'Scales to thousands of tenants',
          ],
          cons: [
            'RLS bugs can leak cross-tenant data (catastrophic)',
            'Hard to give tenants different schemas',
            'Backup/restore per tenant is complex',
          ],
        },
        {
          approach: 'Schema per tenant',
          pros: [
            'Strong isolation',
            'Per-tenant migrations possible',
            'Easy tenant offboarding (DROP SCHEMA)',
          ],
          cons: [
            'Connection pool explosion with many tenants',
            'Migration management complexity (run N migrations)',
            'Cross-tenant analytics requires UNION queries',
          ],
        },
        {
          approach: 'Database per tenant',
          pros: ['Maximum isolation', 'Different infra per tier', 'Regulatory compliance friendly'],
          cons: ['Very expensive at scale', 'Operational burden', 'Cross-tenant features near impossible'],
        },
      ],
      real_world_example:
        'A SaaS platform started with shared schema + RLS for 500 tenants. When an enterprise client required GDPR data residency (EU-only storage), they migrated that tenant to a dedicated database in eu-west-1. The architecture used a TenantRegistry service that returned the correct DataSource based on tenantId — handling both shared and dedicated tenants transparently.',
      red_flags: [
        'Missing `SET LOCAL app.tenant_id` before every query when using RLS — causes cross-tenant data leaks',
        'Storing tenantId in module-scoped state instead of request-scoped — concurrency bugs',
        'Not validating that the JWT tenantId matches the URL tenantId in path params',
        'Using NestJS default scope (singleton) for tenant-specific services',
        'No test for cross-tenant data isolation — a missing RLS policy is silent',
      ],
      follow_up_questions: [
        'How do you handle database migrations for schema-per-tenant architecture?',
        'What are the trade-offs of using REQUEST scope vs TRANSIENT scope in NestJS?',
        'How do you implement tenant-specific feature flags?',
        'How would you approach a data breach investigation in a shared schema architecture?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A critical NestJS microservice is experiencing memory leaks in production, growing from 200MB to 2GB over 48 hours before OOMKill. How do you find and fix the leak?',
    answer: buildAnswer({
      short_answer:
        'Take heap snapshots before/after load using `--inspect` and compare with Chrome DevTools. Common NestJS leak sources: unbounded caches, event listener accumulation, unclosed streams, circular references in request-scoped providers, or global interceptors holding request references.',
      detailed_answer:
        'Memory leak investigation requires systematic elimination.\n\nStep 1 — Establish baseline and confirm the leak:\n```bash\n# Enable heap snapshots without impacting production\nnode --max-old-space-size=2048 --heapsnapshot-signal=SIGUSR2 dist/main.js\n# Send signal to trigger snapshot\nkill -SIGUSR2 $(pgrep -f main.js)\n```\n\nStep 2 — Capture three snapshots over time: at startup, after 1h of load, after 6h. The heap difference between snapshot 2 and 3 reveals what\'s accumulating.\n\nStep 3 — Chrome DevTools heap comparison: Sort by "Delta" in the "Comparison" view. Look for:\n- Arrays or Maps with growing sizes\n- Closure contexts retaining large objects\n- EventEmitter instances with growing listener counts\n\nCommon NestJS leak sources:\n\n1. **Global EventEmitter accumulation**: `emitter.on()` in module init without cleanup. Fix: use `emitter.once()` or `emitter.removeAllListeners()` in `onModuleDestroy()`.\n\n2. **Unbounded in-memory cache**: A `Map` used as cache in a singleton service without eviction policy. Fix: use LRU cache (`lru-cache` package) with maxSize.\n\n3. **Request-scoped provider holding references**: Circular reference between REQUEST-scoped service and a singleton. Fix: avoid injecting singletons that hold references to request-scoped objects.\n\n4. **Interceptors retaining response bodies**: A logging interceptor that stores full response bodies in memory for batching. Fix: stream log data, never buffer complete responses.\n\n5. **TypeORM QueryRunner not released**: `const runner = dataSource.createQueryRunner(); await runner.connect();` without `await runner.release()` in finally block.\n\nFix validation: After fixes, run `process.memoryUsage().heapUsed` every 30s under constant load for 1h. Memory should stabilize (flat line) rather than grow linearly.',
      trade_offs: [
        {
          approach: 'Periodic process restart (poor man\'s fix)',
          pros: ['Immediate relief', 'Zero code change', 'Easy with Kubernetes liveness probes'],
          cons: [
            'Does not fix the leak',
            'Causes brief unavailability on restart',
            'Masks real problems',
          ],
        },
        {
          approach: 'Production heap profiling with `clinic.js`',
          pros: [
            'Detailed flame graphs',
            'Can run under real production load',
            'Identifies both memory and CPU issues',
          ],
          cons: [
            '15-20% CPU overhead during profiling',
            'Generates large trace files',
            'Requires brief prod exposure',
          ],
        },
        {
          approach: 'Canary deployment with memory alerting',
          pros: [
            'Safe — only affects small traffic %',
            'Real production traffic reveals leaks staging can\'t',
          ],
          cons: ['Slower feedback cycle', 'Still need profiling to identify root cause'],
        },
      ],
      real_world_example:
        'A payment processing NestJS service leaked memory through a global interceptor that accumulated audit log entries in a Map, keyed by correlation ID. The map had TTL logic but the cleanup timer was inside a closure that held a reference to the interceptor instance, preventing GC. Discovered via heap snapshot comparison showing 40,000+ Map entries after 24h. Fix: replaced in-memory accumulation with direct async write to audit table, eliminating the Map entirely.',
      red_flags: [
        'Restarting pods on a schedule to "manage" memory — never acceptable as a permanent fix',
        'Using `global.cache = {}` for module-level caching — grows unbounded',
        'EventEmitter.on() in controller or service methods that are called per request',
        'Not calling `queryRunner.release()` in every code path after `queryRunner.connect()`',
        'Storing large objects (full HTTP responses, file buffers) in module-scoped singletons',
      ],
      follow_up_questions: [
        'How does Node.js garbage collection work and what triggers a GC pause?',
        'What is the difference between a memory leak and heap fragmentation?',
        'How would you set Kubernetes memory limits and requests for a Node.js service?',
        'How do you profile memory in a containerized environment without SSH access?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'You need to implement distributed tracing across 5 NestJS microservices communicating via gRPC and an event bus. How do you propagate trace context and make debugging production issues tractable?',
    answer: buildAnswer({
      short_answer:
        'Use OpenTelemetry SDK with auto-instrumentation for NestJS, gRPC, and the message broker. Propagate trace context via W3C TraceContext headers in gRPC metadata and message headers. Export spans to Jaeger or Tempo. Add custom spans for business-critical operations.',
      detailed_answer:
        'Distributed tracing requires two things: context propagation (every service knows which trace it\'s part of) and span creation (each service records its work).\n\nSetup with OpenTelemetry:\n```typescript\n// tracing.ts - must import BEFORE NestJS bootstraps\nimport { NodeSDK } from \'@opentelemetry/sdk-node\';\nimport { getNodeAutoInstrumentations } from \'@opentelemetry/auto-instrumentations-node\';\nimport { OTLPTraceExporter } from \'@opentelemetry/exporter-trace-otlp-grpc\';\n\nconst sdk = new NodeSDK({\n  traceExporter: new OTLPTraceExporter({ url: \'http://otel-collector:4317\' }),\n  instrumentations: [getNodeAutoInstrumentations()],\n});\nsdk.start();\n```\n\ngRPC context propagation: Auto-instrumentation handles propagation via gRPC metadata. Manually access with:\n```typescript\nconst tracer = trace.getTracer(\'order-service\');\nconst span = tracer.startSpan(\'processPayment\', {\n  attributes: { \'order.id\': orderId, \'tenant.id\': tenantId },\n});\n```\n\nEvent bus propagation: Message brokers (Kafka, RabbitMQ) don\'t auto-propagate W3C TraceContext. Implement a NestJS interceptor that:\n1. On publish: serializes `trace.getActiveSpan().spanContext()` into message headers\n2. On consume: deserializes and sets as parent context before processing\n\nCustom NestJS interceptor for all inbound requests:\n```typescript\n@Injectable()\nexport class TracingInterceptor implements NestInterceptor {\n  intercept(ctx: ExecutionContext, next: CallHandler) {\n    const req = ctx.switchToHttp().getRequest();\n    const span = trace.getActiveSpan();\n    span?.setAttributes({\n      \'user.id\': req.user?.id,\n      \'tenant.id\': req.user?.tenantId,\n    });\n    return next.handle();\n  }\n}\n```\n\nSampling strategy: Head-based sampling (decide at trace root) with 10% default, 100% for errors and slow spans (>2s). Use OpenTelemetry\'s `ParentBasedSampler` + `TraceIdRatioBased`.\n\nFault tolerance: Tracing failures must NEVER fail business requests. Wrap all OTEL SDK calls in try-catch. Use async batch exporter — never synchronous.',
      trade_offs: [
        {
          approach: 'Auto-instrumentation only',
          pros: ['Zero code changes', 'Consistent coverage', 'Easy to add new services'],
          cons: [
            'No business context in spans',
            'Can\'t add custom attributes (user ID, order ID)',
            'Harder to debug domain-level issues',
          ],
        },
        {
          approach: 'Manual instrumentation everywhere',
          pros: ['Rich business context', 'Precise span boundaries', 'Custom error recording'],
          cons: ['High maintenance burden', 'Easy to forget in new code', 'Inconsistent across teams'],
        },
        {
          approach: 'Auto-instrumentation + custom spans for critical paths',
          pros: ['Best of both worlds', 'Focus effort on high-value paths', 'Maintainable'],
          cons: ['Requires discipline to identify critical paths', 'Some onboarding effort for team'],
        },
      ],
      real_world_example:
        'An order management system with 7 NestJS services (orders, inventory, payments, notifications, shipping, analytics, auth) had P99 latency spikes that were impossible to debug with logs alone. After adding OpenTelemetry with Tempo + Grafana, they found that 80% of P99 spikes were caused by inventory service making a synchronous HTTP call to a legacy system without timeout. Trace visualization showed the 4.5s span immediately. Fix: added 2s timeout + circuit breaker. P99 dropped from 8s to 800ms.',
      red_flags: [
        'Adding tracing as blocking synchronous operations — OTEL must be async',
        'Not propagating trace context through message queues — creates broken traces',
        'Sampling 100% of traces in production at high traffic — storage costs explode',
        'Not adding trace ID to error responses — makes correlating user reports to traces impossible',
        'Tracing library initialization after NestJS bootstrap — misses framework instrumentation',
      ],
      follow_up_questions: [
        'What is the difference between tracing, metrics, and logs in observability?',
        'How do you implement correlation IDs without OpenTelemetry?',
        'What is tail-based sampling and when is it better than head-based sampling?',
        'How would you handle trace context propagation with GraphQL subscriptions?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you design a NestJS CQRS architecture that can handle 10,000 events/second with at-least-once delivery guarantees and idempotent command handling?',
    answer: buildAnswer({
      short_answer:
        'Use NestJS CQRS module with a durable event store (Kafka or PostgreSQL outbox), implement idempotency keys on command handlers using a deduplication table, and ensure at-least-once delivery through consumer group offsets with explicit commit after successful processing.',
      detailed_answer:
        'At 10,000 events/sec, in-memory CQRS (NestJS EventEmitter) is insufficient. You need durable messaging and idempotent handlers.\n\nArchitecture:\n- Commands → validated → written to command log → CommandHandler processes\n- Events → written to event store (Kafka topic or PostgreSQL + outbox) → EventHandlers consume\n- Projections → EventHandlers update read models (materialized views)\n\nIdempotent command handling:\n```typescript\n@CommandHandler(CreateOrderCommand)\nexport class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {\n  async execute(command: CreateOrderCommand) {\n    // Check deduplication table first\n    const existing = await this.repo.findByIdempotencyKey(command.idempotencyKey);\n    if (existing) return existing; // Return cached result, don\'t re-process\n    \n    // Process command\n    const order = Order.create(command);\n    \n    // Save order + deduplication record in SAME transaction\n    await this.dataSource.transaction(async (em) => {\n      await em.save(order);\n      await em.save(IdempotencyRecord, {\n        key: command.idempotencyKey,\n        result: JSON.stringify(order.id),\n        expiresAt: addDays(new Date(), 7),\n      });\n    });\n    \n    return order;\n  }\n}\n```\n\nTransactional outbox for at-least-once:\n```typescript\n// Same transaction: save aggregate + outbox record\nawait em.transaction(async (tx) => {\n  await tx.save(Order, order);\n  await tx.save(OutboxEvent, {\n    aggregateId: order.id,\n    eventType: \'OrderCreated\',\n    payload: JSON.stringify(orderCreatedEvent),\n    publishedAt: null, // null = unpublished\n  });\n});\n// Separate process polls outbox and publishes to Kafka\n```\n\nKafka consumer with manual offset commit:\n```typescript\nconsumer.on(\'message\', async (message) => {\n  await this.commandBus.execute(parseCommand(message));\n  // ONLY commit offset after successful processing\n  await consumer.commitOffsets([{ topic, partition, offset: message.offset }]);\n});\n```\n\nAt 10k events/sec with 50ms average handler time: need 500 concurrent handlers. Use 5-10 Kafka partitions × multiple consumer replicas, or use worker threads for CPU-bound handlers.',
      trade_offs: [
        {
          approach: 'Exactly-once semantics with Kafka transactions',
          pros: ['No duplicate processing', 'Simpler handler logic'],
          cons: [
            '30-50% throughput reduction',
            'Kafka transaction coordinator is a bottleneck',
            'Not compatible with all sink systems',
          ],
        },
        {
          approach: 'At-least-once + idempotent handlers',
          pros: ['Higher throughput', 'Simpler infrastructure', 'Works with any message broker'],
          cons: ['Every handler must implement idempotency', 'Deduplication table needs cleanup job'],
        },
        {
          approach: 'PostgreSQL + outbox pattern (no Kafka)',
          pros: ['Transactional consistency with business data', 'Simpler ops', 'ACID guarantees'],
          cons: [
            'Lower throughput ceiling (~1-5k events/sec)',
            'Polling adds latency (100-500ms typical)',
            'PostgreSQL as message store has operational limits',
          ],
        },
      ],
      real_world_example:
        'A logistics platform processed 8k shipment events/second during peak hours. Initial CQRS used NestJS EventEmitter — events were lost on pod restart. Migration to Kafka with idempotent handlers: each ShipmentEventHandler checked a Redis set keyed by `eventId` before processing. Duplicate rate was 0.3% (Kafka at-least-once), handled transparently. System handled 12k events/sec after adding 2 more partitions and 3 consumer replicas.',
      red_flags: [
        'Using NestJS in-memory EventEmitter for events that must survive process restart',
        'Saving the aggregate and publishing the event in separate transactions — creates lost events',
        'No idempotency keys in command DTOs — makes retry logic impossible',
        'Implementing CQRS but keeping commands and queries in the same database transaction',
        'Not setting `max.poll.records` and `session.timeout.ms` for Kafka consumers under heavy load',
      ],
      follow_up_questions: [
        'What is event sourcing and how does it differ from CQRS?',
        'How do you handle eventual consistency in projections when a read model is behind?',
        'How do you implement sagas (long-running processes) in NestJS CQRS?',
        'How would you migrate from a CRUD architecture to CQRS incrementally?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your NestJS GraphQL API is experiencing N+1 query problems causing 50+ database queries per request. How do you implement DataLoader and batch queries effectively?',
    answer: buildAnswer({
      short_answer:
        'Use Facebook\'s DataLoader via `@nestjs/dataloader` or custom REQUEST-scoped DataLoader providers. Batch all field resolvers that load related entities by key. Each DataLoader collects keys within a single event loop tick and executes one batched query.',
      detailed_answer:
        'N+1 in GraphQL: querying 100 posts each requesting their author makes 1 (posts) + 100 (authors) = 101 queries.\n\nDataLoader solution: DataLoader batches all `.load(authorId)` calls that happen within the same event loop tick into a single `.loadMany([id1, id2, ...id100])` call.\n\nNestJS implementation:\n\n```typescript\n// users.loader.ts\n@Injectable({ scope: Scope.REQUEST }) // Must be REQUEST scoped!\nexport class UsersLoader {\n  private readonly loader: DataLoader<string, User>;\n  \n  constructor(private usersService: UsersService) {\n    this.loader = new DataLoader<string, User>(\n      async (userIds: readonly string[]) => {\n        const users = await this.usersService.findByIds([...userIds]);\n        // DataLoader requires results in SAME ORDER as keys\n        const userMap = new Map(users.map(u => [u.id, u]));\n        return userIds.map(id => userMap.get(id) ?? new Error(`User ${id} not found`));\n      },\n      { cache: true, maxBatchSize: 500 }\n    );\n  }\n  \n  load(userId: string): Promise<User> {\n    return this.loader.load(userId);\n  }\n}\n\n// post.resolver.ts\n@ResolveField()\nasync author(@Parent() post: Post, @Context() ctx: GqlContext) {\n  return ctx.loaders.users.load(post.authorId);\n  // Or inject UsersLoader directly if using NestJS DI\n}\n```\n\nRequest-scoped context approach:\n```typescript\n// app.module.ts - create loaders factory per request\nexport function createLoaders(usersService: UsersService): AppLoaders {\n  return {\n    users: new UsersLoader(usersService),\n    comments: new CommentsLoader(commentsService),\n  };\n}\n```\n\nBeyond DataLoader — query planning:\nFor deeply nested queries (posts → comments → reactions → users), DataLoader still makes N round trips at each level. Solution: analyze the GraphQL AST in the resolver to eagerly load required relations:\n```typescript\n@Query()\nasync posts(@Info() info: GraphQLResolveInfo) {\n  const relations = extractRelations(info); // parse AST\n  return this.postsRepo.find({ relations }); // single query with JOINs\n}\n```\n\nPersisted queries + complexity limits prevent clients from requesting deeply nested graphs that exhaust memory.',
      trade_offs: [
        {
          approach: 'DataLoader (batching)',
          pros: ['Automatic batching', 'Request-level cache prevents duplicate loads', 'Works for any data source'],
          cons: [
            'Batches are per event-loop tick — async operations between loads break batching',
            'Return order must match input order (easy to get wrong)',
            'Memory overhead from per-request DataLoader instances',
          ],
        },
        {
          approach: 'JOIN-based eager loading via AST analysis',
          pros: ['Single query for entire request', 'Best throughput', 'Predictable query count'],
          cons: [
            'Complex to implement',
            'Large JOINs can be slower than multiple simple queries',
            'Tight coupling between resolver and persistence layer',
          ],
        },
        {
          approach: 'Persisted queries + field-level caching',
          pros: ['Caches at CDN level', 'Reduces server load', 'Best for read-heavy public APIs'],
          cons: ['Complex cache invalidation', 'Doesn\'t help for authenticated/personalized queries'],
        },
      ],
      real_world_example:
        'A content platform\'s GraphQL API loaded a feed of 50 articles with author, tags, and like count. Without DataLoader: 1 + 50 + 50 + 50 = 151 queries, taking 800ms. After DataLoader for users and tags, plus a single aggregation query for like counts: 4 queries total, 45ms. The key insight was that like counts needed a `GROUP BY` aggregation, not a DataLoader batch — so they used a custom batch function returning a Map of `articleId → likeCount`.',
      red_flags: [
        'Using SINGLETON scope for DataLoader — request A\'s data bleeds into request B\'s cache',
        'Not returning results in the same order as input keys — DataLoader silently returns wrong data',
        'Using DataLoader for mutations — loaders are for reads only, mutations need immediate execution',
        'No query depth/complexity limits — allows O(n^k) queries on deeply nested graphs',
        'Caching DataLoader results across requests (Redis) without proper cache invalidation',
      ],
      follow_up_questions: [
        'How does DataLoader handle errors for individual keys in a batch?',
        'What is the difference between DataLoader cache and a Redis cache for GraphQL?',
        'How do you implement real-time updates (subscriptions) in NestJS GraphQL?',
        'When would you choose REST over GraphQL in a NestJS microservices architecture?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A high-traffic NestJS API needs to handle 1M requests/day with 99.9% uptime. How do you design the rate limiting, circuit breaking, and graceful degradation strategy?',
    answer: buildAnswer({
      short_answer:
        'Layer defenses: NestJS Throttler with Redis store for rate limiting, Opossum or custom interceptor for circuit breakers on external calls, fallback handlers returning cached or degraded responses, and health checks that distinguish liveness from readiness.',
      detailed_answer:
        '1M req/day ≈ ~11.5 req/sec average, but with 10x peak factor = ~115 req/sec at peak. This is manageable, but requires resilience for external dependency failures.\n\nLayer 1 — Rate limiting with NestJS Throttler:\n```typescript\n@Module({\n  imports: [\n    ThrottlerModule.forRoot({\n      throttlers: [\n        { name: \'default\', ttl: 60000, limit: 100 },\n        { name: \'burst\', ttl: 1000, limit: 20 }, // 20/sec burst limit\n      ],\n      storage: new ThrottlerStorageRedisService(redisOptions), // Distributed storage!\n    }),\n  ],\n})\n```\n\nCustom throttler key for per-user limits:\n```typescript\n@Injectable()\nexport class CustomThrottlerGuard extends ThrottlerGuard {\n  protected async getTracker(req: Record<string, any>): Promise<string> {\n    return req.user?.id ?? req.ip; // User-level throttling when authenticated\n  }\n}\n```\n\nLayer 2 — Circuit breaker for external dependencies:\n```typescript\n@Injectable()\nexport class PaymentService {\n  private breaker = new CircuitBreaker(this.callExternalPaymentApi.bind(this), {\n    timeout: 3000,\n    errorThresholdPercentage: 50,\n    resetTimeout: 30000,\n    volumeThreshold: 10, // Min calls before opening\n  });\n  \n  async processPayment(data: PaymentDto) {\n    try {\n      return await this.breaker.fire(data);\n    } catch (err) {\n      if (err.message === \'Breaker is open\') {\n        return this.degradedPaymentResponse(); // Fallback\n      }\n      throw err;\n    }\n  }\n}\n```\n\nLayer 3 — Graceful degradation:\n- Recommendations service down → return empty array (not 503)\n- Analytics down → accept request, queue event locally, drain when restored\n- Non-critical enrichment (user avatar, social counts) → return null, enrich async\n\nHealth check separation:\n```typescript\n// /health/live — only checks if process is alive\n@Get(\'/live\') live() { return { status: \'ok\' }; }\n\n// /health/ready — checks DB, Redis, external services\n@Get(\'/ready\') async ready() {\n  // If DB is down, returns 503 → Kubernetes stops routing traffic here\n  // If DB is slow, still returns 200 → gradual recovery\n}\n```\n\nFault tolerance metric: track error budget (99.9% SLA = 43.8 min downtime/month). Alert when weekly error budget is 50% consumed.',
      trade_offs: [
        {
          approach: 'In-memory Throttler storage',
          pros: ['Zero infrastructure dependency', 'Fastest'],
          cons: [
            'Limits not shared across replicas — each pod allows full quota',
            'Ineffective behind load balancer with 3+ replicas',
          ],
        },
        {
          approach: 'Redis-backed Throttler storage',
          pros: ['Consistent limits across all replicas', 'Supports sliding window'],
          cons: [
            'Redis becomes critical dependency',
            'Adds 0.5-2ms per request for Redis roundtrip',
            'Redis failure must not block requests (fail-open)',
          ],
        },
        {
          approach: 'API Gateway rate limiting (Kong, AWS API GW)',
          pros: ['Offloads from app', 'No code changes', 'Fine-grained controls', 'Analytics built-in'],
          cons: ['Vendor lock-in', 'Less flexible business logic', 'Cost at scale'],
        },
      ],
      real_world_example:
        'An e-learning platform had a third-party video transcoding service that intermittently took 30s to respond (normal is 200ms). Without circuit breakers, request threads piled up, exhausting the Node.js libuv thread pool and causing unrelated endpoints to degrade. After adding a circuit breaker with 3s timeout: transcoding failures were isolated, other endpoints were unaffected, and users got a "video processing, check back later" message instead of a timeout.',
      red_flags: [
        'Rate limiting only by IP in a corporate environment — entire office gets blocked by one bad actor',
        'Circuit breaker without a fallback — just converts timeouts into immediate 503s without reducing load',
        'Kubernetes liveness probe hitting the database — one slow DB query causes rolling restarts',
        'Not having fail-open logic for rate limiter Redis failures — Redis outage blocks all requests',
        'Same rate limit for all tiers — premium users share limits with free tier',
      ],
      follow_up_questions: [
        'What is the difference between rate limiting, throttling, and backpressure?',
        'How do you implement exponential backoff with jitter for retries in NestJS?',
        'What metrics would you use to set circuit breaker thresholds?',
        'How does bulkhead isolation differ from circuit breaking?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement zero-downtime deployments for a NestJS API that has long-running background jobs and active WebSocket connections?',
    answer: buildAnswer({
      short_answer:
        'Implement graceful shutdown that stops accepting new connections, drains active WebSockets with a close handshake, waits for in-flight requests to complete, pauses job queues and waits for running jobs, then exits. Coordinate with Kubernetes pod termination grace period.',
      detailed_answer:
        'Zero-downtime requires the old pod to finish cleanly before the new pod takes over.\n\nKubernetes deployment sequence:\n1. New pod starts, passes readiness probe\n2. Load balancer routes new traffic to new pod\n3. Old pod receives SIGTERM\n4. Old pod has `terminationGracePeriodSeconds` (default 30s, should be 60-120s for job workers)\n5. Old pod exits (or SIGKILL if grace period exceeded)\n\nNestJS graceful shutdown:\n```typescript\nasync function bootstrap() {\n  const app = await NestFactory.create(AppModule);\n  \n  // Enable graceful shutdown hooks\n  app.enableShutdownHooks();\n  \n  // Configure shutdown timeout\n  app.use((req, res, next) => {\n    res.on(\'finish\', () => { if (isShuttingDown) checkDrain(); });\n    next();\n  });\n  \n  await app.listen(3000);\n  \n  process.on(\'SIGTERM\', async () => {\n    console.log(\'SIGTERM received — beginning graceful shutdown\');\n    isShuttingDown = true;\n    await app.close(); // Triggers onModuleDestroy hooks\n  });\n}\n```\n\nWebSocket graceful drain:\n```typescript\n@Injectable()\nexport class WsGateway implements OnModuleDestroy {\n  @WebSocketServer() server: Server;\n  \n  async onModuleDestroy() {\n    // Notify all clients to reconnect\n    this.server.emit(\'server:restart\', { reconnectAfter: 5000 });\n    \n    // Wait for clients to disconnect or force-close after timeout\n    await Promise.race([\n      this.waitForClientsToDisconnect(),\n      new Promise(resolve => setTimeout(resolve, 10000)), // 10s max wait\n    ]);\n    \n    this.server.close();\n  }\n}\n```\n\nBackground job drain (BullMQ):\n```typescript\n@Injectable()\nexport class JobQueueService implements OnModuleDestroy {\n  async onModuleDestroy() {\n    // Pause queue — stop accepting new jobs\n    await this.queue.pause();\n    \n    // Wait for active jobs to complete\n    const activeJobs = await this.queue.getActive();\n    await Promise.all(activeJobs.map(job => job.waitUntilFinished(this.queueEvents)));\n    \n    await this.queue.close();\n  }\n}\n```\n\nReadiness probe removes pod from load balancer rotation before SIGTERM arrives (Kubernetes sends SIGTERM, load balancer update, and readiness probe failure concurrently — add a 5s sleep before starting shutdown to handle this race condition).',
      trade_offs: [
        {
          approach: 'Short grace period (30s) with job checkpointing',
          pros: ['Fast rollout', 'Kubernetes recycles pod quickly'],
          cons: [
            'Jobs longer than 30s are interrupted',
            'Must implement job resumption from checkpoint',
          ],
        },
        {
          approach: 'Long grace period (5min) wait for all jobs',
          pros: ['No interrupted jobs', 'Simpler job logic (no checkpointing)'],
          cons: [
            'Slow rollouts',
            'OOMKilled if job exceeds memory before finishing',
            'Kubernetes cluster resources held longer',
          ],
        },
        {
          approach: 'Separate job worker deployment from API deployment',
          pros: ['API can redeploy in 30s', 'Workers can have 5min grace periods independently', 'Clear separation of concerns'],
          cons: ['Two deployments to manage', 'Shared code changes need both deployed'],
        },
      ],
      real_world_example:
        'A video processing platform had NestJS workers that processed 10-minute video jobs. Initial setup: 30s grace period meant in-progress jobs were killed mid-encoding, corrupting output files. Fix: (1) separated video workers into a separate Kubernetes Deployment with `terminationGracePeriodSeconds: 720`, (2) API pods kept 30s grace period with only fast request handling, (3) video workers implemented S3 checkpoint uploads every 60s for recovery. Zero interrupted jobs for 6 months after this change.',
      red_flags: [
        'Not calling `app.enableShutdownHooks()` — onModuleDestroy never runs on SIGTERM',
        'Kubernetes terminationGracePeriodSeconds shorter than longest job duration',
        'WebSocket server.close() without notifying clients — clients see connection reset errors',
        'Not adding a sleep before shutdown — race condition with load balancer routing update',
        'Marking readiness probe as failed but not waiting before shutting down — in-flight requests dropped',
      ],
      follow_up_questions: [
        'What is the difference between SIGTERM and SIGKILL and why does it matter?',
        'How do you implement blue-green deployments vs rolling deployments in Kubernetes?',
        'How do you handle database migrations during zero-downtime deployments?',
        'What is a preStop lifecycle hook in Kubernetes and when do you use it?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you architect a NestJS service for processing file uploads at scale — handling 10GB CSV files, progress tracking, and failure recovery — without blocking the event loop or exhausting memory?',
    answer: buildAnswer({
      short_answer:
        'Stream file directly to object storage (S3) without buffering in memory, use multipart upload for large files, queue processing jobs with BullMQ pointing to the stored file, and process with Node.js streams with backpressure to stay within memory limits.',
      detailed_answer:
        'A 10GB file buffered in memory crashes a Node.js process with default 1.5GB heap. The solution is never to buffer the entire file.\n\nUpload flow:\n1. Client POSTs to NestJS endpoint\n2. NestJS streams the request body directly to S3 using AWS SDK streaming upload\n3. Returns a job ID immediately — does not wait for processing\n4. Background worker reads from S3, processes with streams, updates progress\n\n```typescript\n@Post(\'upload\')\n@UseInterceptors(FileInterceptor(\'file\'))\nasync uploadFile(@UploadedFile() file: Express.Multer.File) {\n  // ❌ BAD: multer.memoryStorage() loads entire file into memory\n  // ✅ GOOD: Use diskStorage then stream to S3, or pipe req.body directly\n  \n  const uploadId = uuid();\n  const s3Key = `uploads/${uploadId}/${file.originalname}`;\n  \n  // Stream to S3 - never buffers entire file\n  await this.s3Client.send(new PutObjectCommand({\n    Bucket: process.env.S3_BUCKET,\n    Key: s3Key,\n    Body: Readable.from(file.buffer), // Or use multer diskStorage + fs.createReadStream\n    ContentLength: file.size,\n  }));\n  \n  const job = await this.processingQueue.add(\'processCSV\', {\n    s3Key, uploadId, totalRows: null, // Unknown until processed\n  });\n  \n  return { jobId: job.id, uploadId };\n}\n```\n\nStreaming CSV processing:\n```typescript\nasync processCSV(job: Job<{ s3Key: string; uploadId: string }>) {\n  const s3Stream = (await this.s3.getObject(s3Key)).Body as Readable;\n  let processedRows = 0;\n  \n  const parser = s3Stream\n    .pipe(csv.parse({ headers: true, backpressure: true }))\n    .pipe(new Transform({\n      objectMode: true,\n      transform: async (row, _, callback) => {\n        await this.processRow(row); // Database write\n        processedRows++;\n        \n        if (processedRows % 1000 === 0) {\n          await job.updateProgress(processedRows); // Progress tracking\n        }\n        callback();\n      },\n      highWaterMark: 100, // Buffer max 100 rows — backpressure control\n    }));\n  \n  await pipeline(parser); // Properly handles backpressure and errors\n}\n```\n\nFailure recovery:\n- Store last processed row cursor (line number or record ID) in Redis\n- On retry, skip rows until cursor reached\n- S3 supports range requests: `Range: bytes=1000000-` to resume from byte offset\n\nMemory profile: With `highWaterMark: 100` rows, memory stays constant at ~50MB regardless of file size. Without backpressure, fast S3 reads + slow DB writes would buffer millions of rows in memory.',
      trade_offs: [
        {
          approach: 'In-process streaming with worker threads',
          pros: ['No external queue dependency', 'Lower latency for small files', 'Simpler architecture'],
          cons: [
            'Long-running jobs block worker thread pool',
            'No retry on process crash',
            'No visibility into progress without custom IPC',
          ],
        },
        {
          approach: 'Queue-based processing (BullMQ + Redis)',
          pros: ['Retry on failure', 'Progress tracking built-in', 'Horizontal scaling of workers'],
          cons: [
            'Redis dependency',
            'Job data serialized to Redis (overhead for large metadata)',
            'Added latency before processing starts',
          ],
        },
        {
          approach: 'AWS Lambda for processing (serverless)',
          pros: ['Infinite parallelism', 'No idle costs', 'Managed scaling'],
          cons: [
            '15-minute timeout limit — bad for 10GB files',
            'Cold start latency',
            'S3-triggered Lambda can\'t do streaming (buffered)',
          ],
        },
      ],
      real_world_example:
        'A payroll SaaS needed to import 5GB CSV files with 10M employee records monthly. Initial implementation used `multer.memoryStorage()` — 5GB upload killed the pod (OOMKill) every time. Solution: (1) client uploads directly to S3 presigned URL (bypasses NestJS entirely), (2) S3 event triggers SQS message, (3) NestJS worker picks up SQS message, streams from S3 with `highWaterMark: 500` rows, writes in batches of 500 using TypeORM `insert()`. Processing time: 45 minutes for 10M rows. Memory constant at 85MB.',
      red_flags: [
        'Using `multer.memoryStorage()` for files >100MB — guaranteed OOMKill',
        'Reading entire CSV into array before processing — O(n) memory for n rows',
        'Not using `stream.pipeline()` — manual pipe loses error propagation',
        'Missing backpressure — fast producer + slow consumer buffers infinitely',
        'No progress checkpoint — on failure must restart from row 0',
      ],
      follow_up_questions: [
        'What is backpressure and how does Node.js streams implement it?',
        'How do you implement resumable uploads with S3 multipart upload?',
        'How would you process the same CSV file in parallel across multiple workers?',
        'What are the trade-offs between processing files synchronously vs asynchronously?',
      ],
    }),
    topicSlug: 'nestjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
];
