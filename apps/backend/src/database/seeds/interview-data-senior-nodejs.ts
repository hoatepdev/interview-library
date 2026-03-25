/**
 * Senior-Level Node.js Interview Questions
 *
 * 10 production-grade questions targeting developers with 5+ years experience.
 * Focus: event loop internals, streaming, scaling, concurrency, production incidents.
 *
 * Topics: nodejs (10)
 * Level: SENIOR
 *
 * Usage: pnpm --filter backend seed:senior-nodejs
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
// NODE.JS — SENIOR LEVEL (10 questions)
// ============================================

export const seniorNodejsQuestions: QuestionSeed[] = [
  // 1. [Performance] — Event Loop Blocking
  {
    title:
      "Your Node.js API has p99 of 5 seconds despite simple queries. CPU usage is only 30%. How do you diagnose and fix event loop blocking?",
    content:
      "A Node.js REST API handles 500 req/s. Average response is 50ms, but p99 is 5 seconds. The DB queries are fast (< 10ms), CPU is at 30%, and there are no obvious errors. Some requests experience 5+ second delays randomly. How do you diagnose this — what tooling do you use, what patterns do you look for, and how do you fix it?",
    answer: buildAnswer({
      short_answer:
        "5-second p99 with low CPU and fast queries is the signature of event loop lag — a synchronous CPU-intensive operation (JSON parse/stringify of large payload, crypto, regex, or synchronous file I/O) blocking the event loop. Measure event loop lag directly, use clinic.js or 0x to find the blocking operation, then move it to worker_threads or libuv threadpool.",
      detailed_answer: `**Event Loop Lag Explained**:
Node.js runs JavaScript on a single thread. If any synchronous operation takes > 100ms, ALL other requests queue up for that duration, creating exactly the p99 pattern described.

**Step 1: Measure Event Loop Lag**
\`\`\`javascript
// Measure: how long does the event loop block between ticks?
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag = now - lastTick - 100;  // 100ms interval minus overhead
  if (lag > 100) {
    console.log(\`Event loop blocked for \${lag}ms\`);
    // Add stack trace capture here
  }
  lastTick = now;
}, 100);
\`\`\`

Or use \`perf_hooks\`:
\`\`\`javascript
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => {
  console.log({
    mean: h.mean / 1e6,   // nanoseconds to ms
    p99: h.percentile(99) / 1e6,
  });
}, 5000);
\`\`\`

**Step 2: Find the Blocking Code**

Tools:
\`\`\`bash
# clinic.js - comprehensive Node.js diagnostics
npx clinic doctor -- node app.js
# Show CPU flame graph
npx clinic flame -- node app.js

# 0x - CPU flame graph
npx 0x app.js
\`\`\`

Common culprits:
\`\`\`javascript
// 1. JSON.parse/stringify of large objects
JSON.parse(largeBuffer.toString());  // 100MB JSON = 2-5 seconds blocking

// 2. Synchronous crypto
const hash = crypto.createHash('sha256').update(largeBuffer).digest('hex');
// Fix: use crypto.scrypt() (async) or move to worker

// 3. Catastrophic regex
const RE_DOE = /^(a+)+$/;
RE_DOE.test('aaaaaaaaaaaaaaaaaaaaaaab');  // ReDoS - exponential backtracking

// 4. Synchronous file I/O
const content = fs.readFileSync('large-file.txt');  // BLOCKS
// Fix: fs.readFile() or streams

// 5. Synchronous bcrypt
const hash = bcryptjs.hashSync(password, 12);  // 300ms blocking
// Fix: bcrypt.hash() async version
\`\`\`

**Fix: Worker Threads for CPU Work**
\`\`\`javascript
// main.js
const { Worker } = require('worker_threads');

function parseLargeJSON(buffer) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./json-worker.js', {
      workerData: { buffer }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// json-worker.js
const { workerData, parentPort } = require('worker_threads');
const result = JSON.parse(workerData.buffer.toString());
parentPort.postMessage(result);
\`\`\`
Workers run in separate V8 contexts with their own event loops.`,
      trade_offs: [
        {
          approach: "Worker threads for CPU-intensive work",
          pros: [
            "Parallelizes CPU work without process overhead",
            "Shared memory via SharedArrayBuffer",
            "Built into Node.js (no external process)",
          ],
          cons: [
            "Worker startup ~30ms — not suitable for tiny operations",
            "Shared state requires careful synchronization",
            "Memory is not fully isolated (unlike child_process)",
          ],
        },
        {
          approach: "child_process.fork() for CPU isolation",
          pros: [
            "Full process isolation — crash in child doesn't affect main",
            "Simple IPC via process.send/receive",
            "Existing Node.js expertise",
          ],
          cons: [
            "Process overhead ~50MB per worker",
            "IPC serializes data (JSON) — overhead for large payloads",
            "Slower startup than worker_threads",
          ],
        },
        {
          approach: "Refactor to avoid blocking operation entirely",
          pros: [
            "Best solution if blocking is avoidable",
            "No threading complexity",
          ],
          cons: [
            "Sometimes the blocking is intrinsic (e.g., must compute bcrypt)",
          ],
        },
      ],
      real_world_example:
        "A payments startup had their webhook processing Node.js service showing random 8-second p99 spikes. Using clinic.js, they found that incoming webhooks contained base64-encoded PDFs (up to 5MB). Their middleware called Buffer.from(base64, 'base64') and then JSON.stringify the result — both blocking operations that took 2-4 seconds for large payloads. Fix: use streams for webhook body parsing (never buffer large payloads), and process PDFs in worker threads. P99 dropped from 8s to 120ms within a day.",
      red_flags: [
        "Immediately suggests horizontal scaling (adding more servers) without diagnosing the root cause",
        "Does not know what event loop lag is or how to measure it",
        "Cannot name any Node.js profiling tool (clinic.js, 0x, v8-profiler)",
        "Unaware of worker_threads as a solution for CPU-bound work",
        "Confuses high latency with high CPU (low CPU + high latency = I/O wait OR event loop block)",
      ],
      follow_up_questions: [
        "How does the libuv thread pool interact with crypto and fs operations, and how do you configure its size?",
        "What is the maximum safe size of a JSON.parse() operation before it blocks the event loop, and how do you measure it?",
        "How would you create a worker pool (reuse workers instead of creating one per request) to avoid worker startup latency?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 2. [System Design] — Node.js Cluster vs PM2 vs Kubernetes Horizontal Scaling
  {
    title:
      "Compare Node.js cluster module, PM2, and Kubernetes horizontal pod autoscaling for a stateful WebSocket service — which do you choose?",
    content:
      "You run a real-time notification service in Node.js that maintains WebSocket connections with 100,000 concurrent users. You need to scale it to 500,000 concurrent users. Compare three approaches: Node.js cluster module, PM2, and Kubernetes HPA. The service uses Redis pub/sub for message broadcasting. Which approach is right, and what problems does each create with WebSocket statefulness?",
    answer: buildAnswer({
      short_answer:
        "For stateful WebSocket services, horizontal scaling (Kubernetes/PM2) requires that all instances share a pub/sub backbone (Redis) and clients can reconnect to any instance. The WebSocket connection itself is stateful and tied to one process/instance — this is the fundamental challenge. Kubernetes HPA is preferred for cloud-native deployment but requires sticky sessions or smart reconnection logic. Node.js cluster is inferior for WebSockets due to OS-level TCP socket sharing issues.",
      detailed_answer: `**The Core Problem with Stateful WebSockets**:

A WebSocket connection is a persistent TCP connection to a specific process. When you scale to N instances:
\`\`\`
Client A → connects to Instance 1
Client B → connects to Instance 2
\`\`\`

If Instance 1 needs to send a message to Client B (connected to Instance 2), it cannot do so directly. You need a shared pub/sub layer.

**Architecture Pattern (Required for all scaling approaches)**:
\`\`\`
[Client A] ←→ [Node Instance 1] ←→ [Redis Pub/Sub]
[Client B] ←→ [Node Instance 2] ←→ [Redis Pub/Sub]
\`\`\`

When someone sends a notification to all users:
\`\`\`javascript
// Publisher (from any instance)
redis.publish('notifications', JSON.stringify({ userId, message }));

// Each instance subscribes and forwards to its local connections
redisSubscriber.subscribe('notifications');
redisSubscriber.on('message', (channel, data) => {
  const { userId, message } = JSON.parse(data);
  const localSocket = localConnections.get(userId);
  if (localSocket) localSocket.send(message);
});
\`\`\`

**Node.js Cluster Module**:
- Creates N worker processes (N = CPU cores) via fork()
- OS round-robins incoming TCP connections
- Problem: WebSocket upgrade (HTTP→WS) is not cleanly supported in cluster
  - The upgrade request may arrive on a different worker than future frames
  - \`socket.io\` and \`ws\` have known issues with cluster without sticky sessions

Fix: use sticky sessions in cluster (route client by IP hash):
\`\`\`javascript
cluster.on('message', (worker, message) => {
  if (message.cmd === 'sticky-session') {
    // Route this connection to the correct worker
  }
});
\`\`\`
Verdict: Works but complex. Not cloud-native.

**PM2 Cluster Mode**:
- Similar to cluster module but with process management
- Same sticky session problem
- Advantage: process monitoring, restart on crash, log aggregation
- Verdict: Good for single-server, not distributed.

**Kubernetes HPA**:
- Scales pods across nodes based on CPU/memory/custom metrics
- WebSocket connections: need Session Affinity (sticky sessions via Service spec)
\`\`\`yaml
apiVersion: v1
kind: Service
spec:
  sessionAffinity: ClientIP  # sticky by client IP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600  # 1 hour sticky
\`\`\`
- Scaling DOWN is the hard part: draining WebSocket connections gracefully
  - Use SIGTERM handler to stop accepting new connections, wait for existing to drain

**Verdict for 500K WebSockets: Kubernetes + Redis Adapter**`,
      trade_offs: [
        {
          approach: "Node.js cluster module",
          pros: [
            "Zero infrastructure overhead",
            "Uses all CPU cores",
            "Built-in, no external dependencies",
          ],
          cons: [
            "Not distributed (single server)",
            "WebSocket sticky session requires custom implementation",
            "Manual failure handling",
          ],
        },
        {
          approach: "PM2 cluster mode",
          pros: [
            "Process management built-in",
            "Zero-downtime restarts",
            "Multi-core utilization",
          ],
          cons: [
            "Single server limitation",
            "Same WebSocket sticky session complexity",
            "PM2 is a config overhead in cloud environments",
          ],
        },
        {
          approach: "Kubernetes HPA + Redis pub/sub",
          pros: [
            "True horizontal scaling across nodes",
            "Cloud-native — autoscale on connection count metric",
            "Health checks and pod replacement built-in",
          ],
          cons: [
            "More complex infrastructure",
            "Scale-down draining requires careful SIGTERM handling",
            "Redis becomes critical path — must be clustered",
          ],
        },
      ],
      real_world_example:
        "Slack's real-time messaging infrastructure handles millions of concurrent WebSocket connections. They use a 'presence' architecture where each WebSocket connection is registered in a distributed registry (Redis). When a user sends a message, the server publishes to a channel, and each instance hosting a connection to the recipient forwards the message. When scaling down a server, it broadcasts a 'reconnect' message to all connected clients, who then reconnect to another server. This allows zero-disruption scaling events where clients transparently migrate to new servers.",
      red_flags: [
        "Claims Node.js cluster solves WebSocket scaling transparently (ignores sticky session problem)",
        "Does not mention Redis or any shared pub/sub layer as necessary for multi-instance WebSockets",
        "Cannot explain what happens to existing WebSocket connections when a pod is terminated",
        "Unaware of session affinity in Kubernetes services",
        "Does not consider the graceful drain problem when scaling down",
      ],
      follow_up_questions: [
        "How do you implement graceful WebSocket connection draining when Kubernetes sends SIGTERM to a pod?",
        "If Redis goes down, what happens to WebSocket message delivery across instances, and how do you design for this failure?",
        "How do you scale the number of Kubernetes pods based on the number of active WebSocket connections (custom metric)?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 3. [Debug] — Streams and Backpressure
  {
    title:
      "Your Node.js file export endpoint causes the server to run out of memory for large exports. How do you fix it using streams and backpressure?",
    content:
      "Your API endpoint exports user data as a CSV. For small users (< 1000 rows) it works fine. For enterprise users (500,000 rows), the Node.js process crashes with OOM. The current implementation queries all rows from PostgreSQL into an array, formats them as CSV, then sends the response. How do you rewrite this using Node.js streams, and how does backpressure work in this context?",
    answer: buildAnswer({
      short_answer:
        "Never buffer all data in memory for streaming operations. Use PostgreSQL cursor-based streaming (pg.query as cursor), pipe through a Transform stream for CSV formatting, and pipe directly to the HTTP response. Backpressure is the mechanism where the readable stream pauses when the writable stream's buffer is full — Node.js handles this automatically when you use pipe(). The key is to never await the full result set.",
      detailed_answer: `**The Problem**:
\`\`\`javascript
// BUG: buffers 500K rows in memory
const users = await db.query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]);
const csv = users.rows.map(formatRow).join('\\n');  // 500K rows * avg 200 bytes = 100MB
res.send(csv);  // Entire 100MB in memory simultaneously
\`\`\`

**Fix: Streaming with Backpressure**
\`\`\`javascript
const { Transform } = require('stream');
const pg = require('pg');
const { stringify } = require('csv-stringify');

app.get('/export', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  // 1. PostgreSQL cursor — streams rows without loading all into memory
  const client = await pool.connect();
  try {
    const cursor = client.query(
      new Cursor('SELECT * FROM users WHERE tenant_id = $1', [req.tenantId])
    );

    // 2. CSV transformer
    const csvTransform = stringify({ header: true, columns: ['id', 'email', 'name'] });

    // 3. Fetch rows in batches via cursor
    const readable = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }
    });

    // Async iteration with backpressure respect
    let rows;
    do {
      rows = await cursor.read(100);  // Read 100 rows at a time
      for (const row of rows) {
        if (!csvTransform.write(row)) {
          // Backpressure: csvTransform buffer full, pause reading
          await new Promise(resolve => csvTransform.once('drain', resolve));
        }
      }
    } while (rows.length > 0);

    csvTransform.end();
    csvTransform.pipe(res);

  } finally {
    client.release();
  }
});
\`\`\`

**How Backpressure Works**:
\`\`\`
PostgreSQL cursor (Readable)
    ↓ rows at controlled pace
Transform Stream (formats CSV)
    ↓ CSV chunks
HTTP Response (Writable)
    ↓ TCP send buffer
Client
\`\`\`

When the client's TCP window fills (download slower than generation):
1. \`res.write()\` returns \`false\` (buffer full)
2. Transform stream pauses (stops writing)
3. Cursor stops reading from PostgreSQL
4. Memory usage stays bounded (~1-2MB regardless of dataset size)

**Simplified with pipeline()**:
\`\`\`javascript
const { pipeline } = require('stream/promises');
await pipeline(
  pgStream,        // readable: PostgreSQL cursor stream
  csvTransform,    // transform: format rows
  res             // writable: HTTP response
);
// Automatically handles backpressure and error propagation
\`\`\``,
      trade_offs: [
        {
          approach: "Streaming with cursor and pipeline()",
          pros: [
            "O(1) memory regardless of dataset size",
            "Starts sending data immediately (lower TTFB)",
            "Built-in backpressure handling",
          ],
          cons: [
            "Cannot set Content-Length header (chunked transfer encoding)",
            "If error occurs mid-stream, client has partial data",
            "More complex error handling than buffered approach",
          ],
        },
        {
          approach: "Write to temp file then stream",
          pros: [
            "Allows retry on stream error",
            "Can set Content-Length",
            "Predictable — full file exists before sending",
          ],
          cons: [
            "Disk I/O overhead",
            "Must clean up temp files",
            "Still O(n) disk space (but not RAM)",
          ],
        },
        {
          approach: "Async job + pre-generated download URL",
          pros: [
            "No long-lived HTTP connection needed",
            "User notified when ready",
            "Can retry failed exports",
          ],
          cons: [
            "More complex UX (polling or email notification)",
            "Storage for exported files",
            "Delayed delivery",
          ],
        },
      ],
      real_world_example:
        "Stripe's data export pipeline uses a streaming architecture for their Sigma product. When a user runs a large query (exporting millions of transactions), Stripe never materializes the full result set in memory. Instead, they use a streaming cursor from their data warehouse, pipe through a CSV formatter (stream.Transform), and stream directly to S3 via multipart upload. The S3 multipart upload handles backpressure — if S3 is slow to accept parts, the cursor slows down. The entire export pipeline uses < 50MB RAM regardless of result size (tested up to 500GB exports).",
      red_flags: [
        "Does not know what backpressure is or why stream.write() returns false",
        "Suggests pagination as the solution (good UX fix but doesn't solve OOM for sync export)",
        "Cannot implement a Transform stream correctly (objectMode for rows vs binary for CSV)",
        "Unaware of pipeline() or why it's better than manual .pipe() chains for error handling",
        "Does not mention the cursor pattern for PostgreSQL (assumes results must be buffered)",
      ],
      follow_up_questions: [
        "How do you handle the case where the client disconnects midway through a 1GB export — how do you clean up the database cursor and free resources?",
        "If you need to add a progress percentage to the export, how do you implement this while maintaining streaming behavior?",
        "How does highWaterMark affect memory usage in Transform streams, and what value would you choose for this CSV export use case?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 4. [Architecture] — CPU-Bound Tasks in Node.js
  {
    title:
      "Design a Node.js service that must process 10,000 image thumbnail generation jobs per minute without impacting API response times",
    content:
      "Your platform generates image thumbnails on upload. Currently, thumbnail generation happens synchronously in the request handler. At low traffic it works, but at 10,000 uploads/minute, the API p99 jumps to 8 seconds and thumbnail generation causes event loop blocking. Design an architecture that decouples thumbnail generation from the API while maintaining reliability (every upload gets a thumbnail), observability, and horizontal scalability.",
    answer: buildAnswer({
      short_answer:
        "Decouple CPU-intensive thumbnail work from the API with a message queue (Bull/BullMQ backed by Redis, or SQS for cloud). API handler puts job in queue and returns immediately. Separate worker processes (dedicated to CPU work) pull from queue and process. This keeps API event loop clean, worker processes can be scaled independently, and queue provides persistence if workers crash.",
      detailed_answer: `**Architecture Overview**:

\`\`\`
Upload API → [Queue] → Worker Pool → Object Storage (S3)
(immediate)            (separate)     (result)
\`\`\`

**API Handler (fast, no blocking)**:
\`\`\`javascript
const Queue = require('bullmq').Queue;
const thumbnailQueue = new Queue('thumbnails', { connection: redis });

app.post('/upload', upload.single('image'), async (req, res) => {
  // 1. Store original to S3 (streaming upload, fast)
  const s3Key = await uploadToS3(req.file.stream);

  // 2. Enqueue thumbnail job (< 1ms)
  const job = await thumbnailQueue.add('generate', {
    s3Key,
    sizes: [100, 400, 800],
    userId: req.user.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });

  // 3. Return immediately — thumbnail will be ready async
  res.json({
    id: req.file.id,
    status: 'processing',
    jobId: job.id,
  });
});
\`\`\`

**Worker Process (separate Node.js process)**:
\`\`\`javascript
// thumbnail-worker.js — separate process, not part of API
const { Worker } = require('bullmq');
const sharp = require('sharp');

const worker = new Worker('thumbnails', async (job) => {
  const { s3Key, sizes } = job.data;

  // Download original
  const buffer = await downloadFromS3(s3Key);

  // Generate thumbnails — CPU intensive, isolated in this worker
  const thumbnails = await Promise.all(sizes.map(size =>
    sharp(buffer)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer()
  ));

  // Upload thumbnails to S3
  await Promise.all(thumbnails.map((thumb, i) =>
    uploadToS3(\`\${s3Key}-\${sizes[i]}.webp\`, thumb)
  ));

  // Update DB record
  await db.query(
    'UPDATE uploads SET thumbnail_status = $1 WHERE s3_key = $2',
    ['completed', s3Key]
  );
}, {
  connection: redis,
  concurrency: 5,  // 5 simultaneous jobs per worker process
});
\`\`\`

**Scaling Strategy**:
- API servers: scale based on request traffic
- Worker servers: scale based on queue depth metric
  - Queue depth > 1000 jobs → scale out workers
  - Queue depth < 100 jobs → scale in workers

**Observability**:
\`\`\`javascript
// Job events for metrics
worker.on('completed', (job) => {
  metrics.histogram('thumbnail.processing_time', job.processedOn - job.timestamp);
});

worker.on('failed', (job, err) => {
  metrics.increment('thumbnail.failed', { error: err.message });
  logger.error({ jobId: job.id, error: err }, 'Thumbnail failed');
});

// Queue depth metric for autoscaling
setInterval(async () => {
  const depth = await thumbnailQueue.getWaiting();
  metrics.gauge('thumbnail.queue_depth', depth);
}, 10_000);
\`\`\``,
      trade_offs: [
        {
          approach: "BullMQ (Redis-backed) job queue",
          pros: [
            "Fast (Redis-backed), reliable with persistence",
            "Rich features: retries, delays, priorities, rate limiting",
            "Great dashboard (Bull Board)",
          ],
          cons: [
            "Redis is a dependency (another service to manage)",
            "Redis persistence must be configured (AOF/RDB) for durability",
            "Not suitable for > 1 million jobs/hour without clustering",
          ],
        },
        {
          approach: "AWS SQS + Lambda/ECS workers",
          pros: [
            "Fully managed — no queue infrastructure",
            "Near-unlimited throughput",
            "Auto-scales workers via Lambda",
          ],
          cons: [
            "Vendor lock-in",
            "Lambda cold start adds latency",
            "Higher cost at small scale",
          ],
        },
        {
          approach: "Worker threads in same process",
          pros: ["No external dependencies", "Low latency (no serialization)"],
          cons: [
            "CPU-bound work can still impact event loop if not managed carefully",
            "Crash in worker can affect main process memory",
            "Limited to single server — no horizontal scaling",
          ],
        },
      ],
      real_world_example:
        "Pinterest processes 10 billion image transforms per day. Their image processing pipeline is fully decoupled from user-facing API servers. Images land in S3, trigger an SQS message, which is consumed by a fleet of EC2 workers running ImageMagick. Worker fleet autoscales based on SQS ApproximateNumberOfMessagesVisible metric. During photo import events (e.g., a user importing 10,000 Pinterest pins), the queue absorbs the burst without any impact on API latency. Their API servers have never touched an image processing operation since 2013.",
      red_flags: [
        "Suggests running sharp.js directly in the API request handler with async/await",
        "Does not know what a job queue is or cannot name any (BullMQ, Kafka, SQS, RabbitMQ)",
        "Claims worker_threads inside the API process is equivalent to a separate worker fleet",
        "No mention of retry logic or what happens when thumbnail generation fails",
        "Cannot describe how to scale workers based on queue depth",
      ],
      follow_up_questions: [
        "What happens to the queue if Redis restarts without persistence configured? How do you prevent job loss?",
        "If thumbnail generation consistently fails for a specific image format, how do you prevent that job from retrying infinitely and blocking the queue?",
        "How do you design a status polling endpoint so the frontend can show 'thumbnail processing...' and then update to show the thumbnail when ready?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 5. [Debug] — Memory Leak via Closures in Express Middleware
  {
    title:
      "A production Express.js app leaks 500MB per hour. Heap snapshots show growing 'Closure' objects attached to Request objects. What's happening?",
    content:
      "Your Express.js app starts at 300MB RSS. It grows 500MB per hour and restarts every 6-8 hours. Heap snapshot comparison shows the growing objects are 'Closure' types, all referencing Request (req) objects. The requests themselves should be short-lived (< 100ms each). How do you diagnose which middleware is causing this, and what are the most common patterns that cause closures to hold references to req objects indefinitely?",
    answer: buildAnswer({
      short_answer:
        "Closures referencing req objects stay alive as long as any other object holds a reference to the closure. Common causes: event emitters registering listeners inside request handlers (without cleanup), setInterval/setTimeout inside request handlers not cleared on response, middleware storing req in module-level Maps/Sets without cleanup, and APM instrumentation that traces spans but never ends them.",
      detailed_answer: `**Heap Snapshot Analysis**:

In Chrome DevTools, load the snapshot, switch to "Containment" view and search for "Closure":
\`\`\`
Closure @ 0x12345 (1.2 MB)
  context: [closure context]
    req: [IncomingMessage] (250 KB)
      socket: [Socket]
        parser: [HTTPParser]
\`\`\`

Traverse up the retainer chain to find what's holding the closure.

**Common Root Causes**:

1. **Timeout not cleared**:
\`\`\`javascript
// BUG: setTimeout captures req, never cleared if request ends before timeout
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    logger.warn({ req }, 'Request timeout');  // req captured in closure
    res.status(408).send('Timeout');
  }, 30000);
  // LEAK: if request completes normally, timeout still pending for 30s
  // If many requests per second, thousands of pending timeouts

  // FIX: Clear timeout when response sends
  res.on('finish', () => clearTimeout(timeout));
  next();
});
\`\`\`

2. **Event listener on process/global emitter**:
\`\`\`javascript
// BUG: adds listener per request, never removed
app.use((req, res, next) => {
  process.on('uncaughtException', (err) => {
    logger.error({ req, err }, 'Uncaught exception on request');
  });
  // New listener added every request — req captured in closure
  // After 10K requests: process has 10K listeners, all referencing req objects
  next();
});
\`\`\`

3. **Module-level cache not bounded**:
\`\`\`javascript
// BUG: activeRequests grows forever (requests never removed)
const activeRequests = new Map();
app.use((req, res, next) => {
  activeRequests.set(req.id, req);  // req kept alive by Map
  // If res.on('finish') handler to delete is missing:
  res.on('finish', () => activeRequests.delete(req.id));  // FIX
  next();
});
\`\`\`

4. **APM / tracing span not closed**:
\`\`\`javascript
// BUG: span.finish() never called on error paths
app.use((req, res, next) => {
  req.span = tracer.startSpan('http.request');
  res.on('finish', () => {
    if (req.span) req.span.finish();  // FIX: must always call finish()
  });
  next();
});
\`\`\`

**Diagnosis Tools**:
\`\`\`javascript
// Detect listener leaks
process.setMaxListeners(100);
require('events').EventEmitter.defaultMaxListeners = 100;
// Watch for: MaxListenersExceededWarning — early warning of listener leaks
\`\`\`

\`\`\`bash
# Add --inspect and use Chrome DevTools allocation timeline
node --inspect app.js
# In Chrome: Memory tab → Allocation Timeline → Record
# Look for sustained allocation that never gets freed
\`\`\``,
      trade_offs: [
        {
          approach: "Always use res.on('finish') for cleanup",
          pros: [
            "Clean resource management",
            "req lifetime tied to response lifecycle",
            "No memory leak",
          ],
          cons: [
            "Requires discipline — easy to forget in all code paths",
            "Error paths must also trigger cleanup (use res.on('close') for aborted requests)",
          ],
        },
        {
          approach: "Avoid storing req/res in closures outside request scope",
          pros: [
            "Prevents the class of leak entirely",
            "Simpler code",
          ],
          cons: ["Sometimes unavoidable (logging, tracing require context propagation)"],
        },
        {
          approach: "Use AsyncLocalStorage for request context instead of closure capture",
          pros: [
            "Context is tied to async execution context, automatically cleaned up",
            "No explicit cleanup needed",
            "Node.js built-in",
          ],
          cons: [
            "Learning curve",
            "Small performance overhead vs direct closure",
            "Must understand async context propagation",
          ],
        },
      ],
      real_world_example:
        "Shopify's Node.js API gateway had a progressive memory leak that only appeared under production load. Their APM middleware (custom OpenTelemetry wrapper) created a span per request and stored it in a Map keyed by request ID for distributed trace correlation. The bug: when clients aborted requests (common in mobile apps with flaky connections), the request_id was never removed from the Map because the 'finish' event fires on clean close, but not on 'aborted'. Fix: listen to both 'finish' and 'close' events, and add a TTL-based cleanup for the span Map to catch any strays.",
      red_flags: [
        "Cannot read a heap snapshot retainer chain to identify who holds the reference",
        "Does not know the difference between res.on('finish') and res.on('close')",
        "Suggests increasing V8 heap size as the solution",
        "Unaware of MaxListenersExceededWarning as an early warning for listener leaks",
        "Cannot explain why closures prevent garbage collection (reference cycle confusion)",
      ],
      follow_up_questions: [
        "How does AsyncLocalStorage solve the request context propagation problem, and how does it differ from storing context on the req object?",
        "If you're using Express with TypeScript, how do you add req.span to the Request type safely without augmenting Express's type definitions globally?",
        "How do you test for memory leaks in a unit test (without running the server for hours)?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 6. [Performance] — HTTP Keep-Alive and Connection Management
  {
    title:
      "Your Node.js service makes 10M HTTP calls/day to an external API and gets rejected 30% of the time with connection refused errors. How do you fix connection management?",
    content:
      "A Node.js microservice calls an external payments API. It makes ~115 calls/second. 30% of calls fail with ECONNREFUSED or ECONNRESET. The external API has a rate limit of 200 connections max. Looking at the external API logs, they show 1,000+ new TCP connections being created per second. Your code uses axios with default configuration. What is wrong and how do you fix it?",
    answer: buildAnswer({
      short_answer:
        "Axios (and Node.js http module) by default creates a new TCP connection for every request. Each TCP connection involves a 3-way handshake (~50-100ms) and is immediately closed after the response. With 115 calls/second, you're creating 115 new TCP connections/second, hitting the external API's connection limit. Fix: use a custom HTTP agent with keep-alive and connection pooling.",
      detailed_answer: `**The Problem**:

Default Node.js \`http.globalAgent\` uses \`keepAlive: false\`:
\`\`\`javascript
// What axios does by default (simplified):
const http = require('http');
// Creates new TCP connection for EVERY request
// After response: closes TCP connection
// Next request: opens new TCP connection again
\`\`\`

At 115 req/s:
- 115 new TCP connections/second
- Each connection takes 50-100ms to establish (3-way handshake)
- External API sees 115 × 3600 = 414,000 connection attempts per hour
- Their connection table hits 200 max → ECONNREFUSED

**Fix: HTTP Keep-Alive with Connection Pool**
\`\`\`javascript
const http = require('http');
const https = require('https');
const axios = require('axios');

// Create persistent HTTP agent with connection pool
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,          // max concurrent connections to this host
  maxFreeSockets: 10,      // connections to keep in idle pool
  timeout: 60000,          // socket timeout
  freeSocketTimeout: 30000 // how long to keep idle connections alive
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
});

// Create axios instance with custom agents
const apiClient = axios.create({
  baseURL: 'https://payments-api.example.com',
  httpAgent,
  httpsAgent,
  timeout: 5000,  // request timeout
});
\`\`\`

**What This Changes**:
- TCP connections are reused across requests
- Instead of 115 new connections/second → steady pool of 20-50 connections
- 3-way handshake overhead eliminated for most requests
- External API sees << 200 simultaneous connections

**Verify with Metrics**:
\`\`\`javascript
// Monitor socket creation rate
const originalCreateConnection = httpAgent.createConnection.bind(httpAgent);
httpAgent.createConnection = (...args) => {
  metrics.increment('http.new_connection');
  return originalCreateConnection(...args);
};
\`\`\`

**Additional Hardening**:
\`\`\`javascript
// Handle socket reuse errors (external server closed keep-alive socket)
apiClient.interceptors.response.use(null, async (error) => {
  if (error.code === 'ECONNRESET' && !error.config._retried) {
    error.config._retried = true;
    return apiClient(error.config);  // retry once on reset
  }
  return Promise.reject(error);
});
\`\`\``,
      trade_offs: [
        {
          approach: "HTTP Keep-Alive with connection pool",
          pros: [
            "Eliminates TCP handshake overhead (50-100ms per request)",
            "Dramatically reduces new connection rate",
            "Reuses TLS session for HTTPS (additional savings)",
          ],
          cons: [
            "Idle connections consume file descriptors",
            "Server-side keep-alive timeout may close socket without notifying client → ECONNRESET",
            "Must handle ECONNRESET retry for keep-alive socket reuse edge case",
          ],
        },
        {
          approach: "Request queuing with rate limiting",
          pros: ["Prevents bursts beyond external API limits", "Predictable throughput"],
          cons: [
            "Adds latency (queue wait time)",
            "Doesn't solve the root cause (connection creation)",
          ],
        },
        {
          approach: "SDK/gRPC instead of HTTP if external API supports it",
          pros: [
            "gRPC multiplexes many requests over single HTTP/2 connection",
            "Built-in connection management",
            "Lower overhead than REST/HTTP 1.1",
          ],
          cons: ["Requires external API support", "SDK integration effort"],
        },
      ],
      real_world_example:
        "When Vercel's deployment pipeline was calling GitHub's API at high rates, they discovered their serverless functions were creating new HTTP connections for each invocation (no keep-alive possible in stateless Lambda functions). Their solution: a connection proxy service that maintains a persistent keep-alive pool and all Lambda functions route through it. This reduced GitHub API calls from creating 50K new connections/hour to maintaining a steady pool of 20. Similar patterns are used by Cloudflare Workers for external API calls.",
      red_flags: [
        "Does not know that Node.js http module does not use keep-alive by default",
        "Cannot explain what the 3-way TCP handshake is and why it adds latency",
        "Suggests adding retries without fixing the root cause (still creates new connections on each retry)",
        "Unaware of maxSockets and maxFreeSockets options on http.Agent",
        "Does not understand the difference between a connection reset (ECONNRESET) and connection refused (ECONNREFUSED)",
      ],
      follow_up_questions: [
        "How do you handle the case where the external API's server closes a keep-alive connection while you're about to use it (socket timeout)?",
        "What is the trade-off between maxSockets=50 and maxSockets=200, and how do you determine the right value?",
        "How does HTTP/2 multiplexing eliminate the need for connection pooling, and when would you use HTTP/2 for service-to-service communication?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 7. [Architecture] — Graceful Shutdown
  {
    title:
      "Design a graceful shutdown mechanism for a Node.js service handling 10,000 concurrent requests when Kubernetes sends SIGTERM",
    content:
      "Your Node.js API service runs in Kubernetes. When Kubernetes terminates a pod (rolling deploy, scale down), it sends SIGTERM 30 seconds before SIGKILL. During these 30 seconds, the service must: stop accepting new connections, finish processing in-flight requests, close database connections cleanly, flush message queue acknowledgments, and report shutdown to load balancer. How do you implement this?",
    answer: buildAnswer({
      short_answer:
        "Listen for SIGTERM → stop accepting new connections (server.close()) → wait for in-flight requests to drain (track with counter) → close DB connections → exit. Use a deadline timeout (25s) to force exit before SIGKILL at 30s. Implement health check endpoint that returns 503 immediately on SIGTERM so load balancer removes the pod from rotation before requests finish draining.",
      detailed_answer: `**Complete Graceful Shutdown Implementation**:

\`\`\`javascript
const server = app.listen(PORT);
let isShuttingDown = false;
let activeRequests = 0;
const SHUTDOWN_DEADLINE_MS = 25_000;  // 25s (before Kubernetes SIGKILL at 30s)

// Track in-flight requests
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({ error: 'Service shutting down' });
  }
  activeRequests++;
  res.on('finish', () => activeRequests--);
  res.on('close', () => activeRequests--);  // Client disconnected
  next();
});

// Health check: returns 503 during shutdown
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting_down' });
  }
  res.json({ status: 'healthy' });
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(\`\${signal} received, starting graceful shutdown\`);
  isShuttingDown = true;

  // 1. Stop accepting new connections
  server.close((err) => {
    if (err) console.error('Error closing HTTP server:', err);
    else console.log('HTTP server closed');
  });

  // 2. Wait for active requests to drain (or deadline)
  const deadline = new Promise(resolve =>
    setTimeout(() => {
      console.log(\`Shutdown deadline reached with \${activeRequests} active requests\`);
      resolve('deadline');
    }, SHUTDOWN_DEADLINE_MS)
  );

  const drained = new Promise(resolve => {
    const interval = setInterval(() => {
      if (activeRequests === 0) {
        clearInterval(interval);
        resolve('drained');
      }
    }, 100);
  });

  const result = await Promise.race([deadline, drained]);
  console.log(\`Shutdown: \${result}\`);

  // 3. Close database pool
  try {
    await dbPool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing DB pool:', err);
  }

  // 4. Flush Redis / message queue
  try {
    await redisClient.quit();
    await queueWorker.close();
  } catch (err) {
    console.error('Error closing queue:', err);
  }

  // 5. Exit
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions — log and exit (don't try to recover)
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException').finally(() => process.exit(1));
});
\`\`\`

**Kubernetes Configuration**:
\`\`\`yaml
spec:
  containers:
    - name: api
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"]  # Grace period before SIGTERM
  terminationGracePeriodSeconds: 30
\`\`\`

The preStop hook adds 5s before SIGTERM — gives load balancer time to deregister the pod.`,
      trade_offs: [
        {
          approach: "Immediate health check 503 + drain",
          pros: [
            "Load balancer removes pod immediately",
            "No new traffic during drain window",
            "Clean shutdown",
          ],
          cons: [
            "~5-10 second window between SIGTERM and load balancer removing pod from rotation",
            "Must handle edge case where a request arrives during this window",
          ],
        },
        {
          approach: "Force exit after deadline (recommended)",
          pros: [
            "Prevents pods from hanging indefinitely",
            "Kubernetes SIGKILL at 30s is more disruptive than controlled exit at 25s",
          ],
          cons: [
            "Some requests will be aborted mid-flight",
            "Need retry logic on client side for these edge cases",
          ],
        },
      ],
      real_world_example:
        "Google's internal services all implement a shutdown grace protocol: on SIGTERM, the service stops advertising itself to the load balancer (via health check returning 503), waits for existing RPCs to complete (up to a configured deadline), then closes connections. Their Stubby RPC framework handles this automatically. The pattern was formalized in Google's SRE book as 'graceful shutdown' and is now standard practice in cloud-native applications. Kubernetes adopted this pattern in its terminationGracePeriodSeconds and preStop lifecycle hooks.",
      red_flags: [
        "Does not know what SIGTERM is or that it's different from SIGKILL",
        "Suggests process.exit(0) in the SIGTERM handler immediately (kills all in-flight requests)",
        "Unaware that server.close() stops accepting new connections but doesn't kill existing ones",
        "Does not consider the load balancer deregistration timing (pod removed from rotation before drain)",
        "No deadline — shutdown could hang indefinitely if a request never completes",
      ],
      follow_up_questions: [
        "What happens to WebSocket connections during graceful shutdown — should you close them gracefully or let Kubernetes kill them?",
        "If a database migration is running when SIGTERM arrives, how do you handle this in your shutdown logic?",
        "How do you test graceful shutdown in a local development environment without Kubernetes?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 8. [System Design] — Rate Limiting Per User in Node.js
  {
    title:
      "Implement a distributed per-user rate limiter in Node.js that handles 50,000 req/s across 20 API servers with < 2ms overhead",
    content:
      "You need to rate limit users to 100 requests per minute. You have 20 Node.js API servers behind a load balancer. Requests from the same user can hit any server. A naive approach of checking Redis on every request adds 1-3ms per request at scale. How do you design a solution that is accurate within 5% and adds < 2ms overhead at p99?",
    answer: buildAnswer({
      short_answer:
        "Use a two-tier approach: in-memory local counter per user (< 0.1ms) synced to Redis periodically (every 200ms) for global coordination. Each server keeps a local token bucket and periodically claims a chunk of the global limit from Redis. This gives < 1ms fast path while maintaining global accuracy within one sync interval. Tradeoff: a user can slightly exceed the limit during the sync window.",
      detailed_answer: `**Two-Tier Rate Limiter**:

\`\`\`javascript
class DistributedRateLimiter {
  constructor(options) {
    this.redis = options.redis;
    this.windowMs = 60_000;           // 1 minute window
    this.globalLimit = 100;           // 100 req/min per user
    this.chunkSize = 10;              // claim 10 tokens at a time from Redis
    this.syncInterval = 200;          // sync every 200ms
    this.localBuckets = new Map();    // userId → { tokens, lastClaim }
    this.syncQueue = new Set();       // users needing sync

    setInterval(() => this.syncToRedis(), this.syncInterval);
  }

  async isAllowed(userId) {
    let bucket = this.localBuckets.get(userId);

    if (!bucket || bucket.tokens <= 0) {
      // Need more tokens from Redis
      const claimed = await this.claimTokens(userId, this.chunkSize);
      if (claimed === 0) return false;  // Rate limited globally

      bucket = { tokens: claimed - 1, lastClaim: Date.now() };
      this.localBuckets.set(userId, bucket);
    } else {
      bucket.tokens--;
    }

    return true;
  }

  async claimTokens(userId, count) {
    const key = \`ratelimit:\${userId}:\${Math.floor(Date.now() / this.windowMs)}\`;
    const lua = \`
      local current = redis.call('GET', KEYS[1])
      current = tonumber(current) or 0
      if current + ARGV[1] > ARGV[2] then
        return 0  -- not enough tokens
      end
      redis.call('INCRBY', KEYS[1], ARGV[1])
      redis.call('EXPIRE', KEYS[1], ARGV[3])
      return ARGV[1]  -- claimed successfully
    \`;

    const claimed = await this.redis.eval(
      lua,
      1,
      key,
      count.toString(),
      this.globalLimit.toString(),
      Math.ceil(this.windowMs / 1000).toString()
    );
    return parseInt(claimed);
  }
}
\`\`\`

**Performance Analysis**:
- Fast path (local bucket has tokens): ~0.05ms (HashMap lookup)
- Slow path (need to claim from Redis): ~1-2ms (Redis eval)
- With chunkSize=10: 90% of requests hit fast path
- P99 overhead: < 0.5ms (only 10% need Redis)

**Accuracy Trade-off**:
With 20 servers × chunkSize=10 = 200 claimed tokens max per sync interval.
A user can exceed 100 req/min by up to 200 requests in a 200ms window before all servers re-sync.
Acceptable for most rate limiting use cases (prevents abuse, not exact billing).

**Memory Management**:
\`\`\`javascript
// Clean up local buckets for inactive users
setInterval(() => {
  const stale = Date.now() - 60_000;
  for (const [userId, bucket] of this.localBuckets) {
    if (bucket.lastClaim < stale) {
      this.localBuckets.delete(userId);
    }
  }
}, 60_000);
\`\`\``,
      trade_offs: [
        {
          approach: "Two-tier local + Redis rate limiter",
          pros: [
            "< 1ms fast path for most requests",
            "Global coordination via Redis",
            "Works across all servers",
          ],
          cons: [
            "Slight inaccuracy (up to chunkSize × servers overage)",
            "Redis failure falls back to local-only (temporarily less accurate)",
            "More complex implementation",
          ],
        },
        {
          approach: "Redis INCR on every request (simple, accurate)",
          pros: ["100% accurate", "Simple implementation", "Easy to reason about"],
          cons: [
            "1-3ms added per request",
            "50K req/s = 50K Redis ops/s → Redis becomes bottleneck",
            "Redis failure = no rate limiting",
          ],
        },
        {
          approach: "Token bucket per server, no global coordination",
          pros: ["Zero added latency", "No external dependency"],
          cons: [
            "20 servers = 20× effective limit (2000 req/min instead of 100)",
            "Not suitable for strict rate limiting",
          ],
        },
      ],
      real_world_example:
        "Cloudflare's rate limiting (used for 35M+ requests/second across their network) uses a similar two-tier approach. Each edge node maintains local counters, periodically synchronized to a distributed consistent store. They accept a configurable 'accuracy window' — typically 1-5 seconds — during which a user might slightly exceed the limit. This is documented as 'approximate rate limiting' and is sufficient for abuse prevention. For billing-grade accuracy (e.g., API usage billing), they use a separate accounting system with eventual consistency.",
      red_flags: [
        "Proposes Redis INCR on every request without acknowledging the latency impact",
        "Cannot explain the trade-off between local-only and distributed rate limiting",
        "Unaware of Redis EVAL for atomic multi-step operations (would use WATCH/MULTI/EXEC instead)",
        "Does not consider Redis failure mode",
        "Cannot calculate the accuracy impact of chunked token claiming",
      ],
      follow_up_questions: [
        "How would you implement this same rate limiter using sliding window instead of fixed window, and what's the accuracy difference?",
        "If Redis latency spikes to 50ms due to a slow AOF flush, how does your system behave?",
        "How do you handle a user who uses 99 of their 100 tokens in the last second of the rate limit window, then immediately uses 99 more in the first second of the next window (sliding window vs fixed window boundary exploit)?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 9. [Architecture] — Idempotency in API Design
  {
    title:
      "Design idempotency for a payment processing API that must handle network retries without double-charging",
    content:
      "Your payment API endpoint charges a credit card. The client sends a POST /charge request, your server processes it (charges the card), but before sending the response, the network times out. The client retries. How do you ensure the card is charged exactly once? Design an idempotency system that works correctly even if your server crashes between charging the card and saving the result.",
    answer: buildAnswer({
      short_answer:
        "Use idempotency keys: client generates a unique key per payment intent, sends it as a header (Idempotency-Key). Server stores (key → result) in DB before returning. On retry, check key → return cached result without re-processing. The critical piece: the key must be stored in the same transaction as the charge result. If the server crashes after charging but before storing the key, the retry must detect and handle this state.",
      detailed_answer: `**Complete Idempotency Implementation**:

\`\`\`javascript
app.post('/charge', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' });
  }

  // Step 1: Check for existing result
  const existing = await db.query(
    'SELECT result, status FROM idempotency_keys WHERE key = $1',
    [idempotencyKey]
  );

  if (existing.rows[0]?.status === 'completed') {
    // Return cached result — no re-processing
    return res.json(existing.rows[0].result);
  }

  if (existing.rows[0]?.status === 'processing') {
    // Another request is processing this key (concurrent retry)
    return res.status(409).json({ error: 'Request in progress' });
  }

  // Step 2: Claim the key atomically (prevent concurrent processing)
  const claimed = await db.query(\`
    INSERT INTO idempotency_keys (key, status, created_at)
    VALUES ($1, 'processing', NOW())
    ON CONFLICT (key) DO NOTHING
    RETURNING id
  \`, [idempotencyKey]);

  if (claimed.rowCount === 0) {
    // Race condition: another process already claimed this key
    return res.status(409).json({ error: 'Request in progress' });
  }

  try {
    // Step 3: Process payment
    const chargeResult = await paymentProvider.charge({
      amount: req.body.amount,
      token: req.body.paymentToken,
      idempotencyKey,  // Also pass to payment provider for their dedup
    });

    // Step 4: Store result (atomic with marking completed)
    await db.query(\`
      UPDATE idempotency_keys
      SET status = 'completed', result = $1
      WHERE key = $2
    \`, [JSON.stringify(chargeResult), idempotencyKey]);

    res.json(chargeResult);

  } catch (err) {
    // Step 5: Mark as failed (retryable)
    await db.query(\`
      UPDATE idempotency_keys
      SET status = 'failed', error = $1
      WHERE key = $2
    \`, [err.message, idempotencyKey]);

    res.status(500).json({ error: 'Payment failed' });
  }
});
\`\`\`

**The Crash Recovery Problem**:
If server crashes after charging but before saving 'completed':
1. Retry arrives → key status is 'processing' (from the dead process)
2. Need a dead key detection: check if the 'processing' key is older than timeout
\`\`\`sql
-- Key stuck in 'processing' for > 60s → treat as failed/resumable
WHERE key = $1 AND (
  status = 'completed'
  OR (status = 'processing' AND created_at > NOW() - INTERVAL '60 seconds')
)
\`\`\`

**Passing Idempotency to Payment Provider**:
Stripe, Adyen, etc. all support their own idempotency keys. Pass your key to them:
\`\`\`javascript
stripe.charges.create({...}, { idempotencyKey });
// Stripe stores result — even if you crash, their dedup handles it
\`\`\``,
      trade_offs: [
        {
          approach: "DB-backed idempotency keys with advisory lock",
          pros: [
            "Works correctly even under concurrent retries",
            "Persistent across server restarts",
            "Full audit trail",
          ],
          cons: [
            "DB write on every payment (even new ones)",
            "Requires TTL cleanup for old keys",
            "DB must be highly available",
          ],
        },
        {
          approach: "Redis-backed idempotency (SETNX)",
          pros: [
            "Fast (< 1ms)",
            "Built-in TTL",
          ],
          cons: [
            "Redis is not as durable as PostgreSQL by default",
            "Must configure Redis persistence for safety",
            "Lost keys on Redis failure → potential duplicate charge",
          ],
        },
        {
          approach: "Rely on payment provider's idempotency only",
          pros: ["Zero additional code", "Provider handles all edge cases"],
          cons: [
            "Only works if provider supports idempotency keys",
            "Does not handle your own application logic dedup",
            "Cannot serve cached response without round-tripping to provider",
          ],
        },
      ],
      real_world_example:
        "Stripe's idempotency implementation (publicly documented) uses a similar approach: every POST request can include an Idempotency-Key header. Stripe stores the request fingerprint + response in their database with a 24-hour TTL. Replayed requests return the exact same response (including HTTP status code) as the original — even if the original returned a failure. This is critical: if a charge fails and the client retries with the same key, Stripe returns the same failure, preventing the client from unknowingly creating a second charge attempt with a new key.",
      red_flags: [
        "Suggests checking for duplicate charges by querying existing transactions (doesn't prevent in-flight duplicates)",
        "Cannot explain the critical path where server crashes between processing and storing the result",
        "Unaware that idempotency keys need to be stored before processing, not after",
        "Does not mention concurrent retry handling (two simultaneous retries of the same key)",
        "Cannot explain why idempotency is the client's responsibility (they generate the key)",
      ],
      follow_up_questions: [
        "How long should idempotency keys be stored, and what are the trade-offs between 24 hours vs 7 days vs permanent?",
        "If the same idempotency key is used with different request bodies (amount changed), how should your server respond?",
        "How do you implement idempotency for a multi-step workflow (charge → create order → send email) where each step can fail independently?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },

  // 10. [Debug] — APM Trace Shows 800ms Unaccounted Time
  {
    title:
      "Your APM trace shows 800ms total request time but all instrumented spans only account for 200ms. Where is the missing 600ms?",
    content:
      "Your Express.js API has OpenTelemetry traces. A request takes 800ms total. Your traces show: DB query 80ms, Redis get 20ms, external API call 100ms = 200ms total. The other 600ms shows as blank in your trace. This happens for 20% of requests at p95. How do you find where the 600ms is going?",
    answer: buildAnswer({
      short_answer:
        "Unaccounted time in traces is usually event loop wait time (time spent in the queue waiting for a free event loop tick), serialization overhead for large objects, or middleware that is not instrumented. Also check: CPU throttling in Kubernetes (CPU limits), garbage collection pauses (check GC logs), or time waiting for a connection from the pool (not instrumented as a span).",
      detailed_answer: `**Systematic Investigation**:

**Hypothesis 1: Event Loop Lag (most common)**
\`\`\`javascript
// Add event loop lag measurement to trace
const { performance } = require('perf_hooks');

app.use((req, res, next) => {
  const start = performance.now();

  // Create a tiny promise that resolves at next tick
  setImmediate(() => {
    const lag = performance.now() - start;
    if (lag > 50) {
      req.span?.setTag('event_loop_lag_ms', lag.toFixed(2));
    }
    next();
  });
});
\`\`\`
If lag is 600ms: another request is blocking the event loop.

**Hypothesis 2: Connection Pool Wait Time (untraced)**
\`\`\`javascript
// Instrument connection acquisition separately
async function queryWithTrace(sql, params) {
  const poolSpan = tracer.startSpan('db.pool.acquire');
  const client = await pool.connect();  // This wait is NOT in your DB query span!
  poolSpan.finish();

  const querySpan = tracer.startSpan('db.query');
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
    querySpan.finish();
  }
}
\`\`\`
Connection pool acquisition can take 0-600ms if pool is exhausted.

**Hypothesis 3: JSON Serialization of Large Objects**
\`\`\`javascript
// Time the serialization
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const start = Date.now();
    const result = originalJson(data);
    const elapsed = Date.now() - start;
    if (elapsed > 50) {
      console.warn(\`JSON serialization took \${elapsed}ms\`);
    }
    return result;
  };
  next();
});
\`\`\`

**Hypothesis 4: Kubernetes CPU Throttling**
\`\`\`bash
# Check if pod is being throttled
kubectl top pod your-pod
# Or check cgroups directly
cat /sys/fs/cgroup/cpu/cpuacct.usage_percpu
# Look for: throttled_time in /sys/fs/cgroup/cpu/cpu.stat
\`\`\`
CPU limit set too low → process gets suspended when it hits the limit.
Fix: increase CPU limit or remove it and use requests only.

**Hypothesis 5: GC Pauses**
\`\`\`bash
# Enable GC logging
node --expose-gc --trace-gc app.js
# Look for major GC pauses > 50ms
\`\`\`

**How to Instrument the Gaps**:
\`\`\`javascript
// Add timing breadcrumbs throughout the request lifecycle
app.use((req, res, next) => {
  req.timings = {};
  req.mark = (name) => { req.timings[name] = Date.now(); };
  req.mark('start');
  res.on('finish', () => {
    req.mark('finish');
    const total = req.timings.finish - req.timings.start;
    logger.info({ timings: req.timings, total }, 'Request timings');
  });
  next();
});
\`\`\``,
      trade_offs: [
        {
          approach: "Distributed tracing with OpenTelemetry",
          pros: [
            "End-to-end visibility",
            "Works across services",
            "Standard instrumentation",
          ],
          cons: [
            "Non-instrumented code appears as gaps",
            "Tracing overhead can be significant at high sample rate",
            "Requires all spans to be properly started and ended",
          ],
        },
        {
          approach: "Application-level timing breadcrumbs",
          pros: [
            "Catches non-instrumented code",
            "Low overhead (simple Date.now() calls)",
            "Easy to add to existing middleware",
          ],
          cons: [
            "Manual — must add to each area of concern",
            "Doesn't correlate with distributed traces automatically",
          ],
        },
        {
          approach: "V8 profiler with flamegraph",
          pros: ["Shows exactly where CPU time is spent", "Catches synchronous blocking"],
          cons: [
            "10-30% overhead while profiling",
            "Cannot run continuously in production",
            "Only shows CPU time, not wait time",
          ],
        },
      ],
      real_world_example:
        "The engineering team at Datadog investigated their own Node.js agent's unaccounted time issue. They found that 300-500ms was being spent waiting for connection pool slots at peak traffic. The trace spans started timing only after the connection was acquired, missing the pool wait entirely. Fix: add a 'pool.acquire' span before the query span. After adding the instrumentation, the missing time became visible and they discovered their pool size (maxConnections=10) was too small for their request rate. Increasing to 50 connections eliminated the gap.",
      red_flags: [
        "Cannot think beyond the instrumented spans to identify untraced code paths",
        "Unaware that connection pool wait time is not automatically included in DB query spans",
        "Does not consider Kubernetes CPU throttling as a cause (common in containerized environments)",
        "Cannot suggest how to add custom timing instrumentation to find untraced gaps",
        "Jumps to 'must be a slow query' without considering the 600ms is not in any DB span",
      ],
      follow_up_questions: [
        "How do you determine the right CPU limit for a Node.js pod in Kubernetes without causing throttling?",
        "If GC pauses are causing the gaps, what can you do to reduce them (apart from upgrading to a newer Node.js version)?",
        "How do you implement sampling in your tracing to reduce overhead while still capturing 100% of slow requests (p99+)?",
      ],
    }),
    level: QuestionLevel.SENIOR,
    topicSlug: "nodejs",
  },
];
