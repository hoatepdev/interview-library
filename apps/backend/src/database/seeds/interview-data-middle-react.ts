/**
 * Middle-Level React Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: hooks deep-dive, rendering behavior, state management patterns,
 * performance, testing, and real-world architecture decisions.
 *
 * Topic: react
 * Level: MIDDLE
 *
 * Usage: npm run seed:middle-react
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

const reactMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "useEffect cleanup function: when it runs, why it matters, and common leak patterns",
    content:
      "Explain the useEffect cleanup function in detail. When exactly does it run? Give a production example of a memory leak caused by a missing cleanup, and show how to fix it.",
    answer: `**When cleanup runs**:
1. Before the effect re-runs (when dependencies change)
2. When the component unmounts

React calls cleanup from the **previous** render before running the new effect. This ensures stale closures don't cause issues.

**Lifecycle**:
\`\`\`
Mount:     effect runs
Update:    cleanup (old) → effect (new)
Unmount:   cleanup (final)
\`\`\`

**Memory leak — unaborted fetch**:
\`\`\`tsx
// BUG: if component unmounts before fetch completes,
// setState is called on an unmounted component
useEffect(() => {
  fetch('/api/users').then(res => res.json()).then(setUsers);
}, []);

// FIX: use AbortController
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/users', { signal: controller.signal })
    .then(res => res.json())
    .then(setUsers)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  return () => controller.abort();
}, []);
\`\`\`

**Other cleanup patterns**:
- **WebSocket**: \`return () => socket.close();\`
- **Event listener**: \`return () => window.removeEventListener('resize', handler);\`
- **Timer**: \`return () => clearInterval(timerId);\`
- **Subscription**: \`return () => subscription.unsubscribe();\`

**Common mistakes**:
- Forgetting cleanup entirely — leading to memory leaks and stale state updates
- Adding cleanup for effects that don't need it (pure computations)
- Not understanding that cleanup runs with the **old** closure values, not the new ones

**Follow-up**: What happens if you return a non-function value from useEffect? How does React 18 Strict Mode's double-invocation of effects help catch missing cleanups?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "useRef vs useState: when to use each and the 'stale closure' problem",
    content:
      "What is the difference between useRef and useState? When would you choose one over the other? Explain the 'stale closure' problem and how useRef solves it.",
    answer: `**Key differences**:
| Feature | useState | useRef |
|---|---|---|
| Triggers re-render | Yes | No |
| Returns | \`[value, setter]\` | \`{ current: value }\` |
| Persists across renders | Yes | Yes |
| Synchronous access | No (batched) | Yes (\`.current\` is immediate) |

**When to use useRef**:
1. **DOM references**: \`<input ref={inputRef} />\`
2. **Mutable values that shouldn't trigger re-render**: timer IDs, previous values, flags
3. **Avoiding stale closures**: when a callback needs the latest value

**Stale closure problem**:
\`\`\`tsx
function Chat() {
  const [message, setMessage] = useState('');

  const sendDelayed = () => {
    setTimeout(() => {
      // BUG: captures 'message' at the time the timeout was created
      console.log('Sending:', message);
    }, 3000);
  };

  // If user types "hello", clicks send, then changes to "world",
  // it logs "hello" — the stale value
}
\`\`\`

**Fix with useRef**:
\`\`\`tsx
function Chat() {
  const [message, setMessage] = useState('');
  const messageRef = useRef(message);
  messageRef.current = message; // always up-to-date

  const sendDelayed = () => {
    setTimeout(() => {
      console.log('Sending:', messageRef.current); // always latest
    }, 3000);
  };
}
\`\`\`

**Common patterns**:
- \`usePrevious\` hook: store previous value in a ref
- Tracking if component is mounted: \`const isMounted = useRef(true)\`
- Storing interval/timeout IDs for cleanup

**Common mistakes**:
- Using useState for values that don't need to trigger re-renders (wastes renders)
- Mutating \`ref.current\` during render (should only mutate in effects or handlers)
- Using useRef when you DO want re-renders on change

**Follow-up**: What is \`useImperativeHandle\` and when would you combine it with \`forwardRef\`? Can you use useRef to optimize expensive computations?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "useMemo and useCallback: when they help, when they hurt, and how to measure",
    content:
      "Explain useMemo and useCallback. When do they actually improve performance, and when do they add unnecessary overhead? How would you measure whether the optimization is worth it?",
    answer: `**useMemo**: Caches a computed value. Re-computes only when dependencies change.
\`\`\`tsx
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
\`\`\`

**useCallback**: Caches a function reference. Returns the same function instance unless dependencies change.
\`\`\`tsx
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []); // stable reference
\`\`\`

**When they HELP**:
1. **Expensive computations** with useMemo (sorting large lists, complex filtering)
2. **Preventing child re-renders** when passing callbacks to \`React.memo()\` wrapped children
3. **Stable references** for dependencies of other hooks (useEffect depends on a function)
4. **Context values** — memoize the value object to prevent all consumers from re-rendering

**When they HURT (or are useless)**:
- Primitive values or cheap computations — the memoization overhead exceeds the savings
- Components that re-render anyway regardless of prop equality
- Functions that are only used in the render body (not passed as props)

**Measuring**:
\`\`\`tsx
// React DevTools Profiler: identify re-renders
// Browser Performance tab: measure actual frame times
// Custom measurement:
const start = performance.now();
const result = expensiveComputation(data);
console.log('Computation took:', performance.now() - start, 'ms');
\`\`\`

**The rule**: Don't memoize by default. Profile first, optimize the bottlenecks.

**React Compiler** (React 19+): Automatically memoizes components and hooks, making manual useMemo/useCallback largely unnecessary in new code.

**Common mistakes**:
- Wrapping everything in useMemo/useCallback "just in case" — adds complexity and memory usage
- Using useCallback without React.memo on the child — the callback is stable but the child re-renders anyway
- Incorrect dependency arrays causing stale values or infinite re-renders

**Follow-up**: How does React.memo differ from useMemo? What is the React Compiler and how does it change the memoization story?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React rendering behavior: when does a component re-render and how to prevent unnecessary renders?",
    content:
      "Explain exactly when a React component re-renders. What are the common causes of unnecessary re-renders in production, and what strategies do you use to prevent them?",
    answer: `**A component re-renders when**:
1. Its **state** changes (setState/dispatch)
2. Its **parent re-renders** (props may or may not have changed)
3. A **context** it consumes changes
4. A **custom hook** it uses triggers a state update

**Important**: A parent re-rendering causes ALL children to re-render by default, even if their props haven't changed. React does NOT do shallow prop comparison automatically.

**Common causes of unnecessary re-renders**:

1. **Inline objects/arrays as props**:
\`\`\`tsx
// Bad: new object every render → child always re-renders
<Child style={{ color: 'red' }} />

// Fix: move to module scope or useMemo
const style = { color: 'red' }; // outside component
<Child style={style} />
\`\`\`

2. **Inline callbacks**:
\`\`\`tsx
// Bad: new function every render
<List onSelect={(id) => setSelected(id)} />

// Fix: useCallback (only if List is wrapped in React.memo)
const onSelect = useCallback((id) => setSelected(id), []);
<List onSelect={onSelect} />
\`\`\`

3. **Context providers with unstable values**:
\`\`\`tsx
// Bad: new object every render → all consumers re-render
<Ctx.Provider value={{ user, logout }}>

// Fix: memoize
const value = useMemo(() => ({ user, logout }), [user, logout]);
<Ctx.Provider value={value}>
\`\`\`

**Prevention strategies**:
- **React.memo()**: Wrap child components to skip re-render if props are shallowly equal
- **Split context**: Separate frequently changing values from stable ones
- **State colocation**: Move state closer to where it's used
- **Children pattern**: \`{children}\` doesn't re-render when parent state changes

\`\`\`tsx
// Children pattern: ExpensiveTree won't re-render when count changes
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div onClick={() => setCount(c + 1)}>{children}</div>;
}
<Parent><ExpensiveTree /></Parent>
\`\`\`

**Common mistakes**:
- Assuming React skips re-renders when props haven't changed — it doesn't by default
- Over-optimizing with React.memo everywhere instead of fixing the root cause
- Lifting state too high in the tree, causing cascading re-renders

**Follow-up**: How does React's reconciliation algorithm (diffing) work? What is the children pattern and why does it prevent re-renders?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Custom hooks: extraction patterns, rules of hooks, and sharing stateful logic",
    content:
      "How do custom hooks work in React? When should you extract logic into a custom hook vs keeping it in the component? What are the rules of hooks and why do they exist?",
    answer: `**Custom hooks**: Functions starting with \`use\` that compose built-in hooks. They share **logic**, not **state** — each call gets its own state.

\`\`\`tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage — each component gets independent debounced state
const debouncedSearch = useDebounce(searchTerm, 300);
\`\`\`

**When to extract**:
1. **Reuse**: Same logic needed in multiple components
2. **Complexity**: Component has too many hooks/effects — extract related ones
3. **Testing**: Easier to test logic in isolation (with renderHook)
4. **Separation of concerns**: Keep components focused on rendering

**When NOT to extract**:
- Logic is used in one place and is simple (2-3 lines)
- The abstraction would be harder to understand than the inline code

**Rules of hooks** (and why):
1. **Only call hooks at the top level** — not inside conditions, loops, or nested functions. React relies on call order to map state to hooks across renders.
2. **Only call hooks from React functions** — components or custom hooks. Regular functions can't use hooks because they don't participate in React's rendering lifecycle.

\`\`\`tsx
// WRONG: conditional hook
if (isLoggedIn) {
  useEffect(() => { ... }); // Error! Breaks call order
}

// RIGHT: conditional logic inside the hook
useEffect(() => {
  if (!isLoggedIn) return;
  // ... logic
}, [isLoggedIn]);
\`\`\`

**Production patterns**:
\`\`\`tsx
// Data fetching hook
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(setData)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [url]);

  return { data, error, loading };
}
\`\`\`

**Common mistakes**:
- Thinking custom hooks share state between components — they don't
- Creating hooks that are too generic/abstract — making them harder to use than raw hooks
- Not following the \`use\` prefix convention — ESLint can't enforce rules of hooks

**Follow-up**: How do you test custom hooks? What is the difference between a custom hook and a utility function?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Context API: when to use it, performance pitfalls, and alternatives",
    content:
      "When should you use React Context? What performance problems does it cause, and how do you mitigate them? When should you reach for a state management library instead?",
    answer: `**When to use Context**:
- Theme, locale, auth state — values that change infrequently and are needed by many components
- Dependency injection — providing services/config without prop drilling
- Compound components — sharing state between related components (Tabs, Accordion)

**Performance problem**: When context value changes, ALL consumers re-render, even if they only use a part of the value that didn't change.

\`\`\`tsx
// Problem: updating 'notifications' re-renders components that only need 'user'
const AppContext = createContext({ user, notifications, theme });
\`\`\`

**Mitigation strategies**:

1. **Split contexts**:
\`\`\`tsx
<UserContext.Provider value={user}>
  <NotificationContext.Provider value={notifications}>
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  </NotificationContext.Provider>
</UserContext.Provider>
\`\`\`

2. **Memoize provider value**:
\`\`\`tsx
const value = useMemo(() => ({ user, login, logout }), [user]);
<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
\`\`\`

3. **Separate state from dispatch**:
\`\`\`tsx
// Components that only dispatch never re-render from state changes
const StateContext = createContext(state);
const DispatchContext = createContext(dispatch);
\`\`\`

4. **use() hook (React 19)**: Read context conditionally with \`use(SomeContext)\`

**When to use a state management library instead**:
- Frequent state updates that affect many components (e.g., real-time data)
- Complex derived state with selectors (Zustand, Redux)
- State that needs to be accessed outside React (middleware, async logic)
- Need for devtools, persistence, time-travel debugging

**Quick comparison**:
| Need | Solution |
|---|---|
| Theme/locale (rare changes) | Context |
| Auth state | Context |
| Form state | Local state or React Hook Form |
| Server state | TanStack Query / SWR |
| Complex client state | Zustand / Redux Toolkit |

**Common mistakes**:
- Using one giant context for all app state — causes unnecessary re-renders everywhere
- Putting frequently changing values in context (mouse position, scroll, timers)
- Not memoizing the provider value — new object reference every render

**Follow-up**: How does \`useReducer\` + Context compare to Redux? What is the \`use()\` hook in React 19?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "useReducer vs useState: when complexity justifies a reducer pattern",
    content:
      "When should you use useReducer instead of useState? Explain the trade-offs and give a real-world example where useReducer significantly simplifies component logic.",
    answer: `**useState** is best for:
- Independent pieces of state
- Simple values (booleans, strings, numbers)
- Few state transitions

**useReducer** is best for:
- Related state that changes together
- Complex state transitions with multiple actions
- When next state depends on previous state in non-trivial ways
- When you want to centralize state logic for testing

**Real-world example — form with validation**:
\`\`\`tsx
// With useState — scattered logic
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// Multiple setState calls that must be coordinated
const handleSubmit = async () => {
  setIsSubmitting(true);
  setErrors({});
  try {
    await login(email, password);
    setIsSuccess(true);
  } catch (e) {
    setErrors({ form: e.message });
  } finally {
    setIsSubmitting(false);
  }
};
\`\`\`

\`\`\`tsx
// With useReducer — centralized transitions
type State = {
  email: string;
  password: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isSuccess: boolean;
};

type Action =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: {} };
    case 'SUBMIT':
      return { ...state, isSubmitting: true, errors: {} };
    case 'SUCCESS':
      return { ...state, isSubmitting: false, isSuccess: true };
    case 'ERROR':
      return { ...state, isSubmitting: false, errors: { form: action.error } };
  }
}
\`\`\`

**Benefits of the reducer**:
- Impossible states are prevented (can't be submitting AND successful simultaneously)
- State transitions are testable without rendering: \`expect(reducer(state, action)).toEqual(...)\`
- Easy to add logging/middleware
- Dispatch is stable (doesn't change between renders) — safe as context value or effect dependency

**Common mistakes**:
- Using useReducer for simple toggle/counter state — overkill
- Mutating state in the reducer instead of returning new objects
- Not using TypeScript discriminated unions for action types

**Follow-up**: How does \`useReducer\` + Context compare to external state managers? Can you use \`useReducer\` with async logic?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Keys in React: why they matter beyond 'unique identifier' and how wrong keys cause bugs",
    content:
      "Explain the role of the `key` prop in React lists. Why does using array index as key cause bugs? Give a concrete production example where incorrect keys lead to data corruption.",
    answer: `**What keys do**: Keys tell React which elements in a list correspond to which items across renders. React uses keys to decide whether to reuse, update, or destroy a component instance.

**Without keys** (or with index keys): React matches elements by position. If the list changes order, React updates props on existing instances instead of moving them.

**Production bug — index as key with form inputs**:
\`\`\`tsx
// users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]
{users.map((user, index) => (
  <UserForm key={index} user={user} />  // BUG
))}
\`\`\`

If "Alice" is deleted, "Bob" moves to index 0. React sees the same key (0) and **reuses the component instance** from Alice — keeping Alice's internal state (form values, refs, focus) but receiving Bob's props. Result: Bob's form shows Alice's unsaved input.

**Fix: use stable unique IDs**:
\`\`\`tsx
{users.map(user => (
  <UserForm key={user.id} user={user} />
))}
\`\`\`

**When index keys are OK**:
- Static lists that never reorder or filter
- Lists of pure display components with no internal state
- Lists where items don't have stable IDs (rare — generate IDs on creation)

**Key as reset mechanism**:
\`\`\`tsx
// Force a component to remount by changing its key
<ProfileEditor key={selectedUserId} userId={selectedUserId} />
// When selectedUserId changes, React destroys old instance and creates new
// This resets all internal state — useful for "edit different user" flows
\`\`\`

**How React reconciliation uses keys**:
1. Old list: \`[A, B, C]\` with keys \`[1, 2, 3]\`
2. New list: \`[C, A, B]\` with keys \`[3, 1, 2]\`
3. React matches by key, moves DOM nodes — doesn't destroy/recreate

**Common mistakes**:
- Using index for lists that can be reordered, filtered, or have items added/removed in the middle
- Using non-unique keys — React shows a warning and falls back to index behavior
- Using random values (Math.random()) as keys — forces remount every render
- Not using keys to intentionally reset component state when needed

**Follow-up**: How would you generate stable keys for items that don't have an ID? What is the performance difference between reordering with keys vs without keys?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Error Boundaries: catching render errors, limitations, and production patterns",
    content:
      "What are Error Boundaries in React? What errors do they catch and what do they NOT catch? How do you implement a production-ready error boundary?",
    answer: `**Error Boundaries**: Class components that catch JavaScript errors in their child component tree during rendering, lifecycle methods, and constructors. They display a fallback UI instead of crashing the entire app.

**What they catch**:
- Errors thrown during rendering
- Errors in lifecycle methods
- Errors in constructors of child components

**What they DON'T catch**:
- Event handlers (use try/catch instead)
- Async code (setTimeout, fetch .then)
- Server-side rendering errors
- Errors thrown in the error boundary itself

**Production implementation**:
\`\`\`tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error monitoring service
    errorReporter.captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
\`\`\`

**Production patterns**:

1. **Granular boundaries** — wrap sections, not the entire app:
\`\`\`tsx
<Layout>
  <ErrorBoundary fallback={<SidebarError />}>
    <Sidebar />
  </ErrorBoundary>
  <ErrorBoundary fallback={<ContentError />}>
    <MainContent />
  </ErrorBoundary>
</Layout>
\`\`\`

2. **Recovery mechanism**:
\`\`\`tsx
// Reset error state when navigating to a different page
<ErrorBoundary key={location.pathname} fallback={<ErrorPage />}>
  {children}
</ErrorBoundary>
\`\`\`

3. **Libraries**: \`react-error-boundary\` provides \`ErrorBoundary\` with reset, retry, and \`useErrorBoundary\` hook.

**Why class components?** There's no hook equivalent for \`getDerivedStateFromError\` or \`componentDidCatch\` yet. This is one of the few remaining reasons to use class components.

**Common mistakes**:
- Wrapping only at the app root — one error crashes the entire UI
- Not logging errors to a monitoring service (Sentry, DataDog)
- Expecting error boundaries to catch event handler or async errors
- Not providing a way to recover/retry from the error state

**Follow-up**: How does \`react-error-boundary\` library simplify error handling? How do you handle errors in event handlers and async code?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Controlled vs uncontrolled components: form architecture decisions in production",
    content:
      "Beyond the basic definition, explain the architectural trade-offs between controlled and uncontrolled form patterns. When would you choose one over the other in a production app? How do libraries like React Hook Form leverage the uncontrolled pattern?",
    answer: `**Controlled**: React state is the single source of truth. Every keystroke triggers a state update and re-render.
\`\`\`tsx
const [value, setValue] = useState('');
<input value={value} onChange={e => setValue(e.target.value)} />
\`\`\`

**Uncontrolled**: DOM is the source of truth. Values are read imperatively via refs.
\`\`\`tsx
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} defaultValue="" />
// Read: inputRef.current.value
\`\`\`

**Architectural trade-offs**:

| Aspect | Controlled | Uncontrolled |
|---|---|---|
| Re-renders | Every keystroke | None until submit |
| Validation | Real-time | On submit/blur |
| Conditional logic | Easy (state-driven) | Harder (imperative) |
| Performance | Can be slow with large forms | Faster — fewer renders |
| Testing | Easier (state is inspectable) | Requires DOM interaction |
| Third-party integration | May conflict | Natural for non-React libs |

**When to choose controlled**:
- Real-time validation (show errors as user types)
- Conditional fields (show field B based on field A's value)
- Computed values (auto-format phone numbers, currency)
- Small forms where re-render cost is negligible

**When to choose uncontrolled**:
- Large forms with many fields (50+ inputs)
- Performance-critical forms (data entry tools)
- File inputs (\`<input type="file">\` is always uncontrolled)
- Integrating with non-React libraries (jQuery plugins, etc.)

**React Hook Form** — best of both worlds:
\`\`\`tsx
const { register, handleSubmit, watch, formState: { errors } } = useForm();

// Uncontrolled by default — no re-renders on input
<input {...register('email', { required: true })} />

// Opt-in to watching specific fields (controlled behavior)
const email = watch('email'); // only re-renders when email changes
\`\`\`

React Hook Form uses refs internally, only re-rendering the form when validation state or watched fields change. This gives you controlled-like features with uncontrolled performance.

**Common mistakes**:
- Making every form controlled without considering form size and re-render cost
- Mixing controlled and uncontrolled patterns on the same input (React warns about this)
- Not using a form library for complex forms — reinventing validation, error handling, etc.

**Follow-up**: What is the difference between \`register\` and \`Controller\` in React Hook Form? How would you handle a dynamic form (add/remove fields) with each pattern?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React.lazy and Suspense: code splitting strategies and loading patterns",
    content:
      "How do React.lazy and Suspense work together for code splitting? What are the trade-offs of different splitting strategies? How do you handle loading and error states?",
    answer: `**React.lazy**: Dynamically imports a component. The import only happens when the component is first rendered.
\`\`\`tsx
const AdminPanel = React.lazy(() => import('./AdminPanel'));
\`\`\`

**Suspense**: Wraps lazy components and shows a fallback while they're loading.
\`\`\`tsx
<Suspense fallback={<Spinner />}>
  <AdminPanel />
</Suspense>
\`\`\`

**Code splitting strategies**:

1. **Route-based splitting** (most common):
\`\`\`tsx
const Home = lazy(() => import('./pages/Home'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

<Routes>
  <Route path="/" element={<Suspense fallback={<Spinner />}><Home /></Suspense>} />
  <Route path="/settings" element={<Suspense fallback={<Spinner />}><Settings /></Suspense>} />
</Routes>
\`\`\`

2. **Component-based splitting** (for heavy components):
\`\`\`tsx
const MarkdownEditor = lazy(() => import('./MarkdownEditor'));
const ChartWidget = lazy(() => import('./ChartWidget'));
\`\`\`

3. **Conditional splitting** (load only when needed):
\`\`\`tsx
const [showModal, setShowModal] = useState(false);
const HeavyModal = lazy(() => import('./HeavyModal'));

{showModal && (
  <Suspense fallback={<Spinner />}>
    <HeavyModal />
  </Suspense>
)}
\`\`\`

**Error handling** — combine with Error Boundary:
\`\`\`tsx
<ErrorBoundary fallback={<p>Failed to load</p>}>
  <Suspense fallback={<Spinner />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>
\`\`\`

**Preloading** — trigger import before rendering:
\`\`\`tsx
const AdminPanel = lazy(() => import('./AdminPanel'));

// Preload on hover
<button onMouseEnter={() => import('./AdminPanel')}>
  Open Admin
</button>
\`\`\`

**Trade-offs**:
- More chunks = more HTTP requests but smaller initial bundle
- Too many lazy boundaries = waterfall loading
- Aggressive splitting on slow networks can feel worse than a larger initial bundle

**Common mistakes**:
- Lazy-loading tiny components — the overhead of a separate chunk exceeds the savings
- Not wrapping lazy components with Suspense — causes a runtime error
- Placing Suspense too high in the tree — shows a full-page spinner for small lazy sections
- Not preloading components that the user is likely to navigate to

**Follow-up**: What is \`React.startTransition\` and how does it interact with Suspense? How does Next.js handle code splitting differently?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Server state vs client state: why TanStack Query / SWR replaced useEffect for data fetching",
    content:
      "What is the difference between server state and client state? Why is fetching data with useEffect considered an anti-pattern in modern React? How do libraries like TanStack Query solve the problems?",
    answer: `**Server state** vs **client state**:

| Aspect | Server State | Client State |
|---|---|---|
| Source of truth | Remote server | Browser |
| Examples | User data, posts, products | UI toggles, form input, theme |
| Can be stale | Yes (someone else changed it) | No (only this client changes it) |
| Needs sync | Yes (refetch, invalidate, poll) | No |
| Shared | Across users/tabs | Per tab/session |

**Problems with useEffect for data fetching**:
\`\`\`tsx
// The "naive" approach — has many hidden problems
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers);
}, []);
\`\`\`

Missing concerns:
1. **Loading/error states** — must track manually
2. **Race conditions** — fast navigation triggers overlapping fetches
3. **Caching** — refetching same data on every mount
4. **Stale data** — no automatic refetch when data changes
5. **Deduplication** — multiple components fetching the same endpoint
6. **Background refetch** — no update when user returns to tab
7. **Optimistic updates** — manual and error-prone
8. **Pagination/infinite scroll** — complex state management

**TanStack Query solves all of these**:
\`\`\`tsx
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // consider fresh for 5 minutes
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <List items={data} />;
}
\`\`\`

**What you get for free**:
- Automatic caching and deduplication
- Background refetch on window focus, network reconnect
- Stale-while-revalidate pattern
- Pagination, infinite queries
- Optimistic updates with rollback
- Devtools for inspecting cache

**When you still use useEffect**:
- Subscribing to external systems (WebSocket, event emitters)
- Synchronizing with browser APIs (title, ResizeObserver)
- Effects that don't involve server data

**Common mistakes**:
- Building a custom caching layer on top of useEffect — reinventing TanStack Query poorly
- Putting server state in global client state (Redux/Zustand) — leads to stale data and complex sync
- Not setting appropriate \`staleTime\` — over-fetching or showing stale data

**Follow-up**: What is the stale-while-revalidate pattern? How do you handle mutations and cache invalidation with TanStack Query?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Lifting state up vs composition: choosing the right pattern to share data between components",
    content:
      "Explain 'lifting state up' in React. When does it become problematic? What composition patterns (render props, compound components, children pattern) can you use as alternatives?",
    answer: `**Lifting state up**: Move shared state to the closest common ancestor of the components that need it.

\`\`\`tsx
// Before: sibling components can't share state
function SearchInput() { const [query, setQuery] = useState(''); }
function SearchResults() { /* needs query but can't access it */ }

// After: lift to parent
function SearchPage() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
}
\`\`\`

**When it becomes problematic**:
- State is lifted too high — causes prop drilling through many layers
- Unrelated components re-render because a common ancestor owns their shared state
- Component becomes a "God component" managing too many concerns

**Alternative patterns**:

1. **Children pattern** — parent controls layout, children manage their own concerns:
\`\`\`tsx
function Layout({ sidebar, content }) {
  return (
    <div className="grid">
      <aside>{sidebar}</aside>
      <main>{content}</main>
    </div>
  );
}
// State stays in the specific component, not in Layout
<Layout sidebar={<Sidebar />} content={<Dashboard />} />
\`\`\`

2. **Compound components** — components share implicit state:
\`\`\`tsx
function Tabs({ children }) {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}
Tabs.Tab = function Tab({ index, children }) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  return <button onClick={() => setActiveTab(index)}>{children}</button>;
};
Tabs.Panel = function Panel({ index, children }) {
  const { activeTab } = useContext(TabContext);
  return activeTab === index ? <div>{children}</div> : null;
};

// Usage — flexible composition
<Tabs>
  <Tabs.Tab index={0}>About</Tabs.Tab>
  <Tabs.Tab index={1}>Settings</Tabs.Tab>
  <Tabs.Panel index={0}><AboutContent /></Tabs.Panel>
  <Tabs.Panel index={1}><SettingsContent /></Tabs.Panel>
</Tabs>
\`\`\`

3. **Render props** — delegate rendering to the consumer:
\`\`\`tsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ... mouse event tracking
  return render(position);
}
<MouseTracker render={pos => <Tooltip x={pos.x} y={pos.y} />} />
\`\`\`

**Decision framework**:
- 2 siblings share state → lift state up
- Deeply nested → Context or composition
- Reusable UI logic → compound components
- Flexible rendering → render props (mostly replaced by hooks)

**Common mistakes**:
- Lifting state to the app root "just in case" — causes global re-renders
- Using Context when simple prop passing would suffice (1-2 levels)
- Over-abstracting with render props when a custom hook would be simpler

**Follow-up**: How do compound components compare to headless UI libraries? When would you use the slot pattern (Vue-style) in React?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React reconciliation: how the virtual DOM diffing algorithm decides what to update",
    content:
      "How does React's reconciliation algorithm work? What assumptions does it make to achieve O(n) performance? What are the practical implications for how you structure your component tree?",
    answer: `**The problem**: Comparing two arbitrary trees is O(n³). React uses heuristics to reduce this to O(n).

**Two key assumptions**:
1. **Different element types produce different trees**: If a \`<div>\` changes to a \`<span>\`, React tears down the entire subtree and rebuilds it — no attempt to diff children.
2. **Keys identify stable elements across renders**: Without keys, React matches elements by position. With keys, React can identify moved, added, or removed elements.

**Diffing algorithm**:

1. **Same type** (\`<div className="a">\` → \`<div className="b">\`):
   - Keep the DOM node
   - Update only changed attributes
   - Recursively diff children

2. **Different type** (\`<div>\` → \`<section>\`):
   - Destroy old tree (unmount all children, remove DOM nodes)
   - Build new tree from scratch

3. **Component type** (\`<MyComponent />\`):
   - Same component type: re-render with new props (keep instance and state)
   - Different component type: unmount old, mount new

4. **List children**:
   - Without keys: match by index — insertions at the beginning cause full re-render
   - With keys: match by key — minimal DOM operations (move, insert, delete)

**Practical implications**:

\`\`\`tsx
// BAD: changes element type conditionally — destroys and recreates
{isLoggedIn ? <AuthenticatedApp /> : <LoginScreen />}
// If both are complex, this causes unnecessary unmount/mount

// BAD: component defined inline — new type every render
function Parent() {
  const Child = () => <div>Hello</div>; // NEW component type each render!
  return <Child />;
}

// GOOD: define components outside or at module scope
const Child = () => <div>Hello</div>;
function Parent() {
  return <Child />;
}
\`\`\`

**Fiber architecture** (React 16+):
- Reconciliation is now incremental — React can pause, abort, and resume work
- Enables concurrent features: transitions, Suspense, selective hydration
- Each fiber node represents a unit of work that can be prioritized

**Common mistakes**:
- Defining components inside other components — creates new type each render, destroying state
- Wrapping components unnecessarily (\`<div><Component /></div>\` vs \`<Component />\`) — adds unnecessary diffing work
- Relying on render order for correctness instead of keys

**Follow-up**: How does React Fiber enable concurrent rendering? What is the difference between the render phase and the commit phase?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "useLayoutEffect vs useEffect: render timing, DOM measurements, and when to use each",
    content:
      "What is the difference between useEffect and useLayoutEffect? When would you use useLayoutEffect in production? What problems does it solve that useEffect cannot?",
    answer: `**Timing difference**:

\`\`\`
Browser paint timeline:
1. Render (React calculates changes)
2. DOM mutations (React commits changes to DOM)
3. useLayoutEffect fires (synchronous, before paint)
4. Browser paints (user sees the screen)
5. useEffect fires (asynchronous, after paint)
\`\`\`

**useEffect** (default):
- Runs asynchronously after the browser paints
- Non-blocking — doesn't delay visual updates
- Use for: data fetching, subscriptions, logging, most side effects

**useLayoutEffect**:
- Runs synchronously after DOM mutations but before paint
- Blocking — delays visual updates until it completes
- Use for: DOM measurements, preventing visual flicker

**When to use useLayoutEffect**:

1. **DOM measurements** (tooltips, popovers positioning):
\`\`\`tsx
function Tooltip({ targetRef, children }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition({
      top: targetRect.top - tooltipRect.height,
      left: targetRect.left + targetRect.width / 2,
    });
  }, [targetRef]);

  return <div ref={tooltipRef} style={position}>{children}</div>;
}
\`\`\`
With \`useEffect\`, the tooltip would briefly flash at position (0,0) before jumping to the correct position. With \`useLayoutEffect\`, positioning happens before the user sees anything.

2. **Preventing flicker** when updating DOM based on measurements
3. **Synchronizing with third-party DOM libraries** that need to read layout

**The flicker problem**:
\`\`\`tsx
// useEffect: user sees brief flash of wrong state
useEffect(() => {
  if (ref.current.scrollHeight > ref.current.clientHeight) {
    setIsOverflowing(true); // causes visible jump
  }
}, [content]);

// useLayoutEffect: measurement happens before paint
useLayoutEffect(() => {
  if (ref.current.scrollHeight > ref.current.clientHeight) {
    setIsOverflowing(true); // no visible jump
  }
}, [content]);
\`\`\`

**SSR caveat**: \`useLayoutEffect\` warns in SSR because there's no DOM to measure. Use \`useEffect\` as fallback or conditionally use \`useLayoutEffect\` only on the client.

**Common mistakes**:
- Using useLayoutEffect for everything — blocks painting, hurts performance
- Using useEffect for DOM measurements — causes visual flicker
- Ignoring SSR warnings when using useLayoutEffect in Next.js/SSR apps

**Follow-up**: How does \`useInsertionEffect\` (React 18) differ from both? When would a CSS-in-JS library use it?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React portals: rendering outside the DOM hierarchy and practical use cases",
    content:
      "What are React Portals? How do they work with event bubbling? What are the common production use cases and pitfalls?",
    answer: `**Portals**: Render children into a DOM node outside the parent component's DOM hierarchy, while maintaining React's component hierarchy (events, context, state).

\`\`\`tsx
import { createPortal } from 'react-dom';

function Modal({ children, isOpen }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.getElementById('modal-root') // renders here in DOM
  );
}
\`\`\`

**Key insight — event bubbling**: Even though the portal renders in a different DOM node, React events bubble up through the **React tree**, not the DOM tree.

\`\`\`tsx
// Click on Modal content will trigger Parent's onClick handler!
function Parent() {
  return (
    <div onClick={() => console.log('Parent clicked')}>
      <Modal isOpen={true}>
        <button>Click me</button> {/* bubbles to Parent in React tree */}
      </Modal>
    </div>
  );
}
\`\`\`

**Production use cases**:
1. **Modals/Dialogs**: Escape \`overflow: hidden\` or \`z-index\` stacking context
2. **Tooltips/Popovers**: Position relative to viewport, not parent container
3. **Notifications/Toasts**: Render in a fixed position regardless of scroll
4. **Dropdown menus**: Avoid being clipped by scrollable containers

**Why portals over CSS \`z-index\`?**:
- CSS stacking contexts can trap elements — a parent with \`transform\`, \`filter\`, or \`will-change\` creates a new stacking context
- \`overflow: hidden\` on any ancestor clips the element
- Portals escape the DOM hierarchy entirely

**Implementation pattern**:
\`\`\`tsx
// Create portal target in index.html
<body>
  <div id="root"></div>
  <div id="modal-root"></div>
  <div id="toast-root"></div>
</body>
\`\`\`

**Accessibility considerations**:
- Manage focus when modal opens (focus trap)
- Return focus when modal closes
- Add \`aria-modal="true"\` and \`role="dialog"\`
- Handle Escape key to close

**Common mistakes**:
- Not understanding that React events still bubble through the React tree — can cause unexpected handlers to fire
- Creating the portal target DOM node inside the component — race condition on first render
- Not managing focus for accessibility
- Using portals when CSS \`position: fixed\` would suffice

**Follow-up**: How do you handle multiple stacked modals with portals? How does \`createPortal\` interact with React's Suspense and Error Boundaries?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "Hydration in React: what it is, mismatch errors, and SSR implications",
    content:
      "What is hydration in React? What causes hydration mismatch errors? How do you debug and fix them in a production SSR/SSG application?",
    answer: `**Hydration**: The process where React attaches event handlers and makes a server-rendered HTML page interactive on the client. React expects the client-rendered DOM to match the server-rendered HTML exactly.

**How it works**:
1. Server renders HTML → sent to browser → user sees content immediately
2. Client loads React JS bundle
3. React "hydrates" — walks the existing DOM, attaches event listeners, but doesn't re-create DOM nodes
4. Page becomes interactive

**Hydration mismatch**: When the client-rendered HTML differs from the server-rendered HTML.

**Common causes**:
1. **Date/time rendering**:
\`\`\`tsx
// Server: "Feb 24, 2026 10:00 UTC"
// Client: "Feb 24, 2026 17:00 GMT+7" ← different timezone!
<p>{new Date().toLocaleString()}</p>
\`\`\`

2. **Random values / IDs**:
\`\`\`tsx
const id = Math.random(); // different on server vs client
<input id={id} />
// Fix: use useId() hook (React 18+)
const id = useId();
\`\`\`

3. **Browser-only APIs**:
\`\`\`tsx
// window doesn't exist on server
const width = window.innerWidth; // Error during SSR
\`\`\`

4. **Conditional rendering based on client state**:
\`\`\`tsx
// Server renders "guest", client renders "user" immediately
const user = localStorage.getItem('user');
\`\`\`

**Fixing strategies**:

1. **\`useEffect\` for client-only values**:
\`\`\`tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

// Render placeholder during SSR, real content after hydration
return mounted ? <ClientOnlyWidget /> : <Placeholder />;
\`\`\`

2. **\`suppressHydrationWarning\`** for known mismatches:
\`\`\`tsx
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>
\`\`\`

3. **Next.js \`dynamic\` with \`ssr: false\`**:
\`\`\`tsx
const Chart = dynamic(() => import('./Chart'), { ssr: false });
\`\`\`

**React 18 improvements**:
- \`useId()\` generates stable IDs across server/client
- Selective hydration with Suspense — hydrate visible parts first
- Better error messages for mismatches

**Common mistakes**:
- Using \`typeof window !== 'undefined'\` checks that produce different output — still causes mismatch
- Suppressing all hydration warnings instead of fixing root causes
- Not understanding that hydration doesn't re-render — it expects identical output

**Follow-up**: What is selective hydration in React 18? How does streaming SSR change the hydration model?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React testing strategies: what to test, testing library philosophy, and common anti-patterns",
    content:
      "What is the recommended approach to testing React components? Explain the testing pyramid for React apps, the philosophy behind React Testing Library, and common anti-patterns.",
    answer: `**React Testing Library philosophy**: Test components the way users interact with them. Find elements by accessible roles, labels, and text — not by implementation details (class names, component internals, state).

\`\`\`tsx
// Anti-pattern: testing implementation
const { container } = render(<Counter />);
const button = container.querySelector('.increment-btn');
expect(wrapper.state('count')).toBe(1);

// Good: testing behavior
render(<Counter />);
const button = screen.getByRole('button', { name: /increment/i });
await userEvent.click(button);
expect(screen.getByText('Count: 1')).toBeInTheDocument();
\`\`\`

**Testing pyramid for React**:

1. **Unit tests** (many): Pure functions, utilities, reducers, custom hooks
\`\`\`tsx
// Reducer test — no rendering needed
expect(reducer({ count: 0 }, { type: 'INCREMENT' }))
  .toEqual({ count: 1 });
\`\`\`

2. **Integration tests** (moderate): Component + children + context interactions
\`\`\`tsx
// Test the form flow end-to-end within React
render(<LoginForm onSubmit={mockSubmit} />);
await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
await userEvent.type(screen.getByLabelText('Password'), 'password');
await userEvent.click(screen.getByRole('button', { name: /log in/i }));
expect(mockSubmit).toHaveBeenCalledWith({
  email: 'test@example.com',
  password: 'password',
});
\`\`\`

3. **E2E tests** (few): Full app flow with real browser (Playwright/Cypress)

**What to test**:
- User interactions (click, type, submit)
- Conditional rendering (shows/hides based on state)
- Error states (validation errors, API failures)
- Loading states
- Accessibility (roles, labels, ARIA attributes)

**What NOT to test**:
- Implementation details (state values, component internals)
- Third-party library behavior
- CSS styling (unless critical to functionality)
- Snapshot tests of large component trees (brittle, low value)

**Testing async components**:
\`\`\`tsx
// Mock the API
server.use(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'Alice' }]));
  })
);

render(<UserList />);
expect(screen.getByText('Loading...')).toBeInTheDocument();
expect(await screen.findByText('Alice')).toBeInTheDocument();
\`\`\`

**Common anti-patterns**:
- Testing implementation details — breaks when you refactor without changing behavior
- Snapshot testing as the primary strategy — provides false confidence
- Not using \`userEvent\` over \`fireEvent\` — \`userEvent\` simulates real user interactions more accurately
- Testing every single component in isolation — focus on user-facing behavior

**Follow-up**: How do you test custom hooks with \`renderHook\`? What is MSW (Mock Service Worker) and how does it differ from mocking fetch/axios?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
  {
    title:
      "React Strict Mode: what it does, why effects run twice, and how it catches bugs",
    content:
      "What does React Strict Mode do in development? Why does it intentionally double-invoke effects and state initializers? What bugs does this catch that you would otherwise miss?",
    answer: `**React Strict Mode**: A development-only tool that activates extra checks and warnings. It doesn't affect production builds.

\`\`\`tsx
<React.StrictMode>
  <App />
</React.StrictMode>
\`\`\`

**What it does in React 18+**:
1. **Double-invokes effects**: Mounts → unmounts → mounts again
2. **Double-invokes rendering**: Calls render functions twice
3. **Double-invokes state initializers**: Calls \`useState(init)\` and \`useReducer(init)\` twice
4. **Warns about deprecated APIs**: \`findDOMNode\`, legacy context, string refs
5. **Detects unexpected side effects** in render

**Why double-invoke effects?**:

It catches missing cleanup functions. If your effect works correctly, running mount → unmount → mount should be identical to just mount.

\`\`\`tsx
// BUG: No cleanup — double-invoke creates two connections
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  // Missing: return () => ws.close();
}, [url]);

// With Strict Mode, you'd see TWO WebSocket connections,
// making the bug obvious during development

// FIX: Add cleanup
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => ws.close();
}, [url]);
\`\`\`

**Bugs it catches**:
1. **Missing effect cleanup**: Subscriptions, timers, event listeners that leak
2. **Impure rendering**: Side effects during render (mutating external variables)
3. **Non-idempotent state initialization**: Initializers that depend on side effects
4. **Stale closure issues**: Effects that don't handle re-mounting correctly

**Why double-invoke rendering?**:
\`\`\`tsx
// BUG: Side effect during render
let renderCount = 0;
function Counter() {
  renderCount++; // Strict Mode reveals this runs unexpectedly
  return <span>{renderCount}</span>;
}
// In Strict Mode, you'll see renderCount incrementing twice per render,
// revealing the side effect
\`\`\`

**Common mistakes**:
- Removing Strict Mode to "fix" double-firing effects — the bug is real, Strict Mode just exposes it
- Not understanding that double-invocation only happens in development
- Adding guards like \`if (alreadyConnected) return\` instead of proper cleanup
- Thinking Strict Mode causes performance issues — it has no impact on production

**Follow-up**: How does Strict Mode interact with React's concurrent features? What is the \`useEffectEvent\` RFC and how does it relate to Strict Mode's effect re-running?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "react",
  },
];

// ============================================
// EXPORT
// ============================================

export const middleReactQuestions: QuestionSeed[] = reactMiddleQuestions;

// Summary
console.log("=".repeat(50));
console.log("MIDDLE-LEVEL REACT INTERVIEW QUESTIONS");
console.log("=".repeat(50));
console.log(`React: ${reactMiddleQuestions.length}`);
console.log(`Total: ${middleReactQuestions.length}`);
console.log("=".repeat(50));
