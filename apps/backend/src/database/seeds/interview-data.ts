/**
 * Interview Library Seed Data
 *
 * This file contains comprehensive seed data for interview questions
 * covering JavaScript, TypeScript, React, Next.js, Node.js, NestJS,
 * PostgreSQL, and System Design topics.
 *
 * Topics: 8
 * Questions: 60 (balanced across junior/middle/senior levels)
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

// ============================================
// TOPICS
// ============================================

export const topics: TopicSeed[] = [
  {
    name: 'JavaScript',
    slug: 'javascript',
    description: 'Core JavaScript concepts, ES6+, async programming, DOM manipulation',
    icon: 'Code',
    color: '#F59E0B'
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    description: 'Type system, generics, utility types, advanced TypeScript patterns',
    icon: 'FileCode',
    color: '#3B82F6'
  },
  {
    name: 'React',
    slug: 'react',
    description: 'Components, hooks, state management, performance optimization',
    icon: 'Atom',
    color: '#06B6D4'
  },
  {
    name: 'Next.js',
    slug: 'nextjs',
    description: 'SSR, SSG, API routes, App Router, server components',
    icon: 'Zap',
    color: '#000000'
  },
  {
    name: 'Node.js',
    slug: 'nodejs',
    description: 'Event loop, streams, buffers, file system, modules',
    icon: 'Server',
    color: '#22C55E'
  },
  {
    name: 'NestJS',
    slug: 'nestjs',
    description: 'Architecture, modules, providers, guards, interceptors',
    icon: 'Layers',
    color: '#EF4444'
  },
  {
    name: 'PostgreSQL',
    slug: 'postgresql',
    description: 'SQL queries, indexes, transactions, optimization',
    icon: 'Database',
    color: '#6366F1'
  },
  {
    name: 'System Design',
    slug: 'system-design',
    description: 'Scalability, caching, load balancing, microservices',
    icon: 'Sitemap',
    color: '#A855F7'
  }
];

// ============================================
// QUESTIONS - JAVASCRIPT
// ============================================

const javascriptQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'Explain the difference between var, let, and const',
    content: 'What are the key differences between var, let, and const in JavaScript? When would you use each one?',
    answer: `**var**:
- Function-scoped (not block-scoped)
- Can be redeclared and updated
- Hoisted with undefined value

**let**:
- Block-scoped
- Can be updated but not redeclared in same scope
- Hoisted but in Temporal Dead Zone until declaration

**const**:
- Block-scoped
- Cannot be reassigned (but objects/arrays are mutable)
- Hoisted like let

**Usage**: Prefer const by default, use let when you need to reassign, avoid var in modern code.`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'javascript'
  },
  {
    title: 'What is the difference between == and ===?',
    content: 'Explain the difference between loose equality (==) and strict equality (===) in JavaScript.',
    answer: `**== (Loose Equality)**:
- Performs type coercion before comparison
- '5' == 5 is true
- null == undefined is true
- Can lead to unexpected results

**=== (Strict Equality)**:
- No type coercion
- Both value and type must match
- '5' === 5 is false
- Always use === in modern JavaScript

The Abstract Equality Comparison Algorithm for == is complex and can produce surprising results. Always prefer ===.`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain array methods: map, filter, and reduce',
    content: 'Describe the purpose and usage of map, filter, and reduce array methods with examples.',
    answer: `**map()** - Transforms each element:
\`\`\`js
const doubled = [1, 2, 3].map(x => x * 2); // [2, 4, 6]
\`\`\`

**filter()** - Selects elements matching a condition:
\`\`\`js
const evens = [1, 2, 3, 4].filter(x => x % 2 === 0); // [2, 4]
\`\`\`

**reduce()** - Reduces array to single value:
\`\`\`js
const sum = [1, 2, 3].reduce((acc, x) => acc + x, 0); // 6
\`\`\`

All three methods are non-mutating and return new arrays. They accept a callback function (and optional thisArg) and are chainable.`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'javascript'
  },
  {
    title: 'What are arrow functions?',
    content: 'Explain arrow function syntax and how they differ from regular functions.',
    answer: `**Syntax**:
\`\`\`js
const add = (a, b) => a + b;
const greet = name => \`Hello \${name}!\`;
const returnObj = () => ({ id: 1 }); // parentheses for object
\`\`\`

**Key Differences**:
1. No own \`this\` - inherits from surrounding scope
2. No \`arguments\` object
3. Cannot be used as constructors (no new)
4. No prototype property

**Best Use Case**: Callbacks where you want to preserve outer \`this\`:
\`\`\`js
setTimeout(() => {
  this.doSomething(); // this from outer scope
}, 100);
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'javascript'
  },

  // Middle
  {
    title: 'Explain JavaScript\'s Event Loop',
    content: 'How does the Event Loop work in JavaScript? Describe call stack, task queue, and microtask queue.',
    answer: `JavaScript is single-threaded with an Event Loop that handles async operations:

**Call Stack**: LIFO stack where synchronous code executes

**Web APIs**: Browser APIs that handle async operations (fetch, timers)

**Task Queue (Macro Queue)**: Callbacks from setTimeout, setInterval, I/O

**Microtask Queue**: Promises, queueMicrotask, MutationObserver - higher priority

**Event Loop Cycle**:
1. Execute all code in Call Stack
2. When stack empty, process all Microtasks
3. Render UI changes if needed
4. Process one Task from Task Queue
5. Repeat

\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4'); // Output: 1, 4, 3, 2
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'What are closures and how are they used?',
    content: 'Explain closures in JavaScript with practical examples of their use cases.',
    answer: `A **closure** is created when a function remembers variables from its outer scope even after the outer function has returned.

\`\`\`js
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}
const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
\`\`\`

**Use Cases**:
1. **Data Privacy/Encapsulation**: Module pattern
2. **Function Factories**: Configure function behavior
3. **Memoization**: Cache expensive computations
4. **Event Handlers**: Preserve state

\`\`\`js
// Debounce using closure
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain Promises and async/await',
    content: 'How do Promises work? Compare Promises with async/await syntax.',
    answer: `**Promises**: Represent eventual completion/failure of async operation.

\`\`\`js
// Promise Chaining
fetch('/api/user')
  .then(res => res.json())
  .then(user => fetch(\`/api/posts/\${user.id}\`))
  .then(res => res.json())
  .catch(err => console.error(err));
\`\`\`

**async/await**: Syntactic sugar for Promises, makes async code look synchronous.

\`\`\`js
async function getUserPosts() {
  try {
    const userRes = await fetch('/api/user');
    const user = await userRes.json();
    const postsRes = await fetch(\`/api/posts/\${user.id}\`);
    return await postsRes.json();
  } catch (err) {
    console.error(err);
  }
}
\`\`\`

**Key Differences**:
- await pauses function execution until Promise resolves
- Try/catch for error handling instead of .catch()
- Sequential code is easier to read and debug`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },
  {
    title: 'What is prototypal inheritance?',
    content: 'Explain JavaScript\'s prototype chain and how objects inherit from each other.',
    answer: `JavaScript uses prototypal inheritance - objects inherit directly from other objects.

**Prototype Chain**:
\`\`\`js
const animal = { eats: true };
const rabbit = { jumps: true };

rabbit.__proto__ = animal; // rabbit inherits from animal
console.log(rabbit.eats); // true (from prototype)
\`\`\`

**Constructor Pattern**:
\`\`\`js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  return \`Hello, I'm \${this.name}\`;
};

const john = new Person('John');
console.log(john.greet()); // "Hello, I'm John"
\`\`\`

**ES6 Classes**: Syntactic sugar over prototypes:
\`\`\`js
class Person {
  constructor(name) { this.name = name; }
  greet() { return \`Hello, I'm \${this.name}\`; }
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'javascript'
  },

  // Senior
  {
    title: 'Memory Management & Garbage Collection',
    content: 'How does JavaScript handle memory management? What causes memory leaks?',
    answer: `**Memory Lifecycle**:
1. **Allocation**: Memory is allocated when variables/objects are created
2. **Use**: Read/write operations
3. **Release**: Memory is freed when no longer needed

**Garbage Collection**: Mark-and-Sweep algorithm
- Roots: global variables, active stack frames
- GC marks reachable objects from roots
- Unmarked objects are garbage collected

**Common Memory Leaks**:
1. **Accidental Globals**: Forgetting \`const/let\`
2. **Closures**: Retaining large references
3. **Detached DOM**: Elements removed but referenced in JS
4. **Event Listeners**: Never removed
5. **Timers**: setInterval/clearTimeout not cleared
6. **Maps/Caches**: Growing without bounds

**Detection**: Chrome DevTools Memory tab, heap snapshots`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'javascript'
  },
  {
    title: 'Explain the Temporal Dead Zone',
    content: 'What is the Temporal Dead Zone (TDZ) in JavaScript? How does it relate to hoisting?',
    answer: `The **Temporal Dead Zone** is the period between entering a scope and variable declaration where accessing let/const throws a ReferenceError.

**Hoisting**:
- \`var\`: Hoisted and initialized as \`undefined\`
- \`let/const\`: Hoisted but NOT initialized (TDZ)
- \`function\`: Hoisted with full definition

\`\`\`js
console.log(x); // undefined (var is hoisted)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 10;
\`\`\`

**Why TDZ Exists**:
1. Prevents accessing variables before declaration
2. Makes \`typeof\` unsafe for let/const in TDZ
3. Enforces temporal consistency - use before declaration is a bug

**\`typeof\` Edge Case**:
\`\`\`js
typeof x; // ReferenceError if x in TDZ
typeof x; // "undefined" if x never declared
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'javascript'
  }
];

// ============================================
// QUESTIONS - TYPESCRIPT
// ============================================

const typescriptQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'Basic types in TypeScript',
    content: 'What are the basic types in TypeScript? How do you define typed variables?',
    answer: `**Primitive Types**:
\`\`\`ts
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
\`\`\`

**Special Types**:
\`\`\`ts
let anything: any = "can be anything";
let unknown: unknown = "safer than any";
let voidValue: void = undefined;
let never: never = (() => { throw new Error(); })();
\`\`\`

**Type Inference**:
\`\`\`ts
let x = 5; // inferred as number
let y = "hello"; // inferred as string
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'typescript'
  },
  {
    title: 'What are interfaces and type aliases?',
    content: 'Explain the difference between interface and type in TypeScript.',
    answer: `**interface**: For object shapes, extensible, supports declaration merging

\`\`\`ts
interface User {
  name: string;
  age: number;
}

interface User {
  email: string; // Merges with above
}
\`\`\`

**type**: More flexible, can represent primitives, unions, intersections

\`\`\`ts
type ID = string | number;
type User = {
  name: string;
  age: number;
};
\`\`\`

**When to use**:
- interface: Public APIs, objects that can be extended
- type: Unions, intersections, mapped types, utility types`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'typescript'
  },
  {
    title: 'Function types in TypeScript',
    content: 'How do you type functions in TypeScript?',
    answer: `**Function Declaration**:
\`\`\`ts
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

**Arrow Function**:
\`\`\`ts
const multiply = (a: number, b: number): number => a * b;
\`\`\`

**Function Type**:
\`\`\`ts
type MathOperation = (a: number, b: number) => number;

const subtract: MathOperation = (a, b) => a - b;
\`\`\`

**Optional & Default Parameters**:
\`\`\`ts
function greet(name: string, greeting?: string): string {
  return greeting ? \`\${greeting}, \${name}\` : \`Hi, \${name}\`;
}

function createConfig(url: string, timeout = 5000) {}
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'typescript'
  },

  // Middle
  {
    title: 'What are generics?',
    content: 'Explain TypeScript generics and provide examples of when to use them.',
    answer: `**Generics** allow creating reusable components that work with multiple types.

**Basic Generic Function**:
\`\`\`ts
function identity<T>(arg: T): T {
  return arg;
}

identity<string>("hello");
identity(42); // Type inferred
\`\`\`

**Generic Interface**:
\`\`\`ts
interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: "hello" };
\`\`\`

**Generic Constraints**:
\`\`\`ts
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length);
}
\`\`\`

**Use Cases**: API responses, data structures, utility functions`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'typescript'
  },
  {
    title: 'Union and Intersection Types',
    content: 'Explain union (|) and intersection (&) types with examples.',
    answer: `**Union Types (|)**: Value can be one of several types

\`\`\`ts
type ID = string | number;

function printId(id: ID) {
  console.log(id);
}

// Type Narrowing
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase(); // TypeScript knows it's string
  }
  return value * 2; // It's number
}
\`\`\`

**Intersection Types (&)**: Combines multiple types

\`\`\`ts
interface Employee {
  name: string;
  salary: number;
}

interface Manager {
  reports: Employee[];
}

type ManagerEmployee = Employee & Manager;

const ceo: ManagerEmployee = {
  name: "CEO",
  salary: 100000,
  reports: []
};
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'typescript'
  },
  {
    title: 'What are utility types?',
    content: 'Describe commonly used TypeScript utility types like Partial, Required, Pick, and Omit.',
    answer: `**Partial<T>**: Makes all properties optional

\`\`\`ts
interface User {
  name: string;
  age: number;
}

function updateUser(id: string, fields: Partial<User>) {}
updateUser("1", { age: 30 }); // Only update age
\`\`\`

**Required<T>**: Makes all properties required

**Pick<T, K>**: Select specific properties

\`\`\`ts
type UserPreview = Pick<User, "name">;
// { name: string }
\`\`\`

**Omit<T, K>**: Remove specific properties

\`\`\`ts
type CreateUserDto = Omit<User, "id">;
\`\`\`

**Record<K, T>**: Create object type with keys

**Readonly<T>**: Make all properties readonly`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'typescript'
  },

  // Senior
  {
    title: 'Advanced TypeScript: Conditional Types',
    content: 'Explain conditional types and provide practical examples.',
    answer: `**Conditional Types**: Select type based on condition

\`\`\`ts
type NonNullable<T> = T extends null | undefined ? never : T;

type Result = NonNullable<string | null>; // string
\`\`\`

**Conditional Type with Infer**:
\`\`\`ts
type Unpromise<T> = T extends Promise<infer U> ? U : T;

type Data = Unpromise<Promise<string>>; // string
\`\`\`

**Distributive Conditional Types**:
\`\`\`ts
type ToArray<T> = T extends any ? T[] : never;

type Numbers = ToArray<string | number>;
// string[] | number[]
\`\`\`

**Real-world Example**:
\`\`\`ts
type EventType = 'click' | 'focus';
type EventMap<T extends EventType> = T extends 'click'
  ? { x: number; y: number }
  : { target: HTMLElement };
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'typescript'
  },
  {
    title: 'TypeScript Decorators',
    content: 'What are decorators in TypeScript? How do they work?',
    answer: `**Decorators**: Special syntax for class declarations and members

\`\`\`ts
// Class Decorator
@Component({
  selector: 'app-root',
  template: '<h1>Hello</h1>'
})
class AppComponent {}

// Method Decorator
class MyClass {
  @Log
  myMethod(arg: string) {}
}

// Property Decorator
class MyClass {
  @MinLength(10)
  password: string;
}
\`\`\`

**Creating a Decorator**:
\`\`\`ts
function Log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${propertyKey}\`);
    return original.apply(this, args);
  };
}
\`\`\`

Note: Requires \`experimentalDecorators\` in tsconfig`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'typescript'
  }
];

// ============================================
// QUESTIONS - REACT
// ============================================

const reactQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What are React components?',
    content: 'Explain functional components vs class components in React.',
    answer: `**Functional Components** (modern approach):
\`\`\`js
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// Arrow function
const Welcome = ({ name }) => <h1>Hello, {name}</h1>;
\`\`\`

**Class Components** (legacy):
\`\`\`js
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
\`\`\`

**Why Functional?**
- Simpler syntax
- Hooks for state/lifecycle
- Better performance optimizations
- Easier to test

Hooks have made class components largely obsolete.`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'react'
  },
  {
    title: 'What is JSX?',
    content: 'Explain JSX syntax and how it works in React.',
    answer: `**JSX**: Syntax extension for JavaScript that looks like HTML

\`\`\`js
const element = <h1>Hello, world!</h1>;
\`\`\`

**Compiles to**:
\`\`\`js
const element = React.createElement('h1', null, 'Hello, world!');
\`\`\`

**Key Points**:
- Must return single parent element (or Fragment)
- camelCase for attributes (className, not class)
- {} for JavaScript expressions
- Comments use {/* */}

\`\`\`js
function Greeting({ name }) {
  return (
    <div className="container">
      <h1>Hello, {name}!</h1>
      {/* This is a comment */}
      <p>Today is {new Date().toDateString()}</p>
    </div>
  );
}
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'react'
  },
  {
    title: 'Explain useState hook',
    content: 'How does the useState hook work in React?',
    answer: `**useState**: Adds state to functional components

\`\`\`js
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

**Key Points**:
- Returns [currentValue, setterFunction]
- Initial value only used on first render
- Setter triggers re-render
- Functional updates for previous state:

\`\`\`js
setCount(prev => prev + 1);
\`\`\`

Can hold any type: objects, arrays, primitives`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'react'
  },

  // Middle
  {
    title: 'Explain useEffect hook',
    content: 'How does useEffect work? What are dependency arrays?',
    answer: `**useEffect**: Handle side effects in functional components

\`\`\`js
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // Runs on mount and when userId changes
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // Runs only on mount
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Cleanup');
  }, []);

  // Runs on every render (avoid!)
  useEffect(() => {
    console.log('Render');
  });
}
\`\`\`

**Dependency Array**:
- Empty [] = mount only
- [deps] = when deps change
- Omitted = every render

**Cleanup**: Return function from useEffect`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'react'
  },
  {
    title: 'What are controlled and uncontrolled components?',
    content: 'Explain the difference between controlled and uncontrolled components in React forms.',
    answer: `**Controlled Components**: Form data handled by React state

\`\`\`js
function Form() {
  const [value, setValue] = useState('');

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
\`\`\`

**Uncontrolled Components**: Form data handled by DOM

\`\`\`js
function Form() {
  const inputRef = useRef();

  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };

  return <input ref={inputRef} />;
}
\`\`\`

**When to use**:
- Controlled: Validation, dynamic forms, multi-field
- Uncontrolled: Simple forms, integrating with non-React code`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'react'
  },
  {
    title: 'What is prop drilling?',
    content: 'Explain prop drilling and how to avoid it.',
    answer: `**Prop Drilling**: Passing props through multiple levels

\`\`\`js
// BAD: Prop drilling
function App() {
  const [theme, setTheme] = useState('dark');
  return <Layout theme={theme} setTheme={setTheme} />;
}

function Layout({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />;
}

function Header({ theme, setTheme }) {
  return <Button theme={theme} setTheme={setTheme} />;
}
\`\`\`

**Solutions**:

1. **Context API**:
\`\`\`js
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Layout />
    </ThemeContext.Provider>
  );
}
\`\`\`

2. **State Management** (Redux, Zustand)
3. **Composition** (passing components as props)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'react'
  },

  // Senior
  {
    title: 'Explain React Fiber',
    content: 'What is React Fiber and why was it introduced?',
    answer: `**React Fiber**: Complete rewrite of React's reconciliation algorithm (React 16+)

**Previous Stack Reconciler Issues**:
- Synchronous rendering - blocked main thread
- No prioritization of updates
- No work splitting/cancellation

**Fiber Improvements**:
1. **Incremental Rendering**: Split work into units
2. **Prioritization**: Different priority updates (animation vs data fetch)
3. **Concurrency**: Pause, abort, reuse work
4. **Error Boundaries**: Better error handling

**Key Concepts**:
- Each component is a "fiber" node
- Each fiber has unit of work to do
- Scheduler determines which fibers to process
- Work is split between phases: render and commit

\`\`\`js
// Concurrent features
startTransition(() => {
  setExpensiveState(newValue); // Low priority
});
setInput(value); // High priority - urgent update
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'react'
  },
  {
    title: 'React performance optimization techniques',
    content: 'What are common performance optimization techniques in React?',
    answer: `**1. Memoization**:
\`\`\`js
// useMemo - cache expensive calculations
const filtered = useMemo(() =>
  data.filter(item => item.active),
  [data]
);

// useCallback - cache functions
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// React.memo - prevent unnecessary re-renders
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render */}</div>;
});
\`\`\`

**2. Code Splitting**:
\`\`\`js
const LazyComponent = React.lazy(() => import('./Component'));
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
\`\`\`

**3. Virtualization**:
- react-window, react-virtualized
- Only render visible items

**4. Debouncing/Throttling**:
- For search inputs, scroll events

**5. Key Prop**: Use stable, unique keys`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'react'
  }
];

// ============================================
// QUESTIONS - NEXT.JS
// ============================================

const nextjsQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What is Next.js?',
    content: 'Explain what Next.js is and what problems it solves.',
    answer: `**Next.js**: React framework for production

**Key Features**:
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- API Routes
- File-based routing
- Image optimization
- Built-in CSS support

**Why use Next.js?**:
- Better SEO than pure SPA
- Faster initial page load
- Backend API in same codebase
- Zero-config setup

**Basic Routing**:
\`\`\`
app/
  about/
    page.tsx       // /about
    page.module.css
  page.tsx         // /
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nextjs'
  },
  {
    title: 'Pages Router vs App Router',
    content: 'What are the differences between Pages Router and App Router?',
    answer: `**Pages Router** (previous default):
\`\`\`
pages/
  index.tsx       // /
  about.tsx       // /about
  blog/
    [id].tsx      // /blog/123
\`\`\`

**App Router** (Next.js 13+, recommended):
\`\`\`
app/
  page.tsx        // /
  about/
    page.tsx      // /about
  blog/
    [id]/
      page.tsx    // /blog/123
\`\`\`

**App Router Benefits**:
- React Server Components by default
- Simplified data fetching
- Nested layouts
- Streaming & Suspense
- Better performance`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nextjs'
  },
  {
    title: 'SSR vs SSG vs ISR',
    content: 'Explain Server-Side Rendering, Static Site Generation, and Incremental Static Regeneration.',
    answer: `**SSR (Server-Side Rendering)**: Generated on each request
\`\`\`ts
// Page renders on every request
export default function Page({ data }) {
  return <div>{data}</div>;
}

export async function getServerSideProps() {
  return { props: { data: await fetch() } };
}
\`\`\`

**SSG (Static Site Generation)**: Generated at build time
\`\`\`ts
export async function getStaticProps() {
  return { props: { data: await fetch() } };
}
\`\`\`

**ISR (Incremental Static Regeneration)**: Static, with updates
\`\`\`ts
export async function getStaticProps() {
  return {
    props: { data: await fetch() },
    revalidate: 60 // Regenerate every 60s
  };
}
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nextjs'
  },

  // Middle
  {
    title: 'Server Components vs Client Components',
    content: 'Explain the difference between Server and Client Components in App Router.',
    answer: `**Server Components** (default in App Router):
- Render on server
- No JavaScript sent to client
- Can access server resources directly
- Cannot use hooks/interactivity

\`\`\`ts
// Server Component (no "use client")
async function BlogPost({ id }) {
  const post = await db.post.findUnique({ where: { id } });
  return <article>{post.content}</article>;
}
\`\`\`

**Client Components**:
- Render in browser
- Use \`"use client"\` directive
- Can use hooks, event handlers

\`\`\`ts
"use client";

import { useState } from 'react';

export function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(l + 1)}>{likes}</button>;
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nextjs'
  },
  {
    title: 'What are API Routes?',
    content: 'Explain how API Routes work in Next.js.',
    answer: `**API Routes**: Build API endpoints as part of Next.js app

**Pages Router**:
\`\`\`ts
// pages/api/users.ts
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ users: [] });
  }
}
\`\`\`

**App Router** (Route Handlers):
\`\`\`ts
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Create user
  return NextResponse.json({ success: true });
}
\`\`\`

**Use Cases**:
- Form submissions
- Webhooks
- Authentication
- Proxy requests to hide API keys`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nextjs'
  },
  {
    title: 'Dynamic Routes in Next.js',
    content: 'How do you create dynamic routes in Next.js?',
    answer: `**App Router Dynamic Segments**:
\`\`\`
app/
  blog/
    [slug]/       // Single segment
      page.tsx    // /blog/my-post

    [...slug]/    // Catch-all
      page.tsx    // /blog/a/b/c

    [[...slug]]/  // Optional catch-all
      page.tsx    // /blog or /blog/a/b
\`\`\`

**Accessing Params**:
\`\`\`ts
// app/blog/[slug]/page.tsx
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>Blog: {params.slug}</h1>;
}

// For server components, params is a Promise in Next.js 15
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
}
\`\`\`

**generateStaticParams** (SSG with dynamic routes):
\`\`\`ts
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nextjs'
  },

  // Senior
  {
    title: 'Next.js Rendering Strategies',
    content: 'When should you use SSR vs SSG vs CSR vs ISR?',
    answer: `**Decision Matrix**:

| Strategy | Use When | Example |
|----------|----------|---------|
| **SSG** | Data available at build time, no user-specific | Blog, docs, marketing |
| **SSR** | Data changes frequently, needs SEO | E-commerce listings, news |
| **ISR** | Data changes but not on every request | Blogs, CMS content |
| **CSR** | User-specific, highly interactive | Dashboard, admin panel |

**Mixed Strategy Example**:
\`\`\`ts
// Static shell with dynamic content
export const revalidate = 3600; // ISR

export default async function Page() {
  // Server: Fetch static content
  const content = await fetchContent();

  return (
    <>
      <StaticContent content={content} />
      <ClientInteractive /> {/* "use client" */}
    </>
  );
}
\`\`\`

**Per-Route Configuration**:
\`\`\`ts
// Force dynamic
export const dynamic = 'force-dynamic';

// Static generation
export const dynamic = 'force-static';
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nextjs'
  }
];

// ============================================
// QUESTIONS - NODE.JS
// ============================================

const nodejsQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What is Node.js?',
    content: 'Explain what Node.js is and its key features.',
    answer: `**Node.js**: JavaScript runtime built on V8 engine

**Key Features**:
- Server-side JavaScript
- Non-blocking I/O
- Event-driven architecture
- Single-threaded with event loop
- NPM ecosystem

**Use Cases**:
- Web servers (Express, Fastify)
- Microservices
- CLI tools
- Real-time applications (Socket.io)

**Simple Server**:
\`\`\`js
import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

server.listen(3000);
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nodejs'
  },
  {
    title: 'CommonJS vs ES Modules',
    content: 'Explain the difference between CommonJS and ES Modules in Node.js.',
    answer: `**CommonJS** (CJS) - Node's original module system:
\`\`\`js
// Exporting
module.exports = myFunction;
exports.myVar = value;

// Importing
const fn = require('./myModule');
const { myVar } = require('./myModule');
\`\`\`

**ES Modules** (ESM) - Modern standard:
\`\`\`js
// Exporting
export default myFunction;
export const myVar = value;

// Importing
import fn from './myModule.js';
import { myVar } from './myModule.js';
\`\`\`

**Key Differences**:
- CJS: synchronous, dynamic require
- ESM: asynchronous, static imports
- ESM: top-level await support
- Enable ESM: "type": "module" in package.json`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nodejs'
  },
  {
    title: 'What is the package.json file?',
    content: 'Explain the purpose of package.json and its key fields.',
    answer: `**package.json**: Project manifest file

**Key Fields**:
\`\`\`json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My application",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
\`\`\`

**Version Ranges**:
- \`^4.18.0\`: Compatible with 4.x.x (most common)
- \`~4.18.0\`: Compatible with 4.18.x
- \`4.18.0\`: Exact version
- \`*\`: Any version`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nodejs'
  },

  // Middle
  {
    title: 'Explain Node.js Event Emitter',
    content: 'How does EventEmitter work in Node.js?',
    answer: `**EventEmitter**: Core pattern for handling events

\`\`\`js
import { EventEmitter } from 'events';

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// Listen for event
myEmitter.on('event', (data) => {
  console.log('Event occurred:', data);
});

// Emit event
myEmitter.emit('event', { message: 'Hello' });

// One-time listener
myEmitter.once('event', handler);

// Remove listener
myEmitter.off('event', handler);
\`\`\`

**Common Use Cases**:
- HTTP server: 'request', 'connection'
- Streams: 'data', 'end', 'error'
- File system: watching files
- Custom application events

**Best Practice**: Always handle 'error' events to avoid crashes`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nodejs'
  },
  {
    title: 'What are Streams in Node.js?',
    content: 'Explain the four types of streams and when to use them.',
    answer: `**Streams**: Handle data piece by piece (chunks)

**Four Types**:
1. **Readable**: fs.createReadStream
2. **Writable**: fs.createWriteStream
3. **Duplex**: Socket (both read and write)
4. **Transform**: zlib (modify data between read and write)

\`\`\`js
import { createReadStream, createWriteStream } from 'fs';

const readStream = createReadStream('input.txt');
const writeStream = createWriteStream('output.txt');

readStream.pipe(writeStream);
\`\`\`

**Benefits**:
- Memory efficient: Don't load entire file
- Time efficient: Start processing immediately
- Composable: Can chain streams

**Pipeline** (modern approach):
\`\`\`js
import { pipeline } from 'stream/promises';

await pipeline(
  readStream,
  transformStream,
  writeStream
);
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nodejs'
  },
  {
    title: 'What is the Buffer class?',
    content: 'Explain the Buffer class in Node.js and its use cases.',
    answer: `**Buffer**: Fixed-size raw binary data

\`\`\`js
// Create buffer
const buf = Buffer.from('Hello');

// Access bytes
console.log(buf[0]); // 72 (ASCII for 'H')

// Convert
buf.toString('hex'); // '48656c6c6f'
buf.toString('base64'); // 'SGVsbG8='

// Buffer manipulation
Buffer.concat([buf1, buf2]);
buf.slice(0, 3);
\`\`\`

**Use Cases**:
- File I/O
- Network protocols
- Cryptography
- Image/video processing
- TCP streams

**Note**: In Node.js, Buffer is a global - no need to import`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nodejs'
  },

  // Senior
  {
    title: 'Node.js Worker Threads',
    content: 'Explain Worker Threads and CPU-bound tasks in Node.js.',
    answer: `**Problem**: Node.js is single-threaded - CPU tasks block event loop

**Worker Threads**: Run JavaScript in parallel threads

\`\`\`js
import { Worker } from 'worker_threads';

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', {
      workerData: data
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(\`Worker stopped \${code}\`));
    });
  });
}
\`\`\`

**worker.js**:
\`\`\`js
import { parentPort, workerData } from 'worker_threads';

const result = heavyComputation(workerData);
parentPort.postMessage(result);
\`\`\`

**Use Cases**:
- Image/video processing
- Encryption
- Data parsing/encoding
- Mathematical computations

**Limitation**: Workers have overhead - not for I/O`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nodejs'
  }
];

// ============================================
// QUESTIONS - NESTJS
// ============================================

const nestjsQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What is NestJS?',
    content: 'Explain what NestJS is and why you would use it.',
    answer: `**NestJS**: Progressive Node.js framework for building server-side applications

**Key Features**:
- TypeScript by default
- Architectured with Angular-like patterns
- Built-in support for Microservices
- WebSocket support
- GraphQL support
- Extensible with modules

**Core Concepts**:
- **Modules**: Organize application structure
- **Controllers**: Handle requests, return responses
- **Providers**: Services, repositories, factories
- **Pipes**: Validation/transformation
- **Guards**: Authentication/authorization
- **Interceptors**: Extra logic before/after handling

**Basic Controller**:
\`\`\`ts
@Controller('cats')
export class CatsController {
  @Get()
  findAll() { return []; }

  @Post()
  create() { return {}; }
}
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nestjs'
  },
  {
    title: 'Explain Modules in NestJS',
    content: 'What are modules and how do they organize a NestJS application?',
    answer: `**Module**: Class annotated with @Module() that organizes application

\`\`\`ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  imports: [OtherModule],      // Import other modules
  controllers: [CatsController],
  providers: [CatsService],    // Services/providers
  exports: [CatsService],      // Export for other modules
})
export class CatsModule {}
\`\`\`

**App Module** (root module):
\`\`\`ts
@Module({
  imports: [CatsModule, DogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
\`\`\`

**Best Practices**:
- One module per feature domain
- Shared providers in a CoreModule
- Lazy load modules with \`load()\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nestjs'
  },
  {
    title: 'What are Providers?',
    content: 'Explain providers and dependency injection in NestJS.',
    answer: `**Provider**: Class that can be injected as a dependency

**Services as Providers**:
\`\`\`ts
@Injectable()
export class CatsService {
  private cats = [];

  findAll() { return this.cats; }
  create(cat) { this.cats.push(cat); }
}
\`\`\`

**Dependency Injection**:
\`\`\`ts
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  findAll() { return this.catsService.findAll(); }
}
\`\`\`

**Custom Providers**:
\`\`\`ts
{
  provide: 'CONNECTION',
  useClass: MyConnection,
  // or useValue: { ... }
  // or useFactory: () => { ... }
}
\`\`\`

**Scope** (default: SINGLETON):
- DEFAULT: Shared across app
- REQUEST: New instance per request
- TRANSIENT: New instance each time injected`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'nestjs'
  },

  // Middle
  {
    title: 'Guards and Interceptors',
    content: 'Explain Guards and Interceptors in NestJS with examples.',
    answer: `**Guards**: Determine if request should proceed (auth/roles)

\`\`\`ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.user; // Must have user
  }
}

@Controller('cats')
@UseGuards(AuthGuard)
export class CatsController {}
\`\`\`

**Interceptors**: Extra logic before/after method execution

\`\`\`ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before...');
    return next.handle().pipe(
      tap(() => console.log('After...'))
    );
  }
}

// Transform response
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({ success: true, data }))
    );
  }
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nestjs'
  },
  {
    title: 'What are Pipes in NestJS?',
    content: 'Explain Pipes for validation and transformation.',
    answer: `**Pipes**: Transform input data or validate it

**Built-in Pipes**:
\`\`\`ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  // id is guaranteed to be a number
}

@Post()
create(@Body(ValidationPipe) createCatDto: CreateCatDto) {}
\`\`\`

**Custom Pipe**:
\`\`\`ts
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }
}
\`\`\`

**Validation with class-validator**:
\`\`\`ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCatDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

// In main.ts
app.useGlobalPipes(new ValidationPipe());
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nestjs'
  },
  {
    title: 'Exception Filters',
    content: 'How do you handle exceptions in NestJS?',
    answer: `**Exception Filters**: Catch and format exceptions

\`\`\`ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}

// Use globally
app.useGlobalFilters(new HttpExceptionFilter());

// Or on controller/method
@Post()
@UseFilters(HttpExceptionFilter)
create() {}
\`\`\`

**Custom Exceptions**:
\`\`\`ts
export class CatNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(\`Cat \${id} not found\`);
  }
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'nestjs'
  },

  // Senior
  {
    title: 'NestJS Microservices',
    content: 'Explain how NestJS handles microservices architecture.',
    answer: `**NestJS Microservices**: Build distributed systems easily

**Transporters Supported**:
- Redis
- NATS
- RabbitMQ
- Kafka
- gRPC
- MQTT

**Setup**:
\`\`\`ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { MicroservicesOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroservicesOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: { host: 'localhost', port: 6379 }
    }
  );
  await app.listen();
}
\`\`\`

**Message Pattern**:
\`\`\`ts
@Controller()
export class AppController {
  @EventPattern('user_created')
  handleUserCreated(data: Record<string, unknown>) {
    // Handle event
  }

  @MessagePattern({ cmd: 'sum' })
  sum(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }
}
\`\`\`

**Hybrid App**: HTTP + Microservice in same app`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'nestjs'
  }
];

// ============================================
// QUESTIONS - POSTGRESQL
// ============================================

const postgresqlQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What is PostgreSQL?',
    content: 'Explain what PostgreSQL is and its key features.',
    answer: `**PostgreSQL**: Open-source relational database system

**Key Features**:
- ACID compliance
- MVCC (Multi-Version Concurrency Control)
- Supports JSON/JSONB
- Extensive data types
- Extensions ecosystem
- Full-text search
- Stored procedures (PL/pgSQL)

**Common Data Types**:
- \`text\`, \`varchar\`, \`char\` - strings
- \`integer\`, \`bigint\`, \`numeric\` - numbers
- \`boolean\` - true/false
- \`timestamp\`, \`date\`, \`time\` - dates
- \`json\`, \`jsonb\` - JSON data
- \`uuid\` - unique identifiers
- \`array\` - arrays

**Basic Query**:
\`\`\`sql
SELECT id, name, email
FROM users
WHERE active = true
ORDER BY created_at DESC
LIMIT 10;
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'postgresql'
  },
  {
    title: 'What are the different types of JOINs?',
    content: 'Explain INNER, LEFT, RIGHT, and FULL JOINs in SQL.',
    answer: `**INNER JOIN**: Only matching rows
\`\`\`sql
SELECT u.name, o.order_date
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- Only users who have orders
\`\`\`

**LEFT JOIN**: All from left, matching from right
\`\`\`sql
SELECT u.name, o.order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- All users, NULL if no orders
\`\`\`

**RIGHT JOIN**: All from right, matching from left
\`\`\`sql
SELECT u.name, o.order_date
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
-- All orders, NULL if no user
\`\`\`

**FULL JOIN**: All rows from both tables
\`\`\`sql
SELECT u.name, o.order_date
FROM users u
FULL JOIN orders o ON u.id = o.user_id;
-- Everything, NULLs where no match
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'postgresql'
  },
  {
    title: 'What are indexes?',
    content: 'Explain database indexes and when to use them.',
    answer: `**Index**: Data structure that improves query speed

**Creating Indexes**:
\`\`\`sql
-- Single column
CREATE INDEX idx_users_email ON users(email);

-- Multiple columns
CREATE INDEX idx_users_name_email ON users(last_name, first_name);

-- Unique index
CREATE UNIQUE INDEX idx_users_email ON users(email);
\`\`\`

**When to Index**:
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY
- Columns frequently queried

**When NOT to Index**:
- Small tables
- Frequently updated columns
- Columns in queries that return most rows

**View Indexes**:
\`\`\`sql
\\d index_name  -- psql command
SELECT * FROM pg_indexes WHERE tablename = 'users';
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'postgresql'
  },

  // Middle
  {
    title: 'Explain ACID properties',
    content: 'What are ACID properties in database transactions?',
    answer: `**ACID**: Four properties ensuring reliable transactions

**Atomicity**: All-or-nothing execution
\`\`\`sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- If second query fails, first is rolled back
\`\`\`

**Consistency**: Database remains valid
- All constraints satisfied
- No data corruption
- Valid transitions between states

**Isolation**: Concurrent transactions don't interfere

Isolation Levels:
- READ UNCOMMITTED: Lowest
- READ COMMITTED: PostgreSQL default
- REPEATABLE READ: Same row if read again
- SERIALIZABLE: Highest, complete isolation

**Durability**: Committed data persists
- Even after power loss
- Write-ahead logging (WAL)
\`\`\`sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'postgresql'
  },
  {
    title: 'What are CTEs (Common Table Expressions)?',
    content: 'Explain CTEs and provide examples of their use.',
    answer: `**CTE**: Temporary result set referenced within SELECT, INSERT, UPDATE, DELETE

**Basic CTE**:
\`\`\`sql
WITH active_users AS (
  SELECT id, name
  FROM users
  WHERE active = true
)
SELECT *
FROM active_users
WHERE name LIKE 'A%';
\`\`\`

**Multiple CTEs**:
\`\`\`sql
WITH
  monthly_sales AS (
    SELECT DATE_TRUNC('month', order_date) AS month, SUM(amount)
    FROM orders
    GROUP BY 1
  ),
  monthly_targets AS (
    SELECT month, target * 1.1 AS new_target
    FROM sales_targets
  )
SELECT m.month, m.sum, t.new_target
FROM monthly_sales m
JOIN monthly_targets t ON m.month = t.month;
\`\`\`

**Recursive CTE** (hierarchical data):
\`\`\`sql
WITH RECURSIVE subordinates AS (
  SELECT id, name, manager_id
  FROM employees
  WHERE id = 1  -- Start with CEO
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e
  JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates;
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'postgresql'
  },
  {
    title: 'JSONB vs JSON',
    content: 'Explain the difference between JSON and JSONB in PostgreSQL.',
    answer: `**JSON**: Stored as plain text, exact copy of input
- Preserves whitespace, ordering
- Faster to insert
- Slower to query
- Must parse on every access

**JSONB**: Stored in binary format, decomposed
- No whitespace preservation
- Slower to insert (parsing on insert)
- Faster to query (already parsed)
- Supports indexing (GIN)

\`\`\`sql
-- Create table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  data JSONB
);

-- Insert
INSERT INTO events (data) VALUES ('{"name": "John", "age": 30}');

-- Query
SELECT data->>'name' AS name FROM events WHERE data->>'age' = '30';

-- Update
UPDATE events SET data = jsonb_set(data, '{age}', '31');
\`\`\`

**JSONB Indexing**:
\`\`\`sql
CREATE INDEX idx_events_data ON events USING GIN (data);
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'postgresql'
  },

  // Senior
  {
    title: 'Explain MVCC in PostgreSQL',
    content: 'How does Multi-Version Concurrency Control work?',
    answer: `**MVCC**: PostgreSQL's approach to concurrent access

**How It Works**:
- Each transaction sees a snapshot of data
- Readers never block writers
- Writers never block readers
- Old versions kept until no transaction needs them

**System Columns**:
- \`xmin\`: Transaction ID that created row
- \`xmax\`: Transaction ID that expired row
- \`cmin\`, \`cmax\`: Command within transaction

\`\`\`sql
SELECT xmin, xmax, * FROM users;
\`\`\`

**VACUUM**: Remove dead tuple versions
- Autovacuum runs automatically
- Dead tuples accumulate from UPDATEs/DELETEs
- bloat if not vacuumed

**VACUUM vs VACUUM FULL**:
- VACUUM: Reclaims space, keeps table accessible
- VACUUM FULL: Rewrites entire table, locks table

**Monitoring**:
\`\`\`sql
SELECT schemaname, tablename, n_dead_tup
FROM pg_stat_user_tables;
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'postgresql'
  },
  {
    title: 'Query Optimization and EXPLAIN ANALYZE',
    content: 'How do you analyze and optimize slow PostgreSQL queries?',
    answer: `**EXPLAIN**: See query execution plan

\`\`\`sql
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
-- Actually runs and shows timing
\`\`\`

**Key Plan Nodes**:
- Seq Scan: Scans entire table (slow for large tables)
- Index Scan: Uses index (faster)
- Bitmap Scan: Index + heap fetch
- Nested Loop: Joins by iterating
- Hash Join: Builds hash table (usually better)

**Optimization Techniques**:

1. **Add indexes** on WHERE/JOIN columns
2. **Use ANALYZE** to update statistics
\`\`\`sql
ANALYZE users;
\`\`\`

3. **Partial Indexes**:
\`\`\`sql
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
\`\`\`

4. **Covering Indexes** (INCLUDE):
\`\`\`sql
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name);
\`\`\``,
    level: QuestionLevel.SENIOR,
    topicSlug: 'postgresql'
  }
];

// ============================================
// QUESTIONS - SYSTEM DESIGN
// ============================================

const systemDesignQuestions: QuestionSeed[] = [
  // Junior
  {
    title: 'What is CAP theorem?',
    content: 'Explain the CAP theorem in distributed systems.',
    answer: `**CAP Theorem**: In a distributed system, you can only have 2 of 3:

**Consistency**: All nodes see same data simultaneously
- Every read receives most recent write
- Strong consistency guarantees

**Availability**: Every request receives response
- Success or failure
- No timeouts

**Partition Tolerance**: System continues despite network failures
- Messages may be lost/delayed
- Network is unreliable

**Trade-offs**:

| System Type | Properties | Use Case |
|-------------|------------|----------|
| CP | Consistency + Partition | Banking, inventory |
| AP | Availability + Partition | Social media feeds |
| CA | Consistency + Availability | Single-node (no P) |

**Example**:
- **PostgreSQL**: Can be CA (single node) or CP (with streaming replication)
- **Cassandra**: AP (eventual consistency)
- **MongoDB**: CP (primary-secondary replication)

In practice, P is always a given in distributed systems - you choose between C and A.`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'system-design'
  },
  {
    title: 'What is load balancing?',
    content: 'Explain load balancing and common algorithms.',
    answer: `**Load Balancer**: Distributes incoming traffic across multiple servers

**Why Use Load Balancers?**:
- Prevents single server overload
- Enables horizontal scaling
- Provides high availability
- SSL termination
- Health checking

**Algorithms**:

1. **Round Robin**: Requests distributed sequentially
2. **Least Connections**: Sends to server with fewest active connections
3. **IP Hash**: Same client always to same server (session stickiness)
4. **Weighted**: More powerful servers get more requests

**Types**:
- **L4**: Transport layer (TCP/UDP) - fast, less info
- **L7**: Application layer (HTTP) - content-aware routing

**Example Architecture**:
\`\`\`
Clients → Load Balancer → [Server1, Server2, Server3]
                     ↓
                Health Check
\`\`\``,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'system-design'
  },
  {
    title: 'What is caching?',
    content: 'Explain caching strategies and common use cases.',
    answer: `**Caching**: Store frequently accessed data in fast storage

**Cache Locations**:
1. **Client**: Browser cache, CDN
2. **Application**: In-memory (Redis, Memcached)
3. **Database**: Query cache, buffer pool

**Strategies**:

**Cache Aside** (Lazy Loading):
\`\`\`js
1. Check cache
2. If miss, query database
3. Write to cache
4. Return data
\`\`\`

**Write Through**: Write to cache and DB simultaneously

**Write Back**: Write to cache, async to DB (faster, risk of data loss)

**Cache Eviction**:
- **LRU**: Least Recently Used
- **LFU**: Least Frequently Used
- **TTL**: Time To Live

**What to Cache**:
- Static data (configs, lookups)
- Expensive computations
- Database query results
- API responses

**Considerations**:
- Cache invalidation
- Stale data
- Memory limits`,
    level: QuestionLevel.JUNIOR,
    topicSlug: 'system-design'
  },

  // Middle
  {
    title: 'Vertical vs Horizontal Scaling',
    content: 'Explain the difference between vertical and horizontal scaling.',
    answer: `**Vertical Scaling** (Scale Up):
- Add more resources to single server
- Better CPU, more RAM, faster disk
- Simpler architecture
- Eventually hits hardware limits
- Single point of failure
- More expensive per resource

**Horizontal Scaling** (Scale Out):
- Add more servers/nodes
- Distributes load across machines
- Can handle unlimited growth
- Requires coordination (load balancer, distributed data)
- More complex architecture
- Commodity hardware

**Example**:

\`\`\`
Vertical:  Server (4 cores) → Server (8 cores) → Server (16 cores)

Horizontal: Server → [Server, Server] → [Server, Server, Server, Server]
\`\`\`

**When to Use**:
- Vertical: Small apps, simpler requirements, quick scaling
- Horizontal: Large apps, high availability, cost-effective at scale

**Modern Approach**: Start vertical, move to horizontal when needed.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'system-design'
  },
  {
    title: 'Explain CDN and how it works',
    content: 'What is a Content Delivery Network and what problems does it solve?',
    answer: `**CDN**: Distributed network of servers delivering content

**How It Works**:
\`\`\`
User → DNS → CDN Edge Server (closest)
                ↓
            Has content? Yes → Serve
            Has content? No → Origin Server → Cache → Serve
\`\`\`

**Benefits**:
- Reduced latency (serving from edge)
- Reduced bandwidth cost (offload origin)
- Increased availability (distributed)
- Better user experience

**What's Cached**:
- Static assets (images, CSS, JS)
- Video content
- API responses (with appropriate headers)

**Cache Control Headers**:
\`\`\`http
Cache-Control: public, max-age=31536000, immutable
Cache-Control: no-cache
Cache-Control: no-store
\`\`\`

**Popular CDNs**:
- Cloudflare
- AWS CloudFront
- Fastly
- Akamai

**Edge Computing**: Run code at CDN edge (Cloudflare Workers)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'system-design'
  },
  {
    title: 'What is a database index and how does it work?',
    content: 'Explain database indexes at a deeper level.',
    answer: `**Index**: Data structure improving query speed (trade-off: space and write speed)

**B-Tree Index** (most common):
- Balanced tree structure
- O(log n) lookup
- Good for range queries
- PostgreSQL default

\`\`\`
          [50]
         /    \\
     [25]      [75]
    /   \\      /   \\
[10]  [40]  [60]  [90]
\`\`\`

**Hash Index**:
- Hash table
- O(1) exact lookup
- No range queries
- Good for equality

**GIN Index** (PostgreSQL):
- Generalized Inverted Index
- For arrays, JSONB
- Contains queries

**Trade-offs**:
- Faster reads
- Slower writes (index must be updated)
- More storage
- Potential index bloat

**Composite Index**:
- Index on multiple columns
- Order matters
- Can satisfy queries from index alone (covering index)

\`\`\`sql
CREATE INDEX idx_user_age_country ON users(age, country);
-- Efficient for: WHERE age = ? AND country = ?
-- Also efficient for: WHERE age = ?
-- NOT efficient for: WHERE country = ?
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: 'system-design'
  },

  // Senior
  {
    title: 'Design a URL Shortener',
    content: 'How would you design a system like bit.ly?',
    answer: `**Requirements**:
- Generate short URLs from long URLs
- Redirect short URLs to original
- High availability
- Handle 10M requests/day

**API Design**:
\`\`\`js
POST /api/shorten { url: "https://example.com/very/long/url" }
Response: { shortUrl: "https://shrt.ly/abc12" }

GET /:code
Response: 301 redirect to original URL
\`\`\`

**Short Code Generation**:
1. **Counter + Base62**: Simple, predictable
2. **Hash (MD5/SHA)**: Fixed length, collisions possible
3. **UUID**: Too long

**Database Schema**:
\`\`\`sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  short_code CHAR(7) UNIQUE NOT NULL,
  long_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  access_count INT DEFAULT 0
);

CREATE INDEX idx_short_code ON urls(short_code);
\`\`\`

**Scaling**:
- Read-heavy: Cache popular URLs in Redis
- Write-heavy: Pre-generate codes in batches
- Sharding: By short code prefix

**301 vs 302**:
- 301: Permanent redirect (browser caches)
- 302: Temporary (no cache, tracks analytics)`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'system-design'
  },
  {
    title: 'Design a Rate Limiter',
    content: 'How would you design a distributed rate limiting system?',
    answer: `**Requirements**:
- Limit requests per user/time window
- Distributed (multiple servers)
- Low latency

**Algorithms**:

**1. Fixed Window**:
\`\`\`js
// Reset at hour boundary
if (count[userId][hour] < 100) {
  count[userId][hour]++;
  allow();
}
\`\`\`
Issue: Spike at boundaries (2x at hour start)

**2. Sliding Window Log**:
- Store timestamps of requests
- Count within window
- Accurate but memory-intensive

**3. Token Bucket**:
\`\`\`js
bucket = { tokens: maxRate, lastRefill: now };

function allowRequest() {
  refillTokens();
  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return true;
  }
  return false;
}
\`\`\`
- Bursts allowed (up to bucket size)
- Smooth rate limiting

**Implementation**:
- **Redis**: INCR + EXPIRE for fixed window
- **Redis + Sorted Set**: Sliding window (remove old timestamps)
- **Nginx**: Built-in rate limiting

**Distributed Challenge**: Clock sync, use atomic Redis operations`,
    level: QuestionLevel.SENIOR,
    topicSlug: 'system-design'
  }
];

// ============================================
// EXPORT ALL QUESTIONS
// ============================================

export const allQuestions: QuestionSeed[] = [
  ...javascriptQuestions,
  ...typescriptQuestions,
  ...reactQuestions,
  ...nextjsQuestions,
  ...nodejsQuestions,
  ...nestjsQuestions,
  ...postgresqlQuestions,
  ...systemDesignQuestions,
];

// Stats
console.log('=== Interview Library Seed Data ===');
console.log(`Topics: ${topics.length}`);
console.log(`Total Questions: ${allQuestions.length}`);

// By topic
topics.forEach(topic => {
  const count = allQuestions.filter(q => q.topicSlug === topic.slug).length;
  console.log(`  ${topic.name}: ${count} questions`);
});

// By level
const byLevel = allQuestions.reduce((acc, q) => {
  acc[q.level] = (acc[q.level] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log('By Level:', byLevel);
