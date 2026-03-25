/**
 * Senior-Level System Design Interview Questions
 *
 * 10 production-grade questions targeting developers with 5+ years experience.
 * Focus: distributed systems, scaling bottlenecks, fault tolerance, real-world trade-offs.
 *
 * Topics: system-design (10)
 * Level: SENIOR
 *
 * Usage: pnpm --filter backend seed:senior-system-design
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
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

// ============================================
// SYSTEM DESIGN — SENIOR LEVEL (10 questions)
// ============================================

export const seniorSystemDesignQuestions: QuestionSeed[] = [
  // 1. [System Design] — Distributed Rate Limiter
  {
    title:
      "Design a distributed rate limiter that works across 50+ API servers with sub-5ms overhead",
    content:
      "Your API is deployed across 50 servers behind a load balancer. You need to enforce per-user rate limits (e.g., 1000 req/min). A naive single Redis counter works but introduces a network hop on every request. How do you design a rate limiter that is accurate, has < 5ms added latency, handles Redis failure gracefully, and scales horizontally?",
    answer: buildAnswer({
      short_answer:
        "Use a token bucket with local in-memory counters that sync to Redis in batches. Accept slight inaccuracy (local window drift) in exchange for sub-millisecond fast path. Implement sliding window log in Redis as source of truth, with local cache as L1. On Redis failure, fall back to local counters with a conservative multiplier.",
      detailed_answer: `**Core Problem**: Every request checking Redis adds ~1-3ms RTT × 1000 req/min = significant throughput penalty.

**Architecture: Two-Layer Rate Limiting**

Layer 1 — Local (in-memory per server):
- Each server maintains a token bucket per userId
- Periodically (every 100ms) syncs delta usage to Redis
- Handles burst within the sync window locally
- Latency: ~0.01ms (pure memory)

Layer 2 — Global (Redis sliding window):
- Redis stores per-user timestamps or counters with TTL
- Authoritative for limit enforcement across all servers
- Checked probabilistically (1 in 10 requests) or when local bucket is low

\`\`\`
Request → Check local bucket (0.01ms)
  → If ample quota: serve directly
  → If near limit: check Redis (~1-3ms)
  → If Redis unavailable: use local with 70% conservative limit
\`\`\`

**Redis Data Structure Options**:
- Fixed window: \`INCR user:123:2024010112\` with EXPIRE — simple but burst at window boundary
- Sliding window log: ZADD with timestamps, ZCOUNT for window — accurate but O(n) per user
- Sliding window counter: blend of two fixed windows weighted by time overlap — O(1), near-accurate

**Failure Modes**:
- Redis timeout > 2ms: fail open with local counter (degraded mode)
- Redis down: all servers use local counters, may allow 50× (50 servers × local limit)
- Mitigation: each server takes 1/N of global quota where N = cluster size (discovered via Redis or service registry)

**Latency Budget**:
- P99 target < 5ms added overhead
- Fast path (local): 0.01ms
- Slow path (Redis check): 1-3ms
- P99 stays well under 5ms with async batch sync`,
      trade_offs: [
        {
          approach: "Centralized Redis with synchronous check on every request",
          pros: ["Perfectly accurate", "Simple implementation", "No drift"],
          cons: [
            "1-3ms added per request",
            "Redis becomes SPOF",
            "Scales poorly under high QPS",
          ],
        },
        {
          approach: "Local in-memory token bucket only",
          pros: [
            "< 0.1ms overhead",
            "No external dependency",
            "Fault tolerant",
          ],
          cons: [
            "50 servers = 50× effective limit",
            "No cross-server enforcement",
            "Memory usage per user",
          ],
        },
        {
          approach: "Two-layer hybrid (local + async Redis sync)",
          pros: [
            "< 1ms P99 fast path",
            "Near-accurate (within sync interval)",
            "Redis failure gracefully degraded",
          ],
          cons: [
            "Allows short burst overages during sync window",
            "More complex implementation",
            "Need consistent server discovery for quota partition",
          ],
        },
      ],
      real_world_example:
        "Stripe uses a sliding window with Redis but pre-allocates quota chunks to each API server for the current second. Each server only contacts Redis when its chunk is exhausted or at epoch boundaries. This gives < 1ms overhead while keeping global accuracy within a small epsilon. GitHub's API rate limiter uses a similar two-layer approach with local fast-path and Redis as authoritative store.",
      red_flags: [
        "Answers only with single Redis INCR without discussing latency trade-off",
        "No mention of failure modes or Redis downtime handling",
        "Does not address the 50-server 50× amplification problem",
        "Proposes Lua scripts as the entire solution without discussing consistency under partial failure",
        "Ignores the difference between fixed window and sliding window accuracy",
      ],
      follow_up_questions: [
        "How would you handle a flash crowd where 10,000 users hit your API simultaneously and overwhelm Redis?",
        "If you partition quota per server (each gets 1/50 of limit), how do you handle servers joining/leaving the cluster?",
        "How do you rate limit by user AND by endpoint (different limits per route) without multiplying Redis keys?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 2. [Debug/Incident] — Database Connection Pool Exhaustion
  {
    title:
      "Production incident: database connection pool exhausted under normal traffic — root cause and fix",
    content:
      "At 2 AM you receive a PagerDuty alert: your service is returning 503 errors. Logs show 'connection pool exhausted' (max 100 connections). But traffic is actually 20% BELOW normal. CPU and memory on the DB server are fine. How do you diagnose and fix this? What systemic changes would prevent recurrence?",
    answer: buildAnswer({
      short_answer:
        "Connection leaks under slow queries or error paths are the most common cause — transactions not committed/rolled back on exception, or queries holding connections during long async waits. Use pg_stat_activity to identify long-held connections, check application code for missing finally{} blocks, and instrument connection checkout/checkin times. Fix: proper connection lifecycle management + connection timeout alarms.",
      detailed_answer: `**Immediate Diagnosis (live incident)**:

Step 1 — What's holding connections?
\`\`\`sql
SELECT pid, usename, state, wait_event_type, wait_event,
       now() - state_change AS duration, query
FROM pg_stat_activity
WHERE datname = 'your_db'
ORDER BY duration DESC;
\`\`\`

Look for:
- \`idle in transaction\` — connection checked out, transaction open, no query running
- \`active\` with long duration — slow query blocking the connection
- \`idle\` × 100 — pool correctly managed but someone set maxConnections too high

Step 2 — Check application connection metrics:
\`\`\`
pool.totalCount    // connections created
pool.idleCount     // connections available
pool.waitingCount  // requests waiting for a connection
\`\`\`

**Root Cause Scenarios**:

1. **Transaction not committed on error path**:
\`\`\`typescript
// BUG: if processOrder throws, connection is never released
const conn = await pool.connect();
await conn.query('BEGIN');
await processOrder(conn);  // throws
await conn.query('COMMIT');
conn.release();  // NEVER REACHED

// FIX:
const conn = await pool.connect();
try {
  await conn.query('BEGIN');
  await processOrder(conn);
  await conn.query('COMMIT');
} catch (err) {
  await conn.query('ROLLBACK');
  throw err;
} finally {
  conn.release();  // ALWAYS runs
}
\`\`\`

2. **Async context switching holding connections** — await on external HTTP call while holding DB connection keeps connection occupied for 500ms+ per request.

3. **Upstream slowness cascades** — if a downstream service (payment API) goes slow, requests pile up holding connections, pool exhausts even at low traffic.

**Systemic Fixes**:
- Set \`statement_timeout\` and \`idle_in_transaction_session_timeout\` on PostgreSQL
- Connection checkout timeout: return error instead of infinite wait
- Separate connection pools per query type (OLTP vs analytics)
- Structured logging of connection lifetime per request
- Circuit breaker on downstream services to prevent cascade`,
      trade_offs: [
        {
          approach: "Increase max connection pool size",
          pros: ["Quick fix", "Buys time during incident"],
          cons: [
            "PostgreSQL has ~100 connection overhead per connection",
            "Masks leak — will exhaust again at higher scale",
            "Increases memory pressure on DB server",
          ],
        },
        {
          approach: "PgBouncer connection pooler in transaction mode",
          pros: [
            "Multiplexes thousands of app connections to tens of DB connections",
            "Protects DB from connection storms",
            "Near-transparent to application",
          ],
          cons: [
            "Transaction-mode pooling breaks SET LOCAL and advisory locks",
            "Additional infrastructure to operate",
            "Debugging is harder with pooler in the middle",
          ],
        },
        {
          approach: "Fix connection lifecycle + monitoring",
          pros: [
            "Addresses root cause",
            "No infrastructure overhead",
            "Improves observability",
          ],
          cons: [
            "Requires code audit",
            "May miss all code paths on first pass",
            "Needs solid test coverage of error paths",
          ],
        },
      ],
      real_world_example:
        "In 2019, a major e-commerce platform experienced checkout failures on Black Friday — not due to traffic spike but because a 3rd-party fraud check API slowed from 50ms to 800ms. Each checkout request held a DB connection during the fraud check. At 500 concurrent checkouts × 800ms = pool exhausted in seconds. Fix: move fraud check outside transaction boundary, use async queue for non-blocking fraud evaluation.",
      red_flags: [
        "Immediately suggests increasing pool size without diagnosing root cause",
        "Does not mention pg_stat_activity or connection introspection",
        "Unaware of idle_in_transaction state and its meaning",
        "Cannot explain why low traffic can exhaust connections (does not understand leaks vs load)",
        "Does not know about connection timeout configuration in pool libraries",
      ],
      follow_up_questions: [
        "How would you design a circuit breaker to prevent downstream slowness from exhausting your DB connection pool?",
        "When would you choose PgBouncer session mode vs transaction mode, and what breaks in transaction mode?",
        "How do you detect and alert on connection pool exhaustion BEFORE it causes 503 errors?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 3. [Performance] — Hot Shard in Distributed Database
  {
    title:
      "Your sharded database has one shard taking 80% of traffic. How do you diagnose and rebalance without downtime?",
    content:
      "You have a user database sharded by user_id % 16 (16 shards). Monitoring shows shard 7 handling 80% of all queries. The shard's CPU is at 95%, causing p99 latency to spike to 2 seconds for affected users. The other 15 shards are idle. How do you diagnose why this shard is hot, and how do you fix it — both immediately and long-term — without taking downtime?",
    answer: buildAnswer({
      short_answer:
        "Hot shards usually come from non-uniform key distribution (celebrity users, sequential IDs clustering in a range, or business logic bias). Immediate relief: read replicas for read-heavy hot shards, query caching for top N users. Long-term: consistent hashing with virtual nodes, or shard splitting. Zero-downtime migration requires dual-write during transition.",
      detailed_answer: `**Step 1: Diagnose Why Shard 7 Is Hot**

Check data distribution:
\`\`\`sql
-- On shard 7
SELECT COUNT(*) as row_count FROM users;  -- is it larger?

-- Check query frequency by user
SELECT user_id, COUNT(*) as query_count
FROM query_log
WHERE shard = 7
GROUP BY user_id
ORDER BY query_count DESC
LIMIT 20;
\`\`\`

Common causes:
- **Celebrity problem**: a few high-activity users (e.g., a company account with 10M employees) all land on shard 7
- **Hash clustering**: if user_ids are assigned sequentially and recently created users are most active, modulo sharding clusters hot users
- **Business logic**: shared resources (e.g., a global settings record) always hit the same shard

**Immediate Mitigation (< 1 hour)**:

1. Add read replicas for shard 7 — route 90% of reads to replicas
2. Application-level caching: cache hot user profiles for 60s in Redis/Memcached
3. Rate limit queries from the hottest user_ids (if celebrity problem)

**Long-term Fix: Shard Splitting**

Split shard 7 into 7a and 7b. Zero-downtime approach:
\`\`\`
Phase 1: Create shard 7b (empty)
Phase 2: Dual-write — writes go to both 7 and 7b
Phase 3: Backfill: copy even user_ids to 7b
Phase 4: Verify: compare checksums
Phase 5: Switch reads: even user_ids → 7b
Phase 6: Stop dual-write, clean up 7
\`\`\`

**Alternative: Consistent Hashing + Virtual Nodes**

With virtual nodes, each physical shard owns N virtual slots. When adding a new shard, only 1/N of keys migrate. This avoids hot spots from modulo hashing.

**Celebrity User Pattern**:
For known hot users, override sharding logic:
\`\`\`typescript
function getShard(userId: string): number {
  if (HOT_USERS.has(userId)) {
    return DEDICATED_HOT_SHARD;  // isolated shard for top users
  }
  return hash(userId) % NUM_SHARDS;
}
\`\`\``,
      trade_offs: [
        {
          approach: "Add read replicas to hot shard",
          pros: [
            "Immediate relief (< 30 min)",
            "No data migration",
            "No application changes",
          ],
          cons: [
            "Only helps if traffic is read-heavy",
            "Adds replication lag",
            "Does not fix write hotspot",
          ],
        },
        {
          approach: "Shard splitting with dual-write",
          pros: [
            "Permanent fix",
            "Zero downtime",
            "Works for both read and write hotspots",
          ],
          cons: [
            "Complex migration",
            "Weeks of engineering work",
            "Dual-write period has consistency risk",
            "Need careful rollback plan",
          ],
        },
        {
          approach: "Re-shard with consistent hashing",
          pros: [
            "Better long-term distribution",
            "Supports seamless node addition",
            "Industry standard for large scale",
          ],
          cons: [
            "Major migration effort",
            "Requires full data reshuffling",
            "Application must be updated to use new sharding logic",
          ],
        },
      ],
      real_world_example:
        "Twitter's early MySQL sharding used user_id % N. When @katyperry gained 100M followers, her tweet fan-out (writing to every follower's timeline) created a celebrity write hotspot. Twitter's solution: separate 'hot user' handling where celebrity tweets are not pre-computed into follower timelines (push model) but instead pulled lazily and merged at read time. This eliminated the write hot-shard problem entirely for celebrity accounts.",
      red_flags: [
        "Suggests re-sharding the entire database immediately without considering downtime",
        "Does not distinguish between read vs write hotspots (have different solutions)",
        "Unaware of dual-write pattern for zero-downtime migration",
        "Cannot explain why modulo sharding creates temporal hot spots with sequential IDs",
        "Does not mention monitoring/observability to detect hot shards proactively",
      ],
      follow_up_questions: [
        "How would your answer change if the hot shard is hot because of writes, not reads?",
        "What's the consistency risk during dual-write and how do you handle conflicts?",
        "How do you handle a user who creates a massive amount of data (e.g., 10M records) on a single shard?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 4. [Architecture Trade-off] — Event Sourcing vs CRUD
  {
    title:
      "When does event sourcing make a system harder to maintain than it solves, and how do you recognize the warning signs?",
    content:
      "Your team is debating whether to redesign your order management system using Event Sourcing. An engineer advocates for it strongly, citing auditability and temporal queries. You have concerns. Walk through the real costs and failure modes of event sourcing in production, and describe the specific conditions where it's genuinely the right choice vs. where it creates more problems than it solves.",
    answer: buildAnswer({
      short_answer:
        "Event sourcing is genuinely valuable when audit trail, temporal queries, or event replay are first-class requirements (financial systems, compliance-heavy domains). It becomes a liability when the team lacks CQRS discipline, when projections become the de facto source of truth, or when schema evolution is underestimated. The warning sign is when developers start updating events retroactively — the system has lost its core invariant.",
      detailed_answer: `**What Event Sourcing Actually Gives You**:
- Complete audit log (who did what, when)
- Ability to replay events to rebuild state
- Temporal queries (what was the state at time T?)
- Event-driven integration (publish events to other systems)
- Easy undo/redo

**Real Costs In Production**:

1. **Schema Evolution Is Hard**
Events are immutable. When business logic changes, old events must still deserialize correctly.
\`\`\`typescript
// Version 1 event
{ type: 'OrderPlaced', userId: '123', amount: 100 }

// Version 2: split amount into subtotal + tax
{ type: 'OrderPlaced', userId: '123', subtotal: 90, tax: 10 }

// Now you need upcasters to transform V1 → V2 during replay
// Every schema change adds complexity to the event store
\`\`\`

2. **Projection Drift**
Projections (read models) can get out of sync. Rebuilding a projection for 10M events takes hours. During rebuild, read models are stale.

3. **The CQRS Tax**
Every query requires a projection. Simple "how many orders does user 123 have?" becomes:
- maintain a projection table
- update it on every OrderPlaced/OrderCancelled event
- handle projection failures and reprocessing

4. **Eventual Consistency By Default**
Writes go to event store; reads come from projections. If your team is used to "write then immediately read your own write," this breaks assumptions.

**When It's The Right Choice**:
- Financial ledgers (debits/credits must be immutable)
- Compliance systems (GDPR right to access all changes)
- Collaborative editing (Google Docs-style conflict resolution)
- Systems where "replay and rebuild" is a valid recovery strategy
- Teams with CQRS experience and discipline

**Warning Signs You're In Trouble**:
- Developers are directly updating/deleting events in the store
- Projections are treated as the source of truth
- Event store has grown to 100GB+ with no snapshotting strategy
- Upcaster chain is 7 versions deep
- New team members take 2 weeks to understand how to add a field`,
      trade_offs: [
        {
          approach: "Full event sourcing with CQRS",
          pros: [
            "Complete audit trail",
            "Temporal queries",
            "Event-driven integration is natural",
            "Replay-based recovery",
          ],
          cons: [
            "High upfront complexity",
            "Schema evolution is a continuous tax",
            "Projection rebuilds are expensive",
            "Eventual consistency requires careful UX design",
          ],
        },
        {
          approach: "CRUD with audit log table",
          pros: [
            "Simple mental model",
            "Easy queries",
            "Instant consistency",
            "Familiar to all developers",
          ],
          cons: [
            "Audit log often becomes an afterthought",
            "Cannot replay to rebuild state",
            "Business logic changes can lose historical context",
          ],
        },
        {
          approach: "Hybrid: CRUD + append-only event log for key domain events",
          pros: [
            "Captures important business events without full ES overhead",
            "Simple operational model",
            "Good enough for most audit requirements",
          ],
          cons: [
            "Not a true event-sourced system",
            "Cannot replay full state from events alone",
            "Risk of event log and CRUD state diverging",
          ],
        },
      ],
      real_world_example:
        "A major European bank built their transaction processing system with event sourcing. Three years in, the event schema had 47 upcaster versions, projection rebuild took 18 hours, and engineers avoided touching event definitions because of the cascading impacts. The system was technically correct but operationally brittle. They eventually introduced snapshots every 1000 events and froze the event schema, only adding new event types instead of modifying old ones. The lesson: event sourcing requires contractual stability in your domain model that most product teams cannot commit to.",
      red_flags: [
        "Claims event sourcing is always better than CRUD because of auditability",
        "Does not mention schema evolution challenges with immutable events",
        "Unaware of what CQRS means or assumes it's optional with event sourcing",
        "Cannot explain how to handle a user deleting their account (GDPR) in an event-sourced system",
        "Does not discuss snapshotting strategy for long event chains",
      ],
      follow_up_questions: [
        "How do you handle GDPR right-to-erasure in an event-sourced system where events are immutable?",
        "What snapshotting strategy would you use for an order with 500+ state transitions?",
        "How do you test that projection rebuilds produce the same result as the live projection?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 5. [System Design] — Global CDN Cache Invalidation
  {
    title:
      "Design a cache invalidation strategy for a global CDN serving 50M users when product prices update in real-time",
    content:
      "Your e-commerce platform serves product pages via a CDN (Cloudflare/Fastly) with aggressive caching (TTL = 1 hour) for performance. Product prices change frequently — sometimes every few minutes during sales events. You cannot serve stale prices because it causes customer disputes. But purging the CDN on every price change kills cache hit rate. How do you design a system that balances freshness with cache efficiency at global scale?",
    answer: buildAnswer({
      short_answer:
        "Separate the price data from the page shell. Cache the static page HTML for 1 hour but inject price via a separate lightweight API call (ESI, micro-caching, or client-side fetch). Use surrogate keys for surgical invalidation — purge only affected SKUs, not the entire cache. For flash sales, use stale-while-revalidate with a background refresh job that pre-warms cache before price changes go live.",
      detailed_answer: `**Core Problem**: Full page cache TTL 1hr + price changes every few minutes = stale prices or low cache hit rate. Both are unacceptable.

**Strategy 1: Fragment Caching (Recommended)**

Split the response into stable vs dynamic parts:
\`\`\`
Product Page Response:
├── HTML shell (images, description, reviews) — TTL: 1 hour
└── Price fragment (price, stock, promotions) — TTL: 30 seconds
\`\`\`

Implementation options:
- **Edge Side Includes (ESI)**: CDN assembles fragments at edge
- **Micro-cache at edge**: price API cached for 30s at each PoP
- **Client-side fetch**: page loads, then JS fetches price from fast API

**Strategy 2: Surrogate Keys / Cache Tags**

Tag each cached response with the product IDs it contains:
\`\`\`
Cache-Tag: product:SKU-123, product:SKU-456, category:electronics
\`\`\`

When SKU-123 price changes, purge only objects tagged \`product:SKU-123\`:
\`\`\`bash
# Fastly Instant Purge by surrogate key
curl -X POST https://api.fastly.com/service/{id}/purge/product:SKU-123
\`\`\`

This is surgical — instead of purging millions of cached pages, purge only the 10,000 pages that show SKU-123.

**Strategy 3: Stale-While-Revalidate + Pre-warming**

\`\`\`
Cache-Control: max-age=3600, stale-while-revalidate=60
\`\`\`

CDN serves stale for up to 60s while asynchronously fetching fresh content. Combined with a price-change event that triggers background cache refresh before the change goes live:
\`\`\`
PriceChangeScheduled (T-5min) → pre-warm cache with new prices
PriceChangeLive (T+0) → trigger CDN purge for affected SKUs
\`\`\`

**Flash Sale Architecture**:
During flash sales with hundreds of price changes/second:
1. Price changes are queued (Kafka)
2. Batch processor groups changes per SKU every 5 seconds
3. Single CDN purge per SKU per batch
4. Edge servers micro-cache price for 5s (accept 5s stale)
5. Real-time price endpoint exists for checkout (bypasses CDN entirely)`,
      trade_offs: [
        {
          approach: "Short TTL (30 seconds) on full page",
          pros: ["Simple", "Price always fresh within 30s", "Easy to reason about"],
          cons: [
            "Cache hit rate drops 99% → ~40%",
            "CDN overhead increases 20×",
            "Origin server must handle all requests",
          ],
        },
        {
          approach: "Fragment caching with price microservice",
          pros: [
            "HTML stays cached 1hr",
            "Price fresh within 30s",
            "Optimal cache efficiency",
          ],
          cons: [
            "Two requests per page load (page + price)",
            "ESI adds CDN configuration complexity",
            "Must handle price fetch failures gracefully",
          ],
        },
        {
          approach: "Surrogate key purge on price change",
          pros: [
            "Instant invalidation",
            "Surgical — only affected pages purged",
            "Full page cache maintained",
          ],
          cons: [
            "CDN purge API has rate limits (Fastly: 1000 purge req/s)",
            "Purge propagation takes 50-200ms globally",
            "Must maintain SKU → cached URLs mapping",
          ],
        },
      ],
      real_world_example:
        "Amazon's product pages use a technique called 'Prism' internally where each page component has its own caching policy. Prices come from a separate API call with a 5-second cache at the edge. During Prime Day, the price service uses a two-tier cache: L1 at the CDN edge (5s TTL) and L2 at regional cache nodes (60s TTL) backed by a price change stream. This allows 99.9% CDN hit rate while ensuring prices are never more than 65 seconds stale. The checkout always reads directly from the authoritative price service, bypassing all caches.",
      red_flags: [
        "Suggests just setting TTL to 0 (no caching) as a solution",
        "Does not distinguish between caching the page vs caching the price",
        "Unaware of surrogate keys / cache tags feature in CDNs",
        "Cannot explain stale-while-revalidate semantics",
        "Does not address the checkout path (must always get authoritative price regardless of CDN caching)",
      ],
      follow_up_questions: [
        "How do you prevent a customer from adding a product to cart at the cached stale price and then being charged the new price at checkout?",
        "If price changes happen at 1000/second during a flash sale, how do you avoid overwhelming the CDN purge API rate limit?",
        "How would you design the system differently if you needed prices to be accurate within 1 second globally?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 6. [Debug/Incident] — Cascading Failures in Microservices
  {
    title:
      "Diagnose a cascading failure where one slow microservice brought down the entire platform in 4 minutes",
    content:
      "Post-mortem scenario: At 3 PM, the recommendation service started responding slowly (p99 = 8 seconds instead of 200ms). By 3:04 PM, the entire platform was down — checkout, product pages, and even the login service, which has no dependency on recommendations. How did this happen, and what architectural patterns would have prevented the cascade?",
    answer: buildAnswer({
      short_answer:
        "Thread pool exhaustion is the classic cascade vector: slow dependency fills all HTTP client threads, which blocks health check threads, which causes the load balancer to restart pods, which overwhelms the restart queue. The login service dies because it shares the same thread pool or JVM with services that have recommendation dependencies. Circuit breakers, bulkheads (isolated thread pools), and timeout budgets prevent this.",
      detailed_answer: `**Timeline Reconstruction**:

\`\`\`
3:00 PM — recommendation service p99 = 8s (DB index missing after deploy)
3:01 PM — product page service: 100 threads waiting for recommendation (8s each)
3:02 PM — product page thread pool exhausted (max 100 threads)
3:02 PM — health check requests to product page service now queued behind recommendation calls
3:02 PM — product page health checks timeout → load balancer marks pods unhealthy
3:03 PM — load balancer restarts product page pods → restart queue overwhelmed
3:03 PM — checkout service calls product page (dependency) → cascades
3:04 PM — login service calls user-session service (same JVM) → starved of threads
\`\`\`

**Why Login Service Failed**:
Login had no direct dependency on recommendations, but:
- Login and user-session ran in same process
- Thread pool was shared
- user-session had a soft dependency on recommendations (for "recently viewed" widget)

**Prevention Patterns**:

**1. Circuit Breaker**
\`\`\`typescript
const breaker = new CircuitBreaker(recommendationService.get, {
  timeout: 200,        // 200ms max
  errorThresholdPercentage: 50,
  resetTimeout: 30000  // 30s before retry
});
// After 50% errors: breaker opens → returns fallback immediately
\`\`\`

**2. Bulkhead (Isolated Thread Pools)**
\`\`\`
Service A Thread Pool:
  ├── Pool: recommendation (max 10 threads)
  ├── Pool: inventory (max 20 threads)
  └── Pool: payment (max 50 threads)
\`\`\`
Recommendation slowness can only consume its 10 threads, not starve payment.

**3. Timeout Budget**
Every external call must have a hard timeout shorter than the caller's own timeout:
\`\`\`
Gateway timeout: 5s
  └── ProductPage timeout: 3s
        └── Recommendation timeout: 200ms  ← hard cap
\`\`\`

**4. Fallback / Graceful Degradation**
\`\`\`typescript
try {
  recommendations = await getRecommendations(userId, { timeout: 200 });
} catch {
  recommendations = getCachedFallback(userId) || [];  // serve without recommendations
}
\`\`\``,
      trade_offs: [
        {
          approach: "Circuit breaker on all external calls",
          pros: [
            "Prevents cascade propagation",
            "Automatic recovery when dependency heals",
            "Metrics on failure rates",
          ],
          cons: [
            "Adds operational complexity",
            "Tricky threshold tuning",
            "Fallback logic must be maintained",
          ],
        },
        {
          approach: "Bulkhead with separate thread/connection pools",
          pros: [
            "Failure is contained to pool",
            "Non-critical services cannot starve critical ones",
            "Simple to reason about",
          ],
          cons: [
            "More resource overhead (N pools instead of 1)",
            "Pool sizing requires tuning",
            "Underutilized pools waste resources",
          ],
        },
        {
          approach: "Process isolation (separate pods per dependency group)",
          pros: ["Hard isolation — one process crash cannot affect another"],
          cons: [
            "Significant operational overhead",
            "Latency for inter-process communication",
            "May be over-engineered for most services",
          ],
        },
      ],
      real_world_example:
        "Netflix's 2012 AWS outage analysis revealed that their Hystrix circuit breaker library (later open-sourced) was designed specifically after cascading failure patterns they observed in production. The library provides circuit breakers, thread pool isolation (bulkheads), and fallback logic as first-class abstractions. Every Netflix microservice call is wrapped in Hystrix. When AWS EBS volumes degraded in us-east-1, Hystrix prevented the degradation from cascading to unrelated services like user authentication.",
      red_flags: [
        "Cannot explain why a service with no direct dependency fails (missing understanding of shared resources)",
        "Suggests adding retries as the main solution (retries amplify the problem during slowness)",
        "Does not know what a circuit breaker is or how the state machine works",
        "Conflates timeout with circuit breaker (they solve different problems)",
        "Does not mention the thread pool starvation mechanism specifically",
      ],
      follow_up_questions: [
        "If you add retries to mitigate transient failures, how do you prevent retry storms from amplifying a real outage?",
        "How does jitter in retry backoff help, and what should the jitter distribution look like?",
        "At what error rate should a circuit breaker open, and how do you avoid false positives during a rolling deploy?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 7. [Architecture Trade-off] — Saga Pattern for Distributed Transactions
  {
    title:
      "Choreography vs Orchestration saga: which do you choose for a 6-step order fulfillment workflow, and why?",
    content:
      "You're designing an order fulfillment system with 6 steps: validate payment, reserve inventory, create shipment, notify warehouse, send confirmation email, and update loyalty points. Each step is a separate microservice. Failures must trigger compensating transactions. Compare choreography-based and orchestration-based saga patterns — which would you choose, and under what circumstances would you change your answer?",
    answer: buildAnswer({
      short_answer:
        "Orchestration sagas are easier to reason about, debug, and monitor for complex multi-step workflows. Choreography avoids a central coordinator (SPOF) but creates implicit coupling through event contracts that becomes hard to trace as steps multiply. For 6+ steps with compensation logic, orchestration wins on maintainability. Choreography wins when steps are truly independent and the team is disciplined about event contract ownership.",
      detailed_answer: `**Choreography Saga**:
Each service listens for events and emits events. No central coordinator.

\`\`\`
OrderPlaced → [PaymentService: charge card]
  → PaymentProcessed → [InventoryService: reserve items]
    → InventoryReserved → [ShipmentService: create shipment]
      → ShipmentCreated → [WarehouseService: notify]
        → ... and so on

Failure: InventoryReservationFailed →
  [PaymentService listens and refunds]
\`\`\`

Problems at scale:
- Step 4 failure requires compensation in steps 1, 2, 3 — who coordinates?
- Debugging: follow 6 events across 6 services in distributed traces
- New step addition: must update multiple services' event handlers
- Cyclic dependencies can emerge accidentally

**Orchestration Saga**:
Central saga orchestrator drives the workflow:
\`\`\`typescript
class OrderFulfillmentSaga {
  async execute(orderId: string) {
    try {
      await this.paymentService.charge(orderId);         // Step 1
      await this.inventoryService.reserve(orderId);      // Step 2
      await this.shipmentService.create(orderId);        // Step 3
      await this.warehouseService.notify(orderId);       // Step 4
      await this.emailService.sendConfirmation(orderId); // Step 5
      await this.loyaltyService.addPoints(orderId);      // Step 6
    } catch (error) {
      await this.rollback(orderId, error.step);          // Compensation
    }
  }

  async rollback(orderId: string, failedStep: number) {
    if (failedStep > 2) await this.inventoryService.release(orderId);
    if (failedStep > 1) await this.paymentService.refund(orderId);
  }
}
\`\`\`

Benefits:
- Single place to see full workflow
- Clear compensation logic
- Easy to add monitoring/tracing at orchestrator level
- Step order is explicit

**The Orchestrator SPOF Problem**:
Mitigated by:
- Persisting saga state to DB (so orchestrator can resume after crash)
- Making orchestrator stateless (state in DB, orchestrator is just a runner)
- Multiple orchestrator instances (each claim a saga via optimistic locking)

**Decision Matrix**:
| Factor | Choreography | Orchestration |
|--------|-------------|---------------|
| Steps | < 3 | 4+ |
| Team | Strong event discipline | Any |
| Debugging | Hard | Easy |
| Coupling | Loose (event contracts) | Tighter (orchestrator knows all) |
| Adding steps | Update multiple services | Update orchestrator only |`,
      trade_offs: [
        {
          approach: "Choreography-based saga",
          pros: [
            "No central coordinator (no SPOF)",
            "Services are truly decoupled",
            "Scales independently",
          ],
          cons: [
            "Difficult to trace end-to-end flow",
            "Compensation logic spread across services",
            "Implicit coupling via event contracts",
            "Hard to add/remove steps without careful coordination",
          ],
        },
        {
          approach: "Orchestration-based saga",
          pros: [
            "Single place to see workflow",
            "Easy compensation logic",
            "Simple debugging",
            "Clear step order",
          ],
          cons: [
            "Orchestrator is a coordination point (can become SPOF if stateless not handled)",
            "Services know about orchestrator",
            "Requires durable state storage for orchestrator",
          ],
        },
      ],
      real_world_example:
        "Uber's trip lifecycle (request → dispatch → pickup → ride → payment → rating) uses an orchestration-based saga internally called 'Trip Machine'. The orchestrator state is persisted to Schemaless (Uber's distributed DB) so it can resume from any step after failure. Each step has idempotency keys to prevent duplicate charges or trips. When a payment fails after ride completion, the saga executes a compensation flow: notify driver, create debt record, attempt retry on next trip. The explicit orchestrator made it easy to add new steps (e.g., safety check) without modifying all downstream services.",
      red_flags: [
        "Recommends 2PC (two-phase commit) across microservices — shows lack of distributed systems experience",
        "Cannot explain what a compensating transaction is",
        "Claims choreography has no coupling (misunderstands event contract coupling)",
        "Does not address how the orchestrator handles its own failure (saga state persistence)",
        "Unaware of idempotency requirement for saga steps",
      ],
      follow_up_questions: [
        "How do you make saga steps idempotent so that retrying a failed step doesn't double-charge the customer?",
        "What happens if the orchestrator crashes between steps 3 and 4 and restarts? How does it know where to resume?",
        "How would you test the compensation flow in a staging environment without actually charging payment?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 8. [Performance] — Read-Heavy Service Optimization
  {
    title:
      "Your user profile API serves 500K req/min, mostly reads. p99 latency is 800ms. DB CPU at 60% — how do you get p99 to < 50ms?",
    content:
      "A user profile service returns a user object (20 fields, ~2KB) used by every other service in your platform. It handles 500K req/min, 95% reads. The PostgreSQL DB has 10M users, adequate indexes, and runs at 60% CPU. Current p99 is 800ms. You need p99 < 50ms without increasing DB hardware. Walk through your optimization approach — what metrics do you gather first, and what do you change?",
    answer: buildAnswer({
      short_answer:
        "800ms p99 for a simple profile read screams cache miss or lock contention, not indexing. Instrument cache hit rates, connection pool wait time, and per-query trace. The path to < 50ms is: Redis cache with write-through, connection pool right-sizing, and possibly denormalized profile objects pre-computed on write. At 500K req/min (8K req/s) with 10M users and high read/write ratio, cache should be the primary optimization.",
      detailed_answer: `**Step 1: Gather Metrics Before Optimizing**

\`\`\`sql
-- Check for lock waits
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- Check slow queries
SELECT query, calls, mean_exec_time, stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- Check cache hit ratio (should be > 99%)
SELECT
  sum(heap_blks_hit)/(sum(heap_blks_hit)+sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;
\`\`\`

Application metrics to add:
- Cache hit rate (currently unknown)
- Connection pool wait time (time from request to connection acquired)
- Query execution time vs total request time (what % is DB?)

**Common Root Causes of 800ms p99**:
1. Cache completely absent or too small → every request hits DB
2. DB connection pool too small → queue wait time
3. Joins or N+1 in query
4. Profile object assembled from multiple tables (5 queries per request)

**Optimization Path**:

**Cache Layer (most impactful)**:
\`\`\`typescript
// Write-through cache: update cache AND DB on write
async updateProfile(userId: string, data: UpdateProfileDto) {
  await this.db.update(userId, data);
  await this.cache.set(\`profile:\${userId}\`, data, { ttl: 3600 });
}

// Read: cache-first
async getProfile(userId: string) {
  const cached = await this.cache.get(\`profile:\${userId}\`);
  if (cached) return cached;

  const profile = await this.db.findOne(userId);
  await this.cache.set(\`profile:\${userId}\`, profile, { ttl: 3600 });
  return profile;
}
\`\`\`

Cache sizing: 10M users × 2KB = 20GB. Redis cluster of 3×8GB = 24GB, fits all users.
Expected cache hit rate with write-through: 98%+ after warm-up.
Expected p99 with warm cache: 1-5ms (Redis RTT).

**Connection Pool Optimization**:
At 8K req/s, if each request holds a connection for 100ms → need 800 connections.
PostgreSQL hard limit: ~1000 connections before performance degrades.
Solution: PgBouncer transaction mode → 20 actual DB connections handle 8K req/s.

**Pre-computed Profile Objects**:
If profile assembles from users + preferences + subscription + badges:
- Compute and cache the full assembled object at write time
- Reads always get the pre-computed blob
- Trade: slight staleness for dependent data (acceptable if TTL = 60s)`,
      trade_offs: [
        {
          approach: "Redis write-through cache",
          pros: [
            "p99 drops to 1-5ms with warm cache",
            "DB load drops by 98%",
            "No DB schema changes",
          ],
          cons: [
            "Cache invalidation on every write",
            "20GB Redis cluster cost",
            "Must handle cache miss on cold start",
            "Cache stampede on cold start or eviction",
          ],
        },
        {
          approach: "Read replicas",
          pros: ["Straightforward to add", "No application cache logic"],
          cons: [
            "Still ~50-100ms per query",
            "Replication lag for hot users",
            "Expensive at scale",
            "Does not address connection pool exhaustion",
          ],
        },
        {
          approach: "Pre-computed profile blob in separate table",
          pros: ["Reads are single-row lookups", "No joins"],
          cons: [
            "Dual-write maintenance",
            "Stale risk if update fails",
            "Schema migration needed",
          ],
        },
      ],
      real_world_example:
        "LinkedIn's member profile service serves billions of profile reads per day. Their architecture uses a multi-layer cache: L1 in-process cache (Guava) for hot profiles (top 1% = 10M users, ~20GB JVM heap), L2 distributed cache (Couchbase), L3 database. The in-process cache eliminates all network RTT for hot profiles, achieving < 0.5ms p99. Cache invalidation uses a Kafka-based event stream: any profile update publishes to a topic consumed by all cache layers for immediate eviction.",
      red_flags: [
        "Jumps to adding read replicas without checking if DB is even the bottleneck",
        "Does not consider connection pool wait time as a latency contributor",
        "Cannot estimate whether 10M × 2KB fits in Redis (basic capacity math)",
        "Unaware of cache stampede problem on warm-up and how to prevent it (lock/probabilistic early expiry)",
        "Does not mention write-through vs cache-aside trade-offs",
      ],
      follow_up_questions: [
        "How do you handle cache stampede when 10,000 users' caches expire simultaneously?",
        "If a profile is updated 100 times per second (e.g., view counter), how do you avoid cache thrashing?",
        "How do you ensure the cache stays consistent across 3 Redis nodes during a node failure?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 9. [System Design] — Multi-region Active-Active
  {
    title:
      "Design an active-active multi-region deployment for a social app where writes can originate from any region",
    content:
      "Your social app has users in the US and EU. You want to deploy in both regions active-active (not active-passive). Users should write to their nearest region. But when a US user and an EU user both edit the same post title within 200ms of each other, you have a write conflict. How do you architect this system to handle conflicts correctly, keep latency low for all users, and comply with EU data residency requirements?",
    answer: buildAnswer({
      short_answer:
        "Use CRDTs or last-write-wins with vector clocks for conflict resolution. Separate user-owned data (write to home region only) from shared data (needs conflict resolution). For EU data residency, EU users' PII must live in EU with async replication to US for reads — not full bidirectional replication. For post edits, last-write-wins with server-assigned timestamps is usually acceptable; for counters (likes), use CRDTs.",
      detailed_answer: `**The Fundamental Tension**:
- Active-active requires accepting writes from both regions
- Same object written simultaneously in two regions = conflict
- CAP theorem: in a network partition, choose consistency (reject some writes) or availability (accept conflicts, resolve later)

**Data Classification**:
Not all data needs the same treatment:
\`\`\`
User PII (name, email):          → user's home region, replicate read-only
User posts (created by one user): → write to user's home region
Social graph (followers):          → LWW with conflict rare
Shared counters (likes/views):    → CRDT (G-Counter)
Chat messages:                     → ordered log per conversation, region-aware
\`\`\`

**Conflict Resolution Strategies**:

1. **Last Write Wins (LWW)** — simplest, acceptable for post edits:
\`\`\`
US write: { id: 1, title: "Hello", ts: 100 }
EU write: { id: 1, title: "Hola",  ts: 102 }
Result:   { id: 1, title: "Hola",  ts: 102 }  ← higher timestamp wins
\`\`\`
Risk: clock skew (NTP accuracy ~10ms). Mitigate with hybrid logical clocks.

2. **CRDT (Conflict-free Replicated Data Type)** — for counters:
\`\`\`
US likes counter: +50
EU likes counter: +30
Merged: 50 + 30 = 80  ← always converges correctly
\`\`\`

3. **Operational Transformation** — for collaborative editing (complex, like Google Docs)

**EU Data Residency**:
- EU user PII: stored ONLY in EU region
- US region may cache EU user's non-PII data (username, avatar) but cannot store email, address
- GDPR deletion: must propagate delete to all replicas within 30 days
\`\`\`
EU → US replication: filtered (exclude PII fields)
US → EU replication: social graph, post metadata (no user PII)
\`\`\`

**Write Routing**:
\`\`\`
User in EU → writes go to EU region
  → EU DB primary receives write
  → Async replication to US (< 200ms typically)
  → US users see EU user's post with 200ms eventual lag
\`\`\`

For strictly local writes (EU user's own posts):
- Write to EU
- US only reads (via replication)
- No conflict possible for owner-authored content`,
      trade_offs: [
        {
          approach:
            "Active-active with LWW and async replication for all data",
          pros: [
            "Low write latency (write to nearest region)",
            "High availability",
            "Simple conflict resolution",
          ],
          cons: [
            "Data loss possible if region fails before replication",
            "LWW loses concurrent edits silently",
            "Clock skew can cause incorrect winner selection",
          ],
        },
        {
          approach: "Active-passive with failover",
          pros: [
            "No conflicts",
            "Strong consistency",
            "Simple reasoning",
          ],
          cons: [
            "High write latency for passive region users",
            "Failover takes 10-60 seconds",
            "Active region becomes SPOF",
          ],
        },
        {
          approach: "Regional ownership with async cross-region reads",
          pros: [
            "No write conflicts (each user owns their data)",
            "GDPR-friendly",
            "Low write latency",
          ],
          cons: [
            "Cross-region reads have replication lag",
            "Cannot write to other users' data in same transaction",
            "Social interactions (replies, reactions) are complex",
          ],
        },
      ],
      real_world_example:
        "Facebook's social graph uses a system called Tao for multi-region replication. Each region has a read cache and writes go to the master region (US-based). Reads can be served from local cache with eventual consistency. For EU GDPR compliance, Facebook had to build a separate EU data store for certain PII fields, with replication pipelines that strip PII before sending to US. The hardest challenge was handling 'right to erasure' — deleting data from all caches and replicas within 30 days across 20+ data centers.",
      red_flags: [
        "Claims active-active is always better without discussing conflict resolution",
        "Does not know what a CRDT is or when to use LWW vs vector clocks",
        "Ignores EU data residency requirement entirely",
        "Assumes strong consistency is achievable across 2 regions with low latency (violates CAP)",
        "Cannot explain the difference between eventual consistency and strong consistency in practical terms",
      ],
      follow_up_questions: [
        "How do you handle a user who moves from EU to US — their data is in EU, but now they're writing from US. Do you migrate their data?",
        "If EU-US network link goes down for 5 minutes, what happens to EU users trying to like a US user's post?",
        "How do you test conflict resolution logic in staging without waiting for actual concurrent writes from two regions?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },

  // 10. [Debug/Incident] — Memory Leak in Long-Running Service
  {
    title:
      "Production Node.js service memory grows from 200MB to 4GB over 48 hours then crashes — how do you diagnose and fix",
    content:
      "Your Node.js API service starts at 200MB RSS. Every 48 hours it reaches 4GB and OOM crashes. Restarting fixes it temporarily. The service handles user sessions, WebSocket connections, and background job scheduling. How do you diagnose the leak in production without taking the service down, and what are the most common Node.js memory leak patterns you'd check first?",
    answer: buildAnswer({
      short_answer:
        "Take heap snapshots at T=0, T=12h, T=24h and diff them to find growing object types. The most common Node.js leaks: unbounded Maps/Sets used as caches without eviction, event listeners added but never removed (especially in WebSocket or EventEmitter patterns), closures capturing large objects, and setInterval accumulating state. Profile with --inspect-brk and Chrome DevTools or clinic.js.",
      detailed_answer: `**Diagnosis Without Downtime**:

Step 1 — Monitor RSS growth rate:
\`\`\`bash
# Every 5 minutes, log process memory
setInterval(() => {
  const mem = process.memoryUsage();
  logger.info({ rss: mem.rss, heapUsed: mem.heapUsed, external: mem.external });
}, 300_000);
\`\`\`

Step 2 — Take heap snapshots in production (low overhead):
\`\`\`javascript
// Expose endpoint for snapshot (admin-only)
app.get('/admin/heapdump', (req, res) => {
  const v8 = require('v8');
  const snapshot = v8.writeHeapSnapshot();
  res.json({ file: snapshot });
});
\`\`\`

Compare snapshots at T+0, T+24h using Chrome DevTools:
- Open DevTools → Memory → Load snapshot
- Use "Comparison" view to see objects that grew between snapshots
- Sort by "Delta" — the growing type is your leak

Step 3 — Identify leak pattern by object type:
- Growing \`Array\` or \`Object\` → unbounded cache or accumulator
- Growing \`Closure\` → setInterval/setTimeout capturing references
- Growing \`(EventEmitter)\` → listener leak
- Growing \`Buffer\` → stream not consumed/destroyed

**Common Leak Patterns**:

1. **EventEmitter listener leak**:
\`\`\`javascript
// BUG: adds new listener on every WebSocket connect, never removed
wsServer.on('connection', (socket) => {
  emitter.on('broadcast', (msg) => socket.send(msg));  // LEAK
  // socket.on('close', ...) never calls emitter.off()
});

// FIX:
wsServer.on('connection', (socket) => {
  const handler = (msg) => socket.send(msg);
  emitter.on('broadcast', handler);
  socket.on('close', () => emitter.off('broadcast', handler));  // cleanup
});
\`\`\`

2. **Unbounded cache**:
\`\`\`javascript
// BUG: cache grows forever
const cache = new Map();
function getUser(id) {
  if (!cache.has(id)) cache.set(id, fetchUser(id));
  return cache.get(id);
}

// FIX: LRU cache with max size
const cache = new LRU({ max: 10_000, ttl: 1000 * 60 * 60 });
\`\`\`

3. **setInterval with closure**:
\`\`\`javascript
// BUG: interval captures req context, req context never GC'd
function handleRequest(req) {
  const jobId = setInterval(() => checkJob(req.jobId), 1000);
  // If clearInterval never called on job completion, req stays in memory
}
\`\`\`

**Production Safe Tools**:
- \`clinic.js doctor\`: low-overhead flame graphs and memory analysis
- \`heapdump\` npm package: trigger heap snapshot via signal
- \`--max-old-space-size\`: temporary mitigation while diagnosing`,
      trade_offs: [
        {
          approach: "Heap snapshot analysis (offline)",
          pros: [
            "Definitive — shows exact object types and references",
            "No production impact",
            "Works with Chrome DevTools",
          ],
          cons: [
            "Snapshot itself can take 5-10 seconds for large heaps",
            "4GB heap snapshot is a 4GB file to analyze",
            "Requires exposing admin endpoint",
          ],
        },
        {
          approach: "clinic.js or 0x flame graph profiling",
          pros: [
            "Visual, easy to understand",
            "Shows both CPU and memory patterns",
            "Great for identifying hot paths",
          ],
          cons: [
            "Adds 10-30% overhead while profiling",
            "Not safe to run on production under full load",
            "Requires traffic replay in staging for best results",
          ],
        },
        {
          approach: "Scheduled pod restarts (mitigation, not fix)",
          pros: [
            "Immediate relief",
            "Buys time for diagnosis",
          ],
          cons: [
            "Causes brief disruption on each restart",
            "Does not address root cause",
            "Hides the problem — discourages fixing",
          ],
        },
      ],
      real_world_example:
        "Slack's Node.js backend had a progressive memory leak that manifested only after 36+ hours of uptime. Using heap snapshot comparison, they identified that every incoming WebSocket message was adding a new listener to a shared EventEmitter for routing purposes. The EventEmitter had 50,000+ listeners after 36 hours (one per message channel context). The fix: use a Map keyed by channelId instead of EventEmitter listeners, and explicitly delete the Map entry when the channel is closed. Memory stabilized at 200MB regardless of uptime.",
      red_flags: [
        "Suggests restarting the service on a cron as the solution",
        "Cannot name specific Node.js memory profiling tools (heapdump, clinic.js, v8.writeHeapSnapshot)",
        "Does not know what a heap snapshot is or how to interpret the comparison view",
        "Only knows to check for 'circular references' (common misconception — V8 GC handles circular refs correctly)",
        "Cannot explain why EventEmitter listener leaks are common in WebSocket-based services",
      ],
      follow_up_questions: [
        "How would your diagnosis approach differ if external memory (Buffer/native addons) is growing instead of V8 heap?",
        "How do you safely take a heap snapshot on a 4GB process without causing a 10-second GC pause?",
        "After finding the leak, how do you write a regression test that would catch this leak in CI before it reaches production?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "system-design",
  },
];
