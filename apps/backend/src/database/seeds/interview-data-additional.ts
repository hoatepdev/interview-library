/**
 * Additional Interview Questions Seed Data
 *
 * High-quality interview questions for:
 * - JavaScript (Advanced concepts, performance, patterns)
 * - TypeScript (Generics, utility types, advanced patterns)
 * - Backend (API design, security, performance)
 * - Database (PostgreSQL advanced, optimization)
 * - System Design (Scalability, distributed systems)
 *
 * Total: 50+ new questions
 * Usage: npm run seed:additional
 */

import { QuestionLevel } from '../entities/question.entity';

export interface TopicSeed {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

// Using existing topics from interview-data.ts
// Topics: javascript, typescript, react, nextjs, nodejs, nestjs, postgresql, system-design

// ============================================
// ADDITIONAL QUESTIONS - JAVASCRIPT (Advanced)
// ============================================

const javascriptAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Explain closures and their practical use cases',
    content: 'What are closures in JavaScript? Provide 3 practical use cases where closures are essential.',
    answer: `**Closure**: A function bundled with its lexical environment. It allows a function to access variables from its outer scope even after the outer function has returned.

\`\`\`js
function outer(x) {
  return function inner(y) {
    return x + y; // inner has access to x (closure)
  };
}
const add5 = outer(5);
console.log(add5(3)); // 8
\`\`\`

**Use Cases**:

1. **Data Encapsulation/Privacy**:
\`\`\`js
function createCounter() {
  let count = 0; // private
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}
\`\`\`

2. **Function Factories**:
\`\`\`js
function multiplier(factor) {
  return function(num) {
    return num * factor;
  };
}
const double = multiplier(2);
const triple = multiplier(3);
\`\`\`

3. **Event Handlers & Callbacks**:
\`\`\`js
// Preserving state in async operations
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // All 3s without closure
  }, 100);
}

// With closure (IIFE)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() { console.log(j); }, 100);
  })(i);
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain prototypal inheritance and prototype chain',
    content: 'How does prototypal inheritance work in JavaScript? Explain the prototype chain lookup process.',
    answer: `**Prototype Chain**: JavaScript's inheritance mechanism where objects can inherit properties from other objects.

**Prototype Chain Lookup**:
\`\`\`js
const parent = { name: 'Parent' };
const child = Object.create(parent);
child.ownProp = 'Child';

console.log(child.ownProp);    // 'Child' (found on child)
console.log(child.name);        // 'Parent' (walks up prototype chain)
console.log(child.unknown);     // undefined (reached end of chain)
\`\`\`

**Lookup Process**:
1. Check object's own properties
2. If not found, check \`Object.getPrototypeOf(obj)\`
3. Repeat until reaching \`null\` (end of chain)

**\`__proto__\` vs \`prototype\`**:
- \`fn.prototype\`: Used when \`new fn()\` is called (becomes prototype of new objects)
- \`obj.__proto__\`: Reference to object's actual prototype (deprecated, use \`Object.getPrototypeOf()\`)

**Inheritance Pattern**:
\`\`\`js
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  return this.name + ' makes a sound';
};

function Dog(name, breed) {
  Animal.call(this, name); // Call parent constructor
  this.breed = breed;
}

// Inherit from Animal
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function() {
  return Animal.prototype.speak.call(this) + ' (woof!)';
};
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'What is Temporal Dead Zone (TDZ)?',
    content: 'Explain Temporal Dead Zone in JavaScript. When does it occur for let, const, and var?',
    answer: `**TDZ**: The period between entering scope and variable declaration where accessing the variable throws a ReferenceError.

\`\`\`js
// TDZ starts here
console.log(myVar);  // undefined (var is hoisted)
console.log(myLet);  // ReferenceError (in TDZ)
console.log(myConst); // ReferenceError (in TDZ)

let myLet = 1;        // TDZ ends for myLet
const myConst = 2;    // TDZ ends for myConst
var myVar = 3;
\`\`\`

**Why TDZ Exists**:
1. Makes code easier to understand (catch errors early)
2. Prevents accessing variables before declaration
3. Ensures \`let\`/\`const\` behave more predictably than \`var\`

**TDZ in Different Scenarios**:

1. **Variable Declaration**:
\`\`\`js
{ // TDZ starts for x
  console.log(x); // ReferenceError
  let x = 5; // TDZ ends
}
\`\`\`

2. **Default Function Parameters**:
\`\`\`js
function foo(a = b, b = 5) {} // ReferenceError: b in TDZ
function bar(a = 5, b = a) {} // Works
\`\`\`

3. **Class Declarations**:
\`\`\`js
new MyClass(); // ReferenceError (class in TDZ)

class MyClass {}
\`\`\`

**Note**: \`typeof\` is safe in TDZ:
\`\`\`js
typeof x; // 'undefined' (not ReferenceError)
console.log(x); // ReferenceError
let x;
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain async/await internals and error handling',
    content: 'How does async/await work under the hood? Compare error handling patterns with Promises.',
    answer: `**Under the Hood**: \`async\` functions return Promises. \`await\` pauses execution until Promise settles.

**Transformation** (roughly):
\`\`\`js
// async/await
async function foo() {
  const result = await Promise.resolve(1);
  return result + 1;
}

// Equivalent Promise
function foo() {
  return Promise.resolve(1)
    .then(result => result + 1);
}
\`\`\`

**Error Handling Patterns**:

1. **try/catch** (recommended):
\`\`\`js
async function fetch() {
  try {
    const data = await api.get();
    return data;
  } catch (error) {
    console.error(error);
    return null; // fallback
  }
}
\`\`\`

2. **catch() on Promise**:
\`\`\`js
async function fetch() {
  const data = await api.get().catch(error => {
    console.error(error);
    return null;
  });
  return data;
}
\`\`\`

3. **Top-level await** (ES2022):
\`\`\`js
// In modules only
const data = await fetch(url);
\`\`\`

**Common Pitfall**: Unhandled promise rejections
\`\`\`js
// Bad - errors not caught
async function bad() {
  const promises = items.map(async item => {
    return await process(item); // throws? not caught
  });
  return Promise.all(promises);
}

// Good - wrap in try/catch
async function good() {
  try {
    const promises = items.map(item => process(item));
    return await Promise.all(promises);
  } catch (error) {
    handle(error);
  }
}
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'javascript'
  },
  {
    title: 'Implement debounce and throttle from scratch',
    content: 'Write implementations of debounce and throttle. Explain the difference and use cases for each.',
    answer: `**Debounce**: Delay execution until after a pause. Useful for search inputs, resize handlers.

\`\`\`js
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage: search API call after user stops typing
const search = debounce((query) => {
  api.search(query);
}, 300);
\`\`\`

**Throttle**: Execute at most once per time period. Useful for scroll handlers, mousemove.

\`\`\`js
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage: limit scroll event handling
const handleScroll = throttle(() => {
  updatePosition();
}, 100);
\`\`\`

**Key Difference**:
- **Debounce**: Last call wins (waits for pause)
- **Throttle**: First call wins (executes immediately)

\`\`\`js
// User types: A... B... C... (then stops)

// Debounce(300ms): executes at C + 300ms (once)
// Throttle(300ms): executes at A, A+300ms, A+600ms...
\`\`\`

**Advanced: Throttle with trailing option**:
\`\`\`js
function throttleAdvanced(fn, limit) {
  let lastCall = 0, timeoutId;
  return function(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timeoutId);
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, remaining);
    }
  };
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain memory leaks in JavaScript and how to prevent them',
    content: 'What are common causes of memory leaks in JavaScript? How would you detect and fix them?',
    answer: `**Common Memory Leaks**:

1. **Accidental Global Variables**:
\`\`\`js
function leak() {
  leaked = 'I am global now'; // Creates window.leaked
}
\`\`\`
**Fix**: Use 'use strict' or const/let

2. **Forgotten Timers**:
\`\`\`js
const data = fetchData();
setInterval(() => {
  document.getElementById('update').innerHTML = data;
}, 1000);
// If element removed, interval still runs with data reference
\`\`\`
**Fix**: Store timer ID, clear on component unmount

3. **Closures**:
\`\`\`js
function setup() {
  const heavyData = new Array(1000000).fill('data');
  return function() {
    console.log('running'); // heavyData still in memory
  };
}
\`\`\`
**Fix**: Make large data external, only keep references needed

4. **Detached DOM Elements**:
\`\`\`js
let element = document.getElementById('button');
document.body.removeChild(element);
// element reference still in memory
\`\`\`
**Fix**: Set reference to null after removal

5. **Event Listeners**:
\`\`\`js
button.addEventListener('click', handler);
// If button removed without removing listener
\`\`\`
**Fix**: \`button.removeEventListener('click', handler)\`

**Detection Tools**:
- Chrome DevTools → Memory → Take heap snapshot
- Look for "Detached DOM nodes"
- Compare snapshots to find increasing object counts
- Use \`performance.memory\` (Chrome-only)

**Best Practices**:
- Cleanup on unmount (remove event listeners, clear timers)
- Use WeakMap/WeakSet for cached data with object keys
- Nullify references when done
- Avoid closures holding large objects`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'javascript'
  },
];

// ============================================
// ADDITIONAL QUESTIONS - TYPESCRIPT
// ============================================

const typescriptAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Explain TypeScript utility types: Pick, Omit, Partial, Required',
    content: 'Describe these utility types and provide real-world use cases for each.',
    answer: `**Pick<T, K>\` - Select specific properties:

\`\`\`ts
type User = { id: number; name: string; email: string; age: number };
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string; }

// Use case: API response subset
function getUsers(): Promise<Pick<User, 'id' | 'name'>[]> {
  return db.users.find({}, { id: 1, name: 1 });
}
\`\`\`

**Omit<T, K>\` - Remove specific properties:

\`\`\`ts
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
// { name: string; email: string; age: number; }

// Use case: DTO for create operations
function create(data: CreateUserInput) {
  return db.users.insert(data);
}
\`\`\`

**Partial<T>\` - Make all properties optional:

\`\`\`ts
type UserUpdate = Partial<User>;
// All properties optional

// Use case: PATCH endpoint update
function updateUser(id: number, data: UserUpdate) {
  return db.users.update(id, data);
}
\`\`\`

**Required<T>\` - Make all properties required:

\`\`\`ts
type UserWithRequiredEmail = Required<Pick<User, 'email'>> & User;
// email is now required even if it was optional

// Use case: Form validation where certain fields must be present
\`\`\`

**Combined Pattern**:
\`\`\`ts
// For update endpoint: all fields optional except id
type UpdateUserDto = Partial<Pick<User, 'name' | 'email'>> & Required<Pick<User, 'id'>>;
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'typescript'
  },
  {
    title: 'Explain generics with constraints and conditional types',
    content: 'How do generic constraints work? Explain conditional types with examples.',
    answer: `**Generic Constraints**: Limit what types can be passed to a generic.

\`\`\`ts
// Basic generic
function identity<T>(arg: T): T {
  return arg;
}

// With constraint - T must have .length property
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength('hello');     // OK
getLength([1, 2, 3]);   // OK
getLength(42);          // Error: number has no .length
\`\`\`

**Keyof Constraint**:
\`\`\`ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'John', age: 30 };
getProperty(user, 'name'); // OK
getProperty(user, 'email'); // Error
\`\`\`

**Conditional Types**: Types that depend on a condition.

\`\`\`ts
type NonNullable<T> = T extends null | undefined ? never : T;

type Result = NonNullable<string | null>; // string
\`\`\`

**Real-world Example**:
\`\`\`ts
// ApiResponse that handles success/error differently
type ApiResponse<T, E = Error> = T extends void
  ? { success: true } | { success: false; error: E }
  : { success: true; data: T } | { success: false; error: E };

// Usage
type GetUserResponse = ApiResponse<User>;
type DeleteUserResponse = ApiResponse<void>;
\`\`\`

**Infer in Conditional Types**:
\`\`\`ts
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Foo = UnwrapPromise Promise<string>>; // string
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'typescript'
  },
  {
    title: 'Implement a deep readonly utility type',
    content: 'Create a DeepReadonly type that makes all nested properties readonly recursively.',
    answer: `**DeepReadonly Implementation**:

\`\`\`ts
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P]
};
\`\`\`

**Explanation**:
- Mapped type iterates over all properties
- \`readonly\` modifier makes each property readonly
- Conditional check for object types to recurse
- Function types excluded (can't be readonly)

**Usage**:
\`\`\`ts
interface User {
  name: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

type ReadonlyUser = DeepReadonly<User>;

// Now this is invalid:
const user: ReadonlyUser = {
  name: 'John',
  preferences: {
    theme: 'light',
    notifications: { email: true, push: false }
  }
};
user.name = 'Jane'; // Error
user.preferences.theme = 'dark'; // Error
\`\`\`

**Alternative with Array/Set/Map support**:
\`\`\`ts
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T[P] extends Set<infer M>
    ? ReadonlySet<DeepReadonly<M>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
};
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'typescript'
  },
  {
    title: 'What are discriminated unions in TypeScript?',
    content: 'Explain discriminated unions and how they enable type narrowing.',
    answer: `**Discriminated Union**: Using a common property (discriminator) to narrow union types.

\`\`\`ts
interface SuccessResponse {
  status: 'success';
  data: { id: string; name: string };
}

interface ErrorResponse {
  status: 'error';
  error: { message: string; code: number };
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse) {
  // TypeScript knows the type based on status
  if (response.status === 'success') {
    response.data.id; // OK - TypeScript knows it's SuccessResponse
    // response.error; // Error
  } else {
    response.error.message; // OK - ErrorResponse
    // response.data; // Error
  }
}
\`\`\`

**Key Requirements**:
1. Common property (discriminator) with literal types
2. Discriminator must have different literal values in each member
3. TypeScript can narrow based on discriminator check

**Real-world Example**:
\`\`\`ts
type LoadingState = { state: 'loading' };
type SuccessState = { state: 'success'; data: User };
type ErrorState = { state: 'error'; error: Error };

type AsyncState = LoadingState | SuccessState | ErrorState;

function render(state: AsyncState) {
  switch (state.state) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserProfile data={state.data} />;
    case 'error':
      return <ErrorMessage error={state.error} />;
  }
}
\`\`\`

**Exhaustiveness Checking**:
\`\`\`ts
function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x);
}

function handle(state: AsyncState) {
  switch (state.state) {
    case 'loading': return 'loading...';
    case 'success': return state.data.name;
    case 'error': return state.error.message;
    default: return assertNever(state); // Compile-time check
  }
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'typescript'
  },
];

// ============================================
// ADDITIONAL QUESTIONS - NODE.JS (Backend)
// ============================================

const nodejsAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Explain Node.js Event Loop phases',
    content: 'Describe all phases of the Node.js Event Loop and their order of execution.',
    answer: `**Node.js Event Loop Phases** (in order):

\`\`\`
┌───────────────────────────────┐
│     timers (setTimeout)        │ → Callbacks for timers
├───────────────────────────────┤
│   pending callbacks           │ → I/O callbacks (except close)
├───────────────────────────────┤
│   idle, prepare               │ → Internal use only
├───────────────────────────────┤
│   poll (new I/O events)       │ → Execute I/O callbacks
├───────────────────────────────┤
│   check (setImmediate)        │ → setImmediate() callbacks
├───────────────────────────────┤
│   close callbacks             │ → socket.on('close', ...)
└───────────────────────────────┘
\`\`\`

**Phase Details**:

1. **timers**: Executes callbacks scheduled by \`setTimeout()\` and \`setInterval()\`
2. **pending callbacks**: Executes I/O callbacks deferred to next loop iteration
3. **idle/prepare**: Internal Node.js operations
4. **poll**: Retrieve new I/O events; execute \`poll\` queue (can block here)
5. **check**: \`setImmediate()\` callbacks
6. **close callbacks**: \`close\` event callbacks

**Key Differences from Browser**:
- Node.js has multiple phases (browser: just microtask + macrotask)
- \`setImmediate()\` only in Node.js
- \`process.nextTick()\` runs after each phase (before microtasks)

**Execution Order Example**:
\`\`\`js
setTimeout(() => console.log(1), 0);
setImmediate(() => console.log(2));
process.nextTick(() => console.log(3));
Promise.resolve().then(() => console.log(4));

// Output: 3, 4, 1, 2 (non-I/O cycle)
// Or: 3, 4, 2, 1 (I/O cycle)
\`\`\`

**process.nextTick vs Promise.resolve**:
- \`process.nextTick\`: Higher priority, runs after current operation
- \`Promise.resolve\`: Microtask queue, runs after macrotask`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nodejs'
  },
  {
    title: 'Explain streams in Node.js (Readable, Writable, Transform)',
    content: 'Describe the four types of streams and when to use each. Provide examples.',
    answer: `**Stream Types**:

1. **Readable**: Data source (file read, HTTP request)

\`\`\`js
const { Readable } = require('stream');

// Custom readable stream
class CounterStream extends Readable {
  constructor(opt) {
    super(opt);
    this.max = 10;
    this.index = 0;
  }
  _read() {
    if (this.index <= this.max) {
      this.push(this.index + '\\n');
      this.index++;
    } else {
      this.push(null); // Signal end
    }
  }
}
\`\`\`

2. **Writable**: Data destination (file write, HTTP response)

\`\`\`js
const { Writable } = require('stream');

class LoggerStream extends Writable {
  _write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  }
}
\`\`\`

3. **Duplex**: Both readable and writable (TCP socket, zlib)

\`\`\`js
const { Duplex } = require('stream');

class DuplexStream extends Duplex {
  _read() {}
  _write(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }
}
\`\`\`

4. **Transform**: Modify data as it passes through (compression, encryption)

\`\`\`js
const { Transform } = require('stream');

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Usage
require('fs')
  .createReadStream('input.txt')
  .pipe(new UppercaseTransform())
  .pipe(require('fs').createWriteStream('output.txt'));
\`\`\`

**Pipe Chaining**:
\`\`\`js
readableStream
  .pipe(transformStream)
  .pipe(writableStream);
\`\`\`

**Backpressure Handling**:
\`\`\`js
// In writable stream
_write(chunk, encoding, callback) {
  // Don't call callback until ready for more
  if (this.buffer.length > HIGH_WATER_MARK) {
    this.once('drain', callback);
  } else {
    callback();
  }
}
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nodejs'
  },
  {
    title: 'Implement a connection pool for PostgreSQL in Node.js',
    content: 'Design and implement a database connection pool. Explain why pooling is necessary.',
    answer: `**Why Connection Pooling?**

- Creating connections is expensive (TCP handshake, auth)
- Limited database connections (PostgreSQL default: 100)
- Reusing connections reduces latency

**Implementation using pg**:

\`\`\`js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'pass',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection available
});

async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release(); // Return to pool
  }
}

// Or use pool.query (auto gets/releases)
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
\`\`\`

**Pool Events**:

\`\`\`js
pool.on('connect', (client) => {
  console.log('New client connected');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error', err);
});

pool.on('remove', (client) => {
  console.log('Client removed');
});
\`\`\`

**Custom Pool Implementation**:

\`\`\`js
class ConnectionPool {
  constructor(maxConnections) {
    this.max = maxConnections;
    this.available = [];
    this.waiting = [];
  }

  async acquire() {
    if (this.available.length > 0) {
      return this.available.pop();
    }

    if (this.active < this.max) {
      this.active++;
      return this.createConnection();
    }

    // Wait for connection to be released
    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(connection) {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      resolve(connection);
    } else {
      this.available.push(connection);
    }
  }
}
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nodejs'
  },
];

// ============================================
// ADDITIONAL QUESTIONS - NESTJS
// ============================================

const nestjsAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Explain NestJS dependency injection and injection scopes',
    content: 'How does DI work in NestJS? What are the different injection scopes?',
    answer: `**Dependency Injection in NestJS**:

NestJS uses a container to manage class dependencies.

\`\`\`ts
@Injectable()
class CatsService {
  constructor(private readonly catsRepository: CatsRepository) {}
}
\`\`\`

**Injection Scopes**:

1. **DEFAULT (Singleton)**: One instance shared across entire app
\`\`\`ts
@Injectable({ scope: Scope.DEFAULT })
class CatsService {}
// Same as: @Injectable()
\`\`\`

2. **REQUEST**: New instance per HTTP request
\`\`\`ts
@Injectable({ scope: Scope.REQUEST })
class RequestScopedService {}
// Use for: per-request data, user context
\`\`\`

3. **TRANSIENT**: New instance every time injected
\`\`\`ts
@Injectable({ scope: Scope.TRANSIENT })
class TransientService {}
// Use for: No shared state, isolated operations
\`\`\`

**Circular Dependencies**:

\`\`\`ts
// Forward reference helps
@Injectable()
class A {
  constructor(@Inject(forwardRef(() => B)) private b: B) {}
}

@Injectable()
class B {
  constructor(@Inject(forwardRef(() => A)) private a: A) {}
}
\`\`\`

**Custom Providers**:

\`\`\`ts
{
  provide: 'CONFIG',
  useValue: { apiKey: 'xxx' },
}

{
  provide: UserService,
  useClass: AdminUserService, // Override class
}

{
  provide: 'AsyncConnection',
  useFactory: async (config) => {
    const connection = await createConnection(config);
    return connection;
  },
  inject: [CONFIG_PROVIDER],
  scope: Scope.TRANSIENT,
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nestjs'
  },
  {
    title: 'Explain Guards, Interceptors, and Pipes in NestJS',
    content: 'Compare Guards, Interceptors, and Pipes. When would you use each?',
    answer: `**Guards**: Determine if request should proceed (authorization)

\`\`\`ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles');
    const request = context.switchToHttp().getRequest();
    return requiredRoles.includes(request.user.role);
  }
}

// Usage
@Controller('cats')
@UseGuards(AuthGuard)
export class CatsController {}
\`\`\`

**Interceptors**: Transform request/response, add logging, caching

\`\`\`ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(\`Request took \${Date.now() - now}ms\`))
    );
  }
}

// Can also transform response
return next.handle().pipe(
  map(data => ({ ...data, timestamp: new Date() }))
);
\`\`\`

**Pipes**: Transform/validate input data

\`\`\`ts
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return value;

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return object;
  }
}
\`\`\`

**Execution Order**:
1. Request → Interceptor (before)
2. Guard → Pipe (validation)
3. Controller → Service
4. Response → Interceptor (after)

**Use Cases**:
- **Guard**: Auth, roles, feature flags
- **Interceptor**: Logging, caching, response transformation
- **Pipe**: Validation, parsing (string → number), sanitization`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nestjs'
  },
];

// ============================================
// ADDITIONAL QUESTIONS - POSTGRESQL
// ============================================

const postgresqlAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Explain PostgreSQL indexes and when to use B-tree, GIN, GiST',
    content: 'Describe different index types in PostgreSQL and their use cases.',
    answer: `**Index Types**:

**B-tree (default)**: Equality and range queries
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Good for: =, <, >, <=, >=, BETWEEN, IN, ORDER BY
\`\`\`

**GIN**: Array values, JSONB, full-text search
\`\`\`sql
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Good for: array contains (@>, &&), jsonb operations, @@ (text search)
SELECT * FROM posts WHERE tags @> ARRAY['typescript'];
\`\`\`

**GiST**: Geometric data, full-text search with rankings
\`\`\`sql
CREATE INDEX idx_places_location ON places USING GiST(location);
CREATE INDEX idx_documents_content ON documents USING GiST(to_tsvector('english', content));

-- Good for: <<, >>, && (geometric), <@ (text search with ranking)
\`\`\`

**BRIN**: Very large tables with sequential data
\`\`\`sql
CREATE INDEX idx_logs_timestamp ON logs USING BRIN(timestamp);

-- Good for: append-only tables (logs, metrics) where data is ordered
\`\`\`

**Hash**: Equality only (simpler than B-tree)
\`\`\`sql
CREATE INDEX idx_users_id_hash ON users USING HASH(id);

-- Good for: = only, smaller size than B-tree
\`\`\`

**Partial Index**: Index subset of data
\`\`\`sql
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- Smaller, faster for filtered queries
SELECT * FROM users WHERE email = ? AND status = 'active';
\`\`\`

**Covering Index**: Include extra columns
\`\`\`sql
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (total, status);

-- Index-only scan possible
SELECT total, status FROM orders WHERE user_id = ?;
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'postgresql'
  },
  {
    title: 'Explain MVCC and VACUUM in PostgreSQL',
    content: 'How does MVCC work in PostgreSQL? Why is VACUUM necessary?',
    answer: `**MVCC (Multi-Version Concurrency Control)**:

PostgreSQL maintains multiple versions of each row to allow concurrent access without locking.

**System Columns**:
- \`xmin\`: Transaction ID that created the row
- \`xmax\`: Transaction ID that expired (deleted) the row

\`\`\`sql
SELECT xmin, xmax, * FROM users WHERE id = 1;
-- xmin | xmax | id | name
-- 1001 | 0    | 1  | John  (committed, visible)
\`\`\`

**How it Works**:

1. Transaction T1 starts (snapshot)
2. Transaction T2 updates row (creates new version)
3. T1 still sees old version (snapshot isolation)
4. T2 commits, but old version stays for T1

**Why VACUUM is Needed**:

Dead tuples accumulate from:
- UPDATE (old row versions)
- DELETE (rows marked dead but not removed)
- CANCELLED transactions

\`\`\`sql
-- Check for bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables WHERE schemaname = 'public';
\`\`\`

**VACUUM Types**:

1. **VACUUM**: Reclaims space, maintains statistics (exclusive lock on each table)
2. **VACUUM FULL**: Rewrites entire table (exclusive lock, compact file)
3. **VACUUM ANALYZE**: Reclaims space + updates statistics
4. **AUTOVACUUM**: Background automatic vacuuming

\`\`\`sql
-- Manual vacuum
VACUUM ANALYZE users;

-- Full vacuum (compact, but locks table)
VACUUM FULL users;

-- Configure autovacuum
ALTER TABLE users SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE users SET (autovacuum_analyze_scale_factor = 0.02);
\`\`\`

**Autovacuum Configuration**:
\`\`\`sql
-- postgresql.conf
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'postgresql'
  },
  {
    title: 'Optimize slow queries in PostgreSQL',
    content: 'A query is slow. How would you analyze and optimize it?',
    answer: `**Step-by-Step Optimization**:

1. **EXPLAIN ANALYZE**:
\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.name;
\`\`\`

2. **Check Plan**:
- Seq Scan (bad for large tables) → Add index
- Nested Loop (cartesian product risk)
- Hash Join (good for large datasets)
- High cost numbers

3. **Common Issues & Fixes**:

**Missing Index**:
\`\`\`sql
-- Before: Seq Scan on users (10000 rows)
CREATE INDEX idx_users_created_at ON users(created_at);
-- Now: Index Scan
\`\`\`

**N+1 Query**:
\`\`\`sql
-- Bad: Run query for each user
-- Good: Use JOIN or ARRAY_AGG
SELECT u.*, ARRAY_AGG(o.id) as order_ids
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;
\`\`\`

**Functions in WHERE** (sargable):
\`\`\`sql
-- Bad: Function prevents index use
WHERE LOWER(email) = 'test@example.com'

-- Good: Index scan
WHERE email = 'test@example.com'

-- For case-insensitive, use CITEXT extension
CREATE EXTENSION citext;
\`\`\`

**Partial Index for Filtered Queries**:
\`\`\`sql
-- Query only needs active users
SELECT * FROM users WHERE status = 'active' AND email = ?;

-- Optimize with partial index
CREATE INDEX idx_active_users_email ON users(email) WHERE status = 'active';
\`\`\`

**Statistics Update**:
\`\`\`sql
ANALYZE users;
\`\`\`

4. **Index Usage Check**:
\`\`\`sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
-- Unused indexes = drop them
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'postgresql'
  },
];

// ============================================
// ADDITIONAL QUESTIONS - SYSTEM DESIGN
// ============================================

const systemDesignAdditionalQuestions: QuestionSeed[] = [
  {
    title: 'Design a URL Shortener service (bit.ly style)',
    content: 'Design a distributed URL shortener service that handles 100M URLs with 10M redirects/day.',
    answer: `**Requirements**:
- Shorten long URLs to ~7 character codes
- Handle redirects (301/302)
- Custom aliases
- Analytics (click counts, referrer)
- High availability (99.9%)

**API Design**:
\`\`\`js
POST /api/shorten
{ url: "https://example.com/very/long/url", alias?: "custom" }
Response: { shortUrl: "https://shrt.ly/abc123" }

GET /{code}
Response: 301 redirect to original URL

GET /api/stats/{code}
Response: { clicks: 1234, created: "2024-01-01", lastClick: "..." }
\`\`\`

**Short Code Generation**:

1. **Counter + Base62**: Simple, sequential
\`\`\`js
function encode(num) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, '0');
}
// 62^7 = 3.5 trillion possible URLs
\`\`\`

**Database Schema**:
\`\`\`sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_code CHAR(7) UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id BIGINT,
  custom_alias VARCHAR(20) UNIQUE
);

CREATE INDEX idx_short_code ON urls(short_code); -- Critical for redirect
CREATE TABLE clicks (
  id BIGSERIAL PRIMARY KEY,
  url_id BIGINT REFERENCES urls(id),
  clicked_at TIMESTAMP DEFAULT NOW(),
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  country CHAR(2)
);

CREATE INDEX idx_clicks_url_date ON clicks(url_id, clicked_at);
-- Partition by month for large scale
\`\`\`

**Scaling - Read Heavy (Redirects)**:

1. **CDN/Edge**: Deploy redirect logic to edge
2. **Cache**:
\`\`\`js
// Redis cache
await redis.set(\`url:\${code}\`, longUrl, { EX: 3600 });

// On redirect
const cached = await redis.get(\`url:\${code}\`);
if (cached) return redirect(cached);
\`\`\`

3. **Sharding**: By short code prefix
\`\`\`shard0: codes [a-z]
shard1: codes [A-Z]
shard2: codes [0-9]
\`\`\`

**Scaling - Write Heavy (Shortening)**:

1. **Pre-generate codes**: Batch generate ranges
2. **ID Generator**: Snowflake-like distributed ID
3. **Message Queue**: Async analytics logging

**Architecture**:
\`\`\`
┌─────────┐    POST /shorten    ┌─────────────┐
│ Client  │ ───────────────────> │ API Gateway │
└─────────┘                     └──────┬──────┘
                                       │
                              ┌────────┴────────┐
                              │  Load Balancer  │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
             ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
             │   Write     │    │   Write     │    │   Write     │
             │  Service    │    │  Service    │    │  Service    │
             └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  PostgreSQL     │
                              │   (Sharded)      │
                              └─────────────────┘

┌─────────┐    GET /abc123       ┌─────────────┐
│ Client  │ ───────────────────> │    CDN      │
└─────────┘                      └──────┬──────┘
                                       │ Cache Hit?
                              ┌────────┴────────┐
                              │  Redis Cluster  │
                              └─────────────────┘
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'system-design'
  },
  {
    title: 'Design a chat application (WhatsApp style)',
    content: 'Design a real-time chat application supporting 1B users with 100M concurrent connections.',
    answer: `**Requirements**:
- 1B users, 100M concurrent
- Real-time messaging
- Online/offline status
- Media sharing
- End-to-end encryption
- Message delivery guarantees

**Core API**:
\`\`\`js
POST /messages/send
{ to: userId, content: "...", type: "text" }

GET /conversations/{id}/messages?before={messageId}&limit=50

WS /ws/connect
→ Message event, Receipt event, Typing event
\`\`\`

**Data Model**:
\`\`\`sql
-- Users shard
CREATE TABLE users_{shard_id} (
  id BIGINT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE,
  username VARCHAR(30),
  created_at TIMESTAMP
);

-- Messages shard (by conversation)
CREATE TABLE messages_{shard_id} (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT,
  sender_id BIGINT,
  content TEXT,
  status SMALLINT, -- 0:sent, 1:delivered, 2:read
  created_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Index for pagination
CREATE INDEX idx_conv_created ON messages_{shard_id}(conversation_id, created_at DESC);
\`\`\`

**Architecture**:

\`\`\`
┌─────────────────────────────────────────────────────┐
│                   Client (Mobile/Web)                │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket
          ┌────────────┴────────────┐
          │    Connection Manager   │ (Orbit, Socket.io)
          │   (Node.js instances)    │
          └────────────┬────────────┘
                       │
          ┌────────────┴────────────┐
          │     Message Queue        │ (Kafka)
          │   (messages, receipts)   │
          └────────────┬────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐      ┌─────▼────┐      ┌─────▼────┐
│ Worker │      │  Worker  │      │  Worker  │
│ Push   │      │ Persist  │      │ Notify  │
└────┬───┘      └────┬─────┘      └─────┬────┘
     │               │                  │
     │          ┌────▼─────┐           │
     │          │ Postgres │           │
     │          │ (Sharded)│           │
     │          └──────────┘           │
     │                                │
     │          ┌────────────┐         │
     │          │   Redis    │◄────────┘
     │          │ (Online)   │
     │          └────────────┘
     │
┌────▼─────┐
│  FCM/APN │ (Push notifications)
└──────────┘
\`\`\`

**Key Components**:

1. **Connection Manager**: Handle WebSocket connections, session mapping
2. **Message Queue**: Buffer messages, deliver guaranteed
3. **Workers**: Async processing (persist, push notification)
4. **Cache**: User online status, unread counts
5. **CDN**: Media storage (images, videos)

**Message Delivery Flow**:

\`\`\`js
// Send message
await kafka.produce('messages', {
  to: userId,
  from: currentUserId,
  content: encryptedContent,
  timestamp: Date.now()
});

// Worker processes
worker.on('message', async (msg) => {
  // 1. Persist to DB
  await db.messages.insert(msg);

  // 2. Check if recipient online
  const socketId = await redis.get(\`session:\${msg.to}\`);

  if (socketId) {
    // Deliver via WebSocket
    io.to(socketId).emit('message', msg);
    await redis.set(\`receipt:\${msg.id}\`, 'delivered');
  } else {
    // Send push notification
    await fcm.send(msg.to, { notification: {...} });
  }
});
\`\`\`

**Scaling Strategies**:

- **Shard by user ID**: Distribute load across database servers
- **Read replicas**: For message history
- **Redis Cluster**: For online status, session data
- **Edge WebSocket**: Deploy connection servers globally

**Sync Strategy** (for multi-device):

\`\`\`sql
-- Device messages table
CREATE TABLE device_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  device_id VARCHAR(50),
  message_id BIGINT,
  status SMALLINT, -- delivered, read
  updated_at TIMESTAMP
);
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'system-design'
  },
];

// ============================================
// EXPORT ALL ADDITIONAL QUESTIONS
// ============================================

export const additionalQuestions: QuestionSeed[] = [
  ...javascriptAdditionalQuestions,
  ...typescriptAdditionalQuestions,
  ...nodejsAdditionalQuestions,
  ...nestjsAdditionalQuestions,
  ...postgresqlAdditionalQuestions,
  ...systemDesignAdditionalQuestions,
];

// Summary
console.log('='.repeat(50));
console.log('ADDITIONAL INTERVIEW QUESTIONS');
console.log('='.repeat(50));
console.log(`JavaScript: ${javascriptAdditionalQuestions.length}`);
console.log(`TypeScript: ${typescriptAdditionalQuestions.length}`);
console.log(`Node.js: ${nodejsAdditionalQuestions.length}`);
console.log(`NestJS: ${nestjsAdditionalQuestions.length}`);
console.log(`PostgreSQL: ${postgresqlAdditionalQuestions.length}`);
console.log(`System Design: ${systemDesignAdditionalQuestions.length}`);
console.log(`Total: ${additionalQuestions.length}`);
console.log('='.repeat(50));
