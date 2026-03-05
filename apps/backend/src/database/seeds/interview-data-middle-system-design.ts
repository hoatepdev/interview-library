/**
 * Middle-Level System Design Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: real-world trade-offs, scalability patterns, practical design decisions.
 *
 * Topics: system-design (20)
 * Level: MIDDLE
 *
 * Usage: pnpm --filter backend seed:middle-system-design
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

// ============================================
// SYSTEM DESIGN — MIDDLE LEVEL (20 questions)
// ============================================

export const middleSystemDesignQuestions: QuestionSeed[] = [
  // 1. API Design: REST vs GraphQL vs gRPC
  {
    title: "REST vs GraphQL vs gRPC — how do you choose?",
    content:
      "Compare REST, GraphQL, and gRPC. What are the key trade-offs? In which scenarios would you choose each?",
    answer: `**REST**:
- Resources modeled as URLs (\`GET /users/:id\`, \`POST /orders\`)
- Stateless, cacheable, widely understood
- Problem: over-fetching (too many fields) and under-fetching (N+1 requests)

\`\`\`
GET /users/1         → { id, name, email, address, ... }  (over-fetch)
GET /users/1/posts   → extra round trip (under-fetch)
\`\`\`

**GraphQL**:
- Client specifies exactly what it needs in a single query
- Single endpoint (\`POST /graphql\`)
- Eliminates over/under-fetching

\`\`\`graphql
query {
  user(id: "1") {
    name
    posts(limit: 5) { title }
  }
}
\`\`\`

**Drawbacks of GraphQL**: Complex caching (no URL-based cache), N+1 problem requires DataLoader, higher learning curve, harder to rate-limit per operation.

**gRPC**:
- Binary protocol (Protocol Buffers), strongly typed contracts
- HTTP/2: multiplexed streams, bi-directional streaming
- ~5–10× faster serialization than JSON
- Ideal for internal service-to-service communication

\`\`\`protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc StreamUserEvents (UserEventFilter) returns (stream UserEvent);
}
\`\`\`

**When to choose**:

| Scenario | Choice |
|----------|--------|
| Public API, broad client support | REST |
| Mobile/web apps with varied data needs | GraphQL |
| Internal microservices, high throughput | gRPC |
| Real-time streaming between services | gRPC (streaming) |
| Simple CRUD, team unfamiliar with alternatives | REST |
| BFF (Backend For Frontend) | GraphQL |

**Hybrid approach**: REST for public API + gRPC between internal services — common in production.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 2. Caching Strategies
  {
    title: "Explain caching strategies: Cache-Aside, Write-Through, Write-Back, and Read-Through",
    content:
      "What are the different caching patterns? When should you use each? How do you handle cache invalidation and consistency?",
    answer: `**Cache-Aside (Lazy Loading)** — most common pattern:
\`\`\`
Read:  Check cache → miss → query DB → populate cache → return
Write: Update DB → invalidate cache (or update cache)
\`\`\`
\`\`\`typescript
async function getUser(id: string) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  await redis.set(\`user:\${id}\`, JSON.stringify(user), 'EX', 3600);
  return user;
}
async function updateUser(id: string, data: Partial<User>) {
  await db.users.update(id, data);
  await redis.del(\`user:\${id}\`); // invalidate
}
\`\`\`
**Pros**: Only caches what's actually used. **Cons**: Cache miss penalty, potential stale data.

**Write-Through**: Write to cache AND DB simultaneously.
\`\`\`
Write: Update cache + DB (sync) → always consistent
Read:  Check cache → always hit after first write
\`\`\`
**Pros**: Cache always up-to-date. **Cons**: Write latency (2 writes), cache fills with unread data.

**Write-Back (Write-Behind)**: Write to cache first, flush to DB asynchronously.
\`\`\`
Write: Update cache → ack immediately → background flush to DB
\`\`\`
**Pros**: Very fast writes. **Cons**: Risk of data loss if cache crashes before flush; complex.

**Read-Through**: Cache sits in front of DB; on miss, cache fetches from DB itself.
\`\`\`
Read: Cache hit → return | Cache miss → cache fetches DB → populate → return
\`\`\`
**Pros**: Application code simpler. **Cons**: Cache layer must know how to query DB.

**Cache invalidation strategies**:
- **TTL (Time To Live)**: Simple, but stale window exists. \`EX 3600\`
- **Event-driven invalidation**: Publish events on writes, subscribers invalidate. More complex but precise.
- **Cache versioning**: Embed version in key — \`user:123:v2\`. No deletion needed.
- **Write-through**: Avoid staleness by always updating cache on writes.

**Common pitfalls**:
- **Cache stampede**: Many simultaneous misses → DB overload. Fix: mutex lock on miss, probabilistic early refresh.
- **Thundering herd**: Cache restart → all misses at once. Fix: warm up cache before switching traffic.
- **Stale reads**: Acceptable for some data (product descriptions), not others (inventory, balances).`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 3. Message Queues
  {
    title: "When and why would you use a message queue in your architecture?",
    content:
      "Explain the benefits of async messaging, different queue patterns (pub/sub, point-to-point, fan-out), and when to use Kafka vs RabbitMQ vs SQS.",
    answer: `**Why message queues?**
- **Decoupling**: Producer doesn't need to know about consumers
- **Load leveling**: Queue absorbs traffic spikes; consumers process at their own pace
- **Reliability**: Messages persist if consumer is down; retry on failure
- **Async processing**: Offload slow tasks (email, PDF generation, video encoding)

**Patterns**:

**Point-to-Point (Queue)**: One message → one consumer. For job queues.
\`\`\`
Producer → [Queue] → Consumer A  (each message consumed once)
\`\`\`

**Pub/Sub (Topic)**: One message → multiple consumers independently.
\`\`\`
Producer → [Topic] → Consumer A (email service)
                   → Consumer B (analytics)
                   → Consumer C (push notification)
\`\`\`

**Fan-out**: Broadcast to all consumers simultaneously.

**Kafka vs RabbitMQ vs SQS**:

| Feature | Kafka | RabbitMQ | SQS |
|---------|-------|----------|-----|
| Model | Log-based pub/sub | AMQP broker | Managed queue |
| Message retention | Days/weeks (replayable) | Until ACK | 14 days max |
| Throughput | Very high (millions/sec) | High | High |
| Ordering | Per-partition guarantee | Per-queue | FIFO queue option |
| Replay messages | Yes (seek to offset) | No | No |
| Managed | Confluent Cloud / MSK | CloudAMQP | AWS-native |
| Best for | Event streaming, audit log | Complex routing, RPC | AWS ecosystem, simple queues |

**Practical example — order processing**:
\`\`\`
POST /orders → [orders topic] → inventory-service (reserve stock)
                              → payment-service (charge card)
                              → email-service (confirmation)
                              → analytics-service (record event)
\`\`\`

**Guarantees**:
- **At most once**: Fire and forget, no retry
- **At least once**: Retry on failure, possible duplicates → design consumers to be idempotent
- **Exactly once**: Hardest; Kafka transactions or deduplication keys

**Idempotency**:
\`\`\`typescript
// Use idempotency key to prevent double-processing
async function processPayment(event: PaymentEvent) {
  const alreadyProcessed = await redis.get(\`payment:\${event.id}\`);
  if (alreadyProcessed) return; // already done

  await chargeCard(event);
  await redis.set(\`payment:\${event.id}\`, '1', 'EX', 86400);
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 4. Database Sharding vs Replication
  {
    title: "Explain database replication vs sharding and when to use each",
    content:
      "What problems does replication solve vs sharding? What are the trade-offs and common pitfalls of each approach?",
    answer: `**Replication**: Copies of the same data on multiple servers.

\`\`\`
Primary ──writes──→ [Primary DB]
                        │
               ┌────────┼────────┐
               ↓        ↓        ↓
           [Replica1] [Replica2] [Replica3]
               ↑reads from replicas↑
\`\`\`

**What it solves**:
- Read scaling: distribute SELECT queries across replicas
- High availability: failover to replica if primary dies
- Disaster recovery: replicas in different data centers

**Types**:
- **Synchronous**: Primary waits for replica ACK — zero data loss, higher write latency
- **Asynchronous**: Primary doesn't wait — low latency, small replication lag (eventual consistency)
- **Read replicas**: Async, route all reads there (common for analytics/reporting)

**Sharding**: Splits data horizontally across multiple databases.

\`\`\`
User ID 1–1M   → [Shard 1 DB]
User ID 1M–2M  → [Shard 2 DB]
User ID 2M–3M  → [Shard 3 DB]
\`\`\`

**Sharding strategies**:
- **Range-based**: \`user_id 1–1M → shard1\`. Simple but hotspots (all new users on latest shard).
- **Hash-based**: \`shard = hash(user_id) % num_shards\`. Even distribution, but resharding is painful.
- **Directory-based**: Lookup table maps key → shard. Flexible, but lookup is a bottleneck/SPOF.

**Sharding challenges**:
- **Cross-shard queries**: \`JOIN users u JOIN orders o\` — u and o may be on different shards
- **Distributed transactions**: Two-phase commit (2PC) is complex and slow
- **Resharding**: Adding a new shard requires rebalancing data — major operational effort
- **Schema changes**: Must apply to all shards simultaneously

**Choosing between them**:

| Problem | Solution |
|---------|----------|
| Read traffic too high | Read replicas |
| Primary is overloaded with reads | Read replicas |
| Need HA / failover | Replication |
| Write traffic too high | Sharding |
| Dataset too large for one server | Sharding |
| Single table > 100M rows | Sharding (or partitioning first) |

**Before sharding — try these first**:
1. Read replicas for read scaling
2. Query optimization + indexes
3. Caching (Redis) for hot data
4. Table partitioning (PostgreSQL native, single server)
5. Vertical scaling

Sharding is a last resort — it adds enormous operational complexity.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 5. API Gateway
  {
    title: "What is an API Gateway and what problems does it solve?",
    content:
      "Explain the role of an API Gateway in a microservices architecture. What cross-cutting concerns does it handle?",
    answer: `**API Gateway**: Single entry point for all client requests; routes to appropriate services and handles cross-cutting concerns.

\`\`\`
Client → [API Gateway] → user-service
                       → order-service
                       → payment-service
                       → notification-service
\`\`\`

**Cross-cutting concerns handled by the Gateway**:

**1. Authentication & Authorization**:
\`\`\`
Client → Gateway: validate JWT/session → forward user identity via header
         ↓ reject 401 if invalid
\`\`\`

**2. Rate Limiting**:
- Per IP, per user, per API key
- Protect downstream services from abuse
- Return 429 Too Many Requests

**3. SSL Termination**:
- Clients connect via HTTPS to gateway
- Internal services communicate over HTTP (within private network)

**4. Request routing**:
\`\`\`
/api/users/*     → user-service:3001
/api/orders/*    → order-service:3002
/api/products/*  → product-service:3003
\`\`\`

**5. Request/Response transformation**:
- Translate between REST and gRPC
- Aggregate multiple service calls into one response (BFF pattern)
- Add/strip headers

**6. Logging, tracing, metrics**:
- Centralized access logs
- Inject trace IDs for distributed tracing (X-Request-ID, W3C Trace Context)

**7. Circuit breaking**:
- Stop forwarding requests to unhealthy services
- Return cached/fallback response

**Popular API Gateways**:

| Gateway | Type | Best For |
|---------|------|----------|
| AWS API Gateway | Managed | AWS-native serverless/REST |
| Kong | OSS/Enterprise | Kubernetes, plugin ecosystem |
| Nginx / Caddy | Reverse proxy | Simple routing, high performance |
| Traefik | Cloud-native | Kubernetes, auto service discovery |
| Envoy | Proxy | Service mesh (Istio), gRPC |

**BFF (Backend for Frontend) pattern**:
\`\`\`
Mobile App  → [Mobile BFF]  → aggregates multiple services
Web App     → [Web BFF]     → returns exactly what UI needs
Third-party → [Public API]  → versioned, documented REST API
\`\`\`

**Pitfall**: Don't put business logic in the API Gateway — it should only route and enforce cross-cutting concerns. Business logic belongs in services.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 6. Designing for High Availability
  {
    title: "How do you design a system for high availability?",
    content:
      "What does high availability mean? Explain the key patterns: redundancy, failover, health checks, circuit breakers, and graceful degradation.",
    answer: `**High Availability (HA)**: System remains operational despite component failures. Measured as uptime percentage.

| Availability | Downtime/year | Downtime/month |
|-------------|---------------|----------------|
| 99% ("two nines") | ~87 hours | ~7 hours |
| 99.9% ("three nines") | ~8.7 hours | ~43 min |
| 99.99% ("four nines") | ~52 min | ~4 min |
| 99.999% ("five nines") | ~5 min | ~26 sec |

**Key HA patterns**:

**1. Redundancy** — eliminate single points of failure (SPOF):
\`\`\`
Without HA:  Client → App Server → DB
             (any single failure = outage)

With HA:     Client → [Load Balancer] → App Server 1
                                      → App Server 2
                                      → App Server 3
             [DB Primary] ↔ [DB Replica] (auto-failover)
\`\`\`

**2. Health checks**:
\`\`\`typescript
// Liveness: is the process alive?
app.get('/health/live', (req, res) => res.send('OK'));

// Readiness: is the service ready to take traffic?
app.get('/health/ready', async (req, res) => {
  const dbOk = await checkDatabase();
  const redisOk = await checkRedis();
  if (dbOk && redisOk) return res.send('OK');
  res.status(503).send('Not ready');
});
\`\`\`

**3. Circuit Breaker**:
\`\`\`
Closed (normal) → failures > threshold → Open (reject fast) → half-open (probe) → Closed
\`\`\`
\`\`\`typescript
// Using opossum (Node.js circuit breaker)
const breaker = new CircuitBreaker(callPaymentService, {
  timeout: 3000,        // call times out after 3s
  errorThresholdPercentage: 50,  // open if 50% fail
  resetTimeout: 30000,  // try again after 30s
});
\`\`\`

**4. Bulkhead pattern** — isolate failures:
\`\`\`
Without: All services share one DB connection pool
         → one slow service starves others

With Bulkhead: user-service:  pool of 10 connections
               order-service: pool of 10 connections
               → each service is independently limited
\`\`\`

**5. Graceful degradation**:
\`\`\`typescript
async function getProductPage(id: string) {
  const product = await productService.get(id); // required
  const reviews = await reviewService.get(id).catch(() => []); // optional
  const recommendations = await mlService.get(id).catch(() => []); // optional
  return { product, reviews, recommendations };
  // Page works even if reviews/recommendations service is down
}
\`\`\`

**6. Retry with exponential backoff**:
\`\`\`typescript
async function withRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(Math.pow(2, i) * 100 + Math.random() * 100); // jitter
    }
  }
}
\`\`\`

**Multi-region HA**: Active-passive (failover) vs Active-active (both serve traffic) — active-active is more complex but eliminates failover delay.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 7. Designing a Notification System
  {
    title: "Design a notification system (email, push, SMS)",
    content:
      "How would you design a scalable notification system that supports multiple channels (email, push notifications, SMS) with delivery guarantees and user preferences?",
    answer: `**Requirements**:
- Multi-channel: email, push (FCM/APNs), SMS
- User preference management (which channels, opt-outs)
- At-least-once delivery with deduplication
- High throughput, async processing

**High-level architecture**:
\`\`\`
[Services] → publish event → [Message Queue]
                                    ↓
                         [Notification Dispatcher]
                          ↙        ↓         ↘
              [Email Worker] [Push Worker] [SMS Worker]
                    ↓              ↓            ↓
              [SendGrid]       [FCM/APNs]   [Twilio]
\`\`\`

**Database schema**:
\`\`\`sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,   -- 'order_confirmed', 'password_reset'
  channel TEXT NOT NULL,      -- 'email', 'push', 'sms'
  subject TEXT,
  body_template TEXT NOT NULL -- Handlebars/Mustache template
);

CREATE TABLE user_notification_prefs (
  user_id UUID REFERENCES users(id),
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, channel, event_type)
);

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,       -- 'pending', 'sent', 'failed', 'bounced'
  idempotency_key TEXT UNIQUE,-- prevent duplicates
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

**Dispatcher service**:
\`\`\`typescript
async function dispatchNotification(event: NotificationEvent) {
  const prefs = await getUserPreferences(event.userId, event.type);
  const channels = prefs.filter(p => p.enabled).map(p => p.channel);

  for (const channel of channels) {
    const idempotencyKey = \`\${event.id}:\${channel}\`;
    const alreadySent = await notificationLog.findByIdempotencyKey(idempotencyKey);
    if (alreadySent) continue; // deduplicate

    const template = await getTemplate(event.type, channel);
    const rendered = renderTemplate(template, event.data);

    await queue.publish(\`notifications.\${channel}\`, {
      ...rendered,
      userId: event.userId,
      idempotencyKey,
    });
  }
}
\`\`\`

**Handling failures**:
- Retry with exponential backoff (up to 3 attempts)
- Dead-letter queue (DLQ) for permanently failed messages
- Alert on DLQ depth

**Rate limiting**: Respect provider limits (SendGrid: 100/s, Twilio: 1/s per number) using token bucket per provider.

**Scaling**:
- Separate worker pools per channel (email burst doesn't block SMS)
- Priority queues: transactional (password reset) > marketing
- Batching for bulk emails (SendGrid bulk API)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 8. Pagination Strategies
  {
    title: "What are the different pagination strategies and when should you use each?",
    content:
      "Compare offset/limit pagination, cursor-based pagination, and keyset pagination. What are the trade-offs for large datasets?",
    answer: `**1. Offset/Limit Pagination** — most common, simplest:
\`\`\`sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 40;
-- Page 3 of 20 items = OFFSET 40
\`\`\`

\`\`\`typescript
// API: GET /posts?page=3&limit=20
const offset = (page - 1) * limit;
const posts = await db.query(\`SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2\`, [limit, offset]);
const total = await db.query(\`SELECT COUNT(*) FROM posts\`);
return { posts, total, page, totalPages: Math.ceil(total / limit) };
\`\`\`

**Problems**:
- **Performance degrades with large offsets**: \`OFFSET 100000\` scans and discards 100K rows
- **Inconsistency on inserts**: New row inserted on page 1 while user reads page 2 → row appears twice or is skipped

**2. Cursor-Based (Opaque Cursor) Pagination**:
\`\`\`typescript
// Encode the last seen item's position as a cursor
const cursor = Buffer.from(JSON.stringify({ id: lastPost.id, createdAt: lastPost.createdAt })).toString('base64');

// API: GET /posts?after=eyJpZCI6IjEyMyIs...&limit=20
const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
const posts = await db.query(
  \`SELECT * FROM posts
   WHERE (created_at, id) < ($1, $2)
   ORDER BY created_at DESC, id DESC
   LIMIT $3\`,
  [decoded.createdAt, decoded.id, limit]
);
const nextCursor = posts.length === limit
  ? Buffer.from(JSON.stringify({ id: posts[posts.length-1].id, createdAt: posts[posts.length-1].createdAt })).toString('base64')
  : null;
\`\`\`

**3. Keyset Pagination** — same concept, explicit columns:
\`\`\`sql
-- After seeing (created_at='2024-01-15', id='abc'):
SELECT * FROM posts
WHERE (created_at, id) < ('2024-01-15 14:00:00', 'abc')
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- Uses a composite index → O(log N) regardless of page depth
\`\`\`

**Comparison**:

| Feature | Offset/Limit | Cursor/Keyset |
|---------|-------------|---------------|
| Random page access | ✅ Yes | ❌ No (forward/backward only) |
| Total count | ✅ Easy | ❌ Expensive |
| Performance on deep pages | ❌ Slow | ✅ Constant |
| Stable under concurrent writes | ❌ Inconsistent | ✅ Stable |
| Complexity | ✅ Simple | ❌ More complex |

**Choosing**:
- **Offset/Limit**: Admin dashboards, reports with total count, small tables
- **Cursor/Keyset**: Infinite scroll (social feeds), large datasets (> 100K rows), real-time data
- **Hybrid**: Use offset for first few pages, switch to cursor for deep pagination`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 9. Idempotency in APIs
  {
    title: "How do you design idempotent APIs?",
    content:
      "What is idempotency, why is it important, and how do you implement it for payment processing or any critical mutation?",
    answer: `**Idempotency**: Performing the same operation multiple times produces the same result as doing it once.

**Why it matters**: Networks are unreliable. If a client doesn't receive a response (timeout, disconnect), it can't know if the server processed the request. Without idempotency, retrying causes duplicate charges, double emails, etc.

**HTTP method idempotency**:
- **GET, PUT, DELETE**: Idempotent by definition (spec)
- **POST**: Not idempotent by default — must be made idempotent explicitly

**Implementing idempotency keys**:
\`\`\`
Client generates UUID: "idempotency-key: 7f9c2ba2-1234-4a1b-b7c8-abc123"
          ↓
POST /payments { amount: 100, currency: 'USD' }
Headers: Idempotency-Key: 7f9c2ba2-1234-4a1b-b7c8-abc123
\`\`\`

**Server implementation**:
\`\`\`typescript
@Post('/payments')
async createPayment(
  @Headers('idempotency-key') idempotencyKey: string,
  @Body() dto: CreatePaymentDto,
) {
  if (!idempotencyKey) throw new BadRequestException('Idempotency-Key header required');

  // 1. Check if we've seen this key before
  const cached = await redis.get(\`idem:\${idempotencyKey}\`);
  if (cached) {
    const result = JSON.parse(cached);
    return result; // Return same response as original request
  }

  // 2. Acquire lock to prevent race conditions (concurrent retries)
  const lockAcquired = await redis.set(
    \`idem:lock:\${idempotencyKey}\`, '1', 'NX', 'EX', 30
  );
  if (!lockAcquired) throw new ConflictException('Request in progress');

  try {
    // 3. Process the request
    const payment = await this.paymentsService.charge(dto);

    // 4. Cache the result (expires after 24 hours)
    await redis.set(\`idem:\${idempotencyKey}\`, JSON.stringify(payment), 'EX', 86400);

    return payment;
  } finally {
    await redis.del(\`idem:lock:\${idempotencyKey}\`);
  }
}
\`\`\`

**Database-level idempotency**:
\`\`\`sql
-- Use the idempotency key as unique constraint
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,  -- enforces uniqueness at DB level
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO payments (id, idempotency_key, user_id, amount, status)
VALUES ($1, $2, $3, $4, 'pending')
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING *;
\`\`\`

**Key considerations**:
- **Scope**: Key should be scoped to user + operation (not global) to prevent cross-user conflicts
- **Expiry**: Store results for 24–48 hours; clients shouldn't retry after that
- **Same payload check**: Optionally validate that the retry uses the same payload (reject if different)
- **Non-idempotent side effects**: Emails — use the idempotency key to track whether the email was sent`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 10. Search System Design
  {
    title: "How would you design a search feature for a large e-commerce platform?",
    content:
      "Design a search system that handles product search with filtering, facets, and relevance ranking at scale. Compare different approaches.",
    answer: `**Requirements**:
- Full-text search (product names, descriptions)
- Filtering by category, price range, brand, attributes
- Faceted counts (how many results per filter value)
- Relevance ranking + business boosting
- Sub-100ms response times at scale

**Why not PostgreSQL FTS alone**:
- Faceted search is expensive with multiple COUNT queries
- Relevance tuning is limited
- Scaling reads across shards is complex
- No native support for geo-search, synonyms, autocomplete

**Elasticsearch-based architecture**:
\`\`\`
[Products DB] → [Change Data Capture / Event Bus] → [Indexer Service] → [Elasticsearch]
                                                                              ↑
[Search API] ←──────────────────────────────────────────────── search queries
\`\`\`

**Index mapping**:
\`\`\`json
{
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "english", "boost": 3 },
      "description": { "type": "text", "analyzer": "english" },
      "category": { "type": "keyword" },
      "brand": { "type": "keyword" },
      "price": { "type": "float" },
      "rating": { "type": "float" },
      "in_stock": { "type": "boolean" },
      "attributes": { "type": "object" }
    }
  }
}
\`\`\`

**Search query with filters + facets**:
\`\`\`json
{
  "query": {
    "bool": {
      "must": [{ "multi_match": { "query": "wireless headphones", "fields": ["name^3", "description"] }}],
      "filter": [
        { "term": { "in_stock": true }},
        { "range": { "price": { "gte": 50, "lte": 300 }}}
      ]
    }
  },
  "aggs": {
    "brands": { "terms": { "field": "brand", "size": 20 }},
    "price_ranges": { "range": { "field": "price", "ranges": [{"to": 50}, {"from": 50, "to": 200}, {"from": 200}]}}
  },
  "sort": [
    { "_score": "desc" },
    { "rating": "desc" }
  ]
}
\`\`\`

**Keeping search index in sync**:
\`\`\`
Option A: Dual write (write DB + ES in same service) — simple but can get out of sync
Option B: CDC (Debezium reads DB WAL → Kafka → indexer) — reliable, eventual consistency
Option C: Event-driven (product-service publishes events → indexer subscribes) — clean but needs events for all changes
\`\`\`

**Scaling**:
- Elasticsearch: 3-node cluster minimum, sharding per index
- Cache common searches in Redis (TTL 5 min)
- Query suggest / autocomplete: separate lightweight index with \`completion\` field

**Fallback strategy**: If Elasticsearch is down, fall back to PostgreSQL full-text search (degraded but functional).`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 11. Event-Driven Architecture
  {
    title: "What is event-driven architecture and what are its trade-offs?",
    content:
      "Explain events vs commands vs queries, eventual consistency, and the challenges of debugging and maintaining event-driven systems.",
    answer: `**Event-Driven Architecture (EDA)**: Services communicate by producing and consuming events (facts that have occurred), rather than calling each other directly.

**Events vs Commands vs Queries**:
- **Event**: "OrderPlaced" — something happened; past tense; fire-and-forget; multiple consumers
- **Command**: "PlaceOrder" — request to do something; one recipient; may be rejected
- **Query**: "GetOrder" — request for data; synchronous; no side effects

**Request-driven (synchronous)**:
\`\`\`
Order Service → HTTP → Payment Service → HTTP → Inventory Service
(tight coupling, cascading failures)
\`\`\`

**Event-driven (asynchronous)**:
\`\`\`
Order Service → publishes OrderPlaced → [Kafka Topic]
                                              ↓
                               ┌──────────────┼──────────────┐
                          Payment Svc    Inventory Svc    Email Svc
                         (charge card) (reserve stock)  (send receipt)
\`\`\`

**Benefits**:
- Loose coupling: services don't know about each other
- Independent scaling and deployment
- Natural audit log (event stream)
- Replayability: new service can process historical events

**Challenges**:

**1. Eventual consistency**:
\`\`\`
Order shows "confirmed" in order-service
but inventory hasn't updated yet → customer sees wrong stock
\`\`\`

**2. Distributed transaction problem** — Saga pattern:
\`\`\`
Choreography Saga:
OrderPlaced → PaymentService charges → PaymentCompleted
→ InventoryService reserves → InventoryReserved
→ ShippingService schedules → OrderFulfilled

If payment fails → PaymentFailed → InventoryService listens and cancels reservation
\`\`\`

**3. Debugging complexity**:
\`\`\`
Request ID → spans across 5 services → need distributed tracing (Jaeger, Zipkin)
Event ordering → events can arrive out of order → use event timestamps + idempotency
\`\`\`

**4. Schema evolution**:
\`\`\`json
// v1 event:  { "orderId": "123", "amount": 100 }
// v2 event:  { "orderId": "123", "amount": 100, "currency": "USD" }
// Consumers must handle both versions gracefully
// Use schema registry (Confluent) + Avro/Protobuf
\`\`\`

**Event sourcing** (advanced): Store events as the source of truth, derive state by replaying.
\`\`\`
Events: [OrderCreated, ItemAdded, ItemAdded, PaymentReceived, OrderShipped]
State = fold(events) → current order state
\`\`\`

**When to use EDA**: Long-running workflows, multiple consumers per event, audit requirements, independent team deployments. Avoid for simple CRUD apps — the complexity isn't worth it.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 12. Microservices vs Monolith
  {
    title: "Microservices vs Monolith — how do you decide which architecture to use?",
    content:
      "What are the genuine trade-offs between microservices and a monolith? When should you split services and what are the common pitfalls of premature decomposition?",
    answer: `**Monolith**: All functionality in one deployable unit.
\`\`\`
[Single App]
├── auth module
├── users module
├── orders module
└── payments module
→ One database, one deployment, one process
\`\`\`

**Microservices**: Each capability is a separately deployed service.
\`\`\`
[Auth Service]     → auth DB
[User Service]     → users DB
[Order Service]    → orders DB
[Payment Service]  → payments DB
→ Communicate via HTTP/gRPC/events
\`\`\`

**Monolith advantages**:
- **Simple development**: No network calls between modules, easy debugging, single IDE session
- **Easy transactions**: \`BEGIN; ... COMMIT;\` across any data
- **Low operational overhead**: One deploy, one CI/CD pipeline, one log stream
- **Faster initially**: No inter-service latency, no serialization

**Microservices advantages**:
- **Independent scaling**: Scale payment service 10× without scaling auth
- **Independent deployment**: Release user-service without touching payment-service
- **Technology freedom**: payment-service in Java, notification-service in Node.js
- **Fault isolation**: Payment service crash doesn't take down the whole app
- **Team autonomy**: Each team owns their service end-to-end

**Hidden microservices costs**:
- **Network latency**: Synchronous call chain: 5 services × 10ms = 50ms just for hops
- **Distributed tracing**: You need Jaeger/Zipkin to debug a single request
- **Data consistency**: No cross-service transactions; must use sagas
- **Operational complexity**: 20 services = 20 CI/CD pipelines, 20 docker images, service discovery
- **Testing is hard**: Integration tests require spinning up multiple services

**When microservices make sense**:
- Large team (> 20 engineers) with clear domain boundaries
- Different scaling requirements per service
- Different technology needs per service
- Regulatory isolation (PCI DSS compliance in payment service only)

**Martin Fowler's rule**: Start with a monolith, extract services when you feel the pain.

**Modular monolith** — best of both worlds:
\`\`\`typescript
// Strict module boundaries enforced by code, not by network
@Module({ imports: [] })          // ← only explicit imports allowed
export class OrdersModule {}      // no direct imports from PaymentsModule

// When you eventually split, boundaries are already there
\`\`\`

**Strangler Fig pattern** — migrating from monolith:
\`\`\`
Phase 1: New feature built as microservice, monolith still serves old
Phase 2: Proxy routes specific requests to new service
Phase 3: Migrate remaining functionality, kill the monolith module
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 13. Designing Authentication System
  {
    title: "Design a secure authentication system with JWT and refresh tokens",
    content:
      "How would you design authentication with short-lived access tokens and long-lived refresh tokens? How do you handle token revocation and refresh token rotation?",
    answer: `**Token-based authentication flow**:
\`\`\`
Login:
Client → POST /auth/login → Server validates credentials
       ← access_token (15 min) + refresh_token (7 days, httpOnly cookie)

API Request:
Client → GET /api/data + Authorization: Bearer <access_token>
       ← Server validates JWT signature (no DB lookup!)

Token Refresh:
Client → POST /auth/refresh (sends refresh_token via cookie)
       ← new access_token + rotated refresh_token
\`\`\`

**Access token** (short-lived, stateless):
\`\`\`typescript
// JWT payload
{
  sub: "user-uuid",
  email: "user@example.com",
  role: "user",
  iat: 1709000000,
  exp: 1709000900  // 15 minutes
}

// Validation is stateless (verify signature only, no DB):
const payload = jwt.verify(token, process.env.JWT_SECRET);
\`\`\`

**Refresh token** (long-lived, stored in DB):
\`\`\`sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,   -- store hash, not plaintext
  family TEXT NOT NULL,              -- for rotation theft detection
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON refresh_tokens(user_id);
\`\`\`

**Refresh token rotation** (prevents token theft):
\`\`\`typescript
async function refreshTokens(incomingToken: string) {
  const tokenHash = hash(incomingToken);
  const storedToken = await db.refreshTokens.findByHash(tokenHash);

  if (!storedToken) throw new UnauthorizedException('Invalid token');

  // Reuse detection: if token is already used, entire family is compromised
  if (storedToken.used) {
    await db.refreshTokens.revokeFamily(storedToken.family); // revoke all tokens in this family
    throw new UnauthorizedException('Token reuse detected');
  }

  if (storedToken.expiresAt < new Date()) throw new UnauthorizedException('Token expired');

  // Mark old token as used
  await db.refreshTokens.markUsed(storedToken.id);

  // Issue new tokens
  const newAccessToken = jwt.sign({ sub: storedToken.userId, ... }, JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  await db.refreshTokens.create({
    userId: storedToken.userId,
    tokenHash: hash(newRefreshToken),
    family: storedToken.family,  // same family for reuse detection
    expiresAt: addDays(new Date(), 7),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
\`\`\`

**Token revocation** (logout):
\`\`\`typescript
// On logout: delete all refresh tokens for user (all devices)
await db.refreshTokens.deleteByUserId(userId);
// Access tokens can't be revoked (stateless) — just let them expire (15 min)
// For immediate revocation: use a short-lived blocklist in Redis
await redis.set(\`revoked:\${jti}\`, '1', 'EX', 900); // 15 min TTL = access token lifetime
\`\`\`

**Security best practices**:
- Store refresh token in httpOnly + Secure + SameSite=Strict cookie (not localStorage)
- Use different secrets for access vs refresh tokens
- Rotate signing keys periodically; support multiple valid keys during rotation
- Rate limit /auth/login (prevent brute force)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 14. File Upload Architecture
  {
    title: "How do you design a scalable file upload system?",
    content:
      "Design a system for handling large file uploads (images, videos). Cover direct-to-storage uploads, chunking, processing pipelines, and CDN delivery.",
    answer: `**Naive approach** (don't do this at scale):
\`\`\`
Client → POST /upload (multipart) → App Server → S3
Problem: App server is the bottleneck; large files consume all memory/bandwidth
\`\`\`

**Presigned URL pattern** (recommended):
\`\`\`
1. Client → POST /upload/presign { filename, contentType }
2. Server → generates presigned S3 URL (expires in 15 min)
3. Client → PUT <presigned_url> (uploads directly to S3)
4. Client → POST /upload/confirm { key, filename }
5. Server → verifies upload, creates DB record, triggers processing
\`\`\`

\`\`\`typescript
// Step 2: Generate presigned URL
async function createPresignedUpload(filename: string, contentType: string, userId: string) {
  const key = \`uploads/\${userId}/\${uuid()}/\${filename}\`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Metadata: { 'uploaded-by': userId },
  });
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return { presignedUrl, key };
}

// Step 5: Confirm and trigger async processing
async function confirmUpload(key: string, userId: string) {
  const fileRecord = await db.files.create({ key, userId, status: 'processing' });
  await queue.publish('file.uploaded', { fileId: fileRecord.id, key, userId });
  return fileRecord;
}
\`\`\`

**Multipart upload for large files** (> 100MB):
\`\`\`typescript
// S3 supports multipart upload natively:
// 1. CreateMultipartUpload → uploadId
// 2. UploadPart (5MB–5GB per part, in parallel)
// 3. CompleteMultipartUpload
// Client manages chunking; failed parts can be retried individually
\`\`\`

**Post-upload processing pipeline**:
\`\`\`
S3 Event / Queue message
        ↓
[Processing Worker]
├── Images: resize (thumbnail, medium, large) → store variants in S3
├── Videos: transcode to HLS (multiple bitrates) → store segments in S3
├── Documents: extract text, generate preview
└── All: virus scan, validate content type, extract metadata
        ↓
Update DB record: status = 'ready', add URLs
        ↓
Notify user (webhook / push notification)
\`\`\`

**CDN delivery**:
\`\`\`
CloudFront / Cloudflare sits in front of S3:
User → CDN (edge cache) → S3 (origin, only on cache miss)

Signed CDN URLs for private files:
const signedUrl = cloudfront.getSignedUrl({
  url: \`https://cdn.example.com/\${key}\`,
  expires: Math.floor(Date.now() / 1000) + 3600,
});
\`\`\`

**Resumable uploads** (for unstable connections):
- Use tus protocol (open standard for resumable uploads)
- Client uploads chunks, server tracks offset in Redis
- On reconnect, client asks for current offset and resumes`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 15. Designing a Job Queue / Task Scheduler
  {
    title: "How would you design a background job processing system?",
    content:
      "Design a system for processing background jobs with support for retries, scheduling, priority queues, and observability.",
    answer: `**Why background jobs?**
- Offload slow operations (email, PDF, image processing)
- Retry on failure
- Schedule recurring tasks (daily reports, cleanup)
- Rate-limit expensive API calls

**Architecture**:
\`\`\`
[API Service]  → enqueue job → [Redis / Queue]
                                      ↓
                            [Worker Pool]
                            Worker 1: job processing
                            Worker 2: job processing
                            Worker 3: job processing
                                      ↓
                            [Dead Letter Queue] (failed after max retries)
\`\`\`

**BullMQ (Node.js) example**:
\`\`\`typescript
// Producer (enqueue)
import { Queue } from 'bullmq';

const emailQueue = new Queue('email', { connection: redisConnection });

// Simple job
await emailQueue.add('send-welcome', { userId, email });

// Delayed job (send 1 hour after signup)
await emailQueue.add('send-onboarding', { userId }, { delay: 3600 * 1000 });

// Recurring job (every day at 8am UTC)
await emailQueue.add('daily-digest', {}, {
  repeat: { cron: '0 8 * * *' },
  removeOnComplete: 100,  // keep last 100 completed
});

// Priority (lower = higher priority)
await emailQueue.add('send-password-reset', { userId }, { priority: 1 });
await emailQueue.add('send-newsletter', { userId }, { priority: 10 });
\`\`\`

\`\`\`typescript
// Consumer (worker)
import { Worker } from 'bullmq';

const worker = new Worker('email', async (job) => {
  switch (job.name) {
    case 'send-welcome':
      await emailService.sendWelcome(job.data.userId);
      break;
    case 'daily-digest':
      await digestService.send();
      break;
  }
}, {
  connection: redisConnection,
  concurrency: 5,            // 5 jobs in parallel per worker
  limiter: { max: 100, duration: 60000 },  // 100 jobs/min rate limit
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message });
});
\`\`\`

**Retry strategy**:
\`\`\`typescript
await queue.add('process-payment', data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,  // 1s, 2s, 4s
  },
});
\`\`\`

**Idempotency in workers**:
\`\`\`typescript
async function processPayment(job: Job) {
  const lockKey = \`job:payment:\${job.data.paymentId}\`;
  const lock = await redis.set(lockKey, job.id, 'NX', 'EX', 300);
  if (!lock) return; // already being processed

  try {
    await chargeCard(job.data);
  } finally {
    await redis.del(lockKey);
  }
}
\`\`\`

**Observability**:
- Bull Board or Arena: visual dashboard for queues
- Expose queue depth, failed jobs count as metrics
- Alert on DLQ size growing
- Log job ID, duration, attempt number in each job's logs`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 16. Rate Limiting
  {
    title: "How do you implement rate limiting and what algorithms exist?",
    content:
      "Explain the common rate limiting algorithms: token bucket, leaky bucket, fixed window, sliding window log, and sliding window counter.",
    answer: `**Why rate limit?**
- Prevent abuse / DDoS
- Ensure fair usage
- Protect downstream services
- Enforce API tiers

**Algorithms**:

**1. Fixed Window Counter** — simplest:
\`\`\`
Window: 60 seconds
Counter resets at each minute boundary

Problem: Boundary burst — 100 requests at 00:59, 100 at 01:00 = 200 in 2 seconds
\`\`\`
\`\`\`typescript
const key = \`rl:\${userId}:\${Math.floor(Date.now() / 60000)}\`;
const count = await redis.incr(key);
await redis.expire(key, 60);
if (count > 100) throw new TooManyRequestsException();
\`\`\`

**2. Sliding Window Log** — precise but memory-heavy:
\`\`\`typescript
const now = Date.now();
const windowStart = now - 60000; // 1 minute ago
await redis.zremrangebyscore(key, 0, windowStart);
const count = await redis.zcard(key);
if (count >= 100) throw new TooManyRequestsException();
await redis.zadd(key, now, \`\${now}-\${Math.random()}\`);
await redis.expire(key, 60);
// Memory: stores timestamp of every request
\`\`\`

**3. Sliding Window Counter** — hybrid (precise, memory-efficient):
\`\`\`typescript
const now = Date.now();
const currentWindow = Math.floor(now / 60000);
const prevWindow = currentWindow - 1;
const elapsed = (now % 60000) / 60000; // fraction of current window elapsed

const [prevCount, currCount] = await redis.mget(
  \`rl:\${userId}:\${prevWindow}\`,
  \`rl:\${userId}:\${currentWindow}\`
);
// Weight previous window by remaining time
const estimated = (Number(prevCount) || 0) * (1 - elapsed) + (Number(currCount) || 0);
if (estimated >= 100) throw new TooManyRequestsException();
await redis.incr(\`rl:\${userId}:\${currentWindow}\`);
\`\`\`

**4. Token Bucket** — allows bursts:
\`\`\`
Bucket capacity: 100 tokens
Refill rate: 10 tokens/second
Each request consumes 1 token
Burst allowed up to bucket capacity
\`\`\`

**5. Leaky Bucket** — smooths traffic:
\`\`\`
Requests enter a queue (bucket)
Processed at a fixed rate (leak)
Excess requests dropped
No bursts allowed — good for protecting downstream services
\`\`\`

**Distributed rate limiting** (multi-instance):
\`\`\`typescript
// Use Redis (atomic operations) as shared state
// Lua script for atomic check-and-increment:
const luaScript = \`
  local current = redis.call('incr', KEYS[1])
  if current == 1 then redis.call('expire', KEYS[1], ARGV[1]) end
  return current
\`;
const count = await redis.eval(luaScript, 1, key, '60');
\`\`\`

**Response headers** (good practice):
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1709001600
Retry-After: 30   (on 429 response)
\`\`\`

**Rate limiting levels**:
- Global (all requests): nginx/API Gateway — first line of defense
- Per-IP: protect unauthenticated endpoints
- Per-user: enforce API tiers
- Per-endpoint: /auth/login stricter than /api/products`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 17. Designing a Webhook System
  {
    title: "How would you design a webhook delivery system?",
    content:
      "Design a reliable webhook system that delivers events to third-party URLs with retry logic, signature verification, and observability.",
    answer: `**What is a webhook?**: HTTP callback — your system POSTs to a customer's URL when an event occurs.

**Challenges**:
- Customer's endpoint might be slow, down, or return errors
- Delivery must be reliable (at-least-once)
- Must not block the main application flow
- Need to handle retries without duplicates

**Architecture**:
\`\`\`
[Event occurs in system]
        ↓
[Webhook Dispatcher] → publishes to → [Queue]
                                          ↓
                               [Webhook Worker Pool]
                                     ↓
                          POST to customer endpoint
                          Success → mark delivered
                          Failure → schedule retry
\`\`\`

**Database schema**:
\`\`\`sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,        -- for HMAC signature
  events TEXT[] NOT NULL,      -- ['order.created', 'payment.succeeded']
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, success, failed, abandoned
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  next_attempt_at TIMESTAMPTZ,
  last_response_code INT,
  last_response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);
\`\`\`

**Delivery worker**:
\`\`\`typescript
async function deliverWebhook(delivery: WebhookDelivery) {
  const endpoint = await db.webhookEndpoints.findById(delivery.endpointId);

  // HMAC signature so recipient can verify authenticity
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(delivery.payload);
  const signature = crypto
    .createHmac('sha256', endpoint.secret)
    .update(\`\${timestamp}.\${body}\`)
    .digest('hex');

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': \`t=\${timestamp},v1=\${signature}\`,
        'X-Webhook-ID': delivery.id,        // for idempotency on receiver side
        'X-Webhook-Timestamp': String(timestamp),
      },
      body,
      signal: AbortSignal.timeout(30000),   // 30s timeout
    });

    if (response.ok) {
      await db.webhookDeliveries.update(delivery.id, { status: 'success', deliveredAt: new Date() });
    } else {
      await scheduleRetry(delivery, response.status);
    }
  } catch (err) {
    await scheduleRetry(delivery, null);
  }
}

async function scheduleRetry(delivery: WebhookDelivery, statusCode: number | null) {
  const attempts = delivery.attempts + 1;
  if (attempts >= delivery.maxAttempts) {
    await db.webhookDeliveries.update(delivery.id, { status: 'abandoned', attempts });
    // Alert the customer in their dashboard
    return;
  }
  // Exponential backoff: 1m, 5m, 30m, 2h, 10h
  const delays = [60, 300, 1800, 7200, 36000];
  const nextAttemptAt = new Date(Date.now() + delays[attempts - 1] * 1000);
  await db.webhookDeliveries.update(delivery.id, { attempts, nextAttemptAt, lastResponseCode: statusCode });
}
\`\`\`

**Receiver-side verification**:
\`\`\`typescript
function verifyWebhookSignature(body: string, header: string, secret: string): boolean {
  const [t, v1] = header.split(',').map(p => p.split('=')[1]);
  const expected = crypto.createHmac('sha256', secret).update(\`\${t}.\${body}\`).digest('hex');
  // Prevent timing attacks:
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 18. Multi-tenancy patterns
  {
    title: "What are the data isolation strategies for multi-tenant SaaS applications?",
    content:
      "Compare silo (per-tenant DB), bridge (per-tenant schema), and pool (shared DB with tenant_id) models. When should you use each?",
    answer: `**Multi-tenancy**: Multiple customers (tenants) share the same application but their data is isolated.

**Three models**:

**1. Silo — Separate database per tenant**:
\`\`\`
Tenant A → Database A
Tenant B → Database B
Tenant C → Database C
\`\`\`
\`\`\`typescript
// Dynamic connection based on tenant
async function getTenantDataSource(tenantId: string): Promise<DataSource> {
  const config = await tenantRegistry.getDbConfig(tenantId);
  return getOrCreateConnection(tenantId, config);
}
\`\`\`
**Pros**: Complete data isolation, independent backups, customizable per tenant, regulatory compliance (GDPR right to deletion = drop database)
**Cons**: High operational overhead (1000 tenants = 1000 DBs), expensive, schema migrations must run across all DBs

**2. Bridge — Separate schema per tenant (same DB)**:
\`\`\`
Database: shared_db
  Schema: tenant_a → users, orders, products
  Schema: tenant_b → users, orders, products
  Schema: tenant_c → users, orders, products
\`\`\`
\`\`\`sql
-- Set search path per connection
SET search_path = tenant_a, public;
SELECT * FROM orders;  -- queries tenant_a.orders
\`\`\`
**Pros**: Schema isolation, relatively easy tenant deletion, same DB instance
**Cons**: PostgreSQL has limits (~10K schemas), migrations still complex, connection pooling needs care

**3. Pool — Shared tables with tenant_id column**:
\`\`\`sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- ...
);

-- Every query must include tenant_id filter
SELECT * FROM orders WHERE tenant_id = $1 AND status = 'pending';
\`\`\`
\`\`\`sql
-- Enforce with Row-Level Security:
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
\`\`\`
**Pros**: Simple deployment, easy to scale horizontally, low cost, cross-tenant analytics easy for operators
**Cons**: Risk of data leaks if tenant_id filter is forgotten, noisy neighbor problem, harder to isolate for compliance

**Comparison matrix**:

| Criteria | Silo | Bridge | Pool |
|----------|------|--------|------|
| Data isolation | Strongest | Strong | Weakest |
| Cost | Highest | Medium | Lowest |
| Operational complexity | Highest | Medium | Lowest |
| Scaling (many small tenants) | ❌ Poor | Moderate | ✅ Best |
| Scaling (few large tenants) | ✅ Best | Good | ❌ Noisy |
| Compliance (GDPR, HIPAA) | ✅ Easiest | Good | ❌ Hardest |
| Schema migrations | Hardest | Hard | Easiest |

**Hybrid approach**: Pool model for most tenants, silo for enterprise customers with compliance requirements.

**Connection pooling with multi-tenancy (Pool model)**:
\`\`\`typescript
// PgBouncer in transaction mode works well
// Set tenant context at transaction start:
await client.query("SET LOCAL app.tenant_id = $1", [tenantId]);
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 19. Observability
  {
    title: "What are the three pillars of observability and how do you implement them?",
    content:
      "Explain logs, metrics, and traces. How do you implement distributed tracing? What tools and practices should a middle-level engineer know?",
    answer: `**The Three Pillars**:
- **Logs**: Discrete events — what happened, when, with what context
- **Metrics**: Aggregated numbers over time — how much, how often, how fast
- **Traces**: End-to-end journey of a request across services

**Logs — Structured logging**:
\`\`\`typescript
// BAD: string logs (hard to query)
console.log(\`User \${userId} placed order \${orderId} for \${amount}\`);

// GOOD: structured JSON logs
logger.info({
  event: 'order.created',
  userId,
  orderId,
  amount,
  traceId: ctx.traceId,  // link to trace
});
\`\`\`
Tools: **pino** (Node.js), **winston**, shipped to Elasticsearch/Kibana (ELK) or Grafana Loki.

**Metrics — RED method** (for services):
- **Rate**: Requests per second
- **Errors**: Error rate (%)
- **Duration**: Latency (p50, p95, p99)

\`\`\`typescript
// Prometheus metrics (with prom-client)
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path, status_code: res.statusCode });
  });
  next();
});
\`\`\`

Scraped by Prometheus → visualized in Grafana. Alert on: p99 latency > 1s, error rate > 1%, queue depth > 1000.

**Distributed Tracing**:
\`\`\`
Request: POST /orders
├── [API Gateway] 5ms
├── [Order Service] 45ms
│   ├── validate(10ms)
│   ├── [DB query] 15ms
│   └── publish event(5ms)
└── [Payment Service] 80ms
    ├── [Stripe API] 60ms
    └── [DB write] 10ms
Total: 135ms
\`\`\`

\`\`\`typescript
// OpenTelemetry (vendor-neutral)
import { trace, context, propagation } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function createOrder(data: CreateOrderDto) {
  const span = tracer.startSpan('createOrder');
  span.setAttributes({ 'order.userId': data.userId });
  try {
    const result = await doWork();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();
  }
}
\`\`\`

**Trace propagation** between services:
\`\`\`typescript
// Inject trace context into outgoing HTTP calls:
const headers = {};
propagation.inject(context.active(), headers);
await fetch('http://payment-service/charge', { headers });

// Extract on receiving side (done automatically by OpenTelemetry middleware)
\`\`\`

**Tooling stack**:
- Traces: **Jaeger** or **Tempo** (OSS), **Datadog APM**, **AWS X-Ray**
- Metrics: **Prometheus** + **Grafana**
- Logs: **Grafana Loki** or **Elasticsearch** + **Kibana**
- All-in-one: **Datadog**, **New Relic**, **Honeycomb**`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },

  // 20. Designing a Leaderboard
  {
    title: "Design a real-time leaderboard system",
    content:
      "How would you design a leaderboard that handles millions of users, supports real-time score updates, and efficiently retrieves a user's rank?",
    answer: `**Requirements**:
- Update score in real-time when user completes an action
- Get top-N users (global leaderboard)
- Get a specific user's current rank
- Show user's neighbors (±N positions around rank)
- Handle millions of users

**Why not a simple SQL query**:
\`\`\`sql
-- Getting rank with SQL:
SELECT COUNT(*) + 1 AS rank
FROM users
WHERE score > (SELECT score FROM users WHERE id = $1);
-- Problem: Full table scan on every rank query → O(N)
\`\`\`

**Redis Sorted Set** — purpose-built for leaderboards:
\`\`\`typescript
const LEADERBOARD_KEY = 'leaderboard:weekly';

// Update score (O(log N)):
await redis.zincrby(LEADERBOARD_KEY, pointsEarned, userId);

// Get top 10 with scores (O(log N + K)):
const top10 = await redis.zrevrangebyscore(LEADERBOARD_KEY, '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 10);

// Get user's rank (0-indexed, 0 = highest score) (O(log N)):
const rank = await redis.zrevrank(LEADERBOARD_KEY, userId);

// Get user's score:
const score = await redis.zscore(LEADERBOARD_KEY, userId);

// Get neighbors (user ±5 positions):
if (rank !== null) {
  const start = Math.max(0, rank - 5);
  const stop = rank + 5;
  const neighbors = await redis.zrevrange(LEADERBOARD_KEY, start, stop, 'WITHSCORES');
}
\`\`\`

**Multiple leaderboard windows**:
\`\`\`typescript
// Different time windows in separate sorted sets
const KEYS = {
  daily: \`leaderboard:daily:\${today}\`,    // expires in 2 days
  weekly: \`leaderboard:weekly:\${week}\`,   // expires in 14 days
  allTime: 'leaderboard:all-time',        // never expires
};

async function recordScore(userId: string, points: number) {
  const pipeline = redis.pipeline();
  pipeline.zincrby(KEYS.daily, points, userId);
  pipeline.expire(KEYS.daily, 172800);     // 2 days
  pipeline.zincrby(KEYS.weekly, points, userId);
  pipeline.expire(KEYS.weekly, 1209600);   // 14 days
  pipeline.zincrby(KEYS.allTime, points, userId);
  await pipeline.exec();
}
\`\`\`

**Persistence** (Redis + PostgreSQL):
\`\`\`sql
-- Source of truth in PostgreSQL
CREATE TABLE user_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  all_time_score BIGINT DEFAULT 0,
  weekly_score BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rebuild Redis cache from DB on startup/failure:
async function rebuildLeaderboard() {
  const scores = await db.query('SELECT user_id, all_time_score FROM user_scores');
  const pipeline = redis.pipeline();
  for (const { user_id, all_time_score } of scores) {
    pipeline.zadd('leaderboard:all-time', all_time_score, user_id);
  }
  await pipeline.exec();
}
\`\`\`

**Scaling**:
- Redis handles millions of members in a sorted set efficiently
- For billions: shard by user ID range across multiple Redis instances, merge for top-N
- Cache the top-100 in application memory (refresh every 30 seconds) to reduce Redis load
- Weekly leaderboard reset: use \`leaderboard:weekly:2024-W12\` key naming, let old keys expire`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "system-design",
  },
];
