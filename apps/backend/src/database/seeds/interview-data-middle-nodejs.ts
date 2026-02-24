/**
 * Middle-Level Node.js Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: event loop internals, streams, error handling, process management,
 * performance, security, testing, and production patterns.
 *
 * Topic: nodejs
 * Level: MIDDLE
 *
 * Usage: npm run seed:middle-nodejs
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

const nodejsMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "Event loop phases: timers, I/O, check — and why the execution order surprises you",
    content:
      "Explain the phases of the Node.js event loop in detail. What is the execution order of setTimeout, setImmediate, process.nextTick, and Promise.resolve? Why does the order sometimes change?",
    answer: `**Event loop phases** (in order):

\`\`\`
   ┌───────────────────────────┐
┌─>│        timers              │ ← setTimeout, setInterval
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │     pending callbacks      │ ← I/O callbacks deferred from previous cycle
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │       idle, prepare        │ ← internal use only
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │          poll              │ ← retrieve new I/O events, execute I/O callbacks
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │         check              │ ← setImmediate callbacks
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │    close callbacks         │ ← socket.on('close', ...)
│  └──────────┬────────────────┘
│             │
└─────────────┘
\`\`\`

**Between every phase**, Node.js checks:
1. **process.nextTick queue** (highest priority)
2. **Microtask queue** (Promise callbacks)

**Execution order puzzle**:
\`\`\`js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));

// Output (always):
// nextTick
// promise
// timeout OR immediate (order varies!)
// immediate OR timeout
\`\`\`

**Why timeout vs immediate order varies**: \`setTimeout(fn, 0)\` is actually \`setTimeout(fn, 1)\` (minimum 1ms). If the event loop starts in < 1ms, the timer hasn't fired yet → \`setImmediate\` runs first. If it takes >= 1ms, the timer is ready → \`setTimeout\` runs first.

**Inside an I/O callback, order is deterministic**:
\`\`\`js
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// Always: immediate, timeout
// Because I/O callback runs in poll phase → check phase is next
\`\`\`

**process.nextTick vs queueMicrotask**:
- \`process.nextTick\`: Runs before microtasks, can starve the event loop
- \`queueMicrotask\` / \`Promise.then\`: Runs after nextTick, before next phase
- Recommendation: prefer \`queueMicrotask\` over \`process.nextTick\` in new code

**Common mistakes**:
- Assuming \`setTimeout(fn, 0)\` means "run immediately" — it means "run as soon as possible in the timers phase"
- Recursive \`process.nextTick\` calls starving the event loop — I/O never gets processed
- Not understanding that promises are microtasks, not macrotasks

**Follow-up**: What happens if you call \`process.nextTick\` recursively? How does the event loop differ in the browser vs Node.js?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Error handling strategies: uncaughtException, unhandledRejection, and graceful shutdown",
    content:
      "How should you handle errors in a production Node.js application? Explain uncaughtException, unhandledRejection, and how to implement graceful shutdown.",
    answer: `**Error types in Node.js**:
1. **Synchronous errors**: Caught with try/catch
2. **Async callback errors**: Error-first callback pattern \`(err, result)\`
3. **Promise rejections**: .catch() or try/catch with async/await
4. **EventEmitter errors**: 'error' event — crashes if no listener
5. **Uncaught exceptions**: Process crashes

**uncaughtException** — last resort for sync errors:
\`\`\`js
process.on('uncaughtException', (error, origin) => {
  logger.fatal({ error, origin }, 'Uncaught exception');
  // Attempt graceful shutdown
  gracefulShutdown(1);
});
\`\`\`

**unhandledRejection** — unhandled promise rejections:
\`\`\`js
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'Unhandled rejection');
  // In Node.js 15+, this crashes the process by default
  // Before that, it was just a warning
});
\`\`\`

**Graceful shutdown pattern**:
\`\`\`js
let isShuttingDown = false;

function gracefulShutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('Starting graceful shutdown...');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connections
      await database.close();
      logger.info('Database connections closed');

      // Close Redis/cache connections
      await redis.quit();
      logger.info('Redis connection closed');

      // Flush logs
      await logger.flush();
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    }

    process.exit(exitCode);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000).unref();
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown(0));  // Kubernetes/Docker stop
process.on('SIGINT', () => gracefulShutdown(0));   // Ctrl+C
\`\`\`

**Error handling best practices**:

1. **Operational errors** (expected): Handle and recover
   - Network timeouts, invalid user input, file not found
   - Retry, return error response, log and continue

2. **Programmer errors** (bugs): Crash and restart
   - TypeError, undefined property access, assertion failures
   - Don't try to recover — state is corrupted

\`\`\`js
// Operational: handle gracefully
async function fetchUser(id) {
  try {
    return await db.users.findById(id);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      logger.warn('Database unavailable, retrying...');
      return retry(() => db.users.findById(id), 3);
    }
    throw err; // Unknown error — let it propagate
  }
}
\`\`\`

**EventEmitter error handling**:
\`\`\`js
const stream = fs.createReadStream('file.txt');
// If no 'error' listener → process crashes!
stream.on('error', (err) => {
  logger.error({ err }, 'Stream error');
});
\`\`\`

**Common mistakes**:
- Catching \`uncaughtException\` and continuing — process state is undefined, must exit
- Not handling \`unhandledRejection\` — silent failures in production
- Missing 'error' event listeners on EventEmitters — causes crashes
- Not implementing graceful shutdown — in-flight requests are dropped on deploy

**Follow-up**: How does \`--unhandled-rejections=strict\` flag change behavior? What is the difference between \`process.exit()\` and \`process.abort()\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Readable and Writable streams: backpressure, pipe, and when to use streams vs buffers",
    content:
      "Explain Node.js streams in depth. What is backpressure and why does it matter? When should you use streams instead of reading entire files into memory?",
    answer: `**Stream types**:
| Type | Example | Description |
|---|---|---|
| Readable | \`fs.createReadStream\` | Source of data |
| Writable | \`fs.createWriteStream\` | Destination for data |
| Duplex | \`net.Socket\` | Both readable and writable |
| Transform | \`zlib.createGzip\` | Modifies data as it passes through |

**When to use streams** (vs loading into memory):
- File > 100MB → stream (avoids loading entire file into RAM)
- Real-time processing (log parsing, video transcoding)
- HTTP request/response bodies for large payloads
- Piping between I/O sources (read file → compress → write)

**Backpressure**: When the writable stream can't keep up with the readable stream. Without handling it, data buffers in memory and eventually crashes the process.

\`\`\`js
// BAD: no backpressure handling
const readable = fs.createReadStream('huge-file.csv');
const writable = fs.createWriteStream('output.csv');
readable.on('data', (chunk) => {
  writable.write(chunk); // If writable is slow, chunks buffer in memory!
});

// GOOD: pipe handles backpressure automatically
readable.pipe(writable);

// GOOD: manual backpressure handling
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause();                     // Stop reading
    writable.once('drain', () => {
      readable.resume();                  // Resume when writable is ready
    });
  }
});
\`\`\`

**pipeline()** — better than pipe (handles errors and cleanup):
\`\`\`js
const { pipeline } = require('stream/promises');
const { createGzip } = require('zlib');

await pipeline(
  fs.createReadStream('input.txt'),
  createGzip(),
  fs.createWriteStream('input.txt.gz')
);
// Automatically handles errors and cleanup for ALL streams
\`\`\`

**HTTP streaming example**:
\`\`\`js
app.get('/download', (req, res) => {
  const fileStream = fs.createReadStream('large-file.zip');
  res.setHeader('Content-Type', 'application/zip');
  pipeline(fileStream, res).catch(err => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  });
});
\`\`\`

**Custom Transform stream**:
\`\`\`js
const { Transform } = require('stream');

const toUpperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

pipeline(
  fs.createReadStream('input.txt'),
  toUpperCase,
  fs.createWriteStream('output.txt')
);
\`\`\`

**Memory comparison**:
\`\`\`
Reading 1GB file:
  fs.readFile()         → 1GB+ RAM usage
  fs.createReadStream() → ~64KB RAM usage (highWaterMark)
\`\`\`

**Common mistakes**:
- Using \`.pipe()\` without error handling — errors in piped streams can be swallowed
- Not using \`pipeline()\` — it properly destroys all streams on error
- Reading entire files into memory when streaming would work
- Forgetting to handle the 'error' event on streams — crashes the process

**Follow-up**: What is \`highWaterMark\` and how does it affect stream performance? How do async iterators work with streams (\`for await...of\`)?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Child processes: exec, spawn, fork — and when to use each for CPU-bound work",
    content:
      "Explain the difference between child_process.exec, spawn, and fork. When should you use each? How do you handle CPU-bound operations in Node.js without blocking the event loop?",
    answer: `**Three ways to create child processes**:

| Method | Behavior | Use case |
|---|---|---|
| \`exec\` | Buffers entire output, runs in shell | Small output, shell commands |
| \`spawn\` | Streams output, no shell by default | Large output, long-running processes |
| \`fork\` | Special spawn for Node.js processes | IPC communication, parallel Node.js work |

**exec** — simple shell commands:
\`\`\`js
const { exec } = require('child_process');

exec('ls -la /tmp', (error, stdout, stderr) => {
  if (error) {
    console.error('Failed:', error.message);
    return;
  }
  console.log(stdout);
});

// Promise version
const { execSync } = require('child_process');
const output = execSync('git rev-parse HEAD').toString().trim();
\`\`\`

**spawn** — streaming output, long-running processes:
\`\`\`js
const { spawn } = require('child_process');

const ffmpeg = spawn('ffmpeg', ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4']);

ffmpeg.stdout.on('data', (data) => console.log('stdout:', data.toString()));
ffmpeg.stderr.on('data', (data) => console.error('stderr:', data.toString()));
ffmpeg.on('close', (code) => console.log('Process exited with code:', code));
ffmpeg.on('error', (err) => console.error('Failed to start:', err));
\`\`\`

**fork** — Node.js child with IPC:
\`\`\`js
// parent.js
const { fork } = require('child_process');
const worker = fork('./worker.js');

worker.send({ type: 'compute', data: largeDataSet });
worker.on('message', (result) => {
  console.log('Result:', result);
});

// worker.js
process.on('message', (msg) => {
  if (msg.type === 'compute') {
    const result = heavyComputation(msg.data);
    process.send(result);
  }
});
\`\`\`

**CPU-bound work strategies**:

1. **Worker Threads** (preferred for Node.js-level parallelism):
\`\`\`js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename, { workerData: { n: 40 } });
  worker.on('message', (result) => console.log('Fibonacci:', result));
} else {
  const result = fibonacci(workerData.n);
  parentPort.postMessage(result);
}
\`\`\`

2. **Child process (fork)**: When you need process isolation (crash safety)
3. **External service**: Offload to a queue (Bull/BullMQ) + worker process

**Worker Threads vs Fork**:
| Feature | Worker Threads | Fork |
|---|---|---|
| Memory | Shared (SharedArrayBuffer) | Separate process |
| Communication | postMessage + shared memory | IPC (serialized) |
| Overhead | Lower (same process) | Higher (new process) |
| Crash isolation | No (crashes parent) | Yes (isolated process) |
| Use for | CPU-bound computation | Isolation, stability |

**Common mistakes**:
- Using \`exec\` for large output — it buffers everything in memory (\`maxBuffer\` limit)
- Not handling the 'error' event on child processes — missing spawn failures
- Using \`execSync\` in production request handlers — blocks the entire server
- Passing untrusted input to \`exec\` — command injection vulnerability

\`\`\`js
// DANGEROUS: command injection
exec(\`ls \${userInput}\`); // userInput could be "; rm -rf /"

// SAFE: use spawn with arguments array
spawn('ls', [userInput]); // arguments are never interpreted by shell
\`\`\`

**Follow-up**: How does the cluster module differ from Worker Threads? When would you use a message queue (Bull) instead of child processes?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "The module system: require resolution algorithm, circular dependencies, and ESM interop",
    content:
      "How does Node.js resolve modules with require()? What happens with circular dependencies? How do you handle CommonJS and ESM interoperability?",
    answer: `**require() resolution algorithm**:
\`\`\`
require('X') from module at /app/src/utils.js:

1. If X is a core module (fs, path, http) → return core module
2. If X starts with './' or '../' or '/'
   a. Try exact file: X, X.js, X.json, X.node
   b. Try directory: X/index.js, X/index.json, X/index.node
   c. Try X/package.json → "main" field
3. If X doesn't start with './'
   a. Search node_modules:
      /app/src/node_modules/X
      /app/node_modules/X
      /node_modules/X
   b. At each level, try file resolution (step 2)
\`\`\`

**Module caching**: Once resolved, the module is cached. Subsequent \`require()\` calls return the same object:
\`\`\`js
const a = require('./module'); // Executes module code
const b = require('./module'); // Returns cached export
a === b; // true
\`\`\`

**Circular dependencies**:
\`\`\`js
// a.js
console.log('a: start');
exports.done = false;
const b = require('./b'); // b starts executing
console.log('a: b.done =', b.done);
exports.done = true;
console.log('a: done');

// b.js
console.log('b: start');
const a = require('./a'); // Gets PARTIAL export of a (done = false)
console.log('b: a.done =', a.done); // false!
exports.done = true;
console.log('b: done');

// Output:
// a: start
// b: start
// b: a.done = false   ← a hasn't finished yet!
// b: done
// a: b.done = true
// a: done
\`\`\`

Node.js returns the **partially completed** export object for circular requires. This prevents infinite loops but can lead to undefined values.

**ESM vs CJS interop**:
\`\`\`js
// ESM can import CJS (usually works)
import pkg from 'cjs-package';        // Gets module.exports
import { named } from 'cjs-package';  // May not work (no static analysis)

// CJS cannot require() ESM synchronously
const esmPkg = require('esm-package'); // Error!

// CJS can use dynamic import() for ESM
const esmPkg = await import('esm-package'); // Works (returns promise)
\`\`\`

**"type" field in package.json**:
\`\`\`json
{ "type": "module" }    // .js files treated as ESM
{ "type": "commonjs" }  // .js files treated as CJS (default)
\`\`\`

**Dual package pattern** (support both CJS and ESM):
\`\`\`json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
\`\`\`

**ESM differences from CJS**:
- No \`__dirname\`, \`__filename\` — use \`import.meta.url\` + \`fileURLToPath\`
- No \`require()\` — use \`import\` or \`createRequire\`
- Top-level \`await\` supported
- Strict mode by default
- Static analysis of imports (tree-shaking possible)

**Common mistakes**:
- Expecting circular dependencies to work like forward references — they return partial exports
- Using \`require()\` for ESM packages — must use \`import()\`
- Not understanding the "exports" field — can break direct file imports
- Mixing .mjs and .cjs extensions without understanding resolution rules

**Follow-up**: What is the \`exports\` field in package.json and how does it change module resolution? How does the \`--experimental-require-module\` flag help?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Cluster module and process management: scaling Node.js across CPU cores",
    content:
      "How does the cluster module work? How do you scale a Node.js application across multiple CPU cores? What are the alternatives to the cluster module in production?",
    answer: `**Cluster module**: Creates multiple Node.js processes (workers) that share the same server port. Each worker is a full copy of the application.

\`\`\`js
const cluster = require('cluster');
const http = require('http');
const os = require('os');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(\`Primary \${process.pid} starting \${numCPUs} workers\`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(\`Worker \${worker.process.pid} died (code: \${code})\`);
    cluster.fork(); // Restart crashed worker
  });
} else {
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(\`Handled by worker \${process.pid}\`);
  }).listen(3000);

  console.log(\`Worker \${process.pid} started\`);
}
\`\`\`

**How it works**:
- Primary process manages workers (does NOT handle requests)
- Workers share the server port via OS-level load balancing (round-robin on Linux)
- Each worker has its own event loop, memory, and V8 instance
- Workers communicate with primary via IPC

**Production alternative — PM2**:
\`\`\`bash
# Start with cluster mode
pm2 start app.js -i max        # One worker per CPU
pm2 start app.js -i 4          # 4 workers

# Zero-downtime reload
pm2 reload app.js              # Restarts workers one by one

# Monitor
pm2 monit
pm2 logs
\`\`\`

\`\`\`js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
\`\`\`

**Docker/Kubernetes alternative**: Run single-process Node.js, scale with multiple containers:
\`\`\`yaml
# docker-compose.yml
services:
  api:
    image: my-node-app
    deploy:
      replicas: 4     # 4 containers, 1 process each
\`\`\`

**Scaling approaches comparison**:
| Approach | Session sharing | Deployment | Crash isolation |
|---|---|---|---|
| Cluster module | In-memory (needs sticky sessions or external store) | Single machine | Worker-level |
| PM2 cluster | Same as cluster module | Single machine | Worker-level + auto-restart |
| Docker/K8s | External store required | Multi-machine | Container-level |

**Shared state problem**: Workers don't share memory. In-memory sessions, caches, or rate limiters won't work across workers.
\`\`\`js
// BAD: in-memory session store with cluster — each worker has its own
const sessions = {};

// GOOD: use Redis for shared state
const RedisStore = require('connect-redis').default;
app.use(session({ store: new RedisStore({ client: redisClient }) }));
\`\`\`

**Common mistakes**:
- Using in-memory state with cluster mode — data is not shared between workers
- Forking more workers than CPU cores — causes context switching overhead
- Not restarting crashed workers — leaves capacity unused
- Using cluster module when Docker/K8s scaling is more appropriate

**Follow-up**: How does zero-downtime deployment work with PM2? When should you use Worker Threads vs cluster module?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "File system operations: async patterns, watching files, and production considerations",
    content:
      "What are the best practices for file system operations in Node.js? Explain async vs sync methods, fs.promises, file watching, and common production pitfalls.",
    answer: `**Three API styles**:

\`\`\`js
const fs = require('fs');
const fsp = require('fs/promises');

// 1. Callback (original)
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 2. Sync (blocks event loop!)
const data = fs.readFileSync('file.txt', 'utf8');

// 3. Promises (recommended)
const data = await fsp.readFile('file.txt', 'utf8');
\`\`\`

**When sync is acceptable**:
- Application startup (loading config, reading certs)
- CLI tools
- Never in request handlers or the hot path

**Common file operations**:
\`\`\`js
const fsp = require('fs/promises');
const path = require('path');

// Read/write
await fsp.readFile('file.txt', 'utf8');
await fsp.writeFile('file.txt', content, 'utf8');
await fsp.appendFile('log.txt', line);

// Directory operations
await fsp.mkdir('dir/subdir', { recursive: true });
const files = await fsp.readdir('dir', { withFileTypes: true });
const dirs = files.filter(f => f.isDirectory());

// File info
const stats = await fsp.stat('file.txt');
console.log(stats.size, stats.mtime, stats.isFile());

// Check existence (don't use fs.exists — deprecated)
try {
  await fsp.access('file.txt', fs.constants.R_OK);
} catch {
  // file doesn't exist or not readable
}

// Atomic write (avoid partial writes on crash)
const tmpFile = 'file.txt.tmp';
await fsp.writeFile(tmpFile, content);
await fsp.rename(tmpFile, 'file.txt'); // atomic on same filesystem
\`\`\`

**File watching**:
\`\`\`js
// fs.watch — more efficient, uses OS-level events
const watcher = fs.watch('dir', { recursive: true }, (eventType, filename) => {
  console.log(eventType, filename);
});
watcher.close();

// For production: use chokidar (handles cross-platform issues)
const chokidar = require('chokidar');
const watcher = chokidar.watch('src/**/*.ts', {
  ignored: /node_modules/,
  persistent: true,
});
watcher.on('change', (filePath) => console.log('Changed:', filePath));
\`\`\`

**Large file processing** — use streams:
\`\`\`js
const { createReadStream } = require('fs');
const readline = require('readline');

async function processLargeFile(filePath) {
  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Process line by line — constant memory
    processLine(line);
  }
}
\`\`\`

**Production pitfalls**:
1. **EMFILE (too many open files)**: Use \`graceful-fs\` or limit concurrent operations
2. **Race conditions**: Multiple processes writing the same file — use file locks or atomic writes
3. **Path traversal attacks**: Validate user input before constructing paths
\`\`\`js
// DANGEROUS
const userPath = req.query.file;
fs.readFile(\`/uploads/\${userPath}\`); // userPath = "../../etc/passwd"

// SAFE
const safePath = path.resolve('/uploads', userPath);
if (!safePath.startsWith('/uploads/')) throw new Error('Invalid path');
\`\`\`

**Common mistakes**:
- Using sync methods in request handlers — blocks all other requests
- Not handling ENOENT (file not found) errors
- Building paths with string concatenation instead of \`path.join()\`
- Not limiting file sizes on upload — out of memory

**Follow-up**: How does \`graceful-fs\` prevent EMFILE errors? What is the difference between \`fs.watch\` and \`fs.watchFile\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "HTTP server internals: keep-alive, connection pooling, and production tuning",
    content:
      "How does Node.js handle HTTP connections internally? Explain keep-alive, connection pooling for outbound requests, and important production tuning parameters.",
    answer: `**Incoming connections (server)**:

\`\`\`js
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello');
});

// Important production settings
server.keepAliveTimeout = 65000;     // Time to keep idle connections open (ms)
server.headersTimeout = 66000;       // Must be > keepAliveTimeout
server.maxHeadersCount = 100;        // Limit header count
server.timeout = 120000;             // Request timeout (0 = no timeout)
server.maxRequestsPerSocket = 0;     // 0 = unlimited requests per keep-alive connection
\`\`\`

**Keep-alive**: HTTP/1.1 reuses TCP connections for multiple requests. Without keep-alive, every request requires a new TCP handshake + TLS negotiation.

**Why \`keepAliveTimeout > 60s\`**: Load balancers (ALB, Nginx) have their own idle timeout (default 60s). If Node.js closes before the LB, the LB sends requests to a closed connection → 502 errors.

\`\`\`
Client → Load Balancer (60s idle timeout) → Node.js (65s idle timeout)
                                                    ↑ Must be higher!
\`\`\`

**Outbound requests — connection pooling with http.Agent**:
\`\`\`js
const http = require('http');

// Default agent (limited connection pooling)
// maxSockets: Infinity, keepAlive: false (Node < 19)

// Custom agent for production
const agent = new http.Agent({
  keepAlive: true,           // Reuse connections
  maxSockets: 50,            // Max concurrent per host
  maxTotalSockets: 200,      // Max total connections
  maxFreeSockets: 10,        // Max idle connections to keep
  timeout: 30000,            // Socket timeout
});

http.get('http://api.example.com/data', { agent }, (res) => {
  // ...
});

// Or with fetch (Node 18+)
const response = await fetch('http://api.example.com/data', {
  dispatcher: agent, // undici agent
});
\`\`\`

**undici** (modern HTTP client, built into Node.js):
\`\`\`js
const { Pool } = require('undici');

const pool = new Pool('http://api.example.com', {
  connections: 10,      // Max connections
  pipelining: 1,        // HTTP pipelining
  keepAliveTimeout: 30000,
});

const { statusCode, body } = await pool.request({
  path: '/data',
  method: 'GET',
});
\`\`\`

**Production tuning checklist**:
1. Set \`server.keepAliveTimeout\` higher than load balancer timeout
2. Set \`server.headersTimeout\` higher than \`keepAliveTimeout\`
3. Use connection pooling for outbound requests (reuse connections)
4. Set appropriate request timeouts
5. Monitor active connections and event loop lag
6. Limit request body size to prevent OOM

\`\`\`js
// Express body size limit
app.use(express.json({ limit: '10mb' }));

// Raw request timeout
server.setTimeout(120000); // 2 minutes
\`\`\`

**Monitoring**:
\`\`\`js
// Active connections
server.getConnections((err, count) => {
  console.log('Active connections:', count);
});

// Event loop lag
const start = process.hrtime.bigint();
setImmediate(() => {
  const lag = Number(process.hrtime.bigint() - start) / 1e6;
  console.log('Event loop lag:', lag, 'ms');
});
\`\`\`

**Common mistakes**:
- Not setting \`keepAliveTimeout\` — causes 502 errors behind load balancers
- Creating a new HTTP agent per request — loses connection pooling benefits
- Not limiting concurrent outbound connections — can exhaust remote server or local sockets
- Setting \`server.timeout = 0\` without monitoring — hung connections accumulate

**Follow-up**: How does HTTP/2 multiplexing change the connection model? What is \`undici\` and why is it faster than \`http.request\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Environment variables, config management, and secrets handling in Node.js",
    content:
      "What are the best practices for managing configuration and environment variables in a Node.js application? How do you handle secrets securely?",
    answer: `**Loading environment variables**:

\`\`\`js
// Direct access
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

// With dotenv (most common)
require('dotenv').config(); // loads .env file into process.env

// With dotenv for multiple environments
require('dotenv').config({
  path: \`.env.\${process.env.NODE_ENV || 'development'}\`
});
\`\`\`

**Config validation** (fail fast at startup):
\`\`\`js
// Using Zod
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
});

const env = envSchema.parse(process.env);
// Throws at startup if any env var is missing or invalid
\`\`\`

**Config module pattern**:
\`\`\`js
// config.js — centralized configuration
const env = envSchema.parse(process.env);

module.exports = {
  port: env.PORT,
  db: {
    url: env.DATABASE_URL,
    pool: { min: 2, max: 10 },
  },
  redis: {
    url: env.REDIS_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    tokenExpiry: '24h',
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
};
\`\`\`

**Secrets management**:

1. **Development**: \`.env.local\` (gitignored)
2. **CI/CD**: Pipeline secrets (GitHub Actions secrets, GitLab CI variables)
3. **Production**: Secret managers:
   - AWS Secrets Manager / SSM Parameter Store
   - HashiCorp Vault
   - Docker secrets
   - Kubernetes secrets

\`\`\`js
// AWS Secrets Manager example
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');
const client = new SecretsManager({ region: 'us-east-1' });

async function getSecret(name) {
  const response = await client.getSecretValue({ SecretId: name });
  return JSON.parse(response.SecretString);
}

// At startup
const dbCredentials = await getSecret('prod/database');
\`\`\`

**File hierarchy**:
\`\`\`
.env                 # Default values (committed)
.env.local           # Local overrides (gitignored)
.env.development     # Dev-specific (committed)
.env.production      # Prod-specific (committed — no secrets!)
.env.test            # Test-specific (committed)
\`\`\`

**Security rules**:
- Never commit secrets to git (use \`.gitignore\`)
- Never log environment variables (especially at startup)
- Rotate secrets regularly
- Use different secrets per environment
- Encrypt secrets at rest

\`\`\`js
// BAD: logging config
console.log('Config:', process.env); // Leaks all secrets

// GOOD: log non-sensitive config only
console.log('Starting on port:', config.port);
console.log('Environment:', config.nodeEnv);
\`\`\`

**Common mistakes**:
- Committing \`.env\` with real secrets to git
- Not validating env vars at startup — runtime crashes hours later
- Using different config patterns across the codebase — centralize in one module
- Hardcoding secrets as fallback defaults: \`process.env.SECRET || 'default-secret'\`
- Not using a secret manager in production — env vars can be exposed in crash dumps

**Follow-up**: How do you rotate secrets without downtime? What is the 12-factor app methodology for configuration?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Debugging Node.js: inspector, profiling, memory leaks, and production diagnostics",
    content:
      "How do you debug a Node.js application in production? Explain the built-in inspector, CPU profiling, heap snapshots, and how to diagnose memory leaks.",
    answer: `**Built-in debugger** (Chrome DevTools):
\`\`\`bash
# Start with inspector
node --inspect app.js            # Listen on 127.0.0.1:9229
node --inspect-brk app.js       # Break on first line
node --inspect=0.0.0.0:9229 app.js  # Allow remote (use in Docker)

# Open chrome://inspect in Chrome → click "inspect"
\`\`\`

**CPU profiling** — find performance bottlenecks:
\`\`\`js
// Programmatic profiling
const { Session } = require('inspector');
const session = new Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // ... run code to profile ...

    session.post('Profiler.stop', (err, { profile }) => {
      fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
      // Open in Chrome DevTools → Performance tab
    });
  });
});

// CLI approach
node --prof app.js           # Generate V8 log
node --prof-process isolate-*.log  # Generate human-readable output
\`\`\`

**Memory leak detection**:

1. **Monitor memory growth**:
\`\`\`js
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: \`\${Math.round(usage.rss / 1024 / 1024)}MB\`,
    heapUsed: \`\${Math.round(usage.heapUsed / 1024 / 1024)}MB\`,
    heapTotal: \`\${Math.round(usage.heapTotal / 1024 / 1024)}MB\`,
    external: \`\${Math.round(usage.external / 1024 / 1024)}MB\`,
  });
}, 30000);
\`\`\`

2. **Heap snapshots** (compare snapshots to find leaks):
\`\`\`js
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot() {
  const snapshotStream = v8.writeHeapSnapshot();
  console.log('Heap snapshot written to:', snapshotStream);
}

// Trigger via signal
process.on('SIGUSR2', takeHeapSnapshot);
// Then: kill -USR2 <pid>
\`\`\`

3. **Common leak patterns**:
\`\`\`js
// Leak: event listeners accumulating
class Leaky {
  constructor(emitter) {
    emitter.on('data', this.handler); // Never removed!
  }
  handler = (data) => { /* ... */ };
  destroy() {
    emitter.off('data', this.handler); // Fix: remove listener
  }
}

// Leak: closures holding references
function createHandler(largeData) {
  return (req, res) => {
    // largeData is captured in closure even if not used
    res.end('ok');
  };
}

// Leak: unbounded caches
const cache = {};
function getData(key) {
  if (!cache[key]) cache[key] = fetchData(key); // Never evicted!
  return cache[key];
}
// Fix: use LRU cache with max size
\`\`\`

**Production diagnostics toolkit**:
- \`clinic.js\`: Automated performance profiling
- \`node --heapsnapshot-signal=SIGUSR2\`: Heap snapshots on signal
- \`node --diagnostic-dir=/tmp\`: Store diagnostics files
- \`--max-old-space-size=4096\`: Increase heap limit (MB)
- \`process.report.writeReport()\`: Generate diagnostic report

**Event loop monitoring**:
\`\`\`js
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
  console.log({
    min: h.min / 1e6,     // ms
    max: h.max / 1e6,
    mean: h.mean / 1e6,
    p99: h.percentile(99) / 1e6,
  });
  h.reset();
}, 10000);
\`\`\`

**Common mistakes**:
- Running \`--inspect\` on 0.0.0.0 in production — exposes debugger to the internet
- Not monitoring memory trends — leaks are only caught when OOM crashes happen
- Taking heap snapshots on a loaded server — pauses the process
- Not setting \`--max-old-space-size\` for memory-intensive apps — default is ~1.5GB

**Follow-up**: How does \`clinic.js\` automate performance analysis? What are Diagnostic Channels in Node.js?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Testing Node.js applications: unit tests, integration tests, and mocking I/O",
    content:
      "What is the recommended testing strategy for a Node.js backend? Explain how to test async code, mock database/HTTP calls, and write effective integration tests.",
    answer: `**Testing pyramid for Node.js backends**:
1. **Unit tests** (many): Pure functions, business logic, validators
2. **Integration tests** (moderate): API endpoints with real/test database
3. **E2E tests** (few): Full system with external services

**Unit testing async code** (with Jest):
\`\`\`js
// service.js
async function getUserOrders(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  return orderRepo.findByUserId(userId);
}

// service.test.js
describe('getUserOrders', () => {
  it('throws when user not found', async () => {
    userRepo.findById = jest.fn().mockResolvedValue(null);

    await expect(getUserOrders('123'))
      .rejects.toThrow(NotFoundError);
  });

  it('returns orders for existing user', async () => {
    const mockOrders = [{ id: '1', amount: 100 }];
    userRepo.findById = jest.fn().mockResolvedValue({ id: '123' });
    orderRepo.findByUserId = jest.fn().mockResolvedValue(mockOrders);

    const result = await getUserOrders('123');
    expect(result).toEqual(mockOrders);
    expect(orderRepo.findByUserId).toHaveBeenCalledWith('123');
  });
});
\`\`\`

**Mocking HTTP requests** (with nock or MSW):
\`\`\`js
const nock = require('nock');

test('fetches user from external API', async () => {
  nock('https://api.example.com')
    .get('/users/123')
    .reply(200, { id: '123', name: 'Alice' });

  const user = await fetchExternalUser('123');
  expect(user.name).toBe('Alice');
});

test('handles API errors', async () => {
  nock('https://api.example.com')
    .get('/users/123')
    .reply(500);

  await expect(fetchExternalUser('123'))
    .rejects.toThrow('API error');
});
\`\`\`

**Integration tests with supertest**:
\`\`\`js
const request = require('supertest');
const app = require('./app');

describe('POST /api/users', () => {
  it('creates a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@test.com' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Alice',
      email: 'alice@test.com',
    });
    expect(response.body.id).toBeDefined();
  });

  it('validates required fields', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: '' })
      .expect(400);
  });
});
\`\`\`

**Test database strategies**:
\`\`\`js
// 1. Use test database with transactions (fast, isolated)
beforeEach(async () => {
  await db.query('BEGIN');
});
afterEach(async () => {
  await db.query('ROLLBACK');
});

// 2. Use testcontainers (real DB in Docker)
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

let container;
beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
});
afterAll(async () => {
  await container.stop();
});
\`\`\`

**Native Node.js test runner** (Node 20+):
\`\`\`js
const { describe, it, mock } = require('node:test');
const assert = require('node:assert');

describe('Calculator', () => {
  it('adds numbers', () => {
    assert.strictEqual(add(2, 3), 5);
  });

  it('mocks dependencies', () => {
    const mockFn = mock.fn(() => 42);
    assert.strictEqual(mockFn(), 42);
    assert.strictEqual(mockFn.mock.calls.length, 1);
  });
});
\`\`\`

**Common mistakes**:
- Mocking too much in integration tests — defeats the purpose of integration testing
- Not cleaning up test data between tests — tests depend on each other
- Testing implementation details (private methods, internal state)
- Slow test suites because every test spins up/tears down databases

**Follow-up**: How do you test WebSocket connections? What is the native Node.js test runner and how does it compare to Jest?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "EventEmitter patterns: custom events, error handling, and memory leak prevention",
    content:
      "How does the EventEmitter class work in Node.js? How do you use it in production for pub/sub patterns? What causes the 'MaxListenersExceeded' warning and how do you prevent memory leaks?",
    answer: `**EventEmitter basics**:
\`\`\`js
const { EventEmitter } = require('events');

class OrderService extends EventEmitter {
  async createOrder(data) {
    const order = await db.orders.create(data);
    this.emit('order:created', order);     // Notify listeners
    return order;
  }

  async cancelOrder(orderId) {
    const order = await db.orders.cancel(orderId);
    this.emit('order:cancelled', order);
    return order;
  }
}

const orderService = new OrderService();

// Register listeners
orderService.on('order:created', (order) => {
  emailService.sendConfirmation(order);
});

orderService.on('order:created', (order) => {
  analyticsService.trackPurchase(order);
});

orderService.on('order:cancelled', (order) => {
  refundService.processRefund(order);
});
\`\`\`

**Key methods**:
\`\`\`js
emitter.on('event', handler);           // Add listener
emitter.once('event', handler);         // Listen once then auto-remove
emitter.off('event', handler);          // Remove specific listener
emitter.removeAllListeners('event');    // Remove all for an event
emitter.listenerCount('event');         // Count listeners
emitter.prependListener('event', fn);   // Add at beginning of list
\`\`\`

**Error handling** — CRITICAL:
\`\`\`js
// If 'error' event has no listener → process crashes!
emitter.emit('error', new Error('something failed'));
// Error: something failed — CRASHES

// Always add error listener
emitter.on('error', (err) => {
  logger.error({ err }, 'EventEmitter error');
});
\`\`\`

**MaxListenersExceeded warning**: Default max is 10 listeners per event. This is a leak detection mechanism, not a hard limit.

\`\`\`js
// Warning: Possible EventEmitter memory leak detected.
// 11 listeners added for 'data'

// Fix 1: Increase limit (if you know you need more)
emitter.setMaxListeners(50);

// Fix 2: Remove listeners when done (actual fix for leaks)
class UserSession {
  constructor(emitter) {
    this.handler = (data) => this.onData(data);
    emitter.on('data', this.handler);
  }

  destroy() {
    emitter.off('data', this.handler); // Cleanup!
  }
}
\`\`\`

**Production patterns**:

1. **Typed events with TypeScript**:
\`\`\`ts
interface OrderEvents {
  'order:created': (order: Order) => void;
  'order:cancelled': (order: Order) => void;
  'error': (error: Error) => void;
}

class OrderService extends EventEmitter {
  emit<K extends keyof OrderEvents>(event: K, ...args: Parameters<OrderEvents[K]>) {
    return super.emit(event, ...args);
  }
  on<K extends keyof OrderEvents>(event: K, listener: OrderEvents[K]) {
    return super.on(event, listener);
  }
}
\`\`\`

2. **Async event handling**:
\`\`\`js
const { on } = require('events');

// Async iterator for events
async function processEvents(emitter) {
  for await (const [data] of on(emitter, 'data')) {
    await processData(data);
  }
}
\`\`\`

3. **AbortController integration**:
\`\`\`js
const ac = new AbortController();

emitter.on('data', handler, { signal: ac.signal });
// Later: ac.abort() removes the listener automatically
\`\`\`

**Common leak patterns**:
- Adding listeners in a loop or per-request without removing them
- Closures in event handlers capturing large objects
- Not calling \`off()\` when the subscriber is destroyed

**Common mistakes**:
- Ignoring the MaxListenersExceeded warning — it usually indicates a real leak
- Calling \`setMaxListeners(Infinity)\` to suppress the warning — hides bugs
- Not handling 'error' events — crashes the process
- Synchronous heavy work in event handlers — blocks the event loop

**Follow-up**: How does the \`EventTarget\` web API differ from \`EventEmitter\`? When would you use a message queue (Redis, RabbitMQ) instead of in-process events?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Timers and scheduling: setTimeout, setInterval, setImmediate, and production patterns",
    content:
      "Explain the timer functions in Node.js. What are the precision guarantees? How do you implement retries, rate limiting, and scheduled tasks in production?",
    answer: `**Timer functions**:
\`\`\`js
// setTimeout — run once after delay
const timer = setTimeout(() => console.log('fired'), 1000);
clearTimeout(timer);

// setInterval — run repeatedly
const interval = setInterval(() => console.log('tick'), 5000);
clearInterval(interval);

// setImmediate — run after current I/O callbacks
const immediate = setImmediate(() => console.log('immediate'));
clearImmediate(immediate);
\`\`\`

**Precision**: Timers are NOT precise. They guarantee "no earlier than" the delay, but can be later due to event loop load.
\`\`\`js
console.time('actual');
setTimeout(() => console.timeEnd('actual'), 100);
// Could print: actual: 103ms, 115ms, etc. — never < 100ms
\`\`\`

**Timer references and event loop**:
\`\`\`js
// .ref() / .unref() — control if timer keeps process alive
const timer = setInterval(checkHealth, 30000);
timer.unref(); // Process can exit even if this timer is still active

// Useful for background tasks that shouldn't prevent shutdown
\`\`\`

**Retry with exponential backoff**:
\`\`\`js
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;

      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * delay * 0.1;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));

      console.log(\`Retry \${attempt + 1}/\${maxRetries} after \${delay}ms\`);
    }
  }
}

// Usage
const data = await withRetry(() => fetch('https://api.example.com/data'), 3, 1000);
\`\`\`

**Rate limiting with token bucket**:
\`\`\`js
class RateLimiter {
  constructor(maxTokens, refillRate) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate; // tokens per second

    setInterval(() => {
      this.tokens = Math.min(this.maxTokens, this.tokens + this.refillRate);
    }, 1000);
  }

  async acquire() {
    while (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.tokens--;
  }
}

const limiter = new RateLimiter(10, 5); // 10 max, 5/sec refill
await limiter.acquire();
\`\`\`

**Scheduled tasks**:
\`\`\`js
// Simple: setInterval (single instance only)
setInterval(() => cleanupExpiredSessions(), 60 * 60 * 1000);

// Production: use node-cron or similar
const cron = require('node-cron');
cron.schedule('0 * * * *', () => {
  // Runs every hour
  cleanupExpiredSessions();
});

// Distributed: use BullMQ repeatable jobs
const { Queue } = require('bullmq');
const queue = new Queue('scheduled-tasks');
await queue.add('cleanup', {}, {
  repeat: { pattern: '0 * * * *' },
});
\`\`\`

**AbortController with timers**:
\`\`\`js
const { setTimeout: sleep } = require('timers/promises');

const ac = new AbortController();

try {
  await sleep(5000, undefined, { signal: ac.signal });
  console.log('Completed');
} catch (err) {
  if (err.code === 'ABORT_ERR') console.log('Cancelled');
}

// Cancel from elsewhere:
ac.abort();
\`\`\`

**timers/promises API** (Node 16+):
\`\`\`js
const { setTimeout, setInterval } = require('timers/promises');

// Promisified setTimeout
await setTimeout(1000);
console.log('After 1 second');

// Async iterable setInterval
for await (const _ of setInterval(1000)) {
  console.log('Every second');
  if (shouldStop) break;
}
\`\`\`

**Common mistakes**:
- Using \`setInterval\` for tasks that take longer than the interval — overlapping executions
- Not clearing timers on shutdown — prevents clean exit
- Relying on timer precision for business logic — use monotonic clocks for measurement
- Using \`setInterval\` for distributed scheduled tasks — runs on every instance

**Follow-up**: How do you prevent overlapping \`setInterval\` executions? What is the \`timers/promises\` module and how does it simplify async timer code?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Security best practices: input validation, dependency auditing, and common vulnerabilities",
    content:
      "What are the most important security practices for a Node.js application? Cover input validation, dependency security, and common attack vectors.",
    answer: `**OWASP Top vulnerabilities in Node.js**:

**1. Injection (command, SQL, NoSQL)**:
\`\`\`js
// COMMAND INJECTION
// BAD: user input in exec
exec(\`convert \${userInput}.png output.jpg\`);
// Fix: use spawn with arguments array
spawn('convert', [userInput + '.png', 'output.jpg']);

// SQL INJECTION
// BAD: string interpolation
db.query(\`SELECT * FROM users WHERE id = '\${userId}'\`);
// Fix: parameterized queries
db.query('SELECT * FROM users WHERE id = $1', [userId]);

// NOSQL INJECTION
// BAD: passing raw body to MongoDB
db.users.find({ username: req.body.username });
// If body is: { username: { "$gt": "" } } → returns all users
// Fix: validate types
const username = String(req.body.username);
\`\`\`

**2. Prototype pollution**:
\`\`\`js
// BAD: merging untrusted objects
const merged = { ...defaults, ...userInput };
// If userInput = { "__proto__": { "isAdmin": true } }
// All objects now have isAdmin = true!

// Fix: validate/sanitize input, use Object.create(null) for maps
// Fix: use libraries that handle it (lodash.merge was vulnerable, now fixed)
\`\`\`

**3. ReDoS (Regular Expression Denial of Service)**:
\`\`\`js
// BAD: vulnerable regex
const emailRegex = /^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)\\.([a-zA-Z]{2,})$/;
// Catastrophic backtracking with malicious input

// Fix: use validator libraries
const validator = require('validator');
validator.isEmail(input);

// Fix: use re2 for untrusted input
const RE2 = require('re2');
const safeRegex = new RE2(/pattern/);
\`\`\`

**4. Path traversal**:
\`\`\`js
// BAD
app.get('/files/:name', (req, res) => {
  res.sendFile('/uploads/' + req.params.name);
  // name = "../../etc/passwd"
});

// Fix: resolve and validate
const safePath = path.resolve('/uploads', req.params.name);
if (!safePath.startsWith('/uploads/')) {
  return res.status(403).send('Forbidden');
}
\`\`\`

**Input validation** (with Zod or Joi):
\`\`\`js
const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['user', 'admin']).default('user'),
});

app.post('/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // result.data is typed and validated
});
\`\`\`

**Dependency security**:
\`\`\`bash
# Audit dependencies
npm audit
npm audit fix

# Use lockfile (prevent supply chain attacks)
npm ci     # Installs exactly from lockfile

# Check for known vulnerabilities
npx snyk test
\`\`\`

**Security headers** (with helmet):
\`\`\`js
const helmet = require('helmet');
app.use(helmet()); // Sets multiple security headers

// Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, X-XSS-Protection, etc.
\`\`\`

**Rate limiting**:
\`\`\`js
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
}));
\`\`\`

**Common mistakes**:
- Trusting client-side validation — always validate on the server
- Not auditing dependencies regularly — vulnerable packages in production
- Using \`eval()\`, \`new Function()\`, or \`vm\` with user input
- Logging sensitive data (passwords, tokens, credit card numbers)
- Not using HTTPS in production

**Follow-up**: What is Content Security Policy (CSP) and how do you configure it in Node.js? How does \`npm audit\` work and what are its limitations?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Logging and observability: structured logging, log levels, and distributed tracing",
    content:
      "What is the recommended logging strategy for a production Node.js application? Explain structured logging, log levels, and how to implement distributed tracing.",
    answer: `**Structured logging** (JSON format, not plain text):
\`\`\`js
// BAD: unstructured
console.log('User 123 created order 456 for $99.99');
// Hard to parse, filter, and aggregate

// GOOD: structured (pino)
const pino = require('pino');
const logger = pino({ level: 'info' });

logger.info({
  userId: '123',
  orderId: '456',
  amount: 99.99,
  currency: 'USD',
}, 'Order created');

// Output: {"level":30,"time":1706198400,"userId":"123","orderId":"456",
//          "amount":99.99,"currency":"USD","msg":"Order created"}
\`\`\`

**Why pino over winston**: Pino is 5-10x faster because it uses JSON.stringify directly and avoids string concatenation. In high-throughput servers, logging overhead matters.

**Log levels** (from most to least severe):
\`\`\`
fatal → error → warn → info → debug → trace
\`\`\`

\`\`\`js
logger.fatal('Database connection lost — shutting down');
logger.error({ err }, 'Failed to process payment');
logger.warn({ retries: 3 }, 'External API slow, retrying');
logger.info({ orderId }, 'Order created successfully');
logger.debug({ query, params }, 'Database query executed');
logger.trace({ headers }, 'Incoming request headers');
\`\`\`

**Production**: Set \`level: 'info'\`. Use \`debug\` in development/staging.

**Request logging middleware**:
\`\`\`js
const pinoHttp = require('pino-http');

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Don't log sensitive headers
    }),
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));
\`\`\`

**Distributed tracing** (track requests across services):
\`\`\`js
// Using OpenTelemetry
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// Automatic instrumentation traces HTTP, database, etc.
// Each request gets a trace ID propagated across services
\`\`\`

**Correlation IDs** (simpler alternative):
\`\`\`js
const { AsyncLocalStorage } = require('async_hooks');
const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  requestContext.run({ requestId }, next);
});

// In any function:
function getRequestId() {
  return requestContext.getStore()?.requestId;
}

// Logger automatically includes requestId
const childLogger = logger.child({ requestId: getRequestId() });
\`\`\`

**Log aggregation pipeline**:
\`\`\`
App (pino) → stdout → Docker → Fluentd/Vector → Elasticsearch → Kibana
                                                → Datadog
                                                → CloudWatch
\`\`\`

**What to log**:
- Request/response (method, URL, status, duration)
- Errors with stack traces
- Business events (order created, payment processed)
- External service calls (duration, success/failure)

**What NOT to log**:
- Passwords, tokens, API keys
- Credit card numbers, PII
- Full request/response bodies (unless debugging)
- Health check requests (too noisy)

**Common mistakes**:
- Using \`console.log\` in production — no levels, no structure, blocks event loop
- Logging too much — storage costs and noise overwhelm signal
- Not including correlation IDs — can't trace requests across services
- Synchronous file logging — blocks the event loop

**Follow-up**: What is AsyncLocalStorage and how does it help with request context propagation? How does OpenTelemetry differ from custom logging?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "AsyncLocalStorage and request context: tracking state across async operations",
    content:
      "What is AsyncLocalStorage? How do you use it to maintain request context (user, trace ID, locale) across async operations without passing it through every function?",
    answer: `**AsyncLocalStorage**: A Node.js API that maintains a store of data throughout the lifetime of an async operation — similar to thread-local storage in multithreaded languages.

\`\`\`js
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

// Create context for a request
app.use((req, res, next) => {
  const store = {
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    userId: req.user?.id,
    locale: req.headers['accept-language']?.split(',')[0] || 'en',
    startTime: Date.now(),
  };

  als.run(store, () => next());
});

// Access context ANYWHERE in the call stack — no passing required
function getRequestContext() {
  return als.getStore();
}

// In a deeply nested service
async function processPayment(orderId) {
  const ctx = getRequestContext();
  logger.info({
    requestId: ctx.requestId,
    userId: ctx.userId,
    orderId,
  }, 'Processing payment');

  // Even in callbacks and promises, the context is preserved
  await paymentGateway.charge(orderId);
}
\`\`\`

**How it works**:
- \`als.run(store, callback)\` creates a new context
- All async operations spawned within that callback inherit the same store
- Promises, setTimeout, EventEmitter callbacks all propagate the context
- Each concurrent request gets its own isolated store

**Automatic logger context**:
\`\`\`js
const pino = require('pino');
const baseLogger = pino();

function getLogger() {
  const ctx = als.getStore();
  if (!ctx) return baseLogger;
  return baseLogger.child({
    requestId: ctx.requestId,
    userId: ctx.userId,
  });
}

// Usage — every log automatically includes request context
async function createOrder(data) {
  const logger = getLogger();
  logger.info({ data }, 'Creating order'); // includes requestId, userId
  // ...
}
\`\`\`

**Use cases**:
1. **Request ID propagation** — trace requests across async boundaries
2. **User context** — access current user without passing through every function
3. **Locale/i18n** — format messages based on request language
4. **Transaction context** — database transactions across service calls
5. **Tenant isolation** — multi-tenant apps identifying current tenant

**Transaction context pattern**:
\`\`\`js
const txnStorage = new AsyncLocalStorage();

async function withTransaction(fn) {
  const client = await pool.connect();
  await client.query('BEGIN');

  try {
    const result = await txnStorage.run(client, () => fn());
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function getDbClient() {
  return txnStorage.getStore() || pool; // Use transaction or default pool
}

// Usage
await withTransaction(async () => {
  await userService.create(userData);     // Uses transaction client
  await orderService.create(orderData);   // Uses same transaction
  // Both committed together or rolled back
});
\`\`\`

**Performance**: AsyncLocalStorage uses async_hooks internally. In Node.js 16+, it has been heavily optimized and the overhead is negligible for most applications.

**enterWith() vs run()**:
\`\`\`js
als.run(store, callback);    // Scoped to callback — recommended
als.enterWith(store);        // Sets for current execution — be careful
\`\`\`

**Common mistakes**:
- Accessing the store outside of a \`run()\` context — returns \`undefined\`
- Mutating the store object from multiple async operations — race conditions
- Using \`enterWith()\` in request handlers — can leak between requests
- Not handling the case where \`getStore()\` returns \`undefined\`

**Follow-up**: How does AsyncLocalStorage relate to TC39's \`AsyncContext\` proposal? What is the performance overhead of using async_hooks?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Node.js performance: event loop lag, blocking operations, and optimization techniques",
    content:
      "How do you identify and fix performance bottlenecks in a Node.js application? Explain event loop lag, common blocking operations, and techniques to keep the server responsive.",
    answer: `**Event loop lag**: The delay between when a timer/callback should fire and when it actually fires. If the event loop is busy with synchronous work, all async callbacks are delayed.

**Measuring event loop lag**:
\`\`\`js
const { monitorEventLoopDelay } = require('perf_hooks');

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(() => {
  console.log({
    min: (histogram.min / 1e6).toFixed(2) + 'ms',
    max: (histogram.max / 1e6).toFixed(2) + 'ms',
    mean: (histogram.mean / 1e6).toFixed(2) + 'ms',
    p50: (histogram.percentile(50) / 1e6).toFixed(2) + 'ms',
    p99: (histogram.percentile(99) / 1e6).toFixed(2) + 'ms',
  });
  histogram.reset();
}, 5000);
// Healthy: p99 < 50ms. Problem: p99 > 100ms
\`\`\`

**Common blocking operations**:
1. **JSON.parse/stringify of large objects** (>10MB)
2. **Synchronous crypto** (pbkdf2Sync, randomBytesSync)
3. **Large regex on untrusted input** (ReDoS)
4. **Synchronous file I/O** (readFileSync in request handlers)
5. **CPU-intensive loops** (sorting millions of items)

**Fixing strategies**:

1. **Offload to Worker Threads**:
\`\`\`js
const { Worker } = require('worker_threads');

function heavyTask(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
\`\`\`

2. **Break up synchronous work with setImmediate**:
\`\`\`js
// BAD: blocks event loop for entire array
function processAll(items) {
  items.forEach(item => heavyProcessing(item));
}

// GOOD: yield to event loop periodically
async function processAll(items) {
  for (let i = 0; i < items.length; i++) {
    heavyProcessing(items[i]);
    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
\`\`\`

3. **Stream large JSON**:
\`\`\`js
// BAD: buffer entire response
const data = JSON.parse(await readFile('huge.json'));

// GOOD: stream with JSONStream
const JSONStream = require('JSONStream');
const stream = fs.createReadStream('huge.json')
  .pipe(JSONStream.parse('items.*'));

for await (const item of stream) {
  process(item);
}
\`\`\`

4. **Use async crypto**:
\`\`\`js
// BAD: blocks event loop
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

// GOOD: async version
const hash = await new Promise((resolve, reject) => {
  crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
    if (err) reject(err);
    else resolve(key);
  });
});
\`\`\`

5. **Connection pooling**:
\`\`\`js
// BAD: new connection per request
app.get('/users', async (req, res) => {
  const client = new Client();
  await client.connect();
  const result = await client.query('SELECT * FROM users');
  await client.end();
});

// GOOD: connection pool
const pool = new Pool({ max: 20 });
app.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});
\`\`\`

**Monitoring checklist**:
- Event loop lag (p99 < 50ms)
- Active handles and requests (\`process._getActiveHandles().length\`)
- Memory usage (\`process.memoryUsage()\`)
- GC frequency and duration (\`--expose-gc\` + \`perf_hooks\`)
- Request latency percentiles

**Common mistakes**:
- Using synchronous methods in hot paths without realizing it (JSON.parse is sync)
- Not using connection pooling for databases — exhausts connections
- Over-caching in memory — GC pauses cause latency spikes
- Premature optimization — profile first, optimize the actual bottleneck

**Follow-up**: How do you profile garbage collection pauses in Node.js? What is the \`--max-semi-space-size\` V8 flag and when should you tune it?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Native fetch, AbortController, and modern HTTP client patterns in Node.js",
    content:
      "How does the native fetch API work in Node.js 18+? How do you use AbortController for timeouts and cancellation? What are the differences from browser fetch?",
    answer: `**Native fetch** (Node.js 18+ — built on undici):
\`\`\`js
// Basic GET
const response = await fetch('https://api.example.com/users');
const data = await response.json();

// POST with JSON body
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@test.com' }),
});

if (!response.ok) {
  throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
}
\`\`\`

**AbortController for timeouts**:
\`\`\`js
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(\`Request to \${url} timed out after \${timeoutMs}ms\`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
\`\`\`

**AbortSignal.timeout()** (Node.js 18+, simpler):
\`\`\`js
const response = await fetch('https://api.example.com/data', {
  signal: AbortSignal.timeout(5000), // Built-in timeout
});
\`\`\`

**Cancellation with AbortController**:
\`\`\`js
const controller = new AbortController();

// Start multiple parallel requests
const promises = urls.map(url =>
  fetch(url, { signal: controller.signal })
);

// Cancel all requests if any one fails
try {
  const results = await Promise.all(promises);
} catch (err) {
  controller.abort(); // Cancels all in-flight requests
}
\`\`\`

**Combining signals** (timeout + manual cancel):
\`\`\`js
const manualController = new AbortController();

const signal = AbortSignal.any([
  AbortSignal.timeout(5000),      // Auto-cancel after 5s
  manualController.signal,         // Manual cancel
]);

fetch(url, { signal });

// User clicks cancel button:
manualController.abort();
\`\`\`

**Differences from browser fetch**:
| Feature | Browser | Node.js |
|---|---|---|
| Cookies | Automatic (same-origin) | Manual (no cookie jar) |
| CORS | Enforced | Not applicable |
| Redirect | Limited to same-origin | Follows all (configurable) |
| Streaming body | ReadableStream | ReadableStream (Web Streams API) |
| HTTP/2 | Browser-managed | Not supported by native fetch (use undici directly) |

**Streaming response body**:
\`\`\`js
const response = await fetch('https://api.example.com/stream');
const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stdout.write(value);
}
\`\`\`

**Retry pattern**:
\`\`\`js
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(options.timeout || 10000),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || '1';
        await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
        continue;
      }

      if (!response.ok && i < retries) continue;

      return response;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
\`\`\`

**Common mistakes**:
- Not checking \`response.ok\` — fetch doesn't throw on HTTP errors (4xx, 5xx)
- Not consuming the response body — can cause memory leaks
- Not setting timeouts — requests can hang indefinitely
- Using \`node-fetch\` when native fetch is available — unnecessary dependency

**Follow-up**: What is undici and how does it differ from the built-in http module? How do you implement connection pooling with native fetch?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
  {
    title:
      "Package management: lockfiles, workspaces, peer dependencies, and monorepo patterns",
    content:
      "Explain how package lockfiles work, what peer dependencies are, and how to set up a Node.js monorepo with workspaces.",
    answer: `**Lockfiles** (package-lock.json, pnpm-lock.yaml, yarn.lock):
- Pin exact dependency versions (including transitive dependencies)
- Ensure reproducible installs across machines and CI
- Generated automatically, should be committed to git

\`\`\`bash
# Install from lockfile (CI/production — ALWAYS use this)
npm ci          # Deletes node_modules, installs exact versions from lockfile
pnpm install --frozen-lockfile
yarn install --frozen-lockfile

# Install and update lockfile (development)
npm install     # May update lockfile if deps changed
\`\`\`

**Dependency types**:
\`\`\`json
{
  "dependencies": {
    "express": "^4.18.0"    // Required at runtime
  },
  "devDependencies": {
    "jest": "^29.0.0"       // Only for development/testing
  },
  "peerDependencies": {
    "react": "^18.0.0"      // Consumer must provide this
  },
  "optionalDependencies": {
    "sharp": "^0.33.0"      // OK if install fails (platform-specific)
  }
}
\`\`\`

**Peer dependencies**: Your package requires the consumer to install a compatible version. Used by plugins, frameworks extensions, and packages that need to share a singleton (React, Angular).

\`\`\`json
// my-react-component/package.json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0"
  }
}
// Consumer must have react/react-dom installed
\`\`\`

**Version ranges**:
\`\`\`
^4.18.0  → >=4.18.0 <5.0.0   (minor + patch updates)
~4.18.0  → >=4.18.0 <4.19.0   (patch updates only)
4.18.0   → exactly 4.18.0      (exact)
*        → any version          (avoid in production)
>=4.0.0  → 4.0.0 or higher
\`\`\`

**Workspaces** (monorepo setup):

\`\`\`json
// root package.json (npm/pnpm)
{
  "workspaces": ["packages/*", "apps/*"]
}

// pnpm-workspace.yaml (pnpm)
packages:
  - 'packages/*'
  - 'apps/*'
\`\`\`

**Monorepo structure**:
\`\`\`
monorepo/
  package.json             # Root with workspaces
  pnpm-workspace.yaml
  packages/
    shared/                # @myorg/shared
      package.json
      src/
    ui/                    # @myorg/ui
      package.json
      src/
  apps/
    web/                   # @myorg/web
      package.json         # depends on @myorg/shared, @myorg/ui
      src/
    api/                   # @myorg/api
      package.json         # depends on @myorg/shared
      src/
\`\`\`

**Cross-package references**:
\`\`\`json
// apps/web/package.json
{
  "dependencies": {
    "@myorg/shared": "workspace:*",    // pnpm
    "@myorg/ui": "workspace:^"         // pnpm — replaces with version on publish
  }
}
\`\`\`

**Running scripts across workspaces**:
\`\`\`bash
# pnpm
pnpm --filter @myorg/web build       # Single package
pnpm -r build                        # All packages
pnpm --filter @myorg/web... build    # Package + all its dependencies

# npm
npm run build -w packages/shared     # Single workspace
npm run build --workspaces           # All workspaces

# Turborepo (optimized task runner)
turbo run build                      # Parallel + cached builds
\`\`\`

**Common mistakes**:
- Not committing lockfiles — inconsistent installs across environments
- Using \`npm install\` in CI instead of \`npm ci\` — can install different versions
- Confusing \`dependencies\` with \`devDependencies\` for libraries — both are installed by consumers with npm@7+
- Using \`workspace:*\` in packages intended for npm publish — must use \`workspace:^\`
- Not hoisting common dependencies — duplicate installations waste disk space

**Follow-up**: How does pnpm's content-addressable store work? What is Turborepo and how does it optimize monorepo builds?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nodejs",
  },
];

// ============================================
// EXPORT
// ============================================

export const middleNodejsQuestions: QuestionSeed[] = nodejsMiddleQuestions;

// Summary
console.log("=".repeat(50));
console.log("MIDDLE-LEVEL NODE.JS INTERVIEW QUESTIONS");
console.log("=".repeat(50));
console.log(`Node.js: ${nodejsMiddleQuestions.length}`);
console.log(`Total: ${middleNodejsQuestions.length}`);
console.log("=".repeat(50));
