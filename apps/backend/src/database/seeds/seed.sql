-- Interview Library Seed Data (SQL)
-- This file contains INSERT statements for topics and questions
-- Run with: psql -U postgres -d interview_library -f seed.sql

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE questions CASCADE;
-- TRUNCATE TABLE topics CASCADE;

-- ============================================
-- TOPICS (8 records)
-- ============================================

INSERT INTO topics (name, slug, description, icon, color, created_at, updated_at) VALUES
('JavaScript', 'javascript', 'Core JavaScript concepts, ES6+, async programming, DOM manipulation', 'Code', 'bg-yellow-100 text-yellow-800', NOW(), NOW()),
('TypeScript', 'typescript', 'Type system, generics, utility types, advanced TypeScript patterns', 'FileCode', 'bg-blue-100 text-blue-800', NOW(), NOW()),
('React', 'react', 'Components, hooks, state management, performance optimization', 'Atom', 'bg-cyan-100 text-cyan-800', NOW(), NOW()),
('Next.js', 'nextjs', 'SSR, SSG, API routes, App Router, server components', 'Zap', 'bg-gray-900 text-white', NOW(), NOW()),
('Node.js', 'nodejs', 'Event loop, streams, buffers, file system, modules', 'Server', 'bg-green-100 text-green-800', NOW(), NOW()),
('NestJS', 'nestjs', 'Architecture, modules, providers, guards, interceptors', 'Layers', 'bg-red-100 text-red-800', NOW(), NOW()),
('PostgreSQL', 'postgresql', 'SQL queries, indexes, transactions, optimization', 'Database', 'bg-indigo-100 text-indigo-800', NOW(), NOW()),
('System Design', 'system-design', 'Scalability, caching, load balancing, microservices', 'Sitemap', 'bg-purple-100 text-purple-800', NOW(), NOW());

-- ============================================
-- JAVASCRIPT QUESTIONS (10)
-- ============================================

-- Junior
INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Explain the difference between var, let, and const',
  'What are the key differences between var, let, and const in JavaScript? When would you use each one?',
  '**var**:- Function-scoped (not block-scoped)- Can be redeclared and updated- Hoisted with undefined value

**let**:- Block-scoped- Can be updated but not redeclared in same scope- Hoisted in Temporal Dead Zone until declaration

**const**:- Block-scoped- Cannot be reassigned (but objects/arrays are mutable)- Hoisted like let

**Usage**: Prefer const by default, use let when you need to reassign, avoid var in modern code.',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'What is the difference between == and ===?',
  'Explain the difference between loose equality (==) and strict equality (===) in JavaScript.',
  '**== (Loose Equality)**:- Performs type coercion before comparison- ''5'' == 5 is true- null == undefined is true- Can lead to unexpected results

**=== (Strict Equality)**:- No type coercion- Both value and type must match- ''5'' === 5 is false- Always use === in modern JavaScript',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Explain array methods: map, filter, and reduce',
  'Describe the purpose and usage of map, filter, and reduce array methods with examples.',
  '**map()** - Transforms each element: const doubled = [1, 2, 3].map(x => x * 2); // [2, 4, 6]

**filter()** - Selects elements matching a condition: const evens = [1, 2, 3, 4].filter(x => x % 2 === 0); // [2, 4]

**reduce()** - Reduces array to single value: const sum = [1, 2, 3].reduce((acc, x) => acc + x, 0); // 6

All three methods are non-mutating and return new arrays.',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'What are arrow functions?',
  'Explain arrow function syntax and how they differ from regular functions.',
  '**Syntax**: const add = (a, b) => a + b;

**Key Differences**:1. No own this - inherits from surrounding scope2. No arguments object3. Cannot be used as constructors (no new)4. No prototype property

**Best Use Case**: Callbacks where you want to preserve outer this',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'junior', 'new', false, 0, 0, 0, NOW(), NOW();

-- Middle
INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Explain JavaScript''s Event Loop',
  'How does the Event Loop work in JavaScript? Describe call stack, task queue, and microtask queue.',
  'JavaScript is single-threaded with an Event Loop that handles async operations:**Call Stack**: LIFO stack where synchronous code executes**Task Queue**: Callbacks from setTimeout, setInterval**Microtask Queue**: Promises, queueMicrotask - higher priority

**Event Loop Cycle**:1. Execute all code in Call Stack2. Process all Microtasks3. Render UI changes if needed4. Process one Task from Task Queue5. Repeat',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'What are closures and how are they used?',
  'Explain closures in JavaScript with practical examples of their use cases.',
  'A **closure** is created when a function remembers variables from its outer scope even after the outer function has returned.**Use Cases**:1. Data Privacy/Encapsulation: Module pattern2. Function Factories: Configure function behavior3. Memoization: Cache expensive computations4. Event Handlers: Preserve state',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Explain Promises and async/await',
  'How do Promises work? Compare Promises with async/await syntax.',
  '**Promises**: Represent eventual completion/failure of async operation.**async/await**: Syntactic sugar for Promises, makes async code look synchronous.**Key Differences**:- await pauses function execution until Promise resolves- Try/catch for error handling instead of .catch()- Sequential code is easier to read and debug',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'What is prototypal inheritance?',
  'Explain JavaScript''s prototype chain and how objects inherit from each other.',
  'JavaScript uses prototypal inheritance - objects inherit directly from other objects.**Prototype Chain**: Objects have a hidden [[Prototype]] property linking to another object.**Constructor Pattern**: Functions have prototype property for shared methods.**ES6 Classes**: Syntactic sugar over prototypes.',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'middle', 'new', false, 0, 0, 0, NOW(), NOW();

-- Senior
INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Memory Management & Garbage Collection',
  'How does JavaScript handle memory management? What causes memory leaks?',
  '**Memory Lifecycle**:1. Allocation: Memory allocated when variables created2. Use: Read/write operations3. Release: Memory freed when no longer needed

**Garbage Collection**: Mark-and-Sweep algorithm- Roots: global variables, active stack frames- GC marks reachable objects- Unmarked objects are garbage collected

**Common Memory Leaks**:1. Accidental globals2. Closures retaining large references3. Detached DOM elements4. Event listeners never removed5. Timers not cleared6. Maps/Caches growing without bounds',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'senior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT
  'Explain the Temporal Dead Zone',
  'What is the Temporal Dead Zone (TDZ) in JavaScript? How does it relate to hoisting?',
  'The **Temporal Dead Zone** is the period between entering a scope and variable declaration where accessing let/const throws a ReferenceError.**Hoisting**:- var: Hoisted and initialized as undefined- let/const: Hoisted but NOT initialized (TDZ)- function: Hoisted with full definition**Why TDZ Exists**:1. Prevents accessing variables before declaration2. Makes typeof unsafe for let/const in TDZ3. Enforces temporal consistency',
  (SELECT id FROM topics WHERE slug = 'javascript'),
  'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- TYPESCRIPT QUESTIONS (8)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Basic types in TypeScript', 'What are the basic types in TypeScript? How do you define typed variables?',
  '**Primitive Types**: string, number, boolean, null, undefined**Special Types**: any, unknown, void, never**Type Inference**: TypeScript can infer types from initialization',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are interfaces and type aliases?', 'Explain the difference between interface and type in TypeScript.',
  '**interface**: For object shapes, extensible, supports declaration merging**type**: More flexible, can represent primitives, unions, intersections**When to use**:- interface: Public APIs, objects that can be extended- type: Unions, intersections, mapped types, utility types',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Function types in TypeScript', 'How do you type functions in TypeScript?',
  '**Function Declaration**: function add(a: number, b: number): number**Arrow Function**: const multiply = (a: number, b: number): number => a * b;**Function Type**: type MathOperation = (a: number, b: number) => number;**Optional & Default Parameters**: function greet(name: string, greeting?: string)',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are generics?', 'Explain TypeScript generics and provide examples of when to use them.',
  '**Generics** allow creating reusable components that work with multiple types.function identity<T>(arg: T): T { return arg; }**Use Cases**: API responses, data structures, utility functions**Generic Constraints**: <T extends SomeType> limits what T can be',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Union and Intersection Types', 'Explain union (|) and intersection (&) types with examples.',
  '**Union Types (|)**: Value can be one of several types - type ID = string | number;**Intersection Types (&)**: Combines multiple types - type ManagerEmployee = Employee & Manager;**Type Narrowing**: Using typeof, instanceof to narrow union types',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are utility types?', 'Describe commonly used TypeScript utility types like Partial, Required, Pick, and Omit.',
  '**Partial<T>**: Makes all properties optional**Required<T>**: Makes all properties required**Pick<T, K>**: Select specific properties**Omit<T, K>**: Remove specific properties**Record<K, T>**: Create object type with keys**Readonly<T>**: Make all properties readonly',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Advanced TypeScript: Conditional Types', 'Explain conditional types and provide practical examples.',
  '**Conditional Types**: Select type based on condition - type NonNullable<T> = T extends null | undefined ? never : T;**Conditional Type with Infer**: type Unpromise<T> = T extends Promise<infer U> ? U : T;**Distributive Conditional Types**: Distribute over union types',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'TypeScript Decorators', 'What are decorators in TypeScript? How do they work?',
  '**Decorators**: Special syntax for class declarations and members@Component() class AppComponent {}**Creating a Decorator**: Function that receives target, propertyKey, descriptor**Note**: Requires experimentalDecorators in tsconfig',
  (SELECT id FROM topics WHERE slug = 'typescript'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- REACT QUESTIONS (8)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are React components?', 'Explain functional components vs class components in React.',
  '**Functional Components** (modern approach): Simpler syntax, hooks for state/lifecycle, better performance.**Class Components** (legacy): Render method, this.state, lifecycle methods.Hooks have made class components largely obsolete.',
  (SELECT id FROM topics WHERE slug = 'react'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is JSX?', 'Explain JSX syntax and how it works in React.',
  '**JSX**: Syntax extension for JavaScript that looks like HTMLCompiles to: React.createElement() calls**Key Points**:- Must return single parent element- camelCase for attributes (className, not class)- {} for JavaScript expressions',
  (SELECT id FROM topics WHERE slug = 'react'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain useState hook', 'How does the useState hook work in React?',
  '**useState**: Adds state to functional componentsconst [count, setCount] = useState(0);**Key Points**:- Returns [currentValue, setterFunction]- Initial value only used on first render- Setter triggers re-render- Functional updates: setCount(prev => prev + 1)',
  (SELECT id FROM topics WHERE slug = 'react'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain useEffect hook', 'How does useEffect work? What are dependency arrays?',
  '**useEffect**: Handle side effects in functional components**Dependency Array**:- Empty [] = mount only- [deps] = when deps change- Omitted = every render**Cleanup**: Return function from useEffect',
  (SELECT id FROM topics WHERE slug = 'react'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are controlled and uncontrolled components?', 'Explain the difference between controlled and uncontrolled components in React forms.',
  '**Controlled Components**: Form data handled by React state - <input value={value} onChange={e => setValue(e.target.value)} />**Uncontrolled Components**: Form data handled by DOM - <input ref={inputRef} />**When to use**:- Controlled: Validation, dynamic forms- Uncontrolled: Simple forms',
  (SELECT id FROM topics WHERE slug = 'react'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is prop drilling?', 'Explain prop drilling and how to avoid it.',
  '**Prop Drilling**: Passing props through multiple levels**Solutions**:1. Context API2. State Management (Redux, Zustand)3. Composition (passing components as props)',
  (SELECT id FROM topics WHERE slug = 'react'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain React Fiber', 'What is React Fiber and why was it introduced?',
  '**React Fiber**: Complete rewrite of React''s reconciliation algorithm (React 16+)**Improvements**:1. Incremental Rendering2. Prioritization of updates3. Concurrency (pause, abort, reuse work)4. Error BoundariesEach component is a "fiber" node with unit of work to do.',
  (SELECT id FROM topics WHERE slug = 'react'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'React performance optimization techniques', 'What are common performance optimization techniques in React?',
  '**1. Memoization**: useMemo, useCallback, React.memo**2. Code Splitting**: React.lazy, Suspense**3. Virtualization**: react-window - only render visible items**4. Debouncing/Throttling**: For search inputs**5. Key Prop**: Use stable, unique keys',
  (SELECT id FROM topics WHERE slug = 'react'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- NEXT.JS QUESTIONS (7)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is Next.js?', 'Explain what Next.js is and what problems it solves.',
  '**Next.js**: React framework for production**Key Features**:- Server-Side Rendering (SSR)- Static Site Generation (SSG)- API Routes- File-based routing- Image optimization**Why use Next.js?**: Better SEO, faster initial load, backend API in same codebase',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Pages Router vs App Router', 'What are the differences between Pages Router and App Router?',
  '**Pages Router** (previous): pages/index.tsx**App Router** (Next.js 13+, recommended): app/page.tsx**App Router Benefits**:- React Server Components by default- Simplified data fetching- Nested layouts- Streaming & Suspense',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'SSR vs SSG vs ISR', 'Explain Server-Side Rendering, Static Site Generation, and Incremental Static Regeneration.',
  '**SSR**: Generated on each request - getServerSideProps()**SSG**: Generated at build time - getStaticProps()**ISR**: Static, with updates every N seconds - getStaticProps() with revalidate',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Server Components vs Client Components', 'Explain the difference between Server and Client Components in App Router.',
  '**Server Components** (default): Render on server, no JavaScript to client, can access server resources**Client Components** (use client directive): Render in browser, can use hooks, event handlers',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are API Routes?', 'Explain how API Routes work in Next.js.',
  '**API Routes**: Build API endpoints as part of Next.js app**Pages Router**: pages/api/users.ts**App Router**: app/api/users/route.ts with GET, POST handlers**Use Cases**: Form submissions, webhooks, authentication, proxy requests',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Dynamic Routes in Next.js', 'How do you create dynamic routes in Next.js?',
  '**App Router Dynamic Segments**: app/blog/[slug]/page.tsx**Accessing Params**: props.params.slug**Catch-all**: [...slug] - /blog/a/b/c**Optional catch-all**: [[...slug]] - /blog or /blog/a/b**generateStaticParams**: For SSG with dynamic routes',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Next.js Rendering Strategies', 'When should you use SSR vs SSG vs CSR vs ISR?',
  '**Decision Matrix**:**SSG**: Data available at build time - Blog, docs**SSR**: Data changes frequently, needs SEO - E-commerce, news**ISR**: Data changes but not on every request - Blogs, CMS**CSR**: User-specific, highly interactive - Dashboard',
  (SELECT id FROM topics WHERE slug = 'nextjs'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- NODE.JS QUESTIONS (7)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is Node.js?', 'Explain what Node.js is and its key features.',
  '**Node.js**: JavaScript runtime built on V8 engine**Key Features**:- Server-side JavaScript- Non-blocking I/O- Event-driven architecture- Single-threaded with event loop- NPM ecosystem',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'CommonJS vs ES Modules', 'Explain the difference between CommonJS and ES Modules in Node.js.',
  '**CommonJS** (CJS): module.exports, require() - synchronous**ES Modules** (ESM): export, import - asynchronous, top-level await**Key Differences**:- CJS: synchronous, dynamic require- ESM: asynchronous, static imports- Enable ESM: "type": "module" in package.json',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is the package.json file?', 'Explain the purpose of package.json and its key fields.',
  '**package.json**: Project manifest file**Key Fields**: name, version, description, main, type, scripts, dependencies, devDependencies**Version Ranges**:- ^4.18.0: Compatible with 4.x.x- ~4.18.0: Compatible with 4.18.x- 4.18.0: Exact version',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain Node.js Event Emitter', 'How does EventEmitter work in Node.js?',
  '**EventEmitter**: Core pattern for handling eventsmyEmitter.on(''event'', handler);myEmitter.emit(''event'', data);myEmitter.once(''event'', handler);**Common Use Cases**: HTTP server, streams, file system, custom events',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are Streams in Node.js?', 'Explain the four types of streams and when to use them.',
  '**Streams**: Handle data piece by piece (chunks)**Four Types**:1. Readable: fs.createReadStream2. Writable: fs.createWriteStream3. Duplex: Socket (both read and write)4. Transform: zlib (modify data)**Benefits**: Memory efficient, time efficient, composable',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is the Buffer class?', 'Explain the Buffer class in Node.js and its use cases.',
  '**Buffer**: Fixed-size raw binary data**Use Cases**: File I/O, network protocols, cryptography, image/video processing**Note**: Buffer is a global - no need to import',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Node.js Worker Threads', 'Explain Worker Threads and CPU-bound tasks in Node.js.',
  '**Worker Threads**: Run JavaScript in parallel threads**Problem**: Node.js is single-threaded - CPU tasks block event loop**Use Cases**: Image/video processing, encryption, data parsing**Limitation**: Workers have overhead - not for I/O',
  (SELECT id FROM topics WHERE slug = 'nodejs'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- NESTJS QUESTIONS (7)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is NestJS?', 'Explain what NestJS is and why you would use it.',
  '**NestJS**: Progressive Node.js framework for building server-side applications**Key Features**:- TypeScript by default- Architectured with Angular-like patterns- Built-in support for Microservices- WebSocket support**Core Concepts**: Modules, Controllers, Providers, Pipes, Guards, Interceptors',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain Modules in NestJS', 'What are modules and how do they organize a NestJS application?',
  '**Module**: Class annotated with @Module() that organizes application**Properties**: imports, controllers, providers, exports**Best Practices**:- One module per feature domain- Shared providers in CoreModule- Lazy load modules with load()',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are Providers?', 'Explain providers and dependency injection in NestJS.',
  '**Provider**: Class that can be injected as a dependency**Services as Providers**: @Injectable()**Dependency Injection**: constructor(private service: MyService)**Custom Providers**: useClass, useValue, useFactory**Scope**: DEFAULT (singleton), REQUEST, TRANSIENT',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Guards and Interceptors', 'Explain Guards and Interceptors in NestJS with examples.',
  '**Guards**: Determine if request should proceed (auth/roles)- @UseGuards(AuthGuard)**Interceptors**: Extra logic before/after method execution- Implement NestInterceptor- Transform responses, add logging',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are Pipes in NestJS?', 'Explain Pipes for validation and transformation.',
  '**Pipes**: Transform input data or validate it**Built-in Pipes**: ParseIntPipe, ValidationPipe**Custom Pipe**: Implement PipeTransform**Validation**: Use class-validator with ValidationPipe',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Exception Filters', 'How do you handle exceptions in NestJS?',
  '**Exception Filters**: Catch and format exceptions**@Catch(HttpException)**: Handle specific exceptions**Usage**: @UseFilters(HttpExceptionFilter)**Custom Exceptions**: Extend NotFoundException',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'NestJS Microservices', 'Explain how NestJS handles microservices architecture.',
  '**NestJS Microservices**: Build distributed systems easily**Transporters**: Redis, NATS, RabbitMQ, Kafka, gRPC**Message Pattern**: @EventPattern, @MessagePattern**Hybrid App**: HTTP + Microservice in same app',
  (SELECT id FROM topics WHERE slug = 'nestjs'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- POSTGRESQL QUESTIONS (8)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is PostgreSQL?', 'Explain what PostgreSQL is and its key features.',
  '**PostgreSQL**: Open-source relational database system**Key Features**:- ACID compliance- MVCC (Multi-Version Concurrency Control)- Supports JSON/JSONB- Extensive data types- Extensions ecosystem',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are the different types of JOINs?', 'Explain INNER, LEFT, RIGHT, and FULL JOINs in SQL.',
  '**INNER JOIN**: Only matching rows**LEFT JOIN**: All from left, matching from right (NULL if no match)**RIGHT JOIN**: All from right, matching from left**FULL JOIN**: All rows from both tables',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are indexes?', 'Explain database indexes and when to use them.',
  '**Index**: Data structure improving query speed**Creating**: CREATE INDEX idx_name ON table(column);**When to Index**: Columns in WHERE, JOIN, ORDER BY**When NOT to Index**: Small tables, frequently updated columns',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain ACID properties', 'What are ACID properties in database transactions?',
  '**ACID**: Four properties ensuring reliable transactions**Atomicity**: All-or-nothing execution**Consistency**: Database remains valid**Isolation**: Concurrent transactions don''t interfere**Durability**: Committed data persists',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What are CTEs (Common Table Expressions)?', 'Explain CTEs and provide examples of their use.',
  '**CTE**: Temporary result set referenced within SELECT**WITH clause**: WITH active_users AS (SELECT ...)**Recursive CTE**: For hierarchical data - WITH RECURSIVE',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'JSONB vs JSON', 'Explain the difference between JSON and JSONB in PostgreSQL.',
  '**JSON**: Stored as plain text, preserves whitespace**JSONB**: Stored in binary format, decompressed- Faster to query- Supports indexing (GIN)**Example**: SELECT data->>''name'' FROM events;',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain MVCC in PostgreSQL', 'How does Multi-Version Concurrency Control work?',
  '**MVCC**: PostgreSQL''s approach to concurrent access**How It Works**: Each transaction sees a snapshot of data**System Columns**: xmin (created), xmax (expired)**VACUUM**: Remove dead tuple versions**Autovacuum**: Runs automatically',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Query Optimization and EXPLAIN ANALYZE', 'How do you analyze and optimize slow PostgreSQL queries?',
  '**EXPLAIN ANALYZE**: See actual execution plan and timing**Plan Nodes**: Seq Scan (slow), Index Scan (fast), Hash Join**Optimization**: Add indexes, use ANALYZE, partial indexes, covering indexes**Monitoring**: Check pg_stat_user_tables',
  (SELECT id FROM topics WHERE slug = 'postgresql'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- SYSTEM DESIGN QUESTIONS (8)
-- ============================================

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is CAP theorem?', 'Explain the CAP theorem in distributed systems.',
  '**CAP Theorem**: In a distributed system, you can only have 2 of 3:**Consistency**: All nodes see same data**Availability**: Every request receives response**Partition Tolerance**: System continues despite network failures**Trade-offs**: CP (banking), AP (social media), CA (single-node)',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is load balancing?', 'Explain load balancing and common algorithms.',
  '**Load Balancer**: Distributes traffic across multiple servers**Algorithms**: Round Robin, Least Connections, IP Hash, Weighted**Types**: L4 (TCP/UDP), L7 (HTTP)**Benefits**: Prevents overload, enables scaling, high availability',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is caching?', 'Explain caching strategies and common use cases.',
  '**Caching**: Store frequently accessed data in fast storage**Strategies**: Cache Aside, Write Through, Write Back**Cache Eviction**: LRU, LFU, TTL**What to Cache**: Static data, expensive computations, API responses',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'junior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Vertical vs Horizontal Scaling', 'Explain the difference between vertical and horizontal scaling.',
  '**Vertical Scaling** (Scale Up): Add more resources to single server**Horizontal Scaling** (Scale Out): Add more servers/nodes**When to Use**: Vertical for small apps, Horizontal for large apps**Modern Approach**: Start vertical, move to horizontal when needed',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Explain CDN and how it works', 'What is a Content Delivery Network and what problems does it solve?',
  '**CDN**: Distributed network of servers delivering content**How It Works**: DNS routes to nearest edge server**Benefits**: Reduced latency, less bandwidth, higher availability**Popular CDNs**: Cloudflare, AWS CloudFront, Fastly',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'What is a database index and how does it work?', 'Explain database indexes at a deeper level.',
  '**B-Tree Index**: Balanced tree, O(log n) lookup, good for ranges**Hash Index**: Hash table, O(1) lookup, no ranges**GIN Index**: For arrays, JSONB**Trade-offs**: Faster reads vs slower writes, more storage**Composite Index**: Multiple columns, order matters',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'middle', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Design a URL Shortener', 'How would you design a system like bit.ly?',
  '**Requirements**: Generate short URLs, redirect, high availability**API**: POST /shorten, GET /:code**Short Code**: Base62 encoding of counter**Database**: id, short_code (unique), long_url**Scaling**: Redis cache for popular URLs, sharding by prefix**301 vs 302**: 301 caches in browser, 302 tracks analytics',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

INSERT INTO questions (title, content, answer, topic_id, level, status, is_favorite, difficulty_score, practice_count, "order", created_at, updated_at)
SELECT 'Design a Rate Limiter', 'How would you design a distributed rate limiting system?',
  '**Requirements**: Limit requests per user/time window, distributed**Algorithms**: Fixed Window (simple, spike at boundaries), Sliding Window (accurate), Token Bucket (bursts)**Implementation**: Redis INCR + EXPIRE for fixed, Sorted Set for sliding**Distributed Challenge**: Clock sync, use atomic Redis operations',
  (SELECT id FROM topics WHERE slug = 'system-design'), 'senior', 'new', false, 0, 0, 0, NOW(), NOW();

-- ============================================
-- SUMMARY
-- ============================================

-- Total: 8 topics, 60 questions
-- JavaScript: 10 questions (4 junior, 4 middle, 2 senior)
-- TypeScript: 8 questions (3 junior, 3 middle, 2 senior)
-- React: 8 questions (3 junior, 3 middle, 2 senior)
-- Next.js: 7 questions (3 junior, 3 middle, 1 senior)
-- Node.js: 7 questions (3 junior, 3 middle, 1 senior)
-- NestJS: 7 questions (3 junior, 3 middle, 1 senior)
-- PostgreSQL: 8 questions (3 junior, 3 middle, 2 senior)
-- System Design: 8 questions (3 junior, 3 middle, 2 senior)
