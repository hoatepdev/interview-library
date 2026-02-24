/**
 * Middle-Level JavaScript & TypeScript Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: real-world scenarios, trade-offs, practical understanding.
 *
 * Topics: javascript (10), typescript (10)
 * Level: MIDDLE
 *
 * Usage: npm run seed:middle-jsts
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
// JAVASCRIPT — MIDDLE LEVEL (10 questions)
// ============================================

const javascriptMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "Microtasks vs Macrotasks: Explain execution order of Promise.then, setTimeout, and queueMicrotask",
    content:
      "What happens when you `await` a non-Promise value? How does the event loop handle `Promise.resolve().then(...)` vs `setTimeout(..., 0)` vs `queueMicrotask(...)`? Explain the execution order and why it matters in production code.",
    answer: `**Awaiting a non-Promise**: \`await 42\` is equivalent to \`await Promise.resolve(42)\`. The value is wrapped in a resolved promise, and execution resumes in a microtask.

**Execution order**:
1. Synchronous code runs to completion first
2. Microtask queue drains completely (Promise callbacks, \`queueMicrotask\`, \`MutationObserver\`)
3. One macrotask runs (\`setTimeout\`, \`setInterval\`, I/O callbacks)
4. Microtask queue drains again
5. Repeat

\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
console.log('5');
// Output: 1, 5, 3, 4, 2
\`\`\`

**Why it matters**: Understanding this is critical for state batching (React uses microtask timing), avoiding race conditions between \`await\`-based logic and \`setTimeout\` callbacks, and debugging unexpected ordering in async code.

**Key difference**: \`Promise.resolve().then(fn)\` and \`queueMicrotask(fn)\` both schedule microtasks. \`setTimeout(fn, 0)\` schedules a macrotask. Microtasks always run before the next macrotask, even if \`setTimeout\` was registered first.

**Common mistakes**:
- Assuming \`setTimeout(fn, 0)\` runs immediately after the current code
- Not realizing microtasks can starve macrotasks if they keep queueing more microtasks
- Confusing Node.js \`process.nextTick\` (which runs before other microtasks) with \`queueMicrotask\`

**Follow-up**: What happens if a microtask queues another microtask indefinitely? How does \`process.nextTick\` differ from \`queueMicrotask\` in Node.js?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Converting callback-based APIs to Promises: approaches, edge cases, and production pitfalls",
    content:
      "You have a function that takes a callback and you need to convert it to return a Promise. What are the different approaches, and what edge cases should you handle in production?",
    answer: `**Approach 1 — \`util.promisify\`** (Node.js): Works with functions following the \`(err, result)\` convention. Handles error propagation automatically.

**Approach 2 — Manual wrapping**:
\`\`\`js
function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
\`\`\`

**Approach 3 — Custom promisify** for non-standard callbacks: Some APIs pass multiple arguments to the callback or don't follow error-first convention (e.g., legacy APIs or browser APIs like \`geolocation\`).

**Edge cases in production**:
- **Callback called multiple times**: A promise settles only once. Subsequent calls are silently ignored, which can hide bugs
- **Callback never called**: The promise hangs forever. Add a timeout wrapper:
\`\`\`js
function withTimeout(promiseFn, ms) {
  return Promise.race([
    promiseFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
}
\`\`\`
- **Multiple result values**: \`resolve\` takes one argument. Use an object or array to bundle values
- **\`this\` binding**: Some callback-based APIs depend on \`this\` context. Bind correctly when promisifying

**Common mistakes**:
- Forgetting to reject on error — leads to silently hanging promises
- Not handling the case where the callback fires synchronously
- Using \`promisify\` on APIs that don't follow the error-first callback pattern

**Follow-up**: How would you handle promisifying an EventEmitter-based API? What are the implications of a promise that never resolves in a server context?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Promise.all vs Promise.allSettled vs Promise.race vs Promise.any: choosing the right concurrency strategy",
    content:
      "Explain `Promise.all`, `Promise.allSettled`, `Promise.race`, and `Promise.any`. In a production scenario with multiple API calls, which would you use and why?",
    answer: `**\`Promise.all(promises)\`**: Resolves when all resolve. Rejects immediately when any one rejects — other promises continue executing but their results are ignored. Use when all results are required and any failure is fatal.

**\`Promise.allSettled(promises)\`**: Always waits for all promises. Returns array of \`{status, value}\` or \`{status, reason}\`. Use when you need to attempt everything and handle partial failures gracefully.

**\`Promise.race(promises)\`**: Settles with whichever promise settles first (resolve or reject). Use for timeouts or getting the fastest response from multiple sources.

**\`Promise.any(promises)\`**: Resolves with the first fulfilled promise. Only rejects if all promises reject (with \`AggregateError\`). Use when you have redundant sources and need any one to succeed.

**Dashboard loading with graceful degradation**:
\`\`\`js
const results = await Promise.allSettled([
  fetchUserStats(),
  fetchRecentOrders(),
  fetchNotifications()
]);
const [stats, orders, notifications] = results.map(r =>
  r.status === 'fulfilled' ? r.value : null
);
// Render available data, show error states for failed sections
\`\`\`

**Fastest CDN selection**:
\`\`\`js
const asset = await Promise.any([
  fetchFrom('cdn1.example.com/asset.js'),
  fetchFrom('cdn2.example.com/asset.js'),
  fetchFrom('cdn3.example.com/asset.js')
]);
\`\`\`

**Common mistakes**:
- Using \`Promise.all\` when partial results are acceptable — a single failure loses all data
- Forgetting that \`Promise.race\` settles on rejection too, not just resolution
- Not handling \`AggregateError\` when using \`Promise.any\`
- \`Promise.all\` doesn't cancel other promises on failure — you might waste resources

**Follow-up**: How would you implement a concurrency limiter (e.g., max 5 parallel requests)? What happens to the unresolved promises after \`Promise.race\` settles?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "The 'this' keyword: four binding rules, arrow functions, and production bugs",
    content:
      "What is the `this` keyword in JavaScript? Explain the four binding rules, and describe how arrow functions change the behavior. Give a production example where `this` binding causes a bug.",
    answer: `**Four binding rules** (in precedence order):
1. **\`new\` binding**: \`this\` refers to the newly created object
2. **Explicit binding**: \`call\`, \`apply\`, \`bind\` set \`this\` to the specified object
3. **Implicit binding**: \`obj.method()\` — \`this\` is \`obj\`
4. **Default binding**: Standalone call — \`this\` is \`globalThis\` (sloppy mode) or \`undefined\` (strict mode)

**Arrow functions**: No own \`this\`. They capture \`this\` from the lexical scope at definition time. Cannot be overridden by \`call\`/\`apply\`/\`bind\`.

**Common production bug** — Passing a method as a callback loses implicit binding:
\`\`\`js
class Logger {
  prefix = '[LOG]';
  log(msg) {
    console.log(\`\${this.prefix} \${msg}\`);
  }
}
const logger = new Logger();
setTimeout(logger.log, 100, 'hello');
// TypeError: Cannot read 'prefix' of undefined
\`\`\`

**Fixes**:
- \`setTimeout(() => logger.log('hello'), 100)\`
- \`setTimeout(logger.log.bind(logger), 100, 'hello')\`
- Define \`log\` as an arrow function class field: \`log = (msg) => { ... }\`

**React class component pattern**:
\`\`\`js
class Button extends React.Component {
  handleClick() { this.setState({ clicked: true }); }
  render() {
    // Bug: this is lost when passed as callback
    return <button onClick={this.handleClick}>Click</button>;
    // Fix: <button onClick={() => this.handleClick()}>Click</button>
  }
}
\`\`\`
This is one of the reasons React moved toward function components with hooks.

**Common mistakes**:
- Assuming arrow functions have their own \`this\` — they inherit it lexically
- Using arrow functions as object methods (they won't get the object as \`this\`)
- Not realizing that destructuring a method loses \`this\` binding: \`const { log } = logger;\`

**Follow-up**: Why can't you use \`bind\` on an arrow function? How does \`this\` behave inside a class static method?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "WeakMap and WeakSet: garbage collection, use cases, and differences from Map/Set",
    content:
      "What is the difference between `WeakMap`/`WeakSet` and `Map`/`Set`? What are realistic production use cases for weak collections?",
    answer: `**Key differences**:
| Feature | Map/Set | WeakMap/WeakSet |
|---|---|---|
| Key types | Any | Objects only (or symbols) |
| GC | Prevents key GC | Allows key GC |
| Iterable | Yes | No |
| \`.size\` | Yes | No |
| \`.clear()\` | Yes | No |

**Why not iterable?** Since entries can be garbage collected at any time, iterating would produce unpredictable results.

**Production use cases**:
1. **DOM metadata**: Associate data with DOM nodes without memory leaks when nodes are removed
2. **Caching computed values**: Cache results tied to object identity; cache auto-cleans when the object is GC'd
3. **Private data**: Simulate private fields (pre-\`#private\` syntax) — only accessible if you have the WeakMap reference
4. **Tracking object relationships**: Mark objects as "seen" or "processed" without preventing their cleanup
5. **Framework internals**: React, Vue, and other frameworks use WeakMaps to associate component instances with their state

**Example — Caching expensive computations**:
\`\`\`js
const cache = new WeakMap();

function expensiveTransform(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = /* heavy computation */;
  cache.set(obj, result);
  return result;
}

let data = { /* large dataset */ };
expensiveTransform(data); // computed and cached
expensiveTransform(data); // returned from cache
data = null; // cache entry is automatically eligible for GC
\`\`\`

**Common mistakes**:
- Trying to iterate over a WeakMap — it's not possible by design
- Using WeakMap for caching with primitive keys — only objects are allowed
- Assuming WeakMap entries are immediately garbage collected — GC timing is non-deterministic

**Follow-up**: How does \`WeakRef\` differ from \`WeakMap\`? When would you use \`WeakRef\`? What is the \`FinalizationRegistry\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Generators and Iterators: lazy evaluation and async iteration in production",
    content:
      "What are Generators and Iterators in JavaScript? When would you use them in production instead of regular arrays or async/await?",
    answer: `**Iterator protocol**: Any object with a \`next()\` method returning \`{value, done}\` is an iterator. Objects with \`[Symbol.iterator]()\` are iterable — usable with \`for...of\`, spread, destructuring.

**Generators**: \`function*\` creates a generator function. \`yield\` pauses execution and returns a value. The generator resumes when \`next()\` is called again. This enables lazy evaluation.

**When to use in production**:
1. **Large datasets**: Process millions of rows without loading all into memory
2. **Pagination**: Lazily fetch pages from an API
3. **Infinite sequences**: Generate IDs, timestamps, etc.
4. **State machines**: Generators naturally model step-by-step transitions
5. **Async generators** (\`async function*\`): Stream processing with \`for await...of\`

**Paginated API fetch with async generator**:
\`\`\`js
async function* fetchAllUsers() {
  let page = 1;
  while (true) {
    const { data, hasMore } = await api.get(\`/users?page=\${page}\`);
    yield* data;
    if (!hasMore) break;
    page++;
  }
}

for await (const user of fetchAllUsers()) {
  await processUser(user); // processes one at a time, memory-efficient
}
\`\`\`

**When NOT to use**: For small, finite datasets where an array is simpler and more readable. Generators add complexity that's only justified by memory or composability benefits.

**Common mistakes**:
- Using generators where a simple \`array.map/filter\` chain would be clearer
- Forgetting that generators are single-use — once exhausted, they can't be restarted
- Not handling generator cleanup (\`return\`/\`throw\`) when breaking out of iteration early

**Follow-up**: How do you handle errors inside an async generator? What is the difference between \`yield\` and \`yield*\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Proxy and Reflect: metaprogramming use cases, performance trade-offs, and when to avoid them",
    content:
      "What is `Proxy` in JavaScript? Describe a production use case, its performance implications, and when you should NOT use it.",
    answer: `**How it works**: \`new Proxy(target, handler)\` creates a proxy. The handler defines traps for fundamental operations:
- \`get(target, prop, receiver)\`: intercept property reads
- \`set(target, prop, value, receiver)\`: intercept property writes
- \`has(target, prop)\`: intercept \`in\` operator
- \`deleteProperty\`, \`apply\`, \`construct\`, etc.

**Production use cases**:
1. **Reactive systems**: Vue 3's reactivity is built on Proxy (replaced \`Object.defineProperty\` from Vue 2)
2. **Validation layers**: Auto-validate property assignments
3. **Default values**: Return defaults for missing properties
4. **API clients**: Build dynamic method chains (\`api.users.get()\`)
5. **Sandboxing**: Control access to sensitive objects

**Dynamic API client example**:
\`\`\`js
function createApiClient(baseUrl) {
  return new Proxy({}, {
    get(_, resource) {
      return {
        get: (id) => fetch(\`\${baseUrl}/\${resource}/\${id}\`).then(r => r.json()),
        list: () => fetch(\`\${baseUrl}/\${resource}\`).then(r => r.json()),
        create: (data) => fetch(\`\${baseUrl}/\${resource}\`, {
          method: 'POST', body: JSON.stringify(data)
        }).then(r => r.json())
      };
    }
  });
}
const api = createApiClient('/api');
await api.users.get('123');   // GET /api/users/123
await api.orders.list();      // GET /api/orders
\`\`\`

**Performance**: Proxied access is 5–50x slower than direct access (varies by engine). V8 has improved, but the overhead is still measurable in tight loops.

**When NOT to use**:
- Hot paths (tight loops, frequent property access)
- Simple cases where a function or getter suffices
- When you need to support environments where Proxy is not polyfillable

**Common mistakes**:
- Using Proxy for things a simple getter/setter can handle
- Forgetting to use \`Reflect\` methods in traps — breaks invariants
- Not realizing Proxy identity: \`proxy !== target\` — breaks Map/Set lookups keyed by the original object

**Follow-up**: What is \`Reflect\` and why should you use it inside Proxy traps? How does Vue 3's reactivity system use Proxy?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Event delegation: how it works with DOM event bubbling and trade-offs vs direct listeners",
    content:
      "What is event delegation in JavaScript? How does it work with the DOM event bubbling model? What are the trade-offs compared to attaching listeners to individual elements?",
    answer: `**Event propagation phases**:
1. **Capture**: Event travels from \`document\` down to the target
2. **Target**: Event fires on the target element
3. **Bubble**: Event travels back up to \`document\`

**Delegation pattern**: Instead of attaching a listener to each \`<li>\` in a list, attach one to the \`<ul>\` and check \`event.target\`.

**Advantages**:
- **Memory**: One listener vs thousands (important for large lists/tables)
- **Dynamic elements**: Works for elements added after the listener is attached (no need to re-attach)
- **Simplified cleanup**: One listener to remove

**Disadvantages**:
- **Some events don't bubble**: \`focus\`, \`blur\`, \`scroll\` (use \`focusin\`/\`focusout\` or capture phase)
- **\`event.target\` complexity**: Need to traverse up to find the right element if children are nested
- **\`stopPropagation\` interference**: Other handlers calling \`stopPropagation()\` can prevent delegation from working

**Production example — todo list**:
\`\`\`js
document.querySelector('.todo-list').addEventListener('click', (e) => {
  const item = e.target.closest('[data-action]');
  if (!item) return;

  const action = item.dataset.action;
  const id = item.closest('[data-id]').dataset.id;

  switch (action) {
    case 'delete': deleteTodo(id); break;
    case 'toggle': toggleTodo(id); break;
    case 'edit': editTodo(id); break;
  }
});
// Works even for dynamically added todo items
\`\`\`

**Common mistakes**:
- Checking only \`event.target\` without using \`closest()\` — clicks on child elements (icons, spans) won't match
- Trying to delegate \`focus\`/\`blur\` events without using \`focusin\`/\`focusout\`
- Over-delegating to \`document.body\` when a closer parent would be more appropriate and performant

**Follow-up**: How does React's synthetic event system relate to event delegation? What is the difference between \`event.target\` and \`event.currentTarget\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Object.freeze vs Object.seal vs Object.preventExtensions: shallow immutability and TypeScript readonly",
    content:
      "What is the difference between `Object.freeze()`, `Object.seal()`, and `Object.preventExtensions()`? When would you use each in production? How do they interact with TypeScript's `readonly`?",
    answer: `**Three levels of restriction** (each includes the previous):
1. **\`Object.preventExtensions(obj)\`**: Can't add new properties. Can modify/delete existing ones
2. **\`Object.seal(obj)\`**: Can't add/delete properties or change property descriptors. Can still modify values
3. **\`Object.freeze(obj)\`**: Can't add/delete/modify anything. Fully immutable (shallow)

**All are shallow**: Nested objects are NOT affected. Use a deep freeze utility if needed.

**TypeScript \`readonly\`**: Compile-time only. \`readonly\` properties and \`Readonly<T>\` prevent assignment in TypeScript code but have zero runtime effect. \`as const\` creates a deeply readonly type at compile time.

**Production example — configuration object**:
\`\`\`ts
const config = Object.freeze({
  apiUrl: 'https://api.example.com',
  maxRetries: 3,
  timeouts: { connect: 5000, read: 10000 } // NOT frozen!
}) as const;

config.apiUrl = 'x';           // Runtime: silently fails (or throws in strict mode)
config.timeouts.connect = 999; // Runtime: SUCCEEDS — freeze is shallow!

// Deep freeze for full protection:
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) deepFreeze(value);
  }
  return Object.freeze(obj);
}
\`\`\`

**When to use**:
- \`Object.freeze\`: Configuration objects, constants that shouldn't be modified at runtime
- \`Object.seal\`: Objects where the shape is fixed but values can change (rare)
- \`preventExtensions\`: Almost never used directly
- \`Readonly<T>\` / \`as const\`: Preferred for compile-time safety without runtime overhead

**Common mistakes**:
- Assuming \`Object.freeze\` is deep — it only freezes the top level
- Expecting TypeScript \`readonly\` to prevent runtime mutations — it's compile-time only
- Not using strict mode — freeze violations silently fail in sloppy mode

**Follow-up**: What is the performance impact of \`Object.freeze\` on V8 optimizations? How would you implement a deep freeze that handles circular references?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
  {
    title:
      "Abstract Equality Algorithm: how == coerces types and when to intentionally use it",
    content:
      "What is the difference between `==` and `===` in JavaScript? Beyond the textbook answer, explain the Abstract Equality Comparison Algorithm and give a real example where `==` behaves unexpectedly in production code.",
    answer: `**\`===\` (Strict Equality)**: No type coercion. If types differ, returns \`false\`. Special cases: \`NaN !== NaN\`, \`+0 === -0\`.

**\`==\` (Abstract Equality)**: Follows a complex algorithm:
1. If types are the same, use \`===\`
2. \`null == undefined\` → \`true\` (and nothing else equals them)
3. Number vs String → convert string to number
4. Boolean vs anything → convert boolean to number first
5. Object vs primitive → call \`ToPrimitive\` (\`valueOf\`/\`toString\`)

**Surprising behavior**:
\`\`\`js
[] == false   // true: [] → '' → 0, false → 0
[] == ![]     // true: ![] is false, then same as above
'' == 0       // true
'0' == false  // true: false→0, '0'→0
\`\`\`

**Production bug — API response parsing**:
\`\`\`js
const status = response.headers['x-status']; // '0' (string)
if (status == false) {
  // This branch executes! '0' == false is true
  showError();
}
// Fix: use === or convert explicitly
if (status === '0') { ... }
\`\`\`

**Acceptable production use of \`==\`**: \`value == null\` is a common idiom to check for both \`null\` and \`undefined\` in one expression. ESLint's \`eqeqeq\` rule often has an exception for this.

**Common mistakes**:
- Assuming \`==\` just checks values — it actually runs a multi-step coercion algorithm
- Not knowing that \`[] == false\` is true while \`!![]\` is also true
- Banning \`==\` entirely without knowing the \`== null\` idiom

**Follow-up**: How does \`Object.is()\` differ from \`===\`? When would you use \`Object.is()\` over \`===\` in production code?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "javascript",
  },
];

// ============================================
// TYPESCRIPT — MIDDLE LEVEL (10 questions)
// ============================================

const typescriptMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "Structural typing vs nominal typing: accidental assignability and branded types",
    content:
      "Explain TypeScript's structural type system vs nominal typing. What problems does structural typing cause in large codebases, and what patterns can you use to simulate nominal types?",
    answer: `**Structural typing**: Two types are compatible if they have the same shape. This is flexible but can be dangerous:
\`\`\`ts
type UserId = string;
type OrderId = string;
function getUser(id: UserId) { ... }
getUser(orderId); // No error! Both are just \`string\`
\`\`\`

**Problems in large codebases**:
- Accidental mixing of semantically different IDs, currencies, units
- Functions accepting wrong types that happen to have the same shape
- Harder to refactor — renaming a type alias doesn't break anything

**Branded types pattern**:
\`\`\`ts
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function getUser(id: UserId) { ... }
const orderId = 'abc' as OrderId;
getUser(orderId); // Error! Types are incompatible
\`\`\`

**Alternative** — Use \`unique symbol\` for the brand to ensure uniqueness:
\`\`\`ts
declare const UserIdBrand: unique symbol;
type UserId = string & { [UserIdBrand]: never };
\`\`\`

**Production example — payment system**:
\`\`\`ts
type USD = Brand<number, 'USD'>;
type EUR = Brand<number, 'EUR'>;
function convertToEUR(amount: USD, rate: number): EUR {
  return (amount * rate) as EUR;
}
const eurAmount: EUR = 100 as EUR;
convertToEUR(eurAmount, 1.1); // Compile error — can't pass EUR as USD
\`\`\`

**Trade-off**: Branded types add casting ceremony at boundaries but provide compile-time safety for domain-critical types.

**Common mistakes**:
- Assuming type aliases create distinct types — they don't in TypeScript
- Over-branding everything instead of only domain-critical types
- Forgetting to create constructor functions to avoid \`as\` casts scattered throughout the code

**Follow-up**: How do branded types interact with serialization/deserialization (e.g., JSON from an API)? What are opaque types in Flow, and how do they compare?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "unknown vs any: type safety at system boundaries and narrowing techniques",
    content:
      "Explain the difference between `unknown` and `any` in TypeScript. Why should a production codebase prefer `unknown`? How do you safely narrow an `unknown` value?",
    answer: `**\`any\`**: Opts out of the type system. You can assign \`any\` to anything and access any property. Errors only appear at runtime.

**\`unknown\`**: Top type — any value can be assigned to it, but you can't do anything with it without narrowing first. It forces explicit type checking.

**Narrowing techniques**:
1. \`typeof\` checks: \`if (typeof x === 'string')\`
2. \`instanceof\`: \`if (x instanceof Error)\`
3. Type predicates: \`function isUser(x: unknown): x is User\`
4. Discriminated unions: Check a \`type\` or \`kind\` field
5. Schema validation: \`zod.parse()\`, \`io-ts\`, \`ajv\`

**Why \`unknown\` > \`any\` in production**:
- Catches bugs at compile time
- Forces developers to handle edge cases
- Makes data boundaries explicit
- Pairs well with validation libraries

**API response handling**:
\`\`\`ts
// Bad: trusting the API shape
async function getUser(id: string): Promise<any> {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json(); // any — no safety
}

// Good: validate at the boundary
async function getUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  const data: unknown = await res.json();
  return userSchema.parse(data); // throws if shape doesn't match
}
\`\`\`

**When \`any\` is acceptable**: Legacy code migration, third-party library typings that are broken, performance-critical generic code where the overhead of narrowing isn't justified.

**Common mistakes**:
- Using \`any\` for API responses because it's 'easier' — this pushes errors to runtime
- Casting \`unknown\` directly with \`as Type\` instead of properly narrowing — defeats the purpose
- Confusing \`unknown\` with \`never\` — \`unknown\` accepts all values, \`never\` accepts none

**Follow-up**: What is the \`never\` type and when does TypeScript infer it? How would you type a generic function that accepts \`unknown\` and returns a narrowed type?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Composing utility types: deriving DTOs from a single source of truth",
    content:
      "Explain TypeScript's `Partial`, `Required`, `Pick`, `Omit`, and `Record` utility types. Give a real-world example where composing these types simplifies your API contracts.",
    answer: `**\`Partial<T>\`**: \`{ [K in keyof T]?: T[K] }\` — all fields become optional. Great for update operations where you send only changed fields.

**\`Required<T>\`**: Opposite of \`Partial\` — makes all optional fields required.

**\`Pick<T, K>\`**: Creates a type with only the specified keys from T. Use for selecting fields for a specific view.

**\`Omit<T, K>\`**: Creates a type excluding specified keys. Use for hiding internal fields.

**\`Record<K, V>\`**: \`{ [key in K]: V }\` — creates a mapped type. Use for dictionaries, lookup tables.

**Composition principle** — derive DTOs from a base type instead of defining separate interfaces:
\`\`\`ts
type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'passwordHash'>
  & { password: string };
type UpdateUserDTO = Partial<Pick<User, 'name' | 'email'>>;
type UserResponse = Omit<User, 'passwordHash'>;
\`\`\`

**Settings management example**:
\`\`\`ts
type AppSettings = {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  fontSize: number;
};

// API endpoint accepts partial updates
async function updateSettings(
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  return api.patch('/settings', patch);
}

// Feature-specific settings view
type DisplaySettings = Pick<AppSettings, 'theme' | 'fontSize'>;
\`\`\`

**Common mistakes**:
- Defining parallel interfaces manually instead of deriving them with utility types — leads to drift
- Using \`Omit\` with string literals that don't exist in the type — TypeScript won't warn you
- Not realizing \`Pick\` and \`Omit\` create new types — they don't modify the original

**Follow-up**: How would you build a custom utility type like \`DeepPartial<T>\` for nested objects? What is the difference between \`Omit\` and using a mapped type with \`Exclude\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Generics with constraints: typing a flexible keyBy utility function",
    content:
      "Explain TypeScript Generics with constraints. How would you type a function that accepts any object with an `id` field and returns a Map keyed by that `id`?",
    answer: `**Generics basics**: Allow functions/classes to work with multiple types while maintaining type safety. Instead of \`any\`, the type variable \`T\` preserves specific types.

**Constraints** (\`extends\`): Restrict what types \`T\` can be. \`T extends { id: string }\` means T must have at least an \`id\` property of type \`string\`.

**Implementing \`keyBy\`**:
\`\`\`ts
function keyBy<T extends { id: PropertyKey }>(
  items: T[]
): Map<T['id'], T> {
  const map = new Map<T['id'], T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}
\`\`\`

**Generic keyBy** (key by any field):
\`\`\`ts
function keyBy<T, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T> {
  const map = new Map<T[K], T>();
  for (const item of items) {
    map.set(item[key], item);
  }
  return map;
}

const userMap = keyBy(users, 'id');    // Map<string, User>
const emailMap = keyBy(users, 'email'); // Map<string, User>
\`\`\`

**Key concepts**: \`keyof T\` gives union of T's keys. \`T[K]\` is an indexed access type — the type of property \`K\` on \`T\`. This preserves specific return types without manual annotation.

**Production usage — normalizing API response**:
\`\`\`ts
interface User { id: string; name: string; email: string; }

const users = await fetchUsers();
const userMap = keyBy(users, 'id');

// Type-safe access:
const user = userMap.get('abc'); // User | undefined
// TypeScript prevents: keyBy(users, 'nonexistent') — compile error
\`\`\`

**Common mistakes**:
- Using \`any\` instead of generics when the input type should flow through to the output
- Over-constraining generics — adding constraints that aren't needed by the function body
- Forgetting that \`keyof T\` returns \`string | number | symbol\`, which may need narrowing

**Follow-up**: What is the difference between \`T extends U\` in a generic constraint vs in a conditional type? How would you make this function work with readonly arrays?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Discriminated unions and exhaustive pattern matching for domain modeling",
    content:
      "Explain TypeScript's discriminated unions. How do they enable exhaustive pattern matching, and why are they preferred over class hierarchies for modeling domain states?",
    answer: `**Structure**: Each variant has a shared property with a unique literal type:
\`\`\`ts
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'loading' };
\`\`\`

**Narrowing**: \`switch\`/\`if\` on the discriminant narrows the type:
\`\`\`ts
function handle(result: Result<User>) {
  switch (result.status) {
    case 'success': return result.data; // TS knows data exists
    case 'error': throw result.error;   // TS knows error exists
    case 'loading': return null;
  }
}
\`\`\`

**Exhaustive checking**:
\`\`\`ts
function assertNever(x: never): never {
  throw new Error(\`Unexpected: \${x}\`);
}
// Add to default case — if you add a new variant and forget to handle it,
// TypeScript gives a compile error because x won't be \`never\`.
\`\`\`

**Why preferred over class hierarchies**:
- No runtime overhead (no class instances, no vtable)
- Naturally serializable (plain objects work with JSON)
- Adding a new variant forces handling everywhere (exhaustive checking)
- Open for extension without modifying existing code

**API request state in a React app**:
\`\`\`ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; retryCount: number };

function renderUserProfile(state: AsyncState<User>) {
  switch (state.status) {
    case 'idle': return <EmptyState />;
    case 'loading': return <Spinner />;
    case 'success': return <Profile user={state.data} />;
    case 'error': return <Error msg={state.error} retries={state.retryCount} />;
  }
}
\`\`\`
If you later add \`{ status: 'retrying'; attempt: number }\`, every switch that doesn't handle it will fail to compile.

**Common mistakes**:
- Using string enums as discriminants but not making them literal types — loses narrowing
- Forgetting exhaustive checks — adding variants without handling them everywhere
- Nesting discriminated unions too deeply — makes code harder to follow

**Follow-up**: How do discriminated unions interact with generic types? What is the \`satisfies\` operator and how does it help?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "The 'infer' keyword in conditional types: type-level pattern matching",
    content:
      "Explain TypeScript's `infer` keyword in conditional types. How would you use it to extract the return type of a function or the element type of an array?",
    answer: `**Syntax**: \`T extends SomeType<infer U> ? U : Default\`

\`infer U\` tells TypeScript: "If T matches this pattern, capture the unknown part as U."

**Built-in examples**:
\`\`\`ts
// ReturnType<T> is implemented as:
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Parameters<T>:
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
\`\`\`

**Custom extractors**:
\`\`\`ts
// Extract element type from array
type ElementOf<T> = T extends (infer E)[] ? E : never;
type X = ElementOf<string[]>; // string

// Extract Promise resolved type
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type Y = Awaited<Promise<Promise<number>>>; // number (recursive!)

// Extract props from a React component
type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;
\`\`\`

**Multiple \`infer\` positions**:
\`\`\`ts
type FirstAndLast<T> = T extends [infer F, ...any[], infer L]
  ? [F, L]
  : never;
type Z = FirstAndLast<[1, 2, 3, 4]>; // [1, 4]
\`\`\`

**Production usage — event system**:
\`\`\`ts
type EventMap = {
  userCreated: (user: User) => void;
  orderPlaced: (order: Order, timestamp: Date) => void;
};

type EventPayload<K extends keyof EventMap> =
  EventMap[K] extends (...args: infer P) => any ? P : never;

type UserCreatedPayload = EventPayload<'userCreated'>; // [User]
type OrderPayload = EventPayload<'orderPlaced'>; // [Order, Date]

function emit<K extends keyof EventMap>(
  event: K,
  ...args: EventPayload<K>
) { ... }
emit('orderPlaced', order, new Date()); // fully type-safe
\`\`\`

**Common mistakes**:
- Using \`infer\` outside of a conditional type's \`extends\` clause — it's only valid there
- Not handling the false branch of the conditional — defaulting to \`any\` instead of \`never\`
- Creating overly complex nested \`infer\` types that become unreadable

**Follow-up**: How do \`infer\` and template literal types combine for string parsing at the type level? What is the difference between \`Awaited<T>\` and a simple \`T extends Promise<infer U> ? U : T\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "The 'satisfies' operator: validation without widening and practical patterns",
    content:
      "Explain TypeScript's `satisfies` operator introduced in 4.9. How does it differ from type annotations and `as` assertions? When should you use it in production code?",
    answer: `**The problem**: Type annotation widens, \`as\` lies.
\`\`\`ts
type Color = string | [number, number, number];

// Annotation: widens to Record<string, Color> — loses specific key info
const palette: Record<string, Color> = { red: [255,0,0], blue: '#0000ff' };
palette.red; // Color — we lost the fact it's an RGB tuple

// As: no validation — could be wrong
const palette = { red: [255,0,0] } as Record<string, Color>;
// No error even if you misspell a color format
\`\`\`

**\`satisfies\`**: Validates AND preserves narrow type.
\`\`\`ts
const palette = {
  red: [255, 0, 0],
  blue: '#0000ff'
} satisfies Record<string, Color>;

palette.red;   // [number, number, number] — preserved!
palette.green; // Error — 'green' doesn't exist
\`\`\`

**When to use**:
1. Configuration objects — validate shape, keep literal types
2. Constants with \`as const satisfies Type\` — immutable and validated
3. Route definitions — validate against a schema while keeping specific route types
4. Enum-like objects — ensure all cases are covered while preserving specific values

**Route configuration example**:
\`\`\`ts
type Route = { path: string; auth: boolean; roles?: string[] };

const routes = {
  home: { path: '/', auth: false },
  dashboard: { path: '/dashboard', auth: true, roles: ['admin', 'user'] },
  settings: { path: '/settings', auth: true }
} satisfies Record<string, Route>;

// routes.home.path is string (validated)
// routes.dashboard.roles is string[] (preserved, not string[] | undefined)
type RouteKeys = keyof typeof routes; // 'home' | 'dashboard' | 'settings'
\`\`\`

**Common mistakes**:
- Using \`as const satisfies\` but forgetting that \`as const\` makes arrays \`readonly\` — may conflict with mutable type expectations
- Confusing \`satisfies\` with \`:Type\` annotation — annotation changes the variable's type, \`satisfies\` doesn't
- Using \`satisfies\` everywhere — it's most valuable for complex constants, not every variable

**Follow-up**: Can you combine \`satisfies\` with generic types? How does \`satisfies\` interact with mapped types and index signatures?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Mapped types and template literal types: building type-safe event emitters",
    content:
      "How do TypeScript mapped types work? Combine them with template literal types to build a type-safe event system where event handler names are derived from event names (e.g., 'click' → 'onClick').",
    answer: `**Mapped types**: Transform each property of an existing type:
\`\`\`ts
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Optional<T> = { [K in keyof T]?: T[K] };
\`\`\`

**Template literal types**: String manipulation at the type level:
\`\`\`ts
type EventName = 'click' | 'focus' | 'blur';
type HandlerName = \`on\${Capitalize<EventName>}\`;
// 'onClick' | 'onFocus' | 'onBlur'
\`\`\`

**Combining both — type-safe event system**:
\`\`\`ts
type Events = {
  click: { x: number; y: number };
  focus: { target: HTMLElement };
  submit: { formData: FormData };
};

// Generate handler props from events
type EventHandlers<E extends Record<string, unknown>> = {
  [K in keyof E as \`on\${Capitalize<string & K>}\`]: (payload: E[K]) => void;
};

type Props = EventHandlers<Events>;
// {
//   onClick: (payload: { x: number; y: number }) => void;
//   onFocus: (payload: { target: HTMLElement }) => void;
//   onSubmit: (payload: { formData: FormData }) => void;
// }
\`\`\`

**Key remapping** (\`as\` clause): The \`as\` in \`[K in keyof E as ...]\` remaps the key. You can filter, rename, or transform keys:
\`\`\`ts
// Remove specific keys
type WithoutId<T> = { [K in keyof T as Exclude<K, 'id'>]: T[K] };

// Getters
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
\`\`\`

**Practical usage — API client**:
\`\`\`ts
type Endpoints = {
  users: User[];
  posts: Post[];
  comments: Comment[];
};

type ApiClient = {
  [K in keyof Endpoints as \`fetch\${Capitalize<string & K>}\`]:
    () => Promise<Endpoints[K]>;
};
// { fetchUsers: () => Promise<User[]>; fetchPosts: () => ... }
\`\`\`

**Common mistakes**:
- Forgetting \`string &\` when using \`Capitalize\` — \`keyof T\` can be \`string | number | symbol\`
- Over-engineering type transformations that could be simple interfaces
- Not testing mapped types with edge cases (empty objects, optional properties)

**Follow-up**: How do you make a mapped type that only transforms certain keys? Can template literal types parse strings (e.g., extract route params from \`'/users/:id/posts/:postId'\`)?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Type guards and type predicates: narrowing at runtime with full type safety",
    content:
      "What are type guards in TypeScript? Explain `typeof`, `instanceof`, `in`, and custom type predicates. When would you write a custom type guard function vs using inline checks?",
    answer: `**Built-in type guards**:

1. **\`typeof\`**: Narrows to primitive types
\`\`\`ts
function process(value: string | number) {
  if (typeof value === 'string') {
    value.toUpperCase(); // TS knows it's string
  }
}
\`\`\`

2. **\`instanceof\`**: Narrows to class instances
\`\`\`ts
if (error instanceof TypeError) {
  error.message; // TS knows it's TypeError
}
\`\`\`

3. **\`in\` operator**: Narrows by property existence
\`\`\`ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };
function move(pet: Fish | Bird) {
  if ('swim' in pet) {
    pet.swim(); // TS knows it's Fish
  }
}
\`\`\`

**Custom type predicates** (\`x is Type\`):
\`\`\`ts
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    typeof (value as User).email === 'string'
  );
}

// Usage
const data: unknown = await response.json();
if (isUser(data)) {
  data.email; // TS knows it's User
}
\`\`\`

**When to write custom type guards**:
- When the check is reused in multiple places
- When narrowing complex union types
- When validating data from external sources (APIs, user input)
- When the logic is too complex for inline checks

**When inline checks suffice**:
- Simple \`typeof\` or \`instanceof\` checks used once
- Discriminated unions where \`switch\` on a discriminant handles narrowing

**Important caveat**: TypeScript trusts your type predicate. If your implementation is wrong, you've created a type-unsafe hole:
\`\`\`ts
// DANGEROUS — always returns true
function isString(x: unknown): x is string {
  return true; // TS won't catch this!
}
\`\`\`

**Common mistakes**:
- Writing type predicates with incorrect validation logic — TypeScript trusts you completely
- Using \`typeof null === 'object'\` without null checking — classic JS gotcha
- Over-relying on type assertions (\`as\`) instead of proper type guards

**Follow-up**: How do assertion functions (\`asserts x is Type\`) differ from type predicates? When would you use a schema validation library (Zod, io-ts) instead of manual type guards?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
  {
    title:
      "Declaration merging and module augmentation: extending third-party types safely",
    content:
      "How does TypeScript's declaration merging work? When would you use module augmentation to extend third-party library types? What are the risks?",
    answer: `**Declaration merging**: TypeScript merges multiple declarations with the same name in the same scope:
- **Interface merging**: Two interfaces with the same name merge their members
- **Namespace merging**: Namespaces merge with classes, functions, or enums
- **Module augmentation**: Extend module declarations from external packages

**Interface merging**:
\`\`\`ts
interface User { name: string; }
interface User { email: string; }
// Result: interface User { name: string; email: string; }
\`\`\`

**Module augmentation** — extending Express Request:
\`\`\`ts
// types/express.d.ts
import { User } from '../models/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    sessionId?: string;
  }
}

// Now in your middleware:
app.use((req, res, next) => {
  req.user = authenticateUser(req); // No error, type-safe
  next();
});
\`\`\`

**Extending a library's type map** — e.g., adding custom events:
\`\`\`ts
declare module 'socket.io' {
  interface ServerToClientEvents {
    customNotification: (data: NotificationPayload) => void;
  }
}
\`\`\`

**Global augmentation**:
\`\`\`ts
declare global {
  interface Window {
    analytics: AnalyticsSDK;
  }
}
export {}; // makes this a module
\`\`\`

**Risks and best practices**:
- **Version drift**: Your augmentation may conflict with future library updates
- **Hidden dependencies**: Other developers may not know why a type has extra fields
- **Over-augmentation**: Adding too many properties to global types pollutes the type space
- **Best practice**: Keep augmentations in a dedicated \`types/\` directory, document why they exist

**Common mistakes**:
- Forgetting \`export {}\` in a \`.d.ts\` file — without it, the file is a global script, not a module
- Augmenting the wrong module path (e.g., \`express\` vs \`express-serve-static-core\`)
- Using \`declare module\` in a non-module file — creates an ambient module instead of augmenting

**Follow-up**: What is the difference between \`.d.ts\` files and regular \`.ts\` files? How does \`declare global\` work and when should you use it?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "typescript",
  },
];

// ============================================
// EXPORT ALL MIDDLE JS/TS QUESTIONS
// ============================================

export const middleJsTsQuestions: QuestionSeed[] = [
  ...javascriptMiddleQuestions,
  ...typescriptMiddleQuestions,
];

// Summary
console.log("=".repeat(50));
console.log("MIDDLE-LEVEL JS/TS INTERVIEW QUESTIONS");
console.log("=".repeat(50));
console.log(`JavaScript: ${javascriptMiddleQuestions.length}`);
console.log(`TypeScript: ${typescriptMiddleQuestions.length}`);
console.log(`Total: ${middleJsTsQuestions.length}`);
console.log("=".repeat(50));
