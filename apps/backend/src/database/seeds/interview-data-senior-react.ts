import { QuestionLevel } from '../../database/entities/question.entity';

export interface QuestionSeed {
  title: string;
  answer: string;
  topicSlug: string;
  level: QuestionLevel;
  difficultyScore: number;
  displayOrder: number;
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

export const seniorReactQuestions: QuestionSeed[] = [
  // 1. Concurrent rendering / useTransition
  {
    title:
      'A search input with real-time filtering over 10,000 items causes severe UI jank. Users report the input becomes unresponsive during typing. Walk through your complete investigation and solution using React Concurrent Mode.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use useTransition to mark the filter state update as non-urgent, allowing React to interrupt the expensive re-render in favor of keeping the input responsive. Combine with useDeferredValue on the filtered list and optionally memo-ize list items to reduce throughput of wasted renders.',
      detailed_answer: `The root cause is that a single synchronous React render encompasses both the keystroke echo (urgent) and the full 10,000-item filter pass (non-urgent). React 18 Concurrent Mode lets you split these into separate priority lanes.

**Step 1 — Profile first**
Open Chrome DevTools Performance tab, record a typing session, and look for a long task (>50 ms) blocking the main thread on every keystroke. You will see a \`performConcurrentWorkOnRoot\` frame consuming ~200–400 ms for 10,000 items.

**Step 2 — Apply useTransition**
\`\`\`tsx
import { useState, useTransition, useDeferredValue, memo } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // urgent — keeps input snappy
    startTransition(() => {
      setFilterQuery(e.target.value); // non-urgent — can be interrupted
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ItemList query={filterQuery} />
    </>
  );
}
\`\`\`

React will commit the \`query\` update immediately (< 1 ms latency for the keystroke echo), then attempt the \`filterQuery\` render. If a new keystroke arrives before it finishes, React throws away the in-progress tree and starts fresh — the old render is never committed to the DOM, eliminating jank.

**Step 3 — useDeferredValue as an alternative**
\`\`\`tsx
const deferredQuery = useDeferredValue(query);
// Pass deferredQuery to the expensive list
\`\`\`
This is useful when you don't own the child component's props. The stale value is used for the committed render while the new value schedules a background re-render.

**Step 4 — Memo-ize list items**
\`\`\`tsx
const Item = memo(({ name, highlight }: { name: string; highlight: string }) => {
  // Only re-renders when name or highlight changes
  return <li>{name}</li>;
});
\`\`\`
Without \`memo\`, every item re-renders even if it passes the filter, doubling throughput waste.

**Measured results (production benchmark):**
- Before: Input Interaction to Next Paint (INP) = 380 ms (poor)
- After useTransition + memo: INP = 18 ms (good)
- CPU main-thread block: 340 ms → effectively 0 ms (yields every 5 ms in concurrent mode)

**Fault tolerance:** If the transition render throws, only the deferred tree crashes; the input and urgent UI remain functional. Wrap \`<ItemList>\` in an ErrorBoundary to gracefully display a fallback without losing the query state.

**Scalability note:** For true 100k-row datasets, combine with windowing (react-window) — Concurrent Mode reduces blocking but does not reduce the DOM node count. The combined approach handles both latency (concurrent) and throughput (virtualization) bottlenecks.`,
      trade_offs: [
        {
          approach: 'useTransition (concurrent rendering)',
          pros: [
            'Input remains immediately responsive — zero perceived latency for keystrokes',
            'React natively manages priority; no manual debounce timers to tune',
            'Works with SSR hydration and Suspense boundaries out of the box',
            'isPending flag gives a free loading indicator without extra state',
          ],
          cons: [
            'Requires React 18+; older codebases need migration',
            'Stale UI is shown during transition — must communicate pending state clearly',
            'Does not reduce the total render work, only defers it; very large lists still need virtualization',
          ],
        },
        {
          approach: 'Debounce/throttle with setTimeout or lodash.debounce',
          pros: [
            'Works with any React version — zero dependency on Concurrent Mode',
            'Simple mental model; easy to reason about timing',
            'Can batch multiple rapid inputs into a single render cycle',
          ],
          cons: [
            'Arbitrary delay (e.g., 300 ms) degrades maintainability — must be tuned per device',
            'Introduces real latency; users on fast machines feel unnecessary lag',
            'Does not prevent a long synchronous render from blocking the main thread once it fires',
          ],
        },
        {
          approach: 'Web Worker offloading for filter computation',
          pros: [
            'Moves CPU-intensive filtering entirely off the main thread',
            'Scales to arbitrarily large datasets without blocking UI',
            'Throughput of filtering is maximized as it runs in parallel',
          ],
          cons: [
            'Complex architecture: data must be serialized/deserialized across the Worker boundary',
            'Adds latency from postMessage round-trip (~1–5 ms) plus structured-clone cost',
            'State synchronization between Worker and main thread is a distributed system problem — risk of data consistency issues if updates race',
          ],
        },
      ],
      real_world_example:
        'At a SaaS analytics platform (50k MAU), a "global search" command palette searched across 8,000 saved reports client-side. On mid-range laptops the input froze for 300–500 ms per keystroke. After migrating to useTransition + useDeferredValue, INP dropped from 380 ms to 22 ms across the p95 cohort, and user session length in the search flow increased by 18% because users no longer abandoned searches mid-type.',
      red_flags: [
        'Wrapping the entire page state update in startTransition instead of only the non-urgent part — urgent updates (input value) must stay outside the transition or the input itself lags',
        'Using useTransition without memo on list items — every item still re-renders, making the transition no faster',
        'Relying on debounce alone without addressing the synchronous render cost — a 300 ms debounce just delays the same 400 ms jank',
        'Not showing isPending feedback — users see stale results with no indication that a fresh render is in progress, harming fault tolerance perception',
        'Applying useDeferredValue to the input value rather than the derived/filtered list — this defers the echo, making the input feel laggy',
      ],
      follow_up_questions: [
        'How does React scheduler assign priority lanes, and what is the difference between "default", "transition", and "idle" priority?',
        'If the filter computation is CPU-bound (regex, fuzzy match), would you move it to a Web Worker even with useTransition? What are the tradeoffs?',
        'How does Concurrent Mode interact with external stores like Redux — what is the tearing problem and how does useSyncExternalStore solve it?',
        'How would you test that the transition behaves correctly under fast, sequential keystrokes in a CI environment?',
      ],
    }),
  },

  // 2. Memory leak investigation
  {
    title:
      'After a 30-minute session in your React SPA, browser memory grows from 80 MB to 600 MB and the app eventually crashes. Describe your complete investigation methodology and common root causes in complex component trees.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Take heap snapshots at intervals in Chrome DevTools, diff them to identify growing object types, then trace retained paths back to component subscriptions, event listeners, closures over stale state, or uncleared timers that prevent garbage collection. Fix by returning cleanup functions from useEffect.',
      detailed_answer: `Memory leaks in SPAs accumulate because JavaScript\'s garbage collector cannot free objects still referenced by live code. In React, the most common sources are subscriptions or listeners registered in \`useEffect\` that are never torn down on unmount.

**Phase 1 — Reproduce and confirm**
\`\`\`
1. Open Chrome DevTools → Memory tab
2. Take Baseline snapshot (S1) after page load settles
3. Navigate through the app for 5 minutes — visit/leave the suspected route several times
4. Force GC (🗑️ button in DevTools)
5. Take second snapshot (S2)
6. Use "Comparison" view: S2 vs S1, sort by "# New" descending
\`\`\`
If you see thousands of new \`EventListener\`, \`WebSocket\`, \`IntersectionObserver\`, or \`Closure\` entries, you have found the category of leak.

**Phase 2 — Identify retained paths**
Click any leaked object → "Retainers" panel shows the reference chain. A chain like: \`EventTarget → window → closure → stale component state\` pinpoints the exact \`useEffect\` that registered the listener.

**Common root causes and fixes:**

**1. Unremoved DOM event listeners**
\`\`\`tsx
// ❌ Leaks — adds new listener on every render, never removes
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []); // Missing cleanup

// ✅ Fixed
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [handleResize]);
\`\`\`

**2. Unsubscribed RxJS / EventEmitter / WebSocket subscriptions**
\`\`\`tsx
useEffect(() => {
  const sub = dataStream$.subscribe(setData);
  return () => sub.unsubscribe(); // ✅ Always unsubscribe
}, [dataStream$]);
\`\`\`

**3. Stale closures in setInterval/setTimeout**
\`\`\`tsx
useEffect(() => {
  const id = setInterval(() => {
    // Closure captures initial \`data\` — holds entire component in memory
    processData(data);
  }, 1000);
  return () => clearInterval(id); // ✅ Clear on unmount
}, []); // data is stale — use useRef for mutable values
\`\`\`

**4. Refs holding component instances**
A \`useRef\` attached to a portal child that was unmounted keeps the entire subtree in memory. Nullify refs on cleanup:
\`\`\`tsx
return () => { ref.current = null; };
\`\`\`

**5. Third-party libraries (charts, maps)**
Libraries like Chart.js or Leaflet create canvas contexts and internal event systems. Always call \`chart.destroy()\` or \`map.remove()\` in the cleanup.

**Phase 3 — Validate fix**
After fixing, repeat the snapshot diff. Memory growth over 5 minutes of navigation should be ≤ natural GC variance (< 5 MB). Track heap growth in production via \`performance.memory\` (Chrome only) or web-vitals custom metrics, alerting when JS heap exceeds a threshold (e.g., 512 MB).

**Throughput and latency impact:** Memory leaks degrade throughput indirectly — GC pauses increase as heap grows, causing periodic 50–200 ms latency spikes during interactions. These GC-induced latency bursts reduce interaction throughput from ~3 req/s to sub-1 req/s under memory pressure. Fixing leaks reduced GC pause time by 70% in one case study, restoring interaction throughput to 11 req/s on a WebSocket-heavy dashboard and cutting p99 interaction latency from 380 ms to 42 ms.`,
      trade_offs: [
        {
          approach: 'Manual useEffect cleanup functions',
          pros: [
            'Zero runtime overhead — cleanup is synchronous and guaranteed by React lifecycle',
            'Most maintainable: cleanup logic lives alongside setup logic in the same effect',
            'Works universally across React 16, 17, 18 and future versions',
          ],
          cons: [
            'Easy to forget, especially in large teams — no static analysis catches a missing return',
            'Cleanup must reference the exact same listener reference; anonymous functions silently fail',
          ],
        },
        {
          approach: 'Custom hook abstractions (useEventListener, useSubscription)',
          pros: [
            'Encapsulates cleanup logic — consumers cannot forget it',
            'Improves maintainability: one bug fix in the hook covers all usages',
            'Enables centralized testing of cleanup behavior',
          ],
          cons: [
            'Adds an abstraction layer that may obscure timing subtleties for junior engineers',
            'Over-generic hooks can carry their own closure retention risks if not carefully implemented',
          ],
        },
        {
          approach: 'Strict Mode double-invoke (React 18 development aid)',
          pros: [
            'React 18 StrictMode mounts → unmounts → remounts every component in development, immediately surfacing missing cleanups',
            'No production code changes required — purely a fault tolerance diagnostic tool',
            'Catches the majority of useEffect leak patterns before they reach production',
          ],
          cons: [
            'Only active in development builds — already-shipped leaks require production heap profiling',
            'Double-invoke can confuse developers unfamiliar with the pattern, leading to incorrect "fixes" that break cleanup logic',
          ],
        },
      ],
      real_world_example:
        'A financial trading dashboard used WebSocket streams for real-time price feeds in each instrument panel. Users could add/remove panels dynamically. After 20 minutes of use, memory grew from 90 MB to 800 MB. Heap snapshot diffing revealed 2,400 retained WebSocket message handlers — one per mount of the instrument component, none ever cleaned up. Adding `return () => socket.removeEventListener(\'message\', handler)` in the useEffect reduced the 30-minute memory footprint to 95 MB (±5 MB GC variance) and eliminated all crash reports.',
      red_flags: [
        'Adding event listeners inside useEffect with an empty dependency array but no return cleanup function — the most common source of listener accumulation',
        'Using anonymous arrow functions as event listener callbacks — `window.removeEventListener` requires the same function reference, so anonymous functions can never be removed',
        'Storing React component instances or their setState in module-level variables or singleton services — prevents the entire component tree from being garbage collected after unmount',
        'Ignoring React Strict Mode double-invoke warnings in development as "annoying flicker" rather than as intentional leak detection',
        'Using WeakRef or FinalizationRegistry as a "fix" for leaks instead of proper cleanup — these are observability tools, not substitutes for deterministic cleanup',
      ],
      follow_up_questions: [
        'How does React 18 Strict Mode\'s double-invoke behavior help surface memory leaks, and what types of leaks does it NOT catch?',
        'If a third-party SDK (analytics, maps) leaks memory, how would you isolate and patch it without access to the SDK source?',
        'How would you set up automated memory regression testing in CI to prevent future leaks from shipping?',
        'Explain the difference between a memory leak and memory bloat in a React app, and how your investigation approach differs for each.',
      ],
    }),
  },

  // 3. Performance debugging — table re-renders
  {
    title:
      'A 500-row data table in your React app re-renders every time the user types in an unrelated search input elsewhere on the page. Profile and fix this without rewriting the table component.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Profile with React DevTools Profiler to confirm unnecessary renders, then isolate the table behind React.memo with a stable props comparison, lift state to prevent the table\'s parent from re-rendering, and ensure callbacks are memoized with useCallback to avoid reference inequality breaking memo.',
      detailed_answer: `This is a classic "render cascade" problem caused by state co-location anti-patterns. The search input state lives in a common ancestor that also renders the table, so every keystroke triggers a top-down re-render of the entire subtree.

**Step 1 — Confirm with React DevTools Profiler**
\`\`\`
1. Open React DevTools → Profiler tab
2. Click "Record", type in the search input, stop recording
3. In the flame graph, look for DataTable highlighted in orange/red
4. Check "Why did this render?" — it will show "Parent component rendered"
\`\`\`
Typical finding: DataTable re-renders 500ms/keystroke with "Parent component rendered" as the sole reason.

**Step 2 — Identify the co-location problem**
\`\`\`tsx
// ❌ Problem: SearchPage owns both search state and table data
function SearchPage() {
  const [query, setQuery] = useState('');    // changes on every keystroke
  const rows = useTableData();               // stable data, but component re-renders anyway

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <DataTable rows={rows} />  {/* Re-renders because SearchPage re-rendered */}
    </>
  );
}
\`\`\`

**Step 3 — Fix 1: React.memo on DataTable**
\`\`\`tsx
const DataTable = memo(function DataTable({ rows }: { rows: Row[] }) {
  return (
    <table>
      {rows.map(row => <TableRow key={row.id} row={row} />)}
    </table>
  );
});
// Now React skips re-rendering DataTable if \`rows\` reference is stable
\`\`\`

**Step 4 — Ensure rows reference stability**
\`\`\`tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const rows = useTableData();       // must return stable reference

  // ❌ New array reference on every render — breaks memo
  // const displayRows = rows.filter(r => r.visible);

  // ✅ Stable reference with useMemo
  const displayRows = useMemo(() => rows.filter(r => r.visible), [rows]);

  const handleSort = useCallback((col: string) => {
    // sort logic
  }, []); // ✅ Stable callback reference

  return (
    <>
      <SearchInput value={query} onChange={setQuery} />
      <DataTable rows={displayRows} onSort={handleSort} />
    </>
  );
}
\`\`\`

**Step 5 — Fix 2: State isolation (better long-term)**
\`\`\`tsx
function SearchSection() {
  const [query, setQuery] = useState('');
  return <SearchInput value={query} onChange={setQuery} />;
}

function SearchPage() {
  return (
    <>
      <SearchSection />   {/* Owns search state — re-renders in isolation */}
      <DataTable />       {/* Never re-renders due to search input */}
    </>
  );
}
\`\`\`
This is the most maintainable solution — no memo required because the table is simply not a descendant of the state that changes.

**Measured results:**
- Before: 500 rows × ~0.8 ms/row = 400 ms render per keystroke, INP = 420 ms (poor)
- After memo + stable refs: DataTable render on keystroke = 0 ms (skipped), INP = 12 ms (good)
- After state isolation: zero virtual DOM work for table on keystroke

**Throughput and latency consideration:** Each skipped render of 500 rows saves ~0.4 ms of diff work. At 10 keystrokes/second, unnecessary re-renders add 4 ms/sec of wasted main-thread latency, directly reducing interaction throughput for other concurrent user actions. After memoization, interaction latency for the search input dropped from 420 ms (poor INP) to 12 ms (good INP), and render throughput increased because the freed main-thread budget was available for other React work.`,
      trade_offs: [
        {
          approach: 'React.memo + useMemo/useCallback for reference stability',
          pros: [
            'Non-invasive — works without restructuring the component tree',
            'Maintainability: can be applied surgically to the expensive component without touching parent logic',
            'React DevTools shows clearly when memo prevents a render',
          ],
          cons: [
            'Brittle: any new prop passed without memoization silently breaks the memo guarantee',
            'useMemo/useCallback themselves have overhead — inappropriate for cheap computations',
            'Custom memo comparators can introduce latent data consistency bugs if fields are missed',
          ],
        },
        {
          approach: 'State isolation (co-locate state with its consumer)',
          pros: [
            'The table component is architecturally decoupled from unrelated state — best long-term maintainability',
            'No memo overhead at all — React never even checks the table\'s props',
            'Naturally scales: adding new state elsewhere cannot accidentally cause table re-renders',
          ],
          cons: [
            'Requires refactoring the component tree, which may be a large change in legacy codebases',
            'Can lead to prop drilling or context overuse if state needs to be shared up the tree',
          ],
        },
        {
          approach: 'External state manager (Zustand/Jotai) with selector subscriptions',
          pros: [
            'Components subscribe only to the exact atoms they need — zero coupling between search state and table state',
            'Throughput is optimal: Zustand\'s shallow equality check prevents re-renders on unrelated store updates',
            'Scales to an entire app — not just one page',
          ],
          cons: [
            'Introduces a new dependency and mental model for state management',
            'Migrating existing useState to a store is a larger refactor than adding memo',
            'Risk of distributed state consistency issues if store updates are not atomic',
          ],
        },
      ],
      real_world_example:
        'An e-commerce admin dashboard had a product catalog table (500 rows) embedded in the same page as a category filter sidebar. Every sidebar interaction (checkbox toggle, search) re-rendered the entire table due to shared parent state. After profiling confirmed 380 ms renders per interaction, we applied React.memo to the table, useMemo to the sorted/filtered row array, and useCallback to all event handlers. Table render time on sidebar interactions dropped to 0 ms. The remaining 22 ms INP was the sidebar\'s own render — acceptable and well within the "good" threshold.',
      red_flags: [
        'Using React.memo without stabilizing all prop references — if any callback is recreated inline, memo does nothing and the engineer wastes time adding it',
        'Adding useMemo to every value "just in case" — shallow primitive values (strings, numbers, booleans) have no reference identity problem and adding useMemo adds overhead without benefit',
        'Using a custom memo comparator that performs deep equality on large objects — the comparison cost can exceed the render cost it\'s trying to prevent',
        'Ignoring the React DevTools Profiler "Why did this render?" view and fixing based on guesses — optimizing the wrong component wastes time and adds complexity',
        'Extracting state to Context as a fix — Context re-renders all consumers on every value change, often making the problem worse unless split into separate contexts',
      ],
      follow_up_questions: [
        'When would you use a custom comparison function with React.memo instead of the default shallow comparison?',
        'How does React 18\'s automatic batching change the frequency of re-renders compared to React 17, and does it reduce the need for useMemo/useCallback?',
        'Describe how you would set up a performance regression test (e.g., in Playwright or Storybook) to ensure the table does not regress to unnecessary re-renders in CI.',
        'If the table rows themselves are complex objects with nested arrays, how would you ensure structural stability without deep-cloning on every fetch?',
      ],
    }),
  },

  // 4. State management at scale
  {
    title:
      'You are architecting state management for a React app projected to reach 100,000 daily active users with 150+ components, real-time data feeds, and complex cross-cutting concerns (auth, notifications, feature flags). How do you choose between Context, Zustand, Jotai, and Redux Toolkit?',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'There is no single correct answer — the choice depends on update frequency, team size, and data topology. Use React Context for low-frequency global state (auth, theme), Zustand for high-frequency cross-component state (real-time feeds, UI state), Jotai for fine-grained atomic state with derived computations, and Redux Toolkit only when you need time-travel debugging, sagas, or are migrating from an existing Redux codebase.',
      detailed_answer: `At 100k DAU with 150+ components, the dominant concerns are render throughput (how many components re-render per state change), developer maintainability, and fault tolerance under real-time data load.

**Decision framework:**

**1. React Context — right tool for low-frequency state**
\`\`\`tsx
// ✅ Good: auth state changes at most a few times per session
const AuthContext = createContext<User | null>(null);

// ❌ Bad: real-time feed updates context 10x/second → re-renders entire tree
const LivePriceContext = createContext<Record<string, number>>({});
\`\`\`
Context triggers a re-render in **every** consumer when its value reference changes. For state that updates rarely (auth, locale, feature flags), this is acceptable. For high-frequency state, it is a scaling bottleneck.

**2. Zustand — sweet spot for most production apps**
\`\`\`typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface NotificationStore {
  items: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    unreadCount: 0,
    addNotification: (n) =>
      set(state => ({
        items: [n, ...state.items],
        unreadCount: state.unreadCount + 1,
      })),
    markAllRead: () =>
      set(state => ({
        items: state.items.map(i => ({ ...i, read: true })),
        unreadCount: 0,
      })),
  }))
);

// Consumer only re-renders when unreadCount changes — not on items change
const count = useNotificationStore(state => state.unreadCount);
\`\`\`
Zustand\'s selector-based subscription gives React.memo-level throughput without memo. At 100k DAU with WebSocket notifications, selectors ensure only badge components re-render on new messages, not the entire nav tree.

**3. Jotai — fine-grained atomic state with derived computations**
\`\`\`typescript
import { atom, useAtom, useAtomValue } from 'jotai';

const userAtom = atom<User | null>(null);
const permissionsAtom = atom(get => {
  const user = get(userAtom);
  return user ? computePermissions(user.role) : [];
});
// Only components reading permissionsAtom re-render when user.role changes
\`\`\`
Jotai excels when you have many derived/computed values with dependency graphs — a data-heavy dashboard with 20+ metrics derived from raw data. Each atom is independently subscribed, so a price update for AAPL does not re-render the GOOG panel.

**4. Redux Toolkit — when auditability or middleware is mandatory**
\`\`\`typescript
// RTK Query handles server state with caching, invalidation, and optimistic updates
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (build) => ({
    getUser: build.query<User, string>({ query: (id) => \`users/\${id}\` }),
  }),
});
\`\`\`
Choose Redux when: regulated industry requires audit trails of state mutations, you need saga-based side effect orchestration, or you have an existing Redux codebase that must be incrementally migrated.

**Recommended architecture for 100k DAU app:**
- Context: AuthContext, FeatureFlagContext (< 5 updates/session)
- Zustand: notifications, UI state (modals, sidebars), real-time data slices
- Jotai: per-entity atoms for data-heavy dashboards
- RTK Query: server state caching (replaces ad-hoc useEffect data fetching)

This layered approach gives each concern the right tool, maximizing throughput while preserving maintainability.`,
      trade_offs: [
        {
          approach: 'React Context for all global state',
          pros: [
            'Zero dependencies — built into React, no library to upgrade or audit',
            'Familiar to all React developers; minimal learning curve',
            'Type-safe with TypeScript generics out of the box',
          ],
          cons: [
            'Every consumer re-renders on any context value change — a critical scaling bottleneck for high-frequency state at 100k DAU',
            'No selector support — cannot subscribe to a slice of context without workarounds',
            'Context splitting (one context per concern) leads to "provider hell" with 10+ nested providers',
          ],
        },
        {
          approach: 'Zustand for all shared state',
          pros: [
            'Selector subscriptions prevent unnecessary re-renders — throughput scales to real-time data feeds',
            'Minimal boilerplate — 10x less code than Redux for equivalent functionality',
            'Middleware (immer, devtools, persist) covers most production needs',
          ],
          cons: [
            'No built-in derived/computed state — must use zustand/middleware or manual selectors',
            'Less opinionated than Redux — large teams may develop inconsistent store patterns, hurting maintainability',
          ],
        },
        {
          approach: 'Redux Toolkit with RTK Query',
          pros: [
            'RTK Query handles server state (caching, invalidation, loading states) with high fault tolerance',
            'Time-travel debugging and Redux DevTools are unmatched for incident investigation',
            'Strong community conventions enforce maintainable patterns at team scale',
          ],
          cons: [
            'Highest boilerplate even with RTK — slice, action, selector, and query all require scaffolding',
            'Bundle size: RTK adds ~40 KB min+gz vs Zustand\'s ~1 KB — affects initial load latency',
            'Normalization requirements for relational data add complexity that may be premature optimization',
          ],
        },
      ],
      real_world_example:
        'A B2B SaaS platform at 80k DAU started with Context for everything. As the app grew to 120 components, a single WebSocket notification caused full-page re-renders because the NotificationContext sat at the app root. Profiling showed 140 components re-rendering per notification. Migration plan: (1) move notifications to Zustand with a selector — immediately reduced re-renders to 3 (badge, dropdown trigger, page title); (2) move auth and feature flags back to Context (low frequency); (3) adopt RTK Query for all API calls. Result: average interaction latency dropped from 180 ms to 40 ms, and the team reported 30% faster feature development due to consistent RTK Query patterns.',
      red_flags: [
        'Putting all app state into a single large Zustand store with no slicing — creates the same "one change re-renders everything" problem as misused Context',
        'Using Redux "because it\'s the industry standard" without evaluating whether RTK Query, Zustand, or Context would suffice — premature complexity harms maintainability',
        'Storing server/remote state (API response data) in client state (Zustand/Context) instead of a purpose-built server state library (React Query, RTK Query) — leads to stale data and complex synchronization',
        'Creating circular derived atoms in Jotai or computed selectors in Zustand — causes infinite re-render loops that are difficult to debug under load',
        'Ignoring bundle size impact: importing Redux + Reselect + Immer + RTK for a small app adds 80+ KB to initial load, increasing first-interaction latency',
      ],
      follow_up_questions: [
        'How does Zustand\'s subscribeWithSelector middleware differ from react-redux\'s useSelector in terms of render optimization?',
        'When would you use server state management (React Query / RTK Query) versus client state management, and where is the boundary between them?',
        'How do you handle optimistic UI updates with rollback on failure in Zustand versus Redux Toolkit?',
        'How would you migrate an existing large Redux codebase to Zustand incrementally without breaking existing functionality?',
      ],
    }),
  },

  // 5. React Server Components architecture
  {
    title:
      'You are redesigning a data-heavy analytics dashboard (12 charts, 3 data tables, 50+ API calls on load) using React Server Components. How do you architect the client/server component boundary, handle data fetching, and ensure fault tolerance when individual data sources fail?',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Fetch all data in Server Components (no client-side waterfalls, no hydration overhead for read-only content), push client boundary down to interactive leaf nodes (charts with zoom/pan, filter controls), use Suspense boundaries per chart to stream data progressively, and wrap each data source in an ErrorBoundary so one failed API does not crash the entire dashboard.',
      detailed_answer: `React Server Components (RSC) fundamentally change the latency profile of data-heavy dashboards by eliminating the client-side fetch waterfall. Instead of: browser load JS → hydrate → fetch → render, RSC allows: server fetches all data in parallel → streams pre-rendered HTML → client hydrates only interactive nodes.

**Architecture decision: what lives where**

\`\`\`
app/
  dashboard/
    page.tsx           ← Server Component (orchestrates all data fetching)
    DashboardLayout.tsx ← Server Component (layout, no state)
    RevenueChart/
      index.tsx        ← Server Component (fetches revenue data)
      RevenueChart.client.tsx  ← Client Component ('use client' — handles zoom/pan interactions)
    UserTable/
      index.tsx        ← Server Component (fetches user data)
      UserTableFilters.client.tsx ← Client Component (search, sort controls)
    SummaryKPIs.tsx    ← Server Component (pure read, no interaction needed)
\`\`\`

**Step 1 — Parallel data fetching in Server Components**
\`\`\`tsx
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function DashboardPage() {
  // All fetches fire in parallel — no waterfall
  // Each Suspense boundary streams independently
  return (
    <div className="dashboard-grid">
      <ErrorBoundary fallback={<ChartError name="Revenue" />}>
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<ChartError name="DAU" />}>
        <Suspense fallback={<ChartSkeleton />}>
          <DailyActiveUsersChart />
        </Suspense>
      </ErrorBoundary>

      {/* Repeat for all 12 charts */}
    </div>
  );
}
\`\`\`

**Step 2 — Server Component fetching with deduplication**
\`\`\`tsx
// app/dashboard/RevenueChart/index.tsx
import { cache } from 'react'; // React\'s built-in request-level cache

const getRevenueData = cache(async (range: string) => {
  const res = await fetch(\`\${process.env.API_URL}/revenue?range=\${range}\`, {
    next: { revalidate: 60 }, // ISR: stale-while-revalidate for throughput
  });
  if (!res.ok) throw new Error(\`Revenue API failed: \${res.status}\`);
  return res.json();
});

export default async function RevenueChart() {
  const data = await getRevenueData('30d'); // Throws → caught by ErrorBoundary
  return <RevenueChartClient data={data} />;
}
\`\`\`
\`react.cache()\` deduplicates identical fetch calls within a single render pass — if 3 charts need the same "current user" data, it is fetched once, not three times.

**Step 3 — Push interactivity to leaf Client Components**
\`\`\`tsx
// app/dashboard/RevenueChart/RevenueChart.client.tsx
'use client';
import { useState } from 'react';

export default function RevenueChartClient({ data }: { data: RevenueData }) {
  const [zoom, setZoom] = useState({ start: 0, end: 100 });
  // Client-side interactivity: zoom, tooltip, drill-down
  return <Chart data={data} zoom={zoom} onZoomChange={setZoom} />;
}
\`\`\`
The client bundle only includes this component, not the data fetching code. This reduces JavaScript bundle size by 40–60% for read-heavy dashboards, directly improving Time to Interactive (TTI).

**Fault tolerance strategy:**
- Per-chart ErrorBoundary ensures one failed data source shows an error card, not a blank dashboard
- \`next: { revalidate: 60 }\` provides stale-while-revalidate: if the upstream API is down, users see 60-second-old data rather than an error
- Server-side retry with exponential backoff in the fetch wrapper handles transient failures
- For critical KPIs, serve from a read replica with eventual consistency tolerance

**Measured impact:**
- Before (SPA): Time to first chart render = 4.2 s (JS parse 800 ms + fetch waterfall 3.4 s)
- After RSC: Time to first chart render = 0.9 s (server streamed first chart in 900 ms, rest progressive)
- JS bundle: 1.2 MB → 480 KB (charts\' data-fetching code removed from client bundle)`,
      trade_offs: [
        {
          approach: 'React Server Components with streaming Suspense',
          pros: [
            'Eliminates client-side fetch waterfall — server parallelizes all data fetches before sending any HTML',
            'Reduces JS bundle size by keeping data-fetching and formatting logic on the server',
            'Progressive streaming: users see first chart in ~1 s rather than waiting for all 12',
            'react.cache() deduplicates redundant fetches within a render — reduces latency and upstream API load',
          ],
          cons: [
            'Requires Next.js 13+ App Router or a custom RSC-capable bundler — significant migration cost for existing SPAs',
            'Debugging server-side render errors is harder than client errors (no browser DevTools)',
            'Interactive state (zoom, filters) must live in Client Components — the boundary between server and client must be carefully designed to avoid prop-drilling through the boundary',
          ],
        },
        {
          approach: 'Client-side SPA with React Query parallel fetching',
          pros: [
            'Well-understood pattern — entire team can debug in browser DevTools',
            'React Query\'s stale-while-revalidate and background refetch provides excellent fault tolerance for transient failures',
            'No server infrastructure required beyond a static CDN for the JS bundle',
          ],
          cons: [
            'Client-side fetch waterfall: browser must download JS, parse, hydrate, then fire fetches — adds 2–4 s to first data render',
            'All fetching code ships to the client, increasing bundle size and parse latency',
            'Each user\'s browser fetches independently — no server-level request deduplication',
          ],
        },
        {
          approach: 'BFF (Backend for Frontend) aggregation endpoint',
          pros: [
            'Single round-trip from client: one request fetches all dashboard data',
            'Server-side joins and transformations reduce payload size and client-side computation',
            'Works with any React version — no RSC migration required',
          ],
          cons: [
            'BFF is a scaling bottleneck and single point of failure — if it is down, the entire dashboard fails (poor fault tolerance vs. per-chart boundaries)',
            'Data from fast APIs waits for slow APIs — throughput is limited by the slowest upstream service',
            'Adds a maintained service with its own deployment pipeline and observability requirements',
          ],
        },
      ],
      real_world_example:
        'A DevOps observability platform had a dashboard with 14 metric charts, each backed by a different data service (Prometheus, Loki, Tempo, custom APIs). The SPA version took 5.8 s to show the first chart due to the fetch waterfall. After migrating to Next.js 14 App Router with RSC: each chart became a Server Component wrapping a Client Component for zoom/threshold drag interactions. Suspense boundaries streamed charts as their data resolved. Time to first chart: 1.1 s. Total dashboard load: 3.2 s (down from 5.8 s). JS bundle: 900 KB → 380 KB. When the Loki service had a 30-second outage, only the log volume chart showed an error card; all other charts remained functional.',
      red_flags: [
        'Putting "use client" at the top of the page or layout component — this opts the entire subtree out of RSC and negates all the performance benefits',
        'Fetching data in Client Components that are children of Server Components — creates unnecessary client-side waterfalls when the data could be fetched on the server',
        'Passing non-serializable values (class instances, functions, Dates) across the server/client boundary — causes silent serialization failures in production',
        'Not wrapping each independent data source in its own ErrorBoundary — a single failed chart crashes the entire dashboard, eliminating fault tolerance',
        'Using react.cache() for mutations or side-effectful operations — cache() is request-scoped and intended only for reads; using it for writes creates data consistency bugs',
      ],
      follow_up_questions: [
        'How does React\'s built-in `cache()` function differ from Next.js `unstable_cache()`, and when would you use each?',
        'How do you handle authentication tokens and cookies in Server Components when making authenticated API calls server-side?',
        'Describe how you would implement optimistic UI updates for a form in a Client Component that invalidates Server Component data after submission.',
        'How would you architect a real-time dashboard (WebSocket updates) using RSC, given that Server Components cannot hold state or subscribe to streams?',
      ],
    }),
  },

  // 6. Micro-frontend architecture
  {
    title:
      'Your organization is splitting a large React monolith into micro-frontends using Webpack Module Federation. Describe the architecture decisions, shared state strategy, and how you prevent version conflicts and cascading failures between federated modules.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use Module Federation with singleton shared libraries (React, React-DOM, design system), a contract-first approach for module boundaries, cross-micro-frontend communication via a shared event bus or custom store (not direct imports), and circuit breakers around remote module loading to prevent one failed micro-frontend from crashing the host.',
      detailed_answer: `Module Federation enables independent deployment of React micro-frontends while sharing code. The hard problems are: React version conflicts (multiple React instances break hooks), shared state without tight coupling, and distributed system failure modes when a remote chunk fails to load.

**Step 1 — Webpack Module Federation configuration**
\`\`\`javascript
// host/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        checkout: 'checkout@https://checkout.example.com/remoteEntry.js',
        catalog:  'catalog@https://catalog.example.com/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        '@company/design-system': { singleton: true },
      },
    }),
  ],
};

// checkout/webpack.config.js (remote)
new ModuleFederationPlugin({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: {
    './CheckoutWidget': './src/CheckoutWidget',
  },
  shared: { /* same shared config */ },
});
\`\`\`

The \`singleton: true\` flag is critical — it forces all micro-frontends to use the host\'s React instance, preventing the "Invalid hook call" error that occurs when two React copies exist on the page.

**Step 2 — Dynamic loading with fault tolerance**
\`\`\`tsx
// host: lazy-load remote with error boundary
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const CheckoutWidget = lazy(() =>
  import('checkout/CheckoutWidget').catch(() => ({
    default: () => <FallbackCheckout />, // Graceful degradation
  }))
);

function App() {
  return (
    <ErrorBoundary fallback={<ServiceUnavailable service="Checkout" />}>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutWidget />
      </Suspense>
    </ErrorBoundary>
  );
}
\`\`\`
If the checkout CDN is unreachable, the \`.catch()\` returns a fallback module. This is the circuit breaker pattern for distributed frontend systems.

**Step 3 — Cross-MFE communication without coupling**
\`\`\`typescript
// packages/mfe-bus/src/index.ts (shared singleton)
type EventMap = {
  'cart:item-added': { productId: string; quantity: number };
  'auth:user-changed': { userId: string | null };
};

class MFEEventBus {
  private emitter = new EventTarget();

  emit<K extends keyof EventMap>(event: K, detail: EventMap[K]) {
    this.emitter.dispatchEvent(new CustomEvent(event, { detail }));
  }

  on<K extends keyof EventMap>(
    event: K,
    handler: (detail: EventMap[K]) => void
  ) {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    this.emitter.addEventListener(event, listener);
    return () => this.emitter.removeEventListener(event, listener); // cleanup
  }
}

export const mfeBus = new MFEEventBus();
\`\`\`
The event bus is a shared singleton distributed as a Module Federation shared dependency. MFEs publish events without knowing who subscribes — loose coupling maintains independence.

**Step 4 — Preventing version conflicts**
- Pin all shared libraries to exact versions in a monorepo lockfile
- Use \`requiredVersion\` in Module Federation to fail fast if incompatible versions are federated
- Semantic versioning contract: MFEs expose typed module interfaces — breaking changes require a major version bump and a host-side migration window
- Automated compatibility checks in CI: load all remoteEntry.js files in a headless browser and assert no console errors

**Measured outcomes:**
- Independent deploys: checkout team ships 3x/day without host release coordination
- Bundle size: host app reduced from 2.4 MB to 680 KB (checkout/catalog loaded on-demand)
- Incident isolation: catalog outage (CDN failure) no longer causes checkout failures`,
      trade_offs: [
        {
          approach: 'Webpack Module Federation',
          pros: [
            'Runtime code sharing: shared libraries (React, design system) loaded once regardless of how many MFEs are on the page',
            'Independent deployment without build-time coordination — true organizational scalability',
            'Lazy loading of remote modules reduces initial bundle size and first-load latency',
          ],
          cons: [
            'Complex Webpack configuration — easy to misconfigure singleton sharing and introduce multiple React instances',
            'Network dependency at runtime: remote entry files add latency to first render; if CDN is slow, the host blocks',
            'Version management across teams requires governance to prevent shared dependency drift',
          ],
        },
        {
          approach: 'iframe-based micro-frontends',
          pros: [
            'Complete isolation: crashes in one iframe cannot affect others — maximum fault tolerance',
            'Any tech stack per iframe — teams are not constrained to React',
            'Zero shared dependency conflicts — each iframe is a self-contained runtime',
          ],
          cons: [
            'Performance: each iframe is a full browser context with separate memory, JS runtime, and layout engine',
            'Communication is limited to postMessage — complex state sharing is cumbersome and error-prone',
            'UX: scroll, focus, and modal management across iframe boundaries is severely constrained',
          ],
        },
        {
          approach: 'Monorepo with shared component library (single deployment)',
          pros: [
            'No network dependency at runtime — all code ships in one bundle, eliminating MFE latency',
            'Simplest architecture to reason about — no distributed system failure modes',
            'Shared state, routing, and error handling are trivial within one React tree',
          ],
          cons: [
            'Deployment coupling: any change requires rebuilding and redeploying the entire app — limits throughput of independent teams',
            'Bundle size grows linearly with every team\'s features — requires aggressive code splitting to maintain load latency',
          ],
        },
      ],
      real_world_example:
        'A marketplace platform (3 teams, 120 engineers) had a React monolith where a checkout bug required coordinating deploys with the catalog, recommendations, and auth teams. After adopting Module Federation: checkout became an independently deployed remote. During a Black Friday incident, the recommendations service (CDN timeout) triggered the fallback component without affecting checkout flow. Checkout conversion rate during the incident was maintained at 98.2% vs. the previous year\'s 0% (entire page was blank). Independent deploy frequency increased from 2x/week (coordinated) to 8x/day per team.',
      red_flags: [
        'Not using singleton: true for React and ReactDOM — causes "Invalid hook call" errors in production when multiple React instances are loaded, a critical fault that is hard to diagnose',
        'Sharing application-level state (Redux store, Zustand store) directly between MFEs via Module Federation — creates implicit coupling that defeats the purpose of independent deployments',
        'Loading all remote entries eagerly at app startup instead of lazily — eliminates the bundle-size benefit of federation and increases initial load latency',
        'No version contract enforcement — allowing MFEs to silently use incompatible minor versions of shared dependencies causes subtle data consistency and rendering bugs in production',
        'No fallback for remote module load failures — a CDN outage for one MFE crashes the entire host application, eliminating the fault isolation benefit of micro-frontends',
      ],
      follow_up_questions: [
        'How do you handle authentication token sharing between micro-frontends without exposing tokens via the event bus?',
        'How would you implement a shared design system across MFEs while allowing each team to independently update their MFE without waiting for a design system release?',
        'Describe your approach to end-to-end testing a micro-frontend architecture where each remote is deployed independently.',
        'How does Vite\'s Module Federation plugin (vite-plugin-federation) differ from Webpack\'s implementation in terms of performance and limitations?',
      ],
    }),
  },

  // 7. Custom hooks for async workflows with race conditions
  {
    title:
      'A search-as-you-type feature fires an API request on every keystroke. Users report seeing stale results appear after newer results — classic race condition. Design a production-grade custom hook that prevents this, handles loading/error states, and supports cancellation.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use AbortController in useEffect cleanup to cancel in-flight requests when a new query arrives, and use a request ID counter or ref to discard stale responses that arrive out-of-order. Combine with useReducer for predictable loading/error state transitions and debouncing to reduce unnecessary throughput to the API.',
      detailed_answer: `Race conditions in search-as-you-type occur because HTTP responses arrive in non-deterministic order. Query "re" may return after query "react", causing older results to overwrite newer ones.

**The problem illustrated:**
\`\`\`
t=0ms:  User types "r"   → request A fires → takes 300ms
t=50ms: User types "re"  → request B fires → takes 100ms
t=150ms: Response B arrives → state = results for "re" ✓
t=300ms: Response A arrives → state = results for "r"  ✗ (stale overwrite!)
\`\`\`

**Production-grade custom hook:**
\`\`\`typescript
import { useEffect, useReducer, useRef, useCallback } from 'react';

type State<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'RESET' };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, error: null, isLoading: false };
    case 'FETCH_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'RESET':
      return { data: null, error: null, isLoading: false };
    default:
      return state;
  }
}

export function useSearch<T>(
  fetchFn: (query: string, signal: AbortSignal) => Promise<T>,
  query: string,
  options: { debounceMs?: number; minLength?: number } = {}
) {
  const { debounceMs = 300, minLength = 2 } = options;
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    error: null,
    isLoading: false,
  });

  // Request ID approach: discard any response not from the latest request
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (query.length < minLength) {
      dispatch({ type: 'RESET' });
      return;
    }

    const requestId = ++latestRequestId.current;
    const controller = new AbortController();
    let debounceTimer: ReturnType<typeof setTimeout>;

    dispatch({ type: 'FETCH_START' });

    debounceTimer = setTimeout(async () => {
      try {
        const result = await fetchFn(query, controller.signal);

        // Only commit if this is still the latest request
        if (requestId === latestRequestId.current) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Cancelled — not a real error
        }
        if (requestId === latestRequestId.current) {
          dispatch({ type: 'FETCH_ERROR', error: err as Error });
        }
      }
    }, debounceMs);

    return () => {
      // Cleanup: cancel the debounce timer AND the in-flight request
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [query, fetchFn, debounceMs, minLength]);

  return state;
}
\`\`\`

**Usage:**
\`\`\`tsx
function SearchPage() {
  const [query, setQuery] = useState('');

  const searchUsers = useCallback(
    (q: string, signal: AbortSignal) =>
      fetch(\`/api/search?q=\${encodeURIComponent(q)}\`, { signal })
        .then(r => r.json() as Promise<User[]>),
    []
  );

  const { data: results, isLoading, error } = useSearch(searchUsers, query, {
    debounceMs: 250,
    minLength: 2,
  });

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {isLoading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {results && <ResultsList items={results} />}
    </>
  );
}
\`\`\`

**Why both mechanisms?**
- \`AbortController\`: Cancels the HTTP request, freeing network resources and preventing the server from processing unnecessary work — reduces throughput waste on the API server
- Request ID counter: Guards against scenarios where the network stack doesn\'t respect abort (e.g., cached responses, some CDN layers) — ensures data consistency by discarding stale payloads

**Performance:** At 200 ms debounce for a 60 WPM typist, this reduces API calls from ~5/second to ~0.8/second, an 84% reduction in search API throughput cost.`,
      trade_offs: [
        {
          approach: 'AbortController + request ID (shown above)',
          pros: [
            'Cancels both the network request and the state update — dual safety for data consistency',
            'Works with any fetch-based API, including REST and GraphQL',
            'No external dependencies — pure React hooks and browser APIs',
          ],
          cons: [
            'AbortController is not supported in IE11 (negligible concern in 2024+)',
            'fetch must propagate the signal to all nested requests in complex workflows',
            'requestId counter is a shared mutable ref — must be carefully guarded in concurrent rendering',
          ],
        },
        {
          approach: 'React Query / TanStack Query with query keys',
          pros: [
            'Race condition prevention is built-in — TanStack Query automatically cancels in-flight queries when the query key changes',
            'Adds caching, deduplication, and background refetch — significant throughput and latency improvements with no custom code',
            'Stale-while-revalidate provides fault tolerance: users see cached results during network failures',
          ],
          cons: [
            'Adds a ~14 KB dependency — significant for apps that only need search',
            'Abstraction layer can hide important behavior (e.g., when exactly cancellation happens)',
            'Learning curve for advanced patterns (optimistic updates, infinite queries)',
          ],
        },
        {
          approach: 'RxJS switchMap observable pattern',
          pros: [
            'switchMap cancels the previous observable on every new emission — race conditions are structurally impossible',
            'Composable: debounce, distinctUntilChanged, retry are single operators',
            'Extremely high throughput handling: operators compose efficiently without re-renders',
          ],
          cons: [
            'RxJS adds ~30 KB to bundle and requires team familiarity with reactive programming mental model',
            'Bridging RxJS observables to React state requires useEffect and Subscription cleanup — adds boilerplate',
            'Over-engineered for a simple search hook without other reactive requirements',
          ],
        },
      ],
      real_world_example:
        'A job search platform had a location autocomplete that fired requests on every keystroke. Under high API latency (p95 = 800 ms), users would type a city name and see the results jump from "San Francisco" back to "San" — the earlier request arrived last. Support tickets citing "wrong location selected automatically" increased. After implementing the AbortController + requestId hook with 200 ms debounce: race condition reports dropped to zero in the next two sprints. API search endpoint load dropped by 71% (from 180k req/min to 52k req/min at peak), reducing backend infrastructure costs by ~$2,400/month.',
      red_flags: [
        'Setting a boolean `isCancelled` ref inside the effect and checking it before setState — this prevents the stale state update but does NOT cancel the HTTP request, wasting server resources and network throughput',
        'Using a module-level variable as the request ID instead of a ref — module-level variables are shared across all component instances, causing cross-instance race conditions',
        'Not cleaning up the debounce timer in the useEffect return function — the timer fires after the component unmounts, triggering setState on an unmounted component',
        'Catching AbortError and dispatching FETCH_ERROR — aborted requests are not errors; displaying an error message when the user is still typing destroys UX',
        'Not memoizing the fetchFn with useCallback — a new function reference on every render causes the useEffect to re-run on every render, defeating the debounce entirely',
      ],
      follow_up_questions: [
        'How does TanStack Query\'s automatic cancellation work under the hood, and how does it differ from manual AbortController management?',
        'If the search API uses GraphQL subscriptions instead of REST, how would you adapt this pattern to handle streaming results?',
        'How would you test this hook\'s race condition prevention in Jest without actually introducing network timing variability?',
        'How would you extend this hook to support optimistic local filtering (show cached results instantly while fetching updated results)?',
      ],
    }),
  },

  // 8. Virtualization for 100,000 rows
  {
    title:
      'A React application must render and interact with a list of 100,000 rows in a scrollable container. Mounting all DOM nodes causes the page to hang for 8 seconds on load. Design a complete virtualization strategy that handles variable row heights, dynamic loading, and keyboard accessibility.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Implement windowed rendering with react-window or TanStack Virtual — only render the ~20 rows visible in the viewport plus an overscan buffer. For variable heights, use a VariableSizeList with a height estimation/measurement cache. For 100k rows, combine with infinite/paginated loading so data itself is not all in memory. Restore keyboard navigation via programmatic scrollToItem.',
      detailed_answer: `Rendering 100,000 DOM nodes is a throughput and memory problem. A typical row with 5 cells creates ~500k DOM nodes, causing:
- Initial render: 8 s (DOM insertion, layout, paint)
- Memory: 600–900 MB DOM heap
- Scroll: 60 fps → 8 fps (layout thrashing)

Virtualization solves this by maintaining a fixed-size DOM pool of ~20–50 rows, recycling them as the user scrolls.

**Architecture with TanStack Virtual (framework-agnostic, more flexible than react-window):**
\`\`\`tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';

interface VirtualTableProps {
  rows: Row[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function VirtualTable({
  rows,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length, // +1 for loading sentinel
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Initial estimate; measured and cached per row
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scroll
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Trigger next page when the last row enters the viewport
  const lastItemIndex = virtualItems[virtualItems.length - 1]?.index;
  if (lastItemIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  return (
    <div
      ref={parentRef}
      role="grid"
      aria-rowcount={rows.length}
      style={{ height: '600px', overflow: 'auto' }}
    >
      {/* Total height spacer — allows scrollbar to reflect full dataset */}
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement} // Measure actual height for accuracy
              role="row"
              aria-rowindex={virtualRow.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                transform: \`translateY(\${virtualRow.start}px)\`,
                width: '100%',
              }}
            >
              {row ? (
                <TableRow row={row} />
              ) : (
                <div>Loading more...</div> // Sentinel row
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
\`\`\`

**Variable height measurement:**
\`\`\`typescript
// virtualizer.measureElement ref automatically measures each row after render
// and caches the height. Subsequent scrolls use exact heights, eliminating jumps.
// estimateSize() only fires for rows not yet measured — used for scrollbar proportion.
\`\`\`

**Keyboard navigation:**
\`\`\`tsx
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  const currentIndex = focusedRowIndex;
  if (e.key === 'ArrowDown') {
    const next = Math.min(currentIndex + 1, rows.length - 1);
    setFocusedRowIndex(next);
    virtualizer.scrollToIndex(next, { align: 'auto' }); // Scroll into view
  }
  if (e.key === 'ArrowUp') {
    const prev = Math.max(currentIndex - 1, 0);
    setFocusedRowIndex(prev);
    virtualizer.scrollToIndex(prev, { align: 'auto' });
  }
}, [focusedRowIndex, rows.length, virtualizer]);
\`\`\`

**Data management for 100k rows:**
\`\`\`typescript
// With TanStack Query infinite query — only load pages as user scrolls
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['rows'],
  queryFn: ({ pageParam = 0 }) => fetchRows({ offset: pageParam, limit: 100 }),
  getNextPageParam: (lastPage, pages) => lastPage.nextOffset,
});
const rows = data?.pages.flatMap(p => p.items) ?? [];
\`\`\`
At 100 rows/page, only 10–20 pages are fetched for typical sessions, keeping memory at 1,000–2,000 objects (not 100,000).

**Measured results:**
- Before: 8 s initial render, 900 MB DOM heap, 8 fps scroll, interaction latency > 2 s (each scroll event re-triggered layout on 500k nodes)
- After virtualization: 120 ms initial render (~66x faster), 45 MB DOM heap, 60 fps scroll
- Interaction latency (scroll + filter): reduced from > 2 s to < 50 ms — a direct throughput improvement enabling real-time filter interactions
- DOM nodes in viewport: 50 (fixed) vs. 500,000 (all) — 10,000x reduction in layout throughput cost`,
      trade_offs: [
        {
          approach: 'TanStack Virtual (react-virtual)',
          pros: [
            'Framework-agnostic, actively maintained, supports variable heights with automatic measurement',
            'Programmatic scrollToIndex enables full keyboard accessibility without custom scroll math',
            'Excellent fault tolerance: if measurement fails, estimateSize fallback prevents layout crashes',
          ],
          cons: [
            'More boilerplate than react-window: must manually wire ref, measure, and absolute positioning',
            'Dynamic measurement causes layout shift on first render of each row — visible on very slow connections',
          ],
        },
        {
          approach: 'react-window with FixedSizeList',
          pros: [
            'Minimal API surface — 5 lines of code for a virtualized list',
            'Excellent performance for fixed-height rows: no measurement overhead',
            'Well-documented and battle-tested at scale',
          ],
          cons: [
            'Does not support variable row heights natively — VariableSizeList requires pre-calculated heights',
            'Less maintained than TanStack Virtual — fewer recent updates',
            'Limited customization for complex row layouts (sticky headers, grouped rows)',
          ],
        },
        {
          approach: 'CSS content-visibility: auto (browser-native)',
          pros: [
            'Zero JavaScript — browser natively skips rendering off-screen content',
            'Works with natural document flow — no absolute positioning or height spacers',
            'Negligible implementation cost: one CSS rule',
          ],
          cons: [
            'Browser must still parse and construct the full DOM for all 100k rows — does not solve the initial render cost or memory problem',
            'Scroll performance improves but initial 8 s load persists',
            'Limited browser support for contain-intrinsic-size which is needed for accurate scrollbar',
          ],
        },
      ],
      real_world_example:
        'A CRM application needed to display an account\'s full transaction history (up to 150,000 rows) in a filterable table. Initial implementation attempted to render all rows client-side: load time was 12 s, tab froze for 8 s, and the page used 1.2 GB of memory on mid-range laptops, causing crashes. After implementing TanStack Virtual with 100-row infinite query pages: initial render dropped to 90 ms, memory stabilized at 48 MB regardless of how far users scrolled, and scroll remained at 60 fps even at the 100,000th row. Accessibility audit confirmed ARIA grid roles with keyboard navigation met WCAG 2.1 AA requirements.',
      red_flags: [
        'Rendering all 100k rows and relying on CSS `display: none` or `visibility: hidden` for off-screen rows — the DOM nodes still exist, consuming memory and parse time; virtualization must not render them at all',
        'Using react-window\'s VariableSizeList with hardcoded heights instead of dynamic measurement — incorrect heights cause scroll position drift and broken layout as users scroll',
        'Forgetting to set a fixed height on the scroll container — without a constrained viewport, the virtualizer renders all rows (incorrectly detecting the entire page as visible)',
        'Not providing ARIA roles (grid, row, rowindex) — keyboard-only users cannot navigate a table without semantic roles, and screen readers announce an unstructured list',
        'Loading all 100k rows into memory before virtualizing — virtualization reduces DOM nodes but if all data is in a JavaScript array, memory (heap) remains high; combine with paginated/infinite loading',
      ],
      follow_up_questions: [
        'How would you implement a "jump to row #N" feature in a virtualized list where rows 1–N-1 may not have been measured yet?',
        'How does react-window\'s AutoSizer interact with CSS Grid and Flexbox parents, and what common sizing bugs does it introduce?',
        'If rows in the virtualized list can expand/collapse (accordion-style), how do you update the virtualizer\'s height cache without a full re-render?',
        'How would you implement sticky/frozen header rows in a virtualized table, given that absolute positioning is used for all rows?',
      ],
    }),
  },

  // 9. Error boundary strategy
  {
    title:
      'Your React application in production has no error boundaries, causing a single component crash to blank-screen the entire app. Design a comprehensive error boundary strategy with granular boundaries, error reporting integration, and recovery UX for a complex SPA.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Implement a layered boundary strategy: a root boundary for catastrophic failures, route-level boundaries to isolate pages, widget-level boundaries for independent UI regions (charts, sidebars), and leaf boundaries for high-risk data-driven components. Integrate Sentry (or equivalent) for error reporting with component stack traces, and provide contextual recovery actions (retry, reload, navigate home).',
      detailed_answer: `Without error boundaries, React unmounts the entire tree on any unhandled render error — the user sees a blank screen with no recovery path. A production error boundary strategy is a distributed system fault tolerance problem: isolate failures to the smallest possible blast radius.

**Boundary hierarchy:**
\`\`\`
RootErrorBoundary           ← Catches catastrophic failures; shows full-page error
  RouteErrorBoundary        ← Per-page isolation; user can navigate to other pages
    LayoutErrorBoundary     ← Sidebar/nav can fail without killing main content
      WidgetErrorBoundary   ← Per-chart/card isolation on dashboards
        LeafErrorBoundary   ← Per-row in data tables with bad data
\`\`\`

**Production-grade ErrorBoundary class component:**
\`\`\`tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[]; // Reset boundary when these values change (e.g., route change)
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry with component stack for precise debugging
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        digest: (errorInfo as any).digest, // Next.js error digest
      },
      tags: {
        boundary: 'react-error-boundary',
      },
    });
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset boundary when resetKeys change (e.g., user navigates to a new route)
    if (
      this.state.hasError &&
      prevProps.resetKeys !== this.props.resetKeys &&
      this.props.resetKeys?.some((key, i) => key !== prevProps.resetKeys?.[i])
    ) {
      this.reset();
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
\`\`\`

**Route-level boundary with recovery:**
\`\`\`tsx
// app/[locale]/(main)/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RootErrorBoundary
      fallback={(error, reset) => (
        <div role="alert" className="error-page">
          <h1>Something went wrong</h1>
          <p>Error ID: {Sentry.lastEventId()}</p>
          <button onClick={reset}>Try again</button>
          <button onClick={() => router.push('/')}>Go to dashboard</button>
        </div>
      )}
    >
      {children}
    </RootErrorBoundary>
  );
}
\`\`\`

**Widget-level boundaries on dashboards:**
\`\`\`tsx
function Dashboard() {
  return (
    <div className="grid">
      {widgets.map(widget => (
        <ErrorBoundary
          key={widget.id}
          fallback={
            <WidgetError
              name={widget.name}
              onRetry={() => window.location.reload()}
            />
          }
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <widget.Component />
          </Suspense>
        </ErrorBoundary>
      ))}
    </div>
  );
}
\`\`\`

**resetKeys for automatic recovery on navigation:**
\`\`\`tsx
const pathname = usePathname();
<ErrorBoundary resetKeys={[pathname]} fallback={<PageError />}>
  <PageContent />
</ErrorBoundary>
// When user navigates to /new-page, the boundary resets — stale error doesn\'t persist
\`\`\`

**Measuring fault tolerance, latency, and throughput improvement:**
- Before: Any component crash → 100% of users see blank screen; session throughput (pages viewed/session) drops to 0 as users rage-quit
- After: Widget-level boundaries → only the crashing widget shows an error card; 95% of the UI remains functional with full interaction latency intact
- P99 blank-screen rate reduced from 0.8% to 0.02% of sessions
- Session throughput (pages/session) increased 22% for affected cohort because users stayed in the app rather than hard-reloading
- Error reporting latency (time from crash to engineer notification): reduced from "never" (silent blank screen) to < 30 s via Sentry alerting`,
      trade_offs: [
        {
          approach: 'Granular widget-level error boundaries',
          pros: [
            'Minimum blast radius: one crashing chart does not affect the rest of the dashboard — maximum fault tolerance',
            'Users can continue their workflow even when a non-critical widget fails',
            'Each boundary reports independently to error monitoring — precise root cause attribution',
          ],
          cons: [
            'High implementation overhead: 150-component app may need 30+ boundaries placed thoughtfully',
            'Boundary placement requires architectural judgment — too coarse misses isolation; too fine creates redundant error UI',
            'Class component requirement means error boundaries cannot be written as functional components in React < 19',
          ],
        },
        {
          approach: 'react-error-boundary library',
          pros: [
            'Provides ErrorBoundary component + useErrorBoundary hook — enables functional components to trigger boundaries imperatively',
            'resetKeys and onReset props handle route-change recovery without manual componentDidUpdate logic',
            'Actively maintained, widely used (3M+ weekly downloads) — reduces bespoke code and improves maintainability',
          ],
          cons: [
            'Additional dependency with its own version lifecycle',
            'Abstraction may hide the getDerivedStateFromError/componentDidCatch lifecycle from engineers who need to understand it',
          ],
        },
        {
          approach: 'Global window.onerror / window.onunhandledrejection only',
          pros: [
            'Catches errors outside React\'s render cycle (async callbacks, event handlers)',
            'Zero changes to component tree structure',
            'Useful as a complement to ErrorBoundary for non-render errors',
          ],
          cons: [
            'Cannot prevent React from unmounting the component tree — the blank screen still occurs for render errors',
            'No granular isolation — all errors are handled globally with no contextual recovery',
            'Not a substitute for ErrorBoundary; should only be used alongside it',
          ],
        },
      ],
      real_world_example:
        'A project management SaaS had no error boundaries. A Gantt chart component began crashing for projects with >500 tasks due to a date arithmetic overflow. This blanked the entire app for 12% of enterprise users (those with large projects) — the highest-value customer segment. Emergency fix: added a WidgetErrorBoundary around the Gantt chart with a fallback showing a "Chart unavailable" message and a link to the list view. Blank screens for affected users dropped from 100% to 0% immediately. Sentry began capturing the exact error with component stack traces, enabling a proper fix within 2 hours. The incident highlighted that all 8 dashboard widgets needed individual boundaries — which were added in the following sprint.',
      red_flags: [
        'Placing a single root ErrorBoundary and considering the job done — a root boundary is only a last resort; it provides zero isolation between independent features',
        'Catching errors in componentDidCatch but not reporting them to an error monitoring service — the error is silently swallowed; engineers have no visibility into production failures',
        'Using try/catch inside render functions to suppress errors instead of ErrorBoundary — try/catch in render does not give React the chance to render a fallback or log the component stack',
        'Not implementing resetKeys tied to route changes — error boundaries persist their error state on navigation, causing users who navigate away and back to still see the error card for a fixed bug',
        'Displaying raw error.message in the fallback UI in production — exposes internal implementation details and stack traces to end users; use a generic message and a Sentry event ID for support reference',
      ],
      follow_up_questions: [
        'React 19 introduces use() hook and async components — how does error propagation change for async component errors versus synchronous render errors?',
        'How do you test error boundary behavior in Vitest or Jest, given that React swallows the errors to the console and re-throws them?',
        'How would you implement an "undo last action" recovery mechanism for an error boundary that catches a state mutation error?',
        'How do Next.js App Router\'s error.tsx and global-error.tsx files relate to React\'s ErrorBoundary, and what is the difference in their scope and behavior?',
      ],
    }),
  },

  // 10. Code splitting strategy
  {
    title:
      'A React application with 200+ components and 15 routes has grown to a 4.2 MB JavaScript bundle, causing a 9-second Time to Interactive on mobile. Design a comprehensive code splitting strategy that prioritizes above-the-fold content and maintains functionality during progressive loading.',
    topicSlug: 'react',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Apply route-level code splitting as the foundation, then component-level splitting for heavy third-party dependencies (charts, rich text editors, PDF viewers), and finally granular splits for below-the-fold content. Use Suspense with skeleton loaders for progressive loading UX, preload critical routes on user intent signals, and analyze bundle with source-map-explorer to find the highest-impact splits.',
      detailed_answer: `A 4.2 MB bundle means users on 4G mobile (10 Mbps, 150 ms RTT) wait 3.4 s to download, 2.1 s for JS parse/compile, and 3.5 s for framework init and render — totaling 9 s TTI. Code splitting reduces the amount parsed and executed before first interaction.

**Step 1 — Analyze the bundle**
\`\`\`bash
# Next.js
ANALYZE=true next build
# or
npx source-map-explorer .next/static/chunks/*.js

# Vite
npx vite-bundle-visualizer
\`\`\`
Typical findings: chart library (1.2 MB), PDF generator (800 KB), rich text editor (600 KB) loaded on initial page even when only used in 2 of 15 routes.

**Step 2 — Route-level splitting (highest impact)**
\`\`\`tsx
// app/routes.tsx (React Router v6 example)
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Each route chunk loads only when navigated to
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics')); // Contains Recharts
const Editor    = lazy(() => import('./pages/Editor'));     // Contains TipTap
const Reports   = lazy(() => import('./pages/Reports'));    // Contains PDF generator

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/editor"    element={<Editor />} />
        <Route path="/reports"   element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`
This alone typically reduces initial bundle from 4.2 MB to 800 KB–1.2 MB.

**Step 3 — Component-level splitting for heavy widgets**
\`\`\`tsx
// Split below-the-fold and interaction-triggered components
const ChartWidget = lazy(() => import('./components/ChartWidget'));
const RichTextEditor = lazy(() =>
  import('./components/RichTextEditor').then(m => ({
    default: m.RichTextEditor, // Named export
  }))
);

function Dashboard() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <AboveFoldContent /> {/* Never lazy-loaded */}

      {/* Below-fold chart: load when it enters viewport */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartWidget />
      </Suspense>

      {/* Editor: load only when user clicks "Edit" */}
      {showEditor && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />
        </Suspense>
      )}
    </>
  );
}
\`\`\`

**Step 4 — Preloading on intent signals**
\`\`\`tsx
// Preload Analytics route when user hovers its nav link
function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const preload = useCallback(() => {
    if (to === '/analytics') import('./pages/Analytics');
    if (to === '/editor')    import('./pages/Editor');
  }, [to]);

  return (
    <Link to={to} onMouseEnter={preload} onFocus={preload}>
      {children}
    </Link>
  );
}
\`\`\`
This gives ~200 ms head start on the chunk download before the user clicks — the route appears to load instantly.

**Step 5 — Third-party library alternatives**
\`\`\`bash
# Replace moment.js (329 KB) with date-fns tree-shaking (only imports used functions)
# Replace lodash (full) with lodash-es (tree-shakeable)
# Replace full recharts with lightweight visx or chart.js
# Bundle diff:
# moment → date-fns: saves 280 KB
# lodash → lodash-es with tree-shaking: saves 180 KB
# recharts → visx (tree-shakeable): saves 400 KB if only 2 chart types used
\`\`\`

**Measured results:**
- Initial bundle: 4.2 MB → 890 KB (79% reduction)
- TTI on 4G mobile: 9 s → 2.1 s
- LCP (Largest Contentful Paint): 7.4 s → 1.8 s
- Lighthouse Performance Score: 28 → 82

**Maintainability note:** Document which routes are lazy-loaded and what their chunks contain in ARCHITECTURE.md. Without documentation, engineers add imports to the wrong chunk, undoing the splitting.`,
      trade_offs: [
        {
          approach: 'Aggressive route + component splitting with Suspense',
          pros: [
            'Largest reduction in initial bundle and TTI — directly improves Core Web Vitals and Lighthouse score',
            'Each route\'s chunk is independently cacheable — users who only visit the dashboard never download the editor\'s 600 KB chunk',
            'Progressive loading with Suspense provides fault tolerance: one chunk failure shows a skeleton, not a blank page',
          ],
          cons: [
            'Increases the number of network requests — each lazy import is a separate chunk fetch (mitigated by HTTP/2 multiplexing)',
            'Waterfall risk: Suspense boundaries can cause parent-to-child loading waterfalls if not carefully structured',
            'Testing complexity: lazy-loaded components require async rendering in tests (waitFor, act)',
          ],
        },
        {
          approach: 'Single bundle with tree-shaking optimization',
          pros: [
            'Simplest deployment — one file cached indefinitely; no dynamic chunk URL management',
            'No loading states or skeleton UI required — everything is available immediately (once loaded)',
            'Works without Suspense infrastructure',
          ],
          cons: [
            'Tree-shaking alone cannot remove code that is imported but conditionally rendered — most of the 4.2 MB cannot be removed',
            'Any change to any module invalidates the entire bundle cache for all users — poor cache throughput',
            'Does not scale: as the app grows, the single bundle grows proportionally',
          ],
        },
        {
          approach: 'Module preloading with <link rel="modulepreload">',
          pros: [
            'Browser pre-fetches chunks during idle time — zero perceived latency for subsequent navigations',
            'Works with both Next.js automatic preloading and custom Vite builds',
            'Can be prioritized (preload critical path, prefetch likely-next paths)',
          ],
          cons: [
            'Preloading too many chunks defeats code splitting — bandwidth is consumed upfront even for rarely visited routes',
            'Preload hints must be maintained manually in large apps; stale preloads waste bandwidth',
            'Does not reduce the initial bundle size — only moves the fetch earlier in time',
          ],
        },
      ],
      real_world_example:
        'A SaaS project management tool with 18 routes and 220 components had a 3.8 MB initial bundle. The PDF export library (850 KB) and the Gantt chart renderer (1.1 MB) were bundled eagerly even though only 20% of users ever used these features. After route splitting + lazy importing these two libraries only on the Reports and Timeline pages: initial bundle dropped from 3.8 MB to 760 KB. Mobile TTI improved from 8.2 s to 1.9 s. Monthly CDN bandwidth costs dropped by 34% (users no longer download 3 MB of code to view their dashboard). The Gantt route preloads on hover of the "Timeline" nav link, so the 1.1 MB chunk is invisible to users who use it.',
      red_flags: [
        'Lazy-loading components that are above the fold or required for initial interactivity — lazy loading above-the-fold content increases TTI instead of reducing it; only below-the-fold or interaction-triggered content should be lazy-loaded',
        'Creating too many tiny chunks (every component lazy-loaded separately) — each chunk requires a network round trip; 50 chunks × 150 ms RTT = 7.5 s of latency overhead on mobile',
        'Not providing Suspense fallbacks at appropriate granularity — a Suspense at the app root causes the entire page to show a spinner while any lazy import loads',
        'Splitting by technical layer (all hooks in one chunk, all contexts in another) instead of by feature/route — technical splits do not align with usage patterns and provide no loading benefit',
        'Forgetting to chunk-split vendor libraries by update frequency — bundling React (rarely updated) with business logic (frequently updated) in the same chunk invalidates the cache on every deploy, reducing cache hit rate and increasing throughput cost',
      ],
      follow_up_questions: [
        'How does Next.js App Router\'s per-page automatic code splitting differ from manual React.lazy, and what cases require manual splitting on top of Next.js defaults?',
        'How would you implement a loading priority queue so that above-the-fold chunks are fetched before below-the-fold chunks, even when both are lazy-imported?',
        'How do you prevent Suspense waterfalls (parent boundary blocking child boundaries) in a tree with multiple levels of lazy-loaded components?',
        'How would you measure the real-world impact of your code splitting changes for users on 3G connections in emerging markets, using field data from the Chrome User Experience Report (CrUX)?',
      ],
    }),
  },
];
