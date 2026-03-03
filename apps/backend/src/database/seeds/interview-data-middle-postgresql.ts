/**
 * Middle-Level PostgreSQL Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: real-world scenarios, query patterns, performance, schema design.
 *
 * Topics: postgresql (20)
 * Level: MIDDLE
 *
 * Usage: pnpm --filter backend seed:middle-postgresql
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
// POSTGRESQL — MIDDLE LEVEL (20 questions)
// ============================================

export const middlePostgresqlQuestions: QuestionSeed[] = [
  // 1. Window Functions
  {
    title: "How do Window Functions work in PostgreSQL?",
    content:
      "Explain window functions, their syntax, and how they differ from GROUP BY aggregation. Provide practical examples using ROW_NUMBER, RANK, LAG, and LEAD.",
    answer: `**Window Functions** perform calculations across a set of rows related to the current row — without collapsing them into a single output row like GROUP BY.

**Syntax**:
\`\`\`sql
function_name() OVER (
  PARTITION BY column
  ORDER BY column
  ROWS BETWEEN ... AND ...
)
\`\`\`

**ROW_NUMBER / RANK / DENSE_RANK**:
\`\`\`sql
-- Rank employees by salary within each department
SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
  RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank
FROM employees;

-- ROW_NUMBER: always unique (1, 2, 3)
-- RANK: ties get same rank, gaps after (1, 1, 3)
-- DENSE_RANK: ties get same rank, no gaps (1, 1, 2)
\`\`\`

**LAG / LEAD** — access previous/next row:
\`\`\`sql
-- Compare each month's revenue with the previous month
SELECT
  month,
  revenue,
  LAG(revenue, 1) OVER (ORDER BY month) AS prev_month,
  revenue - LAG(revenue, 1) OVER (ORDER BY month) AS growth
FROM monthly_sales;
\`\`\`

**Running totals with SUM**:
\`\`\`sql
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
\`\`\`

**Named window** for reuse:
\`\`\`sql
SELECT
  name,
  salary,
  AVG(salary) OVER w AS dept_avg,
  MAX(salary) OVER w AS dept_max
FROM employees
WINDOW w AS (PARTITION BY department);
\`\`\`

**Key difference from GROUP BY**: Window functions retain individual rows; GROUP BY collapses them. You can have multiple different windows in a single query.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 2. Transactions and Isolation Levels
  {
    title: "Explain PostgreSQL transaction isolation levels and their trade-offs",
    content:
      "What are the four isolation levels? What anomalies does each prevent? How do you choose the right one for your application?",
    answer: `**PostgreSQL Isolation Levels**:

| Level | Dirty Read | Non-repeatable Read | Phantom Read | Serialization Anomaly |
|-------|-----------|--------------------|--------------|-----------------------|
| READ UNCOMMITTED* | No | Possible | Possible | Possible |
| READ COMMITTED (default) | No | Possible | Possible | Possible |
| REPEATABLE READ | No | No | No** | Possible |
| SERIALIZABLE | No | No | No | No |

*PostgreSQL treats READ UNCOMMITTED the same as READ COMMITTED.
**PostgreSQL's REPEATABLE READ also prevents phantom reads (unlike the SQL standard).

**READ COMMITTED** (default):
\`\`\`sql
-- Each statement sees only data committed before the statement began
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- sees 1000
-- Another transaction commits: UPDATE accounts SET balance = 500 WHERE id = 1;
SELECT balance FROM accounts WHERE id = 1; -- sees 500 (changed!)
COMMIT;
\`\`\`

**REPEATABLE READ**:
\`\`\`sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1; -- sees 1000
-- Another transaction commits: UPDATE accounts SET balance = 500 WHERE id = 1;
SELECT balance FROM accounts WHERE id = 1; -- still sees 1000
-- If we try to UPDATE the same row:
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
-- ERROR: could not serialize access due to concurrent update
COMMIT;
\`\`\`

**SERIALIZABLE**:
\`\`\`sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- The result is as if transactions ran one-at-a-time
-- PostgreSQL detects conflicts and aborts one transaction
-- Must be prepared to RETRY on serialization failure
COMMIT;
\`\`\`

**When to use what**:
- **READ COMMITTED**: Most OLTP workloads, web applications — good default
- **REPEATABLE READ**: Financial reports, dashboards needing consistent snapshots
- **SERIALIZABLE**: Financial transfers, inventory management, any place where correctness outweighs throughput

**Retry pattern for serializable**:
\`\`\`sql
-- Application code should retry on error code 40001
SAVEPOINT my_savepoint;
-- do work
-- on serialization failure: ROLLBACK TO my_savepoint; retry
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 3. Partial and Expression Indexes
  {
    title: "What are partial indexes and expression indexes in PostgreSQL?",
    content:
      "When would you use a partial index or an expression index instead of a regular index? Explain with practical examples.",
    answer: `**Partial Index**: Indexes only rows matching a WHERE condition — smaller, faster, more targeted.

\`\`\`sql
-- Only index active users (skip the 90% who are inactive)
CREATE INDEX idx_users_active_email ON users(email)
WHERE active = true;

-- This query uses the partial index:
SELECT * FROM users WHERE email = 'foo@bar.com' AND active = true;
-- This query does NOT use it (no active = true filter):
SELECT * FROM users WHERE email = 'foo@bar.com';
\`\`\`

**Common use cases for partial indexes**:
\`\`\`sql
-- Soft-delete: only index non-deleted rows
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE deleted_at IS NULL;

-- Status filtering: index only in-progress items
CREATE INDEX idx_tasks_active ON tasks(assignee_id)
WHERE status IN ('pending', 'in_progress');

-- Unique constraint on a subset
CREATE UNIQUE INDEX idx_unique_primary_email ON user_emails(user_id)
WHERE is_primary = true;
\`\`\`

**Expression Index**: Indexes the result of an expression or function.

\`\`\`sql
-- Case-insensitive email lookup
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Query must match the expression exactly:
SELECT * FROM users WHERE LOWER(email) = 'foo@bar.com'; -- uses index
SELECT * FROM users WHERE email = 'foo@bar.com';        -- does NOT use index

-- Index on extracted JSON field
CREATE INDEX idx_events_type ON events((data->>'type'));

-- Index on date part
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
\`\`\`

**Combining both**:
\`\`\`sql
-- Expression index that is also partial
CREATE INDEX idx_active_lower_email ON users(LOWER(email))
WHERE active = true;
\`\`\`

**Benefits**:
- Smaller index size → less storage, fits in memory
- Faster index scans and maintenance (fewer rows to update on INSERT/UPDATE)
- More precise query targeting`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 4. EXPLAIN and Query Plans
  {
    title: "How do you read and interpret an EXPLAIN ANALYZE output?",
    content:
      "Walk through the key elements of an EXPLAIN ANALYZE plan. What are the most important things to look for when debugging slow queries?",
    answer: `**Running EXPLAIN ANALYZE**:
\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = true
GROUP BY u.name;
\`\`\`

**Key elements in the output**:
\`\`\`
HashAggregate  (cost=156.00..158.00 rows=200 width=40) (actual time=3.2..3.5 rows=180 loops=1)
  Group Key: u.name
  Buffers: shared hit=45 read=12
  ->  Hash Left Join  (cost=50.00..150.00 rows=1200 width=36) (actual time=1.2..2.8 rows=1200 loops=1)
        Hash Cond: (o.user_id = u.id)
        ->  Seq Scan on orders o  (cost=0.00..80.00 rows=5000 width=8)
        ->  Hash  (cost=40.00..40.00 rows=200 width=36)
              ->  Index Scan using idx_users_active on users u (cost=0.29..40.00 rows=200 width=36)
                    Filter: (active = true)
Planning Time: 0.3 ms
Execution Time: 4.1 ms
\`\`\`

**What to look for**:

1. **Estimated vs actual rows**: If they diverge wildly, run \`ANALYZE tablename\` to update statistics
\`\`\`
rows=200 vs actual rows=50000  -- bad estimates → bad plan
\`\`\`

2. **Seq Scan on large tables**: Potential missing index
\`\`\`
Seq Scan on orders (cost=0.00..80000.00 rows=500000 ...)
-- Consider adding an index
\`\`\`

3. **Buffers**: \`shared hit\` = cache; \`shared read\` = disk I/O
\`\`\`
Buffers: shared hit=45 read=12000  -- lots of disk reads
\`\`\`

4. **Nested Loop with high loops**: Can multiply cost
\`\`\`
Nested Loop  (actual time=0.01..500.00 rows=1000 loops=10000)
-- 10000 iterations × inner cost = slow
\`\`\`

5. **Sort with external merge**: Not enough work_mem
\`\`\`
Sort Method: external merge  Disk: 50000kB
-- Increase work_mem or reduce result set
\`\`\`

**Tips**:
- Always use \`ANALYZE\` (not just \`EXPLAIN\`) for real timings
- Use \`BUFFERS\` to see I/O impact
- Use \`FORMAT JSON\` or tools like pgMustard / explain.dalibo.com for visualization
- Compare plans before and after adding indexes`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 5. Constraints and Data Integrity
  {
    title: "What types of constraints does PostgreSQL support and how do you use them effectively?",
    content:
      "Explain the different types of constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, EXCLUSION). When should you use database-level constraints vs application-level validation?",
    answer: `**Constraint Types**:

**PRIMARY KEY**: Uniquely identifies each row
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL
);
\`\`\`

**FOREIGN KEY**: Referential integrity between tables
\`\`\`sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- ON DELETE options: CASCADE, SET NULL, SET DEFAULT, RESTRICT, NO ACTION
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT
);
\`\`\`

**UNIQUE**: Prevent duplicate values
\`\`\`sql
-- Single column
ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);

-- Multi-column (composite unique)
ALTER TABLE user_roles ADD CONSTRAINT uq_user_role UNIQUE (user_id, role);

-- Partial unique (conditional uniqueness)
CREATE UNIQUE INDEX uq_active_email ON users(email)
WHERE deleted_at IS NULL;
\`\`\`

**CHECK**: Validate data against an expression
\`\`\`sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (LENGTH(name) > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount NUMERIC CHECK (discount >= 0 AND discount <= price),
  status TEXT CHECK (status IN ('draft', 'published', 'archived'))
);
\`\`\`

**EXCLUSION**: Prevent overlapping ranges
\`\`\`sql
-- Requires btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE room_bookings (
  room_id INT,
  during TSTZRANGE,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);
-- Prevents double-booking: no two rows can have same room_id AND overlapping time
\`\`\`

**NOT NULL**: Most basic constraint
\`\`\`sql
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
\`\`\`

**DB constraints vs app validation**:
- **Always enforce at DB level**: uniqueness, foreign keys, NOT NULL, check constraints for enums/ranges
- **Also validate at app level**: for better UX and error messages
- **App-only validation**: complex business rules, cross-service checks, async validation
- The database is your last line of defense — never rely solely on app code`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 6. Subqueries and Lateral Joins
  {
    title: "Explain the difference between subqueries, CTEs, and LATERAL joins",
    content:
      "When should you use a correlated subquery vs a CTE vs a LATERAL join? What are the performance implications of each?",
    answer: `**Correlated Subquery**: Re-evaluated for each row in the outer query.
\`\`\`sql
-- Get each user's latest order date
SELECT u.name,
  (SELECT MAX(o.created_at) FROM orders o WHERE o.user_id = u.id) AS last_order
FROM users u;
-- Runs the inner SELECT once per user row
\`\`\`

**CTE (WITH clause)**: Named temporary result set, evaluated once.
\`\`\`sql
WITH latest_orders AS (
  SELECT user_id, MAX(created_at) AS last_order
  FROM orders
  GROUP BY user_id
)
SELECT u.name, lo.last_order
FROM users u
LEFT JOIN latest_orders lo ON lo.user_id = u.id;
-- CTE is materialized once, then joined
\`\`\`

**LATERAL JOIN**: Like a correlated subquery but returns multiple columns/rows and can be joined.
\`\`\`sql
-- Get each user's 3 most recent orders
SELECT u.name, recent.*
FROM users u
LEFT JOIN LATERAL (
  SELECT o.id, o.total, o.created_at
  FROM orders o
  WHERE o.user_id = u.id
  ORDER BY o.created_at DESC
  LIMIT 3
) recent ON true;
\`\`\`

**When to use what**:

| Pattern | Use When |
|---------|----------|
| Correlated subquery | Single scalar value per row, simple logic |
| CTE | Reuse the same result set multiple times, readability |
| LATERAL | Top-N per group, complex per-row computations returning multiple columns |

**Performance notes**:
\`\`\`sql
-- CTE materialization (PostgreSQL 12+: can be inlined)
WITH cte AS MATERIALIZED (  -- force materialization
  SELECT * FROM big_table WHERE status = 'active'
)
SELECT * FROM cte WHERE id = 42;

WITH cte AS NOT MATERIALIZED (  -- force inlining
  SELECT * FROM big_table WHERE status = 'active'
)
SELECT * FROM cte WHERE id = 42;
\`\`\`

**Top-N per group** — LATERAL is typically the fastest approach:
\`\`\`sql
-- Faster than ROW_NUMBER() + filter for small N with an index on (user_id, created_at DESC)
SELECT u.id, recent.*
FROM users u
CROSS JOIN LATERAL (
  SELECT id, total
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 3
) recent;
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 7. Schema Design and Normalization
  {
    title: "When should you normalize vs denormalize your PostgreSQL schema?",
    content:
      "Explain normalization forms (1NF–3NF) and real-world scenarios where denormalization is the better choice. How do you handle the trade-offs?",
    answer: `**Normalization Forms**:

**1NF**: Atomic values, no repeating groups
\`\`\`sql
-- Bad: tags stored as comma-separated string
CREATE TABLE posts (id INT, tags TEXT); -- 'react,node,sql'

-- Good (1NF): separate table
CREATE TABLE post_tags (
  post_id INT REFERENCES posts(id),
  tag TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);
\`\`\`

**2NF**: 1NF + no partial dependencies on composite keys
\`\`\`sql
-- Bad: student_name depends on student_id only, not (student_id, course_id)
CREATE TABLE enrollments (student_id INT, course_id INT, student_name TEXT, grade CHAR);

-- Good: separate tables
CREATE TABLE students (id INT PRIMARY KEY, name TEXT);
CREATE TABLE enrollments (student_id INT, course_id INT, grade CHAR, PRIMARY KEY (student_id, course_id));
\`\`\`

**3NF**: 2NF + no transitive dependencies
\`\`\`sql
-- Bad: city depends on zip_code, not directly on user_id
CREATE TABLE users (id INT, zip_code TEXT, city TEXT);

-- Good: separate lookup
CREATE TABLE zip_codes (code TEXT PRIMARY KEY, city TEXT);
CREATE TABLE users (id INT, zip_code TEXT REFERENCES zip_codes(code));
\`\`\`

**When to denormalize**:

1. **Read-heavy dashboards**: Precompute aggregates
\`\`\`sql
-- Materialized view for dashboard
CREATE MATERIALIZED VIEW order_stats AS
SELECT
  user_id,
  COUNT(*) AS total_orders,
  SUM(amount) AS total_spent,
  MAX(created_at) AS last_order_at
FROM orders
GROUP BY user_id;

CREATE UNIQUE INDEX ON order_stats(user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY order_stats;
\`\`\`

2. **Avoiding expensive JOINs**: Store computed values
\`\`\`sql
-- Add a counter cache column
ALTER TABLE posts ADD COLUMN comment_count INT DEFAULT 0;

-- Update via trigger
CREATE FUNCTION update_comment_count() RETURNS trigger AS $$
BEGIN
  UPDATE posts SET comment_count = (
    SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
  ) WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

3. **JSONB for flexible metadata**: When the schema varies per row
\`\`\`sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  attributes JSONB DEFAULT '{}'  -- flexible per-category fields
);
\`\`\`

**Trade-offs**:
- Normalized: less storage, easier updates, enforced integrity, more JOINs
- Denormalized: faster reads, risk of inconsistency, harder updates
- Strategy: normalize by default, denormalize selectively with materialized views or triggers`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 8. Triggers
  {
    title: "How do triggers work in PostgreSQL?",
    content:
      "Explain the different types of triggers (BEFORE, AFTER, INSTEAD OF), row-level vs statement-level triggers, and practical use cases.",
    answer: `**Trigger**: Function that executes automatically in response to INSERT, UPDATE, or DELETE.

**Trigger function** (must return trigger):
\`\`\`sql
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

**Attaching the trigger**:
\`\`\`sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_at();
\`\`\`

**Trigger timing**:

| Timing | Use Case |
|--------|----------|
| BEFORE | Modify data before it's written (validation, defaults, auto-fill) |
| AFTER | Side effects: audit logs, notifications, cascading updates |
| INSTEAD OF | On views only — implement custom write logic |

**Row-level vs Statement-level**:
\`\`\`sql
-- Row-level: fires once per affected row
CREATE TRIGGER audit_row
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_change();

-- Statement-level: fires once per SQL statement
CREATE TRIGGER notify_batch
  AFTER INSERT ON orders
  FOR EACH STATEMENT
  EXECUTE FUNCTION notify_new_orders();
\`\`\`

**Conditional triggers (WHEN clause)**:
\`\`\`sql
CREATE TRIGGER log_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();
\`\`\`

**Audit log example**:
\`\`\`sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT
);

CREATE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    current_setting('app.current_user', true)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
\`\`\`

**Cautions**:
- Triggers can make debugging harder (hidden side effects)
- Cascading triggers can cause performance issues
- Keep trigger functions simple; move complex logic to application code
- Use \`pg_trigger\` catalog to inspect existing triggers`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 9. Enums and Custom Types
  {
    title: "How should you handle enums in PostgreSQL — native ENUM type vs CHECK constraint vs lookup table?",
    content:
      "Compare the three approaches for modeling a fixed set of values. What are the trade-offs of each approach?",
    answer: `**Three approaches**:

**1. Native ENUM type**:
\`\`\`sql
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status order_status NOT NULL DEFAULT 'pending'
);

-- Adding a value (append only, no remove/rename easily):
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'delivered';
\`\`\`

**Pros**: Type safety, compact storage (4 bytes), sorted by declaration order
**Cons**: Hard to remove or rename values, requires migration, stored in system catalog

**2. CHECK constraint**:
\`\`\`sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Changing allowed values: drop and re-add the constraint
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));
\`\`\`

**Pros**: Easy to modify, no custom type management, simple
**Cons**: No type reuse across tables, stored as TEXT (larger), no built-in ordering

**3. Lookup table**:
\`\`\`sql
CREATE TABLE order_statuses (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  sort_order INT
);

INSERT INTO order_statuses (name, display_name, sort_order) VALUES
  ('pending', 'Pending', 1),
  ('processing', 'Processing', 2),
  ('shipped', 'Shipped', 3);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status_id INT NOT NULL REFERENCES order_statuses(id)
);
\`\`\`

**Pros**: Easy to add/remove/rename, can store metadata (display name, color), works with ORMs
**Cons**: Requires JOIN for display, more complex queries, extra table

**Recommendation by scenario**:

| Scenario | Best Approach |
|----------|--------------|
| Rarely changes, < 10 values | Native ENUM |
| Moderately changes, simple needs | CHECK constraint |
| Frequently changes, needs metadata | Lookup table |
| Used across many tables | Native ENUM or lookup table |
| ORM-heavy codebase | CHECK or lookup (ENUMs need special ORM config) |

**TypeORM example with CHECK**:
\`\`\`typescript
@Entity()
export class Order {
  @Column({
    type: 'text',
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 10. UPSERT and Conflict Resolution
  {
    title: "How does INSERT ... ON CONFLICT (UPSERT) work in PostgreSQL?",
    content:
      "Explain the UPSERT pattern, conflict targets, and common use cases. How does it differ from MERGE?",
    answer: `**UPSERT**: Insert a row, or update it if a conflict occurs.

**Basic syntax**:
\`\`\`sql
INSERT INTO users (email, name, login_count)
VALUES ('user@example.com', 'John', 1)
ON CONFLICT (email)
DO UPDATE SET
  name = EXCLUDED.name,
  login_count = users.login_count + 1,
  last_login_at = NOW();
\`\`\`

**EXCLUDED**: Refers to the row that was proposed for insertion.

**DO NOTHING** — silently skip duplicates:
\`\`\`sql
INSERT INTO tags (name)
VALUES ('javascript'), ('react'), ('javascript')
ON CONFLICT (name) DO NOTHING;
-- Inserts 'javascript' and 'react', skips the duplicate
\`\`\`

**Conflict on composite key**:
\`\`\`sql
INSERT INTO user_preferences (user_id, key, value)
VALUES ($1, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
\`\`\`

**Conflict on constraint name**:
\`\`\`sql
INSERT INTO products (sku, name, price)
VALUES ('ABC-123', 'Widget', 9.99)
ON CONFLICT ON CONSTRAINT products_sku_key
DO UPDATE SET price = EXCLUDED.price;
\`\`\`

**Conditional update with WHERE**:
\`\`\`sql
INSERT INTO inventory (product_id, quantity)
VALUES ($1, 10)
ON CONFLICT (product_id)
DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity
WHERE inventory.quantity + EXCLUDED.quantity <= 1000;
-- Only update if it won't exceed max stock
\`\`\`

**Returning the result**:
\`\`\`sql
INSERT INTO users (email, name)
VALUES ('user@example.com', 'John')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name
RETURNING id, email, (xmax = 0) AS inserted;
-- xmax = 0 means it was an INSERT, not UPDATE
\`\`\`

**Bulk upsert**:
\`\`\`sql
INSERT INTO prices (product_id, price, updated_at)
SELECT product_id, price, NOW()
FROM staging_prices
ON CONFLICT (product_id)
DO UPDATE SET
  price = EXCLUDED.price,
  updated_at = EXCLUDED.updated_at;
\`\`\`

**MERGE (PostgreSQL 15+)**: More powerful multi-action syntax:
\`\`\`sql
MERGE INTO target t
USING source s ON t.id = s.id
WHEN MATCHED AND s.deleted THEN DELETE
WHEN MATCHED THEN UPDATE SET t.name = s.name
WHEN NOT MATCHED THEN INSERT (id, name) VALUES (s.id, s.name);
\`\`\`

**ON CONFLICT vs MERGE**: ON CONFLICT handles INSERT conflicts only; MERGE can do INSERT + UPDATE + DELETE in one statement.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 11. Materialized Views
  {
    title: "What are materialized views and when should you use them?",
    content:
      "Explain materialized views vs regular views. How do you refresh them? What are the performance implications?",
    answer: `**Regular View**: Virtual table — query is executed every time you SELECT from it.
\`\`\`sql
CREATE VIEW active_users AS
SELECT id, name, email FROM users WHERE active = true;
-- SELECT * FROM active_users; runs the full query each time
\`\`\`

**Materialized View**: Stores the result physically — like a cached snapshot.
\`\`\`sql
CREATE MATERIALIZED VIEW order_summary AS
SELECT
  u.id AS user_id,
  u.name,
  COUNT(o.id) AS order_count,
  SUM(o.total) AS total_spent,
  MAX(o.created_at) AS last_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name;

-- Add index for fast lookups
CREATE UNIQUE INDEX ON order_summary(user_id);
CREATE INDEX ON order_summary(total_spent DESC);
\`\`\`

**Refreshing**:
\`\`\`sql
-- Full refresh (locks the view during refresh):
REFRESH MATERIALIZED VIEW order_summary;

-- Concurrent refresh (no lock, requires UNIQUE index):
REFRESH MATERIALIZED VIEW CONCURRENTLY order_summary;
\`\`\`

**Automated refresh** (via pg_cron or application scheduler):
\`\`\`sql
-- Using pg_cron extension
SELECT cron.schedule('refresh_order_summary', '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY order_summary');
\`\`\`

**When to use materialized views**:

| Use Case | Why |
|----------|-----|
| Dashboard aggregations | Avoid expensive JOINs + GROUP BY on every page load |
| Reporting queries | Pre-compute complex analytics |
| Search/filter results | Denormalize for fast filtering |
| Cross-table aggregates | Join once, query cheaply |

**When NOT to use**:
- Data must be real-time (staleness unacceptable)
- Source data changes very frequently and refreshes are expensive
- Simple queries that are already fast enough

**Checking staleness**:
\`\`\`sql
-- No built-in last refresh time, track it yourself:
CREATE TABLE matview_refresh_log (
  view_name TEXT PRIMARY KEY,
  last_refreshed TIMESTAMPTZ
);

-- Update after refresh:
REFRESH MATERIALIZED VIEW CONCURRENTLY order_summary;
INSERT INTO matview_refresh_log VALUES ('order_summary', NOW())
ON CONFLICT (view_name) DO UPDATE SET last_refreshed = NOW();
\`\`\`

**Performance comparison**:
- Regular view: ~500ms (complex query every time)
- Materialized view: ~2ms (reads cached data)
- Trade-off: data can be up to [refresh interval] stale`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 12. Row-Level Security (RLS)
  {
    title: "How does Row-Level Security (RLS) work in PostgreSQL?",
    content:
      "Explain RLS policies, how to enable them, and practical use cases for multi-tenant applications.",
    answer: `**Row-Level Security (RLS)**: Restricts which rows a user can see or modify based on policies.

**Enable RLS**:
\`\`\`sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- By default, enabling RLS blocks ALL access (even table owner must create policies)
-- Force policies on table owner too:
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
\`\`\`

**Create policies**:
\`\`\`sql
-- Users can only see their own documents
CREATE POLICY user_documents ON documents
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Users can only insert documents for themselves
CREATE POLICY user_insert_documents ON documents
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- Users can only update their own documents
CREATE POLICY user_update_documents ON documents
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);
\`\`\`

**Setting the session variable** (from application code):
\`\`\`sql
-- Set at the beginning of each request/transaction
SET LOCAL app.current_user_id = 'abc-123';
-- LOCAL: scoped to current transaction only
\`\`\`

**Multi-tenant application**:
\`\`\`sql
-- All tables have tenant_id
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  amount NUMERIC NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Admin role bypasses RLS
CREATE POLICY admin_all ON invoices
  TO admin_role
  USING (true);
\`\`\`

**Combining policies** (OR logic by default for same command):
\`\`\`sql
-- Admins see all, users see own + shared
CREATE POLICY see_own ON documents FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY see_shared ON documents FOR SELECT
  USING (visibility = 'public');

-- A user can see rows matching EITHER policy
\`\`\`

**Performance considerations**:
\`\`\`sql
-- RLS conditions are added to every query — ensure indexed columns
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);

-- Check the actual query plan:
EXPLAIN ANALYZE SELECT * FROM documents;
-- Will show the RLS filter in the plan
\`\`\`

**Cautions**:
- RLS is bypassed by superusers and table owners (unless FORCE ROW LEVEL SECURITY)
- Functions with SECURITY DEFINER execute as the function owner, bypassing RLS
- Always test with a non-superuser role`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 13. Date and Time handling
  {
    title: "How should you handle dates, times, and timezones in PostgreSQL?",
    content:
      "Explain TIMESTAMP vs TIMESTAMPTZ, timezone handling, common pitfalls, and best practices for date/time operations.",
    answer: `**TIMESTAMP vs TIMESTAMPTZ**:

\`\`\`sql
-- TIMESTAMP (without time zone): stores literal date/time, no TZ conversion
-- TIMESTAMPTZ (with time zone): converts to UTC on storage, converts to session TZ on retrieval

CREATE TABLE events (
  naive_ts   TIMESTAMP,     -- DO NOT use for real-world timestamps
  aware_ts   TIMESTAMPTZ    -- ALWAYS prefer this
);

SET timezone = 'America/New_York';
INSERT INTO events VALUES ('2024-01-15 14:00:00', '2024-01-15 14:00:00');

SET timezone = 'Asia/Tokyo';
SELECT * FROM events;
-- naive_ts:  2024-01-15 14:00:00        (unchanged)
-- aware_ts:  2024-01-16 04:00:00+09     (converted to Tokyo time)
\`\`\`

**Best practices**:

1. **Always use TIMESTAMPTZ** for real timestamps:
\`\`\`sql
CREATE TABLE orders (
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_at TIMESTAMPTZ
);
\`\`\`

2. **Use DATE for date-only values**:
\`\`\`sql
CREATE TABLE birthdays (
  user_id UUID,
  birth_date DATE NOT NULL  -- no timezone ambiguity
);
\`\`\`

3. **Date arithmetic**:
\`\`\`sql
-- Add/subtract intervals
SELECT NOW() + INTERVAL '30 days';
SELECT NOW() - INTERVAL '2 hours 30 minutes';

-- Difference between dates
SELECT age('2024-12-31'::date, '2024-01-01'::date); -- 11 mons 30 days

-- Date truncation
SELECT DATE_TRUNC('month', created_at) AS month FROM orders;
SELECT DATE_TRUNC('week', NOW());
\`\`\`

4. **Filtering by date ranges**:
\`\`\`sql
-- Use range comparisons (indexable) instead of date functions
-- Good:
SELECT * FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at < '2024-02-01';

-- Bad (can't use index):
SELECT * FROM orders
WHERE EXTRACT(MONTH FROM created_at) = 1;
\`\`\`

5. **Generate date series**:
\`\`\`sql
-- All days in January 2024
SELECT generate_series(
  '2024-01-01'::date,
  '2024-01-31'::date,
  '1 day'::interval
)::date AS day;

-- Fill gaps in time-series data
SELECT d.day, COALESCE(o.count, 0) AS order_count
FROM generate_series('2024-01-01'::date, '2024-01-31'::date, '1 day') AS d(day)
LEFT JOIN (
  SELECT DATE(created_at) AS day, COUNT(*) AS count
  FROM orders
  GROUP BY DATE(created_at)
) o ON o.day = d.day;
\`\`\`

**Common pitfalls**:
- Comparing TIMESTAMP with TIMESTAMPTZ produces implicit conversion
- AT TIME ZONE converts both directions (apply once, not twice)
- Always store in TIMESTAMPTZ; convert on display in the application layer`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 14. Full-Text Search
  {
    title: "How do you implement full-text search in PostgreSQL?",
    content:
      "Explain tsvector, tsquery, GIN indexes, and how PostgreSQL's built-in FTS compares to external search engines like Elasticsearch.",
    answer: `**Core concepts**:

**tsvector**: Processed document (normalized, stemmed tokens)
**tsquery**: Search query

\`\`\`sql
SELECT to_tsvector('english', 'The quick brown foxes jumped');
-- 'brown':3 'fox':4 'jump':5 'quick':2
-- (stopwords removed, stems normalized)

SELECT to_tsquery('english', 'quick & brown');
-- 'quick' & 'brown'
\`\`\`

**Basic search**:
\`\`\`sql
SELECT title, ts_rank(search_vector, query) AS rank
FROM articles, to_tsquery('english', 'postgresql & performance') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;
\`\`\`

**Setting up a search column**:
\`\`\`sql
-- Add a tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Populate it
UPDATE articles SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(body, '')), 'B');

-- Create GIN index for fast searches
CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Auto-update with trigger
CREATE FUNCTION articles_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_trigger();
\`\`\`

**Weighted search** (title matches rank higher):
\`\`\`sql
-- Weights: A=1.0, B=0.4, C=0.2, D=0.1
SELECT title,
  ts_rank_cd(search_vector, query) AS rank
FROM articles, plainto_tsquery('english', 'database indexing') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
\`\`\`

**Query types**:
\`\`\`sql
to_tsquery('english', 'cat & dog')      -- AND
to_tsquery('english', 'cat | dog')      -- OR
to_tsquery('english', '!cat')            -- NOT
to_tsquery('english', 'cat <-> dog')     -- FOLLOWED BY (phrase)
plainto_tsquery('cat dog')                -- simple AND of terms
websearch_to_tsquery('"exact phrase" or term -excluded')  -- web-style
\`\`\`

**Highlighting results**:
\`\`\`sql
SELECT ts_headline('english', body, query,
  'StartSel=<mark>, StopSel=</mark>, MaxWords=50') AS snippet
FROM articles, to_tsquery('english', 'postgresql') AS query
WHERE search_vector @@ query;
\`\`\`

**PostgreSQL FTS vs Elasticsearch**:
| Feature | PostgreSQL FTS | Elasticsearch |
|---------|---------------|---------------|
| Setup | Zero (built-in) | Separate cluster |
| Scalability | Single-node | Distributed |
| Fuzzy matching | Limited (pg_trgm) | Excellent |
| Faceted search | Manual | Built-in |
| Use when | < 10M docs, simple needs | Large scale, complex search |`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 15. Performance Tuning Configuration
  {
    title: "What are the key PostgreSQL configuration parameters for performance tuning?",
    content:
      "Explain the most important postgresql.conf settings and how to tune them for different workloads.",
    answer: `**Memory settings**:

\`\`\`ini
# shared_buffers: Main memory cache for data pages (start at 25% of RAM)
shared_buffers = 4GB          # For 16GB RAM server

# work_mem: Memory per sort/hash operation (per query, per operation!)
work_mem = 64MB               # Be careful: 100 concurrent queries × 64MB = 6.4GB
# Check if sorts spill to disk: EXPLAIN ANALYZE shows "Sort Method: external merge"

# maintenance_work_mem: Memory for VACUUM, CREATE INDEX, ALTER TABLE
maintenance_work_mem = 1GB

# effective_cache_size: Hint to planner about OS cache (50-75% of RAM)
effective_cache_size = 12GB   # For 16GB RAM server
\`\`\`

**WAL (Write-Ahead Log) settings**:
\`\`\`ini
# wal_buffers: Memory for WAL
wal_buffers = 64MB

# checkpoint_completion_target: Spread checkpoint I/O over this fraction
checkpoint_completion_target = 0.9

# max_wal_size: Trigger checkpoint when WAL reaches this size
max_wal_size = 4GB
\`\`\`

**Connection settings**:
\`\`\`ini
# max_connections: Keep low, use a connection pooler (PgBouncer)
max_connections = 100         # Not 1000!

# Each connection uses ~5-10MB of memory
# 100 connections × 10MB = 1GB just for connections
\`\`\`

**Query planner settings**:
\`\`\`ini
# random_page_cost: Reduce for SSD (default 4.0 favors seq scan)
random_page_cost = 1.1        # For SSD storage

# effective_io_concurrency: Increase for SSD
effective_io_concurrency = 200

# default_statistics_target: More samples for better query plans
default_statistics_target = 200  # Default 100, up to 10000
\`\`\`

**Autovacuum tuning**:
\`\`\`ini
# Make autovacuum more aggressive for busy tables
autovacuum_max_workers = 4
autovacuum_naptime = 30s                      # Check more frequently
autovacuum_vacuum_scale_factor = 0.05         # 5% dead rows triggers vacuum (default 20%)
autovacuum_analyze_scale_factor = 0.025       # 2.5% changes triggers analyze
\`\`\`

**Per-table autovacuum** for hot tables:
\`\`\`sql
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 5
);
\`\`\`

**Monitoring current settings**:
\`\`\`sql
SHOW shared_buffers;
SHOW work_mem;
SELECT name, setting, unit, context FROM pg_settings WHERE name LIKE '%mem%';

-- Check if settings need tuning
SELECT * FROM pg_stat_user_tables WHERE n_dead_tup > 10000;
SELECT * FROM pg_stat_activity WHERE state = 'active';
\`\`\`

**Workload tuning guide**:
| Setting | OLTP (web app) | OLAP (analytics) |
|---------|---------------|-------------------|
| work_mem | 32-64MB | 256MB-1GB |
| shared_buffers | 25% RAM | 25% RAM |
| random_page_cost | 1.1 (SSD) | 1.1 (SSD) |
| max_parallel_workers | 2-4 | 8-16 |`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 16. Locking and Concurrency
  {
    title: "Explain locking mechanisms in PostgreSQL and how to avoid deadlocks",
    content:
      "What types of locks exist? How do you detect and prevent deadlocks? What is advisory locking?",
    answer: `**Lock types** (from least to most restrictive):

| Lock Mode | SELECT | INSERT | UPDATE | DELETE | DDL |
|-----------|--------|--------|--------|--------|-----|
| ACCESS SHARE | Yes | | | | |
| ROW SHARE | | | | | |
| ROW EXCLUSIVE | | Yes | Yes | Yes | |
| ACCESS EXCLUSIVE | | | | | Yes |

**Row-level locks**:
\`\`\`sql
-- Explicit row lock (FOR UPDATE)
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
-- Row is locked until COMMIT/ROLLBACK
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- FOR UPDATE SKIP LOCKED (job queue pattern)
SELECT id, payload FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
-- Other transactions skip locked rows instead of waiting

-- FOR SHARE (shared read lock — prevents updates, allows other reads)
SELECT * FROM products WHERE id = 1 FOR SHARE;
\`\`\`

**Deadlock example and prevention**:
\`\`\`sql
-- Deadlock scenario:
-- TX1: UPDATE accounts SET ... WHERE id = 1; (locks row 1)
-- TX2: UPDATE accounts SET ... WHERE id = 2; (locks row 2)
-- TX1: UPDATE accounts SET ... WHERE id = 2; (waits for TX2)
-- TX2: UPDATE accounts SET ... WHERE id = 1; (waits for TX1) -> DEADLOCK!

-- Prevention: always lock rows in consistent order
BEGIN;
SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Both transactions lock in the same order -> no deadlock
COMMIT;
\`\`\`

**Detecting locks**:
\`\`\`sql
-- View current locks
SELECT
  l.pid,
  a.usename,
  l.relation::regclass AS table_name,
  l.mode,
  l.granted,
  a.query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation IS NOT NULL;

-- Find blocking queries
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid
JOIN pg_locks kl ON kl.relation = bl.relation AND kl.pid != bl.pid
JOIN pg_stat_activity blocking ON blocking.pid = kl.pid
WHERE NOT bl.granted;
\`\`\`

**Advisory locks** (application-level):
\`\`\`sql
-- Session-level advisory lock (released on disconnect)
SELECT pg_advisory_lock(12345);
-- ... do exclusive work ...
SELECT pg_advisory_unlock(12345);

-- Transaction-level advisory lock (released on COMMIT/ROLLBACK)
SELECT pg_advisory_xact_lock(12345);

-- Non-blocking (try):
SELECT pg_try_advisory_lock(12345); -- returns true/false

-- Use case: prevent concurrent cron jobs
SELECT pg_try_advisory_lock(hashtext('daily_report'));
\`\`\`

**Lock timeout**:
\`\`\`sql
SET lock_timeout = '5s';  -- Don't wait forever for a lock
SET statement_timeout = '30s';  -- Kill queries that run too long
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 17. Stored Procedures and Functions
  {
    title: "What is the difference between functions and procedures in PostgreSQL?",
    content:
      "Compare CREATE FUNCTION vs CREATE PROCEDURE, explain PL/pgSQL basics, and discuss when to use database-side logic vs application code.",
    answer: `**Functions vs Procedures** (procedures added in PG 11):

| Feature | Function | Procedure |
|---------|----------|-----------|
| Returns value | Yes | No (OUT params only) |
| Called with | SELECT my_func() | CALL my_proc() |
| Transaction control | No (runs in caller's tx) | Yes (COMMIT/ROLLBACK inside) |
| Used in SQL | Yes (in SELECT, WHERE, etc.) | No |

**Function example**:
\`\`\`sql
CREATE OR REPLACE FUNCTION calculate_discount(
  total NUMERIC,
  tier TEXT
) RETURNS NUMERIC AS $$
BEGIN
  RETURN CASE tier
    WHEN 'gold' THEN total * 0.20
    WHEN 'silver' THEN total * 0.10
    ELSE total * 0.05
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage:
SELECT order_id, total, calculate_discount(total, customer_tier) AS discount
FROM orders;
\`\`\`

**Procedure example** (with transaction control):
\`\`\`sql
CREATE OR REPLACE PROCEDURE transfer_funds(
  sender_id UUID,
  receiver_id UUID,
  amount NUMERIC
) AS $$
BEGIN
  -- Debit sender
  UPDATE accounts SET balance = balance - amount WHERE id = sender_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender account % not found', sender_id;
  END IF;

  -- Credit receiver
  UPDATE accounts SET balance = balance + amount WHERE id = receiver_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receiver account % not found', receiver_id;
  END IF;

  -- Log the transfer
  INSERT INTO transfers (from_id, to_id, amount) VALUES (sender_id, receiver_id, amount);

  COMMIT;
END;
$$ LANGUAGE plpgsql;

CALL transfer_funds('abc', 'def', 100.00);
\`\`\`

**Returning sets** (table functions):
\`\`\`sql
CREATE FUNCTION get_user_orders(p_user_id UUID)
RETURNS TABLE (order_id UUID, total NUMERIC, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.total, o.created_at
  FROM orders o
  WHERE o.user_id = p_user_id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

SELECT * FROM get_user_orders('abc-123');
\`\`\`

**Volatility categories** (helps the planner):
\`\`\`sql
-- IMMUTABLE: Same input always returns same output (can be cached)
CREATE FUNCTION full_name(first TEXT, last TEXT) RETURNS TEXT
AS $$ SELECT first || ' ' || last; $$ LANGUAGE sql IMMUTABLE;

-- STABLE: Same within a single query/transaction (reads DB but no writes)
-- VOLATILE: Can return different results each call (default)
\`\`\`

**When to use DB functions vs app code**:
- **DB functions**: Complex data transformations, computed columns, batch operations, reusable business constraints
- **App code**: Business logic that needs external services, complex error handling, testability, version control
- **Rule of thumb**: If the logic is purely about data and runs in one query, use a function. If it needs HTTP calls, queues, or complex branching, use app code.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 18. Arrays and Array Operations
  {
    title: "How do PostgreSQL arrays work and when should you use them?",
    content:
      "Explain array data type, array operators, indexing arrays, and when arrays are appropriate vs separate tables.",
    answer: `**Array basics**:
\`\`\`sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  scores INT[]
);

-- Insert
INSERT INTO articles (id, title, tags, scores) VALUES
  (gen_random_uuid(), 'PostgreSQL Tips', ARRAY['postgresql', 'database', 'sql'], ARRAY[85, 92, 78]);

-- Alternative syntax
INSERT INTO articles (id, title, tags) VALUES
  (gen_random_uuid(), 'React Guide', '{react,frontend,javascript}');
\`\`\`

**Array operators**:
\`\`\`sql
-- Contains (@>)
SELECT * FROM articles WHERE tags @> ARRAY['postgresql'];

-- Is contained by (<@)
SELECT * FROM articles WHERE tags <@ ARRAY['postgresql', 'sql', 'database'];

-- Overlap (&&) — any element in common
SELECT * FROM articles WHERE tags && ARRAY['react', 'vue'];

-- Access by index (1-based!)
SELECT tags[1] FROM articles; -- first element

-- Array length
SELECT array_length(tags, 1) FROM articles;

-- Append
UPDATE articles SET tags = array_append(tags, 'tutorial') WHERE id = $1;

-- Remove
UPDATE articles SET tags = array_remove(tags, 'draft') WHERE id = $1;
\`\`\`

**Unnest** — expand array to rows:
\`\`\`sql
-- List all unique tags across articles
SELECT DISTINCT unnest(tags) AS tag FROM articles ORDER BY tag;

-- Count articles per tag
SELECT tag, COUNT(*) AS article_count
FROM articles, unnest(tags) AS tag
GROUP BY tag
ORDER BY article_count DESC;
\`\`\`

**GIN index for array searches**:
\`\`\`sql
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);
-- Speeds up @>, <@, && operators
\`\`\`

**Array aggregation**:
\`\`\`sql
-- Collect values into an array
SELECT user_id, array_agg(DISTINCT tag ORDER BY tag) AS all_tags
FROM user_tags
GROUP BY user_id;
\`\`\`

**When to use arrays vs separate table**:

| Use Arrays | Use Separate Table |
|------------|-------------------|
| Small, fixed-size lists | Large or unbounded lists |
| No need to query individual elements often | Need to JOIN or filter on related data |
| Tags, labels, simple flags | Full entities with their own attributes |
| Ordering matters and is simple | Need foreign keys or constraints per element |
| Performance: avoid JOINs for small sets | Data integrity is critical |

**Anti-pattern** — don't use arrays for:
\`\`\`sql
-- Bad: storing user_ids as array (no FK enforcement)
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  member_ids UUID[]  -- can't enforce that these are real users!
);

-- Good: junction table
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (group_id, user_id)
);
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 19. Backup and Restore Strategies
  {
    title: "What are the different backup and restore strategies in PostgreSQL?",
    content:
      "Compare pg_dump, pg_basebackup, and WAL archiving. When should you use each approach?",
    answer: `**1. pg_dump** — Logical backup (SQL or custom format):
\`\`\`bash
# Dump entire database as SQL
pg_dump -h localhost -U postgres mydb > backup.sql

# Custom format (compressed, supports parallel restore)
pg_dump -Fc -h localhost -U postgres mydb -f backup.dump

# Dump specific tables
pg_dump -t users -t orders mydb -f partial.dump

# Dump schema only (no data)
pg_dump --schema-only mydb > schema.sql

# Dump data only
pg_dump --data-only mydb > data.sql
\`\`\`

**Restore from pg_dump**:
\`\`\`bash
# SQL format
psql mydb < backup.sql

# Custom format (parallel restore with 4 jobs)
pg_restore -d mydb -j 4 backup.dump

# Restore specific table
pg_restore -d mydb -t users backup.dump
\`\`\`

**2. pg_basebackup** — Physical backup (entire cluster):
\`\`\`bash
# Full physical backup
pg_basebackup -h localhost -U replicator -D /backups/base -Ft -z -P

# -Ft: tar format
# -z: compress with gzip
# -P: show progress
\`\`\`

**3. Continuous Archiving (WAL + PITR)**:
\`\`\`ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/wal/%f'
\`\`\`

\`\`\`bash
# Point-in-time recovery
# 1. Restore base backup
# 2. Create recovery.signal
# 3. Configure restore_command in postgresql.conf:
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2024-03-15 14:30:00'
\`\`\`

**Comparison**:

| Feature | pg_dump | pg_basebackup | WAL Archiving |
|---------|---------|---------------|---------------|
| Type | Logical | Physical | Physical |
| Granularity | Per-table | Entire cluster | Entire cluster |
| Point-in-time | No | No | Yes (PITR) |
| Cross-version | Yes | No | No |
| Size | Smaller (data only) | Full cluster | Base + WAL segments |
| Speed (backup) | Slow for large DBs | Fast | Continuous |
| Speed (restore) | Slow | Fast | Depends on WAL volume |
| Locks | ACCESS SHARE only | No locks | No locks |

**When to use each**:
- **pg_dump**: Development, migrations, small databases (< 50GB), cross-version upgrades
- **pg_basebackup**: Setting up replicas, medium databases, disaster recovery
- **WAL archiving + PITR**: Production, large databases, need to recover to any point in time

**Backup automation example** (cron):
\`\`\`bash
# Daily logical backup with 7-day retention
0 2 * * * pg_dump -Fc mydb -f /backups/mydb_$(date +\\%Y\\%m\\%d).dump && find /backups -name "mydb_*.dump" -mtime +7 -delete
\`\`\`

**Testing backups** — Most important step!
\`\`\`bash
# Always test restore to a separate database
createdb mydb_test
pg_restore -d mydb_test backup.dump
# Verify data integrity
psql mydb_test -c "SELECT COUNT(*) FROM critical_table;"
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },

  // 20. Connection Pooling
  {
    title: "Why is connection pooling important in PostgreSQL and how do you implement it?",
    content:
      "Explain the cost of database connections, connection pooling strategies (PgBouncer, application-level), and configuration best practices.",
    answer: `**Why connection pooling?**

Each PostgreSQL connection:
- Spawns a new OS process (~5-10MB memory)
- Requires authentication, SSL handshake
- Allocates per-connection memory (work_mem, temp_buffers)
- Creates entries in shared memory structures

\`\`\`
100 idle connections × 10MB = 1GB wasted memory
1000 connections = severe performance degradation
\`\`\`

**PgBouncer** — External connection pooler (most popular):
\`\`\`ini
# pgbouncer.ini
[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings
pool_mode = transaction     # Most common for web apps
default_pool_size = 20      # Max connections to PostgreSQL PER database/user
max_client_conn = 1000      # Max connections from applications
min_pool_size = 5           # Keep minimum connections warm

# Timeouts
server_idle_timeout = 600   # Close idle server connections after 10 min
client_idle_timeout = 0     # Don't close idle client connections
query_timeout = 30          # Kill queries running > 30s
\`\`\`

**Pool modes**:

| Mode | Description | Use Case |
|------|-------------|----------|
| session | 1:1 mapping until client disconnects | Legacy apps, PREPARE statements |
| transaction | Connection returned after each transaction | Web apps (recommended) |
| statement | Connection returned after each statement | Simple read-only queries |

**Application-level pooling** (Node.js with pg):
\`\`\`typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'app',
  password: 'secret',
  max: 20,                  // Max pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
});

// Use pool directly (auto checkout/checkin)
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// Manual checkout for transactions
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, sender]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, receiver]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release(); // Always release back to pool!
}
\`\`\`

**TypeORM pool configuration**:
\`\`\`typescript
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  extra: {
    max: 20,                   // Pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});
\`\`\`

**Sizing the pool**:
\`\`\`
Optimal pool size = (number of CPU cores × 2) + number of disk spindles

Example: 4-core server with SSD
Pool size = (4 × 2) + 1 = 9-10 connections
\`\`\`

**Monitoring connections**:
\`\`\`sql
-- Current connection count
SELECT count(*) FROM pg_stat_activity;

-- Connections by state
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query_start < now() - interval '30 seconds';

-- Kill a stuck connection
SELECT pg_terminate_backend(pid);
\`\`\`

**Best practices**:
- Use PgBouncer in production (transaction mode)
- Set \`max_connections\` low in PostgreSQL (100-200), handle scale at the pooler level
- Always release connections back to the pool (use try/finally)
- Monitor pool utilization and adjust size based on actual usage`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "postgresql",
  },
];
