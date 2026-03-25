/**
 * Senior-Level PostgreSQL Interview Questions
 *
 * 10 production-grade questions targeting developers with 5+ years experience.
 * Focus: query performance, concurrency, scaling, data consistency, incident diagnosis.
 *
 * Topics: postgresql (10)
 * Level: SENIOR
 *
 * Usage: pnpm --filter backend seed:senior-postgresql
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
  difficultyScore?: number;
  displayOrder?: number;
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
// POSTGRESQL — SENIOR LEVEL (10 questions)
// ============================================

export const seniorPostgresqlQuestions: QuestionSeed[] = [
  // 1. [Debug] — Slow Query Despite Index
  {
    title:
      "Your query has an index but EXPLAIN shows Seq Scan. Walk through every reason this could happen and how you diagnose each",
    content:
      "You add an index on users.created_at, but EXPLAIN ANALYZE still shows a sequential scan on a 50M row table. The query is: SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'. How do you systematically diagnose why the planner chose a seq scan, and what are all the possible root causes?",
    answer: buildAnswer({
      short_answer:
        "PostgreSQL's query planner chooses seq scan when it estimates it's cheaper than an index scan. This happens when: statistics are stale (ANALYZE needed), query selectivity is too low (returns > 10-20% of rows), index is on an expression different from the query predicate, or planner cost constants are misconfigured for your storage type. EXPLAIN ANALYZE with BUFFERS reveals the real costs.",
      detailed_answer: `**Systematic Diagnosis**:

Step 1 — Check what the planner actually thinks:
\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days';
\`\`\`

Look for:
- \`Seq Scan on users (cost=0.00..XXXXX rows=YYYY)\`
- If rows=YYYY is large (> 10% of table) → planner correctly chose seq scan
- If rows=100 but actual=5000000 → statistics are stale

Step 2 — Check table statistics:
\`\`\`sql
SELECT
  schemaname, tablename, last_analyze, last_autoanalyze,
  n_live_tup, n_dead_tup, n_mod_since_analyze
FROM pg_stat_user_tables
WHERE tablename = 'users';
\`\`\`

If \`n_mod_since_analyze\` is large → statistics are stale → run ANALYZE.

Step 3 — Check index existence and type:
\`\`\`sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';
\`\`\`

Verify: is the index on \`created_at\` or on \`(created_at::date)\` or \`lower(email)\`?
Predicate \`created_at > X\` cannot use an index on \`created_at::date\`.

**All Possible Root Causes**:

1. **High selectivity** (most common): query returns > 15-20% of rows
   - 50M rows, 7-day window, 10K new users/day = 70K rows = 0.14% → should use index
   - But if all 50M users registered in the last 7 days → seq scan is correct

2. **Stale statistics**: planner estimates 100 rows but actual is 5M
   → Fix: \`ANALYZE users;\` or reduce autovacuum threshold

3. **Table is small** (fits in 1-2 pages): planner always seq scans small tables
   → Not applicable to 50M row table

4. **random_page_cost too high** for SSDs:
\`\`\`sql
-- Default: random_page_cost = 4.0 (HDD assumption)
-- SSD: should be 1.1-1.5
SHOW random_page_cost;
SET random_page_cost = 1.1;  -- test if index scan is chosen
\`\`\`

5. **Index bloat**: dead tuples make index pages large, increasing cost estimate
\`\`\`sql
SELECT * FROM pgstattuple('idx_users_created_at');
-- Check dead_tuple_percent > 20%
\`\`\`

6. **Wrong index type for range scan**: HASH index doesn't support range operators
   → BTree index is correct for range queries

7. **Correlation**: index is on a column with low correlation (data not physically sorted)
   For extremely low correlation, index scan requires random I/O for every row → planner prefers seq scan`,
      trade_offs: [
        {
          approach: "Force index via SET enable_seqscan = off (debugging only)",
          pros: [
            "Quickly tests if index scan is faster",
            "Reveals actual index scan cost for comparison",
          ],
          cons: [
            "NEVER do this in production — disables planner optimization globally",
            "Session-level only but can cause severe degradation",
            "Treats symptom not cause",
          ],
        },
        {
          approach: "Adjust random_page_cost for SSD storage",
          pros: [
            "Correct fix for SSD-backed storage",
            "Improves index scan cost estimates for all queries",
            "Permanent improvement",
          ],
          cons: [
            "Must be done carefully — too low makes planner over-prefer index scans",
            "Should be set in postgresql.conf, not per-session",
          ],
        },
        {
          approach: "Partial index to increase selectivity",
          pros: [
            "Drastically reduces index size",
            "Planner almost always chooses partial index for matching queries",
          ],
          cons: [
            "Only helps if query always has the partial index predicate",
            "Index must be recreated if predicate logic changes",
          ],
        },
      ],
      real_world_example:
        "A fintech company had a transactions table (200M rows) with an index on transaction_date. Their end-of-day report query (last 30 days) started doing seq scans after a data migration that changed the physical storage order. Investigation revealed: random_page_cost was 4.0 (HDD default) but they had migrated to NVMe SSDs. Setting random_page_cost=1.1 and running ANALYZE immediately switched the planner to index range scans, cutting query time from 45 seconds to 800ms. The old cost model made random I/O appear more expensive than it actually was.",
      red_flags: [
        "Only suggests running VACUUM without checking statistics or selectivity first",
        "Does not know about random_page_cost and its impact on index vs seq scan decision",
        "Suggests SET enable_seqscan = off as a production fix",
        "Cannot read EXPLAIN output and identify which node is the bottleneck",
        "Unaware that partial indexes exist or when to use them",
      ],
      follow_up_questions: [
        "If the query returns 30% of rows, is there ever a scenario where an index scan is faster than a seq scan?",
        "How does CLUSTER command help, and what are the trade-offs vs maintaining a covering index?",
        "How would you create a partial index that only covers active users (deleted_at IS NULL) and how much space would it save?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 2. [Concurrency] — SELECT FOR UPDATE and Deadlocks
  {
    title:
      "Two concurrent transactions both SELECT FOR UPDATE the same rows in different orders — deadlock. How do you prevent it at scale?",
    content:
      "Your payment service runs two concurrent operations: 'Transfer from A to B' locks account A then B, and 'Transfer from B to A' locks account B then A. This creates a classic deadlock detected by PostgreSQL. In production with thousands of concurrent transfers, deadlocks happen hundreds of times per minute. How do you design your way out of this?",
    answer: buildAnswer({
      short_answer:
        "Always acquire locks in a consistent global order — sort account IDs and always lock the lower ID first. This eliminates the deadlock condition by ensuring all transactions acquire locks in the same sequence. For high-contention scenarios, also consider optimistic locking (version counter + retry on conflict) or serializable isolation level with automatic retry on serialization failure.",
      detailed_answer: `**The Deadlock Root Cause**:
\`\`\`
Transaction T1: LOCK account_A → wait for account_B
Transaction T2: LOCK account_B → wait for account_A
\`\`\`
PostgreSQL detects this cycle and kills one transaction with:
\`ERROR: deadlock detected DETAIL: Process 1 waits for ShareLock on transaction 2; blocked by process 2\`

**Fix 1: Consistent Lock Ordering (Recommended)**
\`\`\`typescript
async function transfer(fromId: string, toId: string, amount: number) {
  // Always lock in sorted order to prevent deadlock
  const [firstId, secondId] = [fromId, toId].sort();

  await db.transaction(async (trx) => {
    // Lock in consistent order regardless of transfer direction
    await trx.query(
      'SELECT * FROM accounts WHERE id = ANY($1) ORDER BY id FOR UPDATE',
      [[firstId, secondId]]
    );

    await trx.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await trx.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
  });
}
\`\`\`

\`ORDER BY id\` with \`FOR UPDATE\` ensures PostgreSQL locks rows in ID order, making deadlocks impossible for this pattern.

**Fix 2: SKIP LOCKED for Queue Processing**
If transfers are queued:
\`\`\`sql
SELECT * FROM pending_transfers
WHERE status = 'pending'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;
\`\`\`
Each worker grabs the next unlocked transfer, no waiting.

**Fix 3: Optimistic Locking**
\`\`\`sql
-- Use version column instead of locks
UPDATE accounts
SET balance = balance - 100, version = version + 1
WHERE id = $1 AND version = $2;
-- If 0 rows updated → someone else changed the row → retry
\`\`\`
Pros: no blocking, scales well under low contention.
Cons: retries increase under high contention — becomes pessimistic at 50%+ conflict rate.

**Fix 4: Application-Level Mutex**
Use Redis distributed lock keyed by sorted account pair:
\`\`\`typescript
const lockKey = [accountA, accountB].sort().join(':');
const lock = await redlock.acquire(lockKey, 5000);
try { await doTransfer(); } finally { await lock.release(); }
\`\`\`
Pros: Works across microservices. Cons: Redis SPOF, adds latency.

**Deadlock Rate Monitoring**:
\`\`\`sql
SELECT * FROM pg_stat_database WHERE datname = 'your_db';
-- deadlocks column increases on each deadlock
\`\`\`
Alert when deadlock rate > 10/min.`,
      trade_offs: [
        {
          approach: "Pessimistic locking with consistent order (SELECT FOR UPDATE)",
          pros: [
            "Zero phantom reads or lost updates",
            "Simple to reason about correctness",
            "Database enforces it",
          ],
          cons: [
            "Locks are held for transaction duration",
            "High contention → queue formation",
            "Does not scale beyond ~1000 TPS for hot accounts",
          ],
        },
        {
          approach: "Optimistic locking with version column",
          pros: [
            "No locks held — high throughput under low contention",
            "Works well for read-heavy, write-infrequent patterns",
          ],
          cons: [
            "Retry logic required in application",
            "Under high contention, retry rate → 100%, performance degrades severely",
            "Starvation: same transaction may retry infinitely",
          ],
        },
        {
          approach: "Serializable isolation level (SSI)",
          pros: [
            "PostgreSQL handles conflict detection automatically",
            "Correct by default",
            "No need to order locks manually",
          ],
          cons: [
            "Higher overhead than READ COMMITTED",
            "More serialization failures to retry",
            "Performance degrades under high write concurrency",
          ],
        },
      ],
      real_world_example:
        "Stripe's payment system handles millions of concurrent balance operations. Their core insight: never hold a database lock during external API calls (like Visa authorization, which can take 500ms). Their pattern: read balance → perform external auth → write back with optimistic lock (version check). If version mismatch (someone else charged concurrently), rollback and retry from the read. This kept DB lock time to microseconds while maintaining correctness. For deadlock prevention specifically, all multi-account operations sort account IDs before acquiring locks — a company-wide convention enforced in code review.",
      red_flags: [
        "Suggests catching deadlock exceptions and retrying without addressing root cause",
        "Does not know what SELECT FOR UPDATE does or why it blocks",
        "Cannot explain the difference between pessimistic and optimistic locking",
        "Unaware that consistent lock ordering eliminates deadlocks for this pattern",
        "Does not mention the performance implications of holding locks during long operations",
      ],
      follow_up_questions: [
        "How do you handle the case where a transfer involves 3 accounts (A → B → C multi-hop) and you need to lock all three?",
        "If you switch to optimistic locking with retries, how do you prevent a transaction from retrying forever under high contention?",
        "How does PostgreSQL's SERIALIZABLE isolation level detect write-write conflicts vs read-write conflicts?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 3. [Performance] — Slow JOIN on Large Tables
  {
    title:
      "A JOIN between two 100M-row tables takes 45 seconds. EXPLAIN shows Hash Join with 8GB memory spill. How do you fix it?",
    content:
      "Query: SELECT o.*, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = 'pending' AND o.created_at > NOW() - INTERVAL '30 days'. Both tables have 100M rows. EXPLAIN shows Hash Join with 8GB hash batch written to disk. The query runs nightly in a batch job. work_mem is 64MB. How do you approach this?",
    answer: buildAnswer({
      short_answer:
        "Hash join spills to disk when the hash table exceeds work_mem. Increase work_mem for this session (not globally), add a covering index on orders(status, created_at, user_id) to filter before the join, or denormalize email into the orders table if it's needed on every order. Also check if the nightly batch can use a streaming approach instead of a single 100M-row scan.",
      detailed_answer: `**Understanding the Problem**:
Hash Join builds a hash table from the smaller relation (after filtering), then probes it with the larger relation. If hash table > work_mem, PostgreSQL writes batches to disk — extremely slow.

\`\`\`
Hash Join (cost: very high)
  Hash Cond: (o.user_id = u.id)
  Batches: 128  ← 128 disk I/O rounds!
  Memory Usage: 64MB → spilling to disk
  → Filter: (status = 'pending' AND created_at > ...)
  → rows: 5000000 (after filter)
\`\`\`

**Fix 1: Reduce Row Count Before Join (Most Impactful)**

Create a covering index on the filtered columns:
\`\`\`sql
CREATE INDEX CONCURRENTLY idx_orders_pending_recent
ON orders (status, created_at, user_id)
WHERE status = 'pending';
-- Partial index: only pending orders
\`\`\`

Now the plan becomes:
\`\`\`
Nested Loop Join (or small Hash Join)
  → Index Scan on orders (status='pending', created_at > 30d ago)
    → result: 10,000 rows (not 100M)
  → Index Scan on users WHERE id = ?
    → result: 1 row per lookup
\`\`\`
Join over 10K rows vs 100M rows → orders of magnitude faster.

**Fix 2: Increase work_mem for This Session**
\`\`\`sql
-- Only for this session (not global)
SET work_mem = '2GB';
SELECT o.*, u.email FROM orders o JOIN users u ON o.user_id = u.id ...;
-- Hash table now fits in memory → no disk spill
\`\`\`

Global work_mem increase is dangerous: 100 concurrent queries × 2GB = 200GB RAM consumed.

**Fix 3: Batch Processing Instead of Single Query**
For a nightly batch, process in chunks:
\`\`\`typescript
const BATCH_SIZE = 10_000;
let offset = 0;

while (true) {
  const batch = await db.query(\`
    SELECT o.*, u.email FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'pending'
    AND o.created_at > NOW() - INTERVAL '30 days'
    ORDER BY o.id
    LIMIT $1 OFFSET $2
  \`, [BATCH_SIZE, offset]);

  if (batch.length === 0) break;
  await processBatch(batch);
  offset += BATCH_SIZE;
}
\`\`\`

**Fix 4: Denormalize Email into Orders**
If email is needed on every order read:
\`\`\`sql
ALTER TABLE orders ADD COLUMN user_email TEXT;
-- Populate via migration
-- Update on user email change via trigger or application
\`\`\`
Eliminates join entirely.`,
      trade_offs: [
        {
          approach: "Add covering partial index",
          pros: [
            "Dramatically reduces rows before join",
            "Permanent improvement",
            "No application changes",
          ],
          cons: [
            "Index adds write overhead on orders table",
            "Index creation is expensive on 100M-row table (use CONCURRENTLY)",
          ],
        },
        {
          approach: "Increase work_mem for session",
          pros: [
            "Quick fix — no schema changes",
            "Safe when limited to single session",
          ],
          cons: [
            "Temporary — won't help if query runs concurrently",
            "Does not fix the underlying scan of 100M rows",
            "8GB RAM needed for this query alone",
          ],
        },
        {
          approach: "Batch processing",
          pros: [
            "Bounded memory per batch",
            "Can be parallelized",
            "Works for any size table",
          ],
          cons: [
            "More complex application code",
            "Longer total runtime (more roundtrips)",
            "Results not transactionally consistent across batches",
          ],
        },
      ],
      real_world_example:
        "An e-commerce company's order analytics job scanned 500M orders nightly, joining with a 50M users table. work_mem spill turned a 5-minute query into 45 minutes. Solution: a covering partial index on orders(status, created_at) WHERE status IN ('pending', 'processing') reduced the scan to 200K rows. The join hash table dropped from 8GB to 40MB — fits in work_mem easily. Query time: 45 minutes → 8 seconds. Secondary optimization: added a materialized view that pre-joined order+user data, refreshed every hour, reducing the nightly job to a simple aggregation.",
      red_flags: [
        "Increases global work_mem without understanding memory impact",
        "Does not think about filtering BEFORE the join to reduce rows",
        "Cannot read EXPLAIN output Batches field to understand disk spill",
        "Unaware of CONCURRENTLY option for adding indexes without locking",
        "Suggests running VACUUM as the solution to slow joins",
      ],
      follow_up_questions: [
        "If the orders table grows to 1 billion rows over the next year, how does your solution change?",
        "How would you handle this query if it needs to run in real-time (not just nightly batch) with p99 < 500ms?",
        "What's the trade-off between a B-tree partial index and a materialized view for this use case?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 4. [System Design] — Multi-tenant Database Architecture
  {
    title:
      "Design a multi-tenant PostgreSQL architecture for a SaaS app with 10,000 tenants ranging from 100 to 10M rows each",
    content:
      "You're building a B2B SaaS product. Some tenants have 100 rows, some have 10 million. You need strong data isolation, the ability to give large tenants dedicated resources, and cost efficiency for small tenants. Compare the three main multi-tenancy patterns (shared table, separate schema, separate database) and explain which you'd choose and how you'd migrate between patterns as a tenant grows.",
    answer: buildAnswer({
      short_answer:
        "Start with shared table (row-level security + tenant_id) for all tenants — it's the most cost-efficient and operationally simple. Build in the ability to 'eject' a large tenant to their own schema or database when they exceed a threshold (e.g., > 1M rows or SLA requires dedicated resources). The migration path requires dual-write, data copy, and routing layer update — design for this from day one.",
      detailed_answer: `**Three Patterns Compared**:

**1. Shared Table (Tenant ID column)**
\`\`\`sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ...
);
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at);
-- Row-level security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
\`\`\`
Best for: < 1M rows per tenant, cost-sensitive, most SaaS apps.
Problem: large tenant's queries slow down small tenants (noisy neighbor).

**2. Separate Schema**
\`\`\`sql
CREATE SCHEMA tenant_abc123;
CREATE TABLE tenant_abc123.orders (...);
\`\`\`
Benefits: schema-level dump/restore, per-tenant migrations possible.
Limits: PostgreSQL has practical limit of ~10K schemas per DB before catalog becomes slow.

**3. Separate Database**
Each tenant gets their own PostgreSQL database (or RDS instance).
Best for: enterprise customers, strict compliance, massive data.
Costs: connection overhead, operational complexity × 10,000.

**Recommended Architecture: Tiered Approach**

\`\`\`
Tier 1 (shared DB):  10,000 small tenants → shared tables + RLS
Tier 2 (shared DB):  100 medium tenants → separate schemas
Tier 3 (dedicated): 10 large tenants → dedicated DB instances
\`\`\`

**Routing Layer (critical)**:
\`\`\`typescript
async function getTenantConnection(tenantId: string): Promise<Connection> {
  const tenant = await getTenantMetadata(tenantId);

  switch (tenant.tier) {
    case 'shared':
      return sharedPool.getConnection({ tenantId });
    case 'schema':
      return schemaPool.getConnection({ schema: tenant.schema });
    case 'dedicated':
      return tenant.connectionPool;  // pre-initialized per tenant
  }
}
\`\`\`

**Migration Path (small → large tenant)**:
\`\`\`
Phase 1: Identify tenant exceeds threshold (> 1M rows or request)
Phase 2: Create new schema/DB for tenant
Phase 3: Dual-write: new writes go to both old shared + new dedicated
Phase 4: Copy historical data (pg_dump + restore, or COPY)
Phase 5: Verify checksums
Phase 6: Switch reads to dedicated
Phase 7: Stop dual-write
Phase 8: Clean up shared table (DELETE WHERE tenant_id = ...)
\`\`\`

This migration must be transparent to the tenant (no downtime).`,
      trade_offs: [
        {
          approach: "Shared table with Row-Level Security",
          pros: [
            "Lowest cost — 10K tenants on 1 DB",
            "Simple migrations (alter table once)",
            "Good for small tenants",
          ],
          cons: [
            "Noisy neighbor problem",
            "tenant_id must be on every index (larger indexes)",
            "RLS has ~5-10% overhead per query",
          ],
        },
        {
          approach: "Separate schemas",
          pros: [
            "Better isolation",
            "Per-tenant schema migrations possible",
            "Easier to dump/restore per tenant",
          ],
          cons: [
            "Practical limit ~10K schemas per database",
            "Shared catalog — large schemas slow catalog queries",
            "Connection pooling becomes complex",
          ],
        },
        {
          approach: "Separate databases",
          pros: [
            "Full isolation",
            "Dedicated resources",
            "Compliance-friendly",
          ],
          cons: [
            "Most expensive (10K databases)",
            "Connection per database required",
            "Schema migrations must be applied to each DB separately",
          ],
        },
      ],
      real_world_example:
        "Shopify uses a shared-database, separate-schema model for their 1M+ merchants. Each merchant gets their own schema with identical table definitions. When a merchant's store grows significantly (Shopify Plus tier), they get migrated to dedicated database clusters with additional read replicas. Shopify built an internal 'Pods' architecture where groups of merchants are assigned to specific database shards, allowing them to move merchants between shards when a shard gets hot. The routing layer (their internal 'Identity' service) maps shop_id → shard → database → schema.",
      red_flags: [
        "Recommends separate DB per tenant for all 10K tenants without discussing cost",
        "Does not mention Row-Level Security as a mechanism for shared table isolation",
        "Cannot describe a migration path for upgrading a tenant to a higher isolation tier",
        "Unaware of noisy neighbor problem and how to monitor for it",
        "Does not consider connection pool implications across 10K tenants",
      ],
      follow_up_questions: [
        "How do you run a database schema migration (ALTER TABLE) across 10,000 tenants with zero downtime?",
        "If tenant A's analytics query causes a full table scan on a shared table with 50M rows from all tenants, how do you protect tenant B's latency?",
        "How do you handle a tenant requesting to export all their data and then delete it (GDPR right to erasure) from the shared table?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 5. [Architecture] — Avoiding Autovacuum Bloat at Scale
  {
    title:
      "Your orders table has 500M rows but is 3× larger on disk than it should be. VACUUM is running but not helping. Why and how do you fix it?",
    content:
      "A production PostgreSQL table has 500M rows. pg_stat_user_tables shows n_dead_tup = 400M. autovacuum is enabled and running daily. But the table is 120GB when the live data should be ~40GB. Queries are getting slower week over week. VACUUM ANALYZE shows 'skipping vacuuming' sometimes. What is happening, and how do you reclaim the space?",
    answer: buildAnswer({
      short_answer:
        "Dead tuples accumulate when VACUUM cannot reclaim them — usually because a long-running transaction holds an older transaction ID (xmin horizon), preventing VACUUM from marking those tuples as reclaimable. VACUUM FULL reclaims space but locks the table. pg_repack reclaims space online. Fix autovacuum parameters (scale_factor, cost_delay) to run more aggressively on large tables.",
      detailed_answer: `**Why Autovacuum Isn't Helping**:

PostgreSQL MVCC creates dead tuples on every UPDATE and DELETE. VACUUM marks them reclaimable, but cannot reclaim tuples newer than the oldest active transaction's xmin.

Check for blocking transactions:
\`\`\`sql
-- Find oldest transaction that's blocking vacuum
SELECT pid, usename, state, xact_start,
       age(backend_xmin) as xmin_age,
       query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC
LIMIT 5;
\`\`\`

If a long-running query (or idle transaction) holds an old xmin for hours, VACUUM cannot reclaim anything newer — dead tuples accumulate for the duration.

Also check replication slots (can pin xmin):
\`\`\`sql
SELECT slot_name, xmin, catalog_xmin,
       pg_current_wal_lsn() - restart_lsn AS lag
FROM pg_replication_slots;
-- If xmin is old (age > 10M), slot is blocking vacuum
\`\`\`

**Fix 1: Terminate the blocking transaction**
\`\`\`sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE age(backend_xmin) > 10000000;  -- xmin older than 10M transactions
\`\`\`

**Fix 2: Tune Autovacuum for Large Tables**
Default autovacuum triggers at 20% dead tuples OR 50 million rows:
\`\`\`sql
-- For this specific table, trigger more aggressively
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,  -- 1% dead tuples (not 20%)
  autovacuum_vacuum_cost_delay = 2        -- less throttling
);
\`\`\`

**Fix 3: Reclaim Disk Space**

Option A — VACUUM FULL (locks table, not for production):
\`\`\`sql
VACUUM FULL ANALYZE orders;  -- rewrites entire table, exclusive lock for hours
\`\`\`

Option B — pg_repack (online, no table lock):
\`\`\`bash
pg_repack -d mydb -t orders --wait-timeout=10
\`\`\`
pg_repack creates a shadow table, copies data, swaps with minimal locking.

**Preventing Future Bloat**:
- Set \`idle_in_transaction_session_timeout = '10min'\` to kill abandoned transactions
- Monitor and drop unused replication slots
- Use \`FILLFACTOR\` < 100 on hot-update tables to leave room for in-page updates (HOT updates avoid dead tuples)
\`\`\`sql
-- HOT-friendly table: leave 20% of each page for updates
ALTER TABLE orders SET (FILLFACTOR = 80);
\`\`\``,
      trade_offs: [
        {
          approach: "VACUUM FULL to reclaim space",
          pros: ["Completely reclaims all dead space", "Simple one-command fix"],
          cons: [
            "Exclusive lock on table — production downtime",
            "120GB table = hours of lock",
            "Must be done in maintenance window",
          ],
        },
        {
          approach: "pg_repack (online repacking)",
          pros: [
            "No table lock during operation",
            "Can run during business hours",
            "Safe for production",
          ],
          cons: [
            "Requires pg_repack extension installed",
            "Needs 2× disk space during operation",
            "Slower than VACUUM FULL (hours for 120GB)",
          ],
        },
        {
          approach: "Reduce dead tuple accumulation proactively",
          pros: [
            "Prevents the problem from recurring",
            "FILLFACTOR optimization can eliminate dead tuples for hot rows",
          ],
          cons: [
            "FILLFACTOR requires table rewrite to apply",
            "Does not reclaim existing bloat",
            "Requires understanding of update patterns per table",
          ],
        },
      ],
      real_world_example:
        "Instagram's PostgreSQL clusters accumulated severe table bloat when they introduced a long-running analytics replica that held its xmin for up to 12 hours. All vacuum operations on production were blocked for 12-hour windows daily. Their fix: created a separate logical replica for analytics (not physical replication slot that pins xmin), added monitoring for xmin_age on all backends, and set idle_in_transaction_session_timeout=60000 to kill abandoned transactions. They also ran pg_repack on their 20 most-bloated tables during off-hours, recovering 2TB of disk space.",
      red_flags: [
        "Does not check for long-running transactions or replication slots before suggesting VACUUM",
        "Recommends VACUUM FULL immediately without mentioning the exclusive lock",
        "Cannot explain MVCC and why dead tuples exist in the first place",
        "Unaware of pg_repack as an online alternative to VACUUM FULL",
        "Does not mention FILLFACTOR or HOT (Heap Only Tuple) updates",
      ],
      follow_up_questions: [
        "How does HOT (Heap Only Tuple) update work and what's required for PostgreSQL to use it?",
        "If you have a replication slot that's lagging by 5 million WAL bytes, how do you safely catch up without losing data?",
        "How would you monitor and alert on bloat proactively before it causes performance degradation?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 6. [Debug] — N+1 Queries in ORM
  {
    title:
      "ORM-generated queries are causing 2,000 database calls per API request. How do you systematically identify and fix N+1 patterns at scale?",
    content:
      "Your Node.js API endpoint returns a list of 100 blog posts, each with author info and comment count. pg_stat_statements shows 2,000+ queries per API call. Logs show: 1 query for posts, 100 queries for authors, 100 queries for comment counts, and 100 queries for tags. How do you instrument, diagnose, and fix this systematically — not just for this endpoint but as a recurring engineering practice?",
    answer: buildAnswer({
      short_answer:
        "N+1 is an ORM pattern failure: lazy loading triggers one query per parent entity. Fix with eager loading joins (for one-to-one/many-to-one) or DataLoader-style batching (for one-to-many). Instrument with query count assertion in tests ('this request should never exceed N queries') and add APM spans per query. For this specific case: 1 query with LEFT JOINs for posts+authors, and 1 GROUP BY query for all comment counts in one shot.",
      detailed_answer: `**The N+1 Pattern**:
\`\`\`typescript
// BUG: each post.author triggers a separate DB call
const posts = await Post.findAll();  // 1 query
for (const post of posts) {
  const author = await post.getAuthor();  // 100 queries
  const commentCount = await post.getCommentCount();  // 100 queries
  const tags = await post.getTags();  // 100 queries
}
// Total: 301 queries → becomes 2001+ for complex objects
\`\`\`

**Fix 1: Eager Loading (JOIN) for *-to-one**
\`\`\`typescript
// TypeORM eager loading
const posts = await Post.find({
  relations: ['author', 'tags'],
  // Generates: SELECT ... FROM posts LEFT JOIN users ON author_id
});
// Now: 1 query with JOIN, not 100 separate queries
\`\`\`

**Fix 2: Batched Aggregation for Counts**
\`\`\`typescript
// Instead of 100 separate COUNT queries:
const postIds = posts.map(p => p.id);

// Single aggregation query
const commentCounts = await db.query(\`
  SELECT post_id, COUNT(*) as count
  FROM comments
  WHERE post_id = ANY($1)
  GROUP BY post_id
\`, [postIds]);

const countMap = new Map(commentCounts.map(r => [r.post_id, r.count]));
posts.forEach(p => { p.commentCount = countMap.get(p.id) || 0; });
\`\`\`
1 query instead of 100.

**Fix 3: DataLoader Pattern (for GraphQL / dynamic batching)**
\`\`\`typescript
const authorLoader = new DataLoader(async (authorIds: string[]) => {
  const authors = await User.findByIds(authorIds);  // 1 query, IN clause
  return authorIds.map(id => authors.find(a => a.id === id));
});

// Even though called 100× in a request, batched to 1 query
const author = await authorLoader.load(post.authorId);
\`\`\`

**Systematic Prevention**:

1. **Query count assertion in tests**:
\`\`\`typescript
it('should fetch 100 posts in < 5 queries', async () => {
  let queryCount = 0;
  db.on('query', () => queryCount++);

  await fetchPostsList({ limit: 100 });

  expect(queryCount).toBeLessThan(5);  // fails immediately if N+1 introduced
});
\`\`\`

2. **APM per-query instrumentation**: New Relic / Datadog shows top endpoints by query count, not just duration.

3. **Slow query dashboard**: Queries that appear > 50 times/second with same pattern → flag for review.`,
      trade_offs: [
        {
          approach: "Eager loading with LEFT JOIN",
          pros: [
            "1 round trip to DB",
            "Simple to implement with ORM",
            "Works well for nested objects",
          ],
          cons: [
            "JOIN can produce large result set for one-to-many (Cartesian product risk)",
            "Not suitable for deeply nested many-to-many",
            "Over-fetching if caller doesn't need all joined data",
          ],
        },
        {
          approach: "DataLoader batching",
          pros: [
            "Automatic batching — request-scoped collection window",
            "Works for any depth of nesting",
            "Ideal for GraphQL resolvers",
          ],
          cons: [
            "Async timing dependency (all loads must happen in same tick)",
            "More complex to implement than simple joins",
            "Requires separate DataLoader instance per request",
          ],
        },
        {
          approach: "Denormalized fields (e.g., comment_count stored on post)",
          pros: [
            "Zero extra query",
            "Fastest reads",
          ],
          cons: [
            "Stale if not updated atomically",
            "Write complexity: maintain counter on every comment insert/delete",
            "Risk of count drift over time",
          ],
        },
      ],
      real_world_example:
        "Facebook's GraphQL infrastructure (Relay) was built specifically to solve N+1 at massive scale. Their DataLoader library (open-sourced) collects all load(id) calls within a single event loop tick and batches them into one query. For their social graph with 2B users, resolving a news feed with 50 posts (each with author, reactions, top comments) went from 500 DB queries to 5 batched queries. They also enforce a 'no N+1 in production' policy via query count monitoring — any resolver that causes > 10 DB queries per request triggers a performance review.",
      red_flags: [
        "Cannot explain what N+1 means or why it happens",
        "Suggests caching all authors in memory as the main solution",
        "Does not know what DataLoader is or how batching works",
        "Cannot write the batched aggregation query (GROUP BY with IN clause)",
        "Has no idea how to write a query count assertion in tests",
      ],
      follow_up_questions: [
        "If a GraphQL query has 3 levels of nesting (posts → comments → comment_authors), how does DataLoader handle the batching across levels?",
        "When does eager loading with JOIN cause a 'Cartesian explosion' and what's the fix?",
        "How would you add query count monitoring to an Express.js application without modifying every endpoint?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 7. [Architecture] — Logical Replication for Zero-Downtime Migration
  {
    title:
      "Migrate a 500GB production PostgreSQL table to a new schema with zero downtime using logical replication",
    content:
      "You need to rename columns, split a JSONB column into normalized columns, and change the primary key type from integer to UUID on a 500GB table that receives 10,000 writes/minute. VACUUM FULL would take the table offline for hours. How do you perform this migration with zero downtime and no data loss?",
    answer: buildAnswer({
      short_answer:
        "Use logical replication to create a shadow table with the new schema, dual-write during migration, backfill historical data, then perform a fast atomic table swap. This follows the 'expand-migrate-contract' pattern. Never ALTER TABLE on large live tables — instead build the new shape in parallel and swap.",
      detailed_answer: `**The Expand-Migrate-Contract Pattern**:

This is the industry standard for zero-downtime schema migrations:

**Phase 1: Expand (Additive changes only)**
\`\`\`sql
-- Add new columns (nullable, no backfill yet)
ALTER TABLE orders ADD COLUMN user_uuid UUID;
ALTER TABLE orders ADD COLUMN amount_cents INTEGER;
ALTER TABLE orders ADD COLUMN currency CHAR(3);
\`\`\`
These are instant (no rewrite). Add NOT NULL DEFAULT later.

**Phase 2: Dual-Write**
\`\`\`typescript
// Application writes to BOTH old and new columns
async function createOrder(data: OrderDto) {
  await db.query(\`
    INSERT INTO orders (
      user_id,           -- old integer FK
      user_uuid,         -- new UUID FK
      amount,            -- old NUMERIC
      amount_cents,      -- new INTEGER
      currency           -- new column
    ) VALUES ($1, $2, $3, $4, $5)
  \`, [data.userId, data.userUuid, data.amount,
      Math.round(data.amount * 100), data.currency]);
}
\`\`\`

**Phase 3: Backfill Historical Data**
\`\`\`sql
-- Backfill in batches to avoid locking
DO $$
DECLARE
  batch_id INTEGER := 0;
BEGIN
  LOOP
    UPDATE orders
    SET
      user_uuid = users.uuid,
      amount_cents = (amount * 100)::INTEGER,
      currency = metadata->>'currency'
    FROM users
    WHERE orders.user_id = users.id
    AND orders.user_uuid IS NULL
    AND orders.id > batch_id
    AND orders.id <= batch_id + 10000;

    GET DIAGNOSTICS updated = ROW_COUNT;
    EXIT WHEN updated = 0;
    batch_id := batch_id + 10000;
    PERFORM pg_sleep(0.1);  -- pace the backfill
  END LOOP;
END $$;
\`\`\`

**Phase 4: Verify**
\`\`\`sql
-- Verify no rows have NULL new columns
SELECT COUNT(*) FROM orders WHERE user_uuid IS NULL;  -- should be 0
SELECT COUNT(*) FROM orders WHERE amount_cents IS NULL;  -- should be 0
\`\`\`

**Phase 5: Contract (Remove Old Columns)**
\`\`\`sql
-- Switch application to use only new columns
-- Then drop old columns (instant, just catalog change)
ALTER TABLE orders DROP COLUMN user_id;
ALTER TABLE orders DROP COLUMN amount;
\`\`\`

**For UUID Primary Key Change** (most complex):
This requires creating a new table, not altering the existing one:
- Create \`orders_v2\` with UUID PK
- Logical replication: use pglogical or built-in logical replication
- Dual-write via trigger on \`orders\`
- Backfill + verify
- Atomic swap: RENAME TABLE (requires brief lock, milliseconds)`,
      trade_offs: [
        {
          approach: "Expand-Migrate-Contract (application-level dual-write)",
          pros: [
            "Zero downtime",
            "Rollback at any phase",
            "Production-proven pattern",
          ],
          cons: [
            "Weeks of engineering effort",
            "Application must support both old and new schema simultaneously",
            "Backfill must be idempotent",
          ],
        },
        {
          approach: "pg_repack with trigger-based replication",
          pros: [
            "No application changes required",
            "Built-in tooling",
            "Handles the heavy lifting",
          ],
          cons: [
            "Cannot change schema (column types, names) — only reclaim space",
            "Requires brief lock at swap time (~milliseconds)",
          ],
        },
        {
          approach: "Maintenance window with VACUUM FULL / ALTER TABLE",
          pros: ["Simplest code path", "No dual-write complexity"],
          cons: [
            "Hours of downtime for 500GB table",
            "Unacceptable for production systems",
          ],
        },
      ],
      real_world_example:
        "GitHub migrated their repositories table (millions of rows) from integer to integer-as-UUID while serving millions of users. Their approach: added a new uuid column, backfilled over 4 months via background worker processing 10K rows/hour (to avoid replication lag), enabled dual-write for new rows, then over a maintenance period switched the primary key constraint — taking only 30 seconds of elevated lock time. The dual-write phase lasted over a quarter, giving them time to verify correctness before full cutover.",
      red_flags: [
        "Suggests running ALTER TABLE directly on a 500GB live table",
        "Unaware of the expand-migrate-contract pattern",
        "Cannot explain why ADD COLUMN with DEFAULT is dangerous on large tables (pre-17 PostgreSQL)",
        "Does not account for concurrent writes during backfill creating race conditions",
        "Has no plan for rollback if migration causes issues at phase 4",
      ],
      follow_up_questions: [
        "How do you handle the foreign key constraints that reference the old integer primary key from 20 other tables?",
        "During dual-write, if a bug in the application writes user_uuid=NULL for 1% of new rows, how do you detect and recover from this?",
        "PostgreSQL 17 changed ADD COLUMN DEFAULT behavior. What was the old behavior and why was it a problem?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 8. [Performance] — Partitioning Strategy
  {
    title:
      "Design a table partitioning strategy for a time-series events table that grows 10GB per day and needs < 100ms query latency for last 30 days",
    content:
      "You have an events table: INSERT ~5M rows/day, growing 10GB/day, retention 1 year = 3.65TB. Queries are almost exclusively on the last 30 days by user_id and event_type. After 90 days, data is rarely accessed. After 1 year, data is deleted. Design the partitioning strategy and data lifecycle, and explain how partitioning achieves partition pruning for your query pattern.",
    answer: buildAnswer({
      short_answer:
        "Use range partitioning by month (or week for finer granularity). Queries on last 30 days touch at most 2 partitions, enabling partition pruning — PostgreSQL scans only those 2 partitions instead of the entire 3.65TB table. Pair with sub-partitioning by user_id hash for write distribution. Drop old partitions instead of DELETE for instant data removal.",
      detailed_answer: `**Partition Design**:

\`\`\`sql
CREATE TABLE events (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- etc.

-- Create partitions automatically with pg_partman extension
SELECT partman.create_parent(
  'public.events',
  'created_at',
  'native',
  'monthly'
);
\`\`\`

**Sub-partitioning for Write Distribution**:
\`\`\`sql
-- If writes are uneven by time, sub-partition by hash
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
  PARTITION BY HASH (user_id);

CREATE TABLE events_2024_01_0 PARTITION OF events_2024_01
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);
-- 4 sub-partitions → write parallelism
\`\`\`

**Partition Pruning**:
\`\`\`sql
-- This query touches ONLY the jan and feb 2024 partitions:
EXPLAIN SELECT * FROM events
WHERE created_at > '2024-01-15'
AND created_at < '2024-02-15'
AND user_id = $1
AND event_type = 'purchase';

-- EXPLAIN shows: "Partitions pruned: 10 (removed 22 partition(s))"
\`\`\`

Without partitioning: full scan of 3.65TB.
With partitioning: scan of 2 monthly partitions (20GB) — ~180× smaller.

**Indexes on Each Partition**:
\`\`\`sql
-- Local index on each partition (automatically inherited)
CREATE INDEX ON events(user_id, created_at, event_type);
-- Applied to ALL current and future partitions
\`\`\`

**Data Lifecycle**:
\`\`\`sql
-- Hot tier (0-30 days): all queries here, fast storage
-- Warm tier (30-90 days): tablespace on slower storage
ALTER TABLE events_2023_10 SET TABLESPACE slow_storage;

-- Expire tier (> 1 year): instant drop (no DELETE needed!)
DROP TABLE events_2023_01;  -- instant, no transaction log, reclaims space immediately
\`\`\`

Dropping a partition is near-instant (metadata operation), unlike DELETE which logs every row and creates dead tuples.`,
      trade_offs: [
        {
          approach: "Monthly range partitioning",
          pros: [
            "Instant old data removal via partition drop",
            "Partition pruning for time-range queries",
            "Partition-level vacuum/analyze",
          ],
          cons: [
            "Requires knowing partition key at insert time",
            "Cross-partition queries (e.g., all-time stats) still expensive",
            "Global indexes not supported in PostgreSQL partitioned tables",
          ],
        },
        {
          approach: "Daily range partitioning",
          pros: [
            "Even finer pruning for last 7 days queries",
            "More granular data movement",
          ],
          cons: [
            "365 partitions per year — planner overhead",
            "Connection to each partition needed",
            "Partition management overhead",
          ],
        },
        {
          approach: "Hash partitioning by user_id",
          pros: [
            "Even write distribution",
            "Good for user-centric queries",
          ],
          cons: [
            "No partition pruning for time-range queries",
            "Cannot drop old partitions by time",
            "Not suitable for this time-series use case",
          ],
        },
      ],
      real_world_example:
        "Twitch's analytics event system processes 1B+ events per day using PostgreSQL range partitioning by day, with automatic partition creation via pg_partman. Queries for 'last 7 days' touch only 7 of 365 partitions. After 90 days, partitions are moved from NVMe to S3-backed storage (via tablespace on S3-compatible storage). After 1 year, partitions are dropped instantly — clearing 3.65TB took less than 1 second (just metadata). Without partitioning, their DELETE-based cleanup consumed 8 hours of I/O per day.",
      red_flags: [
        "Suggests using DELETE for data cleanup instead of DROP PARTITION",
        "Does not explain partition pruning or how to verify it with EXPLAIN",
        "Unaware that PostgreSQL does not support global unique indexes on partitioned tables",
        "Cannot explain the difference between range and hash partitioning use cases",
        "Does not consider the write distribution impact of partitioning on INSERT throughput",
      ],
      follow_up_questions: [
        "How do you ensure an INSERT into a partitioned table with a created_at in the past goes to the right partition?",
        "If you need a unique index across all partitions (e.g., idempotency key), how do you work around PostgreSQL's lack of global unique indexes?",
        "How would you automate monthly partition creation so operations team doesn't have to remember to create next month's partition?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 9. [System Design] — Read Replicas with Acceptable Staleness
  {
    title:
      "Design a read/write splitting strategy that routes 95% of queries to read replicas while tolerating at most 1 second of replication lag",
    content:
      "Your application has 10 PostgreSQL read replicas with replication lag ranging from 0ms to 3 seconds depending on write load. Some operations must read their own writes (post a comment, immediately see it). Others (analytics queries, search) are fine with 3 second lag. How do you design a smart routing layer that maximizes replica utilization while guaranteeing correctness for read-your-own-writes patterns?",
    answer: buildAnswer({
      short_answer:
        "Use session-based read-after-write tracking: after a write, set a 'minimum LSN' (log sequence number) on the session. When routing subsequent reads for that session, only route to replicas where pg_last_wal_receive_lsn() > minimum_lsn. For analytics queries with no write dependencies, route to any replica regardless of lag. Implement lag monitoring per replica and exclude replicas with lag > threshold from the hot pool.",
      detailed_answer: `**The Core Challenge**:
Routing all reads to replicas breaks when:
1. User comments → reads from stale replica → comment not visible
2. Update user profile → reads profile from old replica → looks unchanged
3. Create order → redirect to order confirmation → order not found on replica

**Solution: LSN-based Read-After-Write**

After any write, capture the current WAL position:
\`\`\`typescript
// After write
const result = await primaryDb.query(
  'INSERT INTO comments (content, user_id) VALUES ($1, $2) RETURNING id',
  [content, userId]
);

// Get current LSN from primary
const [lsnResult] = await primaryDb.query(
  'SELECT pg_current_wal_lsn() as lsn'
);

// Store in session/context (Redis or cookie)
await session.set('min_read_lsn', lsnResult.lsn);
\`\`\`

On subsequent reads in the same session:
\`\`\`typescript
async function getReadConnection(sessionLsn?: string): Promise<Connection> {
  if (!sessionLsn) {
    // No write in this session → any replica OK
    return getAnyHealthyReplica();
  }

  // Find a replica that has caught up to our write
  for (const replica of healthyReplicas) {
    const [lagResult] = await replica.query(
      'SELECT pg_last_wal_receive_lsn() as current_lsn'
    );
    if (lsnIsAheadOf(lagResult.current_lsn, sessionLsn)) {
      return replica;
    }
  }

  // No replica caught up yet → fall back to primary
  return primaryDb;
}
\`\`\`

**Replica Health Pool Management**:
\`\`\`typescript
// Background health check every 5 seconds
setInterval(async () => {
  for (const replica of allReplicas) {
    const lag = await replica.query(\`
      SELECT EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp()))
      AS lag_seconds
    \`);

    if (lag > MAX_LAG_SECONDS) {
      hotPool.remove(replica);  // exclude from routing
    } else {
      hotPool.add(replica);
    }
  }
}, 5000);
\`\`\`

**Query Classification**:
\`\`\`typescript
enum ReadConsistency {
  STRONG,       // Must use primary or caught-up replica
  SESSION,      // Read-your-own-writes: use LSN tracking
  EVENTUAL,     // Analytics: any replica OK, even lagging
}

// Route based on annotation
@ReadConsistency(ReadConsistency.EVENTUAL)
async getAnalytics(userId: string) { ... }

@ReadConsistency(ReadConsistency.SESSION)
async getComments(postId: string) { ... }
\`\`\`

**Fallback Strategy**:
If no replica has caught up within 100ms, route to primary (not ideal, but correct).`,
      trade_offs: [
        {
          approach: "LSN-based session tracking",
          pros: [
            "Correct read-your-own-writes guarantee",
            "Transparent to application beyond consistency annotation",
            "Minimizes primary traffic (only falls back when needed)",
          ],
          cons: [
            "Complex routing logic",
            "LSN comparison logic must be correct (LSN is not a simple integer)",
            "Session state must be shared across stateless app instances (Redis)",
          ],
        },
        {
          approach: "Always read from primary after any write (sticky sessions)",
          pros: ["Simple", "Always correct"],
          cons: [
            "Primary takes 100% of traffic for the session",
            "Negates replica benefit if users write frequently",
            "Sticky sessions require session affinity",
          ],
        },
        {
          approach: "Route all reads to replicas, accept staleness",
          pros: ["Maximum replica utilization", "Zero complexity"],
          cons: [
            "Incorrect for read-your-own-writes",
            "User sees their actions not reflected",
            "Causes support escalations and user confusion",
          ],
        },
      ],
      real_world_example:
        "GitLab's database routing layer (open-sourced as their 'database load balancing' gem) uses LSN-based read-after-write tracking. After any write, the gem stores the primary's WAL position in the request context. Subsequent reads in the same request check each replica's lag against this LSN. If no replica is caught up within 500ms, the query falls back to primary. This approach allows GitLab to route 95%+ of read traffic to replicas while maintaining correctness for operations like 'create merge request, immediately see it in your MR list'.",
      red_flags: [
        "Cannot explain what replication lag is or how to measure it",
        "Suggests routing all reads to primary 'to be safe' (defeats the purpose of replicas)",
        "Does not know what WAL LSN is or how to compare LSNs",
        "Unaware of read-your-own-writes consistency requirement",
        "Cannot describe a health check mechanism for excluding lagged replicas",
      ],
      follow_up_questions: [
        "If a replica falls behind by 30 seconds during a write-heavy batch job, how do you prevent all reads from falling back to primary?",
        "How would you implement this routing layer in a multi-tenant SaaS where each tenant has different consistency requirements?",
        "If the primary fails and a replica is promoted, how does your LSN tracking adapt to the new primary's LSN sequence?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },

  // 10. [Architecture] — JSONB vs Normalized Schema
  {
    title:
      "Your product team wants to store arbitrary user metadata as JSONB. At what scale does this become a performance problem, and how do you design the schema to defer that trade-off?",
    content:
      "Your SaaS product needs to store per-user custom attributes set by each tenant (e.g., 'job_title', 'department', 'custom_field_1' through 'custom_field_50'). Tenants define their own attribute schemas. The users table will have 50M rows. Some tenants filter users by custom attributes (WHERE custom_data->>'department' = 'Engineering'). How do you design this, knowing that JSONB queries can be slow and the attribute schema will evolve?",
    answer: buildAnswer({
      short_answer:
        "JSONB is excellent for write flexibility but becomes a query bottleneck when you need to filter/index arbitrary keys. Design for JSONB now (fast time-to-market) but build the abstraction to support indexed EAV (Entity-Attribute-Value) for query-heavy attributes. Use GIN index for containment queries, and JSONB path expression indexes for high-cardinality frequently-queried keys.",
      detailed_answer: `**JSONB Strengths and Limits**:

\`\`\`sql
-- JSONB storage: works for flexible schema
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  custom_data JSONB DEFAULT '{}'
);

-- GIN index for containment queries (can this user match department=Engineering?)
CREATE INDEX idx_users_custom_gin ON users USING GIN(custom_data);

-- Specific path index for high-cardinality, frequently-queried key
CREATE INDEX idx_users_department
ON users((custom_data->>'department'))
WHERE custom_data ? 'department';
\`\`\`

**Query Performance**:
\`\`\`sql
-- GIN containment: uses index, but limited to equality
SELECT * FROM users WHERE custom_data @> '{"department": "Engineering"}';

-- Expression index: range/sort queries
SELECT * FROM users WHERE custom_data->>'hire_date' > '2024-01-01'
ORDER BY custom_data->>'last_name';
-- Needs functional index on hire_date and last_name to be fast
\`\`\`

**When JSONB Becomes a Problem**:
- Filtering on 50 different keys → need 50 indexes (index explosion)
- Sorting/grouping by JSONB keys → index per sort key needed
- JOINing JSONB values to other tables → type casting, planner confusion
- JSONB document > 1MB → storage and parsing overhead
- pg_stats doesn't collect statistics on JSONB keys → planner blind

**Hybrid Design: JSONB + Selective Normalization**:
\`\`\`sql
-- Store everything in JSONB
-- Promote frequently-queried keys to real columns asynchronously
CREATE TABLE user_attributes (
  user_id UUID REFERENCES users(id),
  key TEXT NOT NULL,
  value_text TEXT,
  value_number NUMERIC,
  value_date DATE,
  tenant_id UUID NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE INDEX ON user_attributes(tenant_id, key, value_text);
\`\`\`

EAV table enables:
- Any key to be indexed independently
- Range queries on numeric/date values
- Aggregate queries (AVG(salary) per department)

**Migration Strategy**:
1. Store in JSONB (fast, flexible)
2. Mirror to EAV table via trigger/async job for query-heavy keys
3. Application queries JSONB for writes, EAV for reads
4. Tenant can mark which attributes are "query-optimized" (get EAV treatment)`,
      trade_offs: [
        {
          approach: "Pure JSONB with GIN index",
          pros: [
            "Flexible schema",
            "Single column to manage",
            "Works well for containment queries",
          ],
          cons: [
            "Cannot do efficient range queries on JSONB values without expression indexes",
            "planner has no statistics on JSONB key distribution",
            "Index explosion if need many keys indexed separately",
          ],
        },
        {
          approach: "EAV (Entity-Attribute-Value) table",
          pros: [
            "Any attribute can be indexed",
            "Full query flexibility",
            "Proper statistics for planner",
          ],
          cons: [
            "Complex queries (pivot required to show as columns)",
            "Type safety: all values stored as text with casting",
            "More joins for simple reads",
          ],
        },
        {
          approach: "Hybrid: JSONB + promoted columns for hot keys",
          pros: [
            "Best of both worlds",
            "Can evolve: start JSONB, promote hot keys",
            "Application doesn't need to change query patterns",
          ],
          cons: [
            "Sync between JSONB and promoted columns",
            "More complex write path",
            "Additional storage for duplicated hot key values",
          ],
        },
      ],
      real_world_example:
        "HubSpot's CRM stores user-defined contact properties as a hybrid system. All properties are stored in a JSONB-like column for flexibility, but their query engine maintains a separate columnar index (built on top of ClickHouse) for properties that users frequently filter on. When a user creates a saved filter for 'Job Title = Engineer', HubSpot asynchronously materializes that property into the columnar store, enabling < 100ms query time across 100M contacts. Properties that are rarely filtered stay in JSONB only, keeping storage costs low.",
      red_flags: [
        "Claims JSONB with GIN index is fast for all query types without distinguishing containment from range queries",
        "Does not know about expression indexes on JSONB paths",
        "Cannot explain why the PostgreSQL planner has trouble optimizing JSONB queries (no column statistics)",
        "Unaware of EAV pattern or its trade-offs",
        "Does not consider tenant-level query isolation — one tenant's slow custom query affecting all tenants",
      ],
      follow_up_questions: [
        "If a tenant has 50 custom fields and filters on 20 of them simultaneously, how do you design the query layer to use indexes efficiently?",
        "How would you build a migration job that copies existing JSONB data into promoted columns without locking the users table?",
        "What are the PostgreSQL limits on GIN index size and how does index bloat in GIN differ from B-tree index bloat?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "postgresql",
  },
];
