/**
 * Middle-Level Next.js Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: App Router, Server Components, caching, data fetching,
 * middleware, performance, deployment, and real-world architecture.
 *
 * Topic: nextjs
 * Level: MIDDLE
 *
 * Usage: npm run seed:middle-nextjs
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

const nextjsMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "App Router file conventions: page.tsx, layout.tsx, loading.tsx, error.tsx, and not-found.tsx",
    content:
      "Explain the special file conventions in Next.js App Router. How do layout.tsx, loading.tsx, error.tsx, and not-found.tsx work together to build a production route?",
    answer: `**Special files in each route segment**:

| File | Purpose | Renders as |
|---|---|---|
| \`page.tsx\` | The UI for a route. Required to make a route accessible | Leaf component |
| \`layout.tsx\` | Shared UI that wraps page and child layouts. Persists across navigation | Wrapper (does not re-render on navigation) |
| \`loading.tsx\` | Instant loading UI (Suspense boundary). Shown while page/data loads | \`<Suspense fallback={<Loading />}>\` |
| \`error.tsx\` | Error boundary. Catches errors in the page and child segments | React Error Boundary |
| \`not-found.tsx\` | UI for \`notFound()\` calls or unmatched routes | 404 page |
| \`template.tsx\` | Like layout but re-mounts on navigation (new instance each time) | Wrapper (re-renders) |
| \`default.tsx\` | Fallback for parallel routes when no match exists | Parallel slot fallback |

**How they compose** (nesting order):
\`\`\`
layout.tsx
  template.tsx (if present)
    error.tsx (Error Boundary)
      loading.tsx (Suspense)
        page.tsx | not-found.tsx
\`\`\`

**layout.tsx key behaviors**:
- Receives \`{children}\` prop — the child page or nested layout
- Does NOT re-render when navigating between sibling routes
- State is preserved across navigation (e.g., sidebar open/closed persists)
- Cannot access current pathname (use \`usePathname()\` in a Client Component)

**loading.tsx in practice**:
\`\`\`tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}
// Automatically wraps page.tsx in <Suspense fallback={<Loading />}>
\`\`\`

**error.tsx in practice**:
\`\`\`tsx
// app/dashboard/error.tsx
'use client'; // Error boundaries must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
\`\`\`

**Common mistakes**:
- Using \`layout.tsx\` when you need per-page state reset — use \`template.tsx\` instead
- Forgetting that \`error.tsx\` must be a Client Component (\`'use client'\`)
- Not realizing \`error.tsx\` won't catch errors in the same-level \`layout.tsx\` — you need a parent error boundary
- Putting heavy data fetching in layout — it blocks all child pages from rendering

**Follow-up**: How do parallel routes (@folder) and intercepting routes ((.)) work together? What is the difference between \`layout.tsx\` and \`template.tsx\` for animation libraries?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Data fetching in App Router: server-side fetch, caching defaults, and revalidation strategies",
    content:
      "How does data fetching work in the Next.js App Router? Explain the default caching behavior of fetch, the difference between static and dynamic rendering, and how to control revalidation.",
    answer: `**Server Component data fetching** — just use \`async/await\`:
\`\`\`tsx
// app/posts/page.tsx — Server Component by default
export default async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return <PostList posts={posts} />;
}
\`\`\`

**Next.js extends \`fetch\`** with caching and revalidation options:

| Option | Behavior |
|---|---|
| Default (no option) | \`force-cache\` in Next 14, \`no-store\` in Next 15 |
| \`{ cache: 'force-cache' }\` | Static: fetched at build time, cached indefinitely |
| \`{ cache: 'no-store' }\` | Dynamic: fetched on every request |
| \`{ next: { revalidate: 60 } }\` | ISR: cached for 60 seconds, then revalidated |
| \`{ next: { tags: ['posts'] } }\` | On-demand: revalidated when tag is invalidated |

**Route-level configuration**:
\`\`\`tsx
// Force all fetches in this route to be dynamic
export const dynamic = 'force-dynamic';

// Set default revalidation for all fetches
export const revalidate = 60;

// Force static generation
export const dynamic = 'force-static';
\`\`\`

**On-demand revalidation** (e.g., after CMS update):
\`\`\`tsx
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  revalidateTag('posts');       // Revalidate all fetches tagged 'posts'
  revalidatePath('/blog');      // Revalidate specific path
  return Response.json({ revalidated: true });
}
\`\`\`

**Static vs Dynamic rendering**:
- **Static**: HTML generated at build time. Used when all data is known at build and no request-time info needed
- **Dynamic**: HTML generated per request. Triggered by: \`cookies()\`, \`headers()\`, \`searchParams\`, \`cache: 'no-store'\`, or \`dynamic = 'force-dynamic'\`

**Common mistakes**:
- Not understanding the caching default changed between Next.js 14 and 15
- Using \`cache: 'no-store'\` everywhere — defeats the purpose of static optimization
- Fetching the same URL in multiple components thinking it duplicates requests — Next.js deduplicates identical \`fetch\` calls in the same render pass
- Mixing server and client data fetching without a clear strategy

**Follow-up**: How does Next.js deduplicate fetch requests across components in the same render? What is the Full Route Cache vs the Data Cache?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Server Actions: form handling, mutations, and progressive enhancement",
    content:
      "What are Server Actions in Next.js? How do they handle form submissions and mutations? Explain progressive enhancement and how Server Actions work without JavaScript.",
    answer: `**Server Actions**: Async functions that run on the server, callable directly from Client or Server Components. Defined with the \`'use server'\` directive.

\`\`\`tsx
// app/actions.ts
'use server';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.posts.create({ title, content });
  revalidatePath('/posts');
}
\`\`\`

**Usage in forms**:
\`\`\`tsx
// Server Component — works without JavaScript!
import { createPost } from './actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create</button>
    </form>
  );
}
\`\`\`

**Progressive enhancement**: The form uses a native HTML \`action\`. If JavaScript hasn't loaded yet (or is disabled), the form submits as a standard POST request. When JS is available, Next.js intercepts and handles it client-side without a full page reload.

**With Client Component enhancements**:
\`\`\`tsx
'use client';
import { useActionState } from 'react';
import { createPost } from './actions';

export function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
\`\`\`

**Validation pattern**:
\`\`\`tsx
'use server';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
});

export async function createPost(prevState: any, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  await db.posts.create(parsed.data);
  revalidatePath('/posts');
  redirect('/posts');
}
\`\`\`

**Key behaviors**:
- Server Actions are POST endpoints under the hood
- They can call \`revalidatePath\`, \`revalidateTag\`, \`redirect\`, \`cookies().set()\`
- They work in both Server and Client Components
- They're serializable — form data is sent, not closures

**Common mistakes**:
- Calling Server Actions outside of form actions/transitions — should use \`startTransition\` for non-form invocations
- Not validating input on the server — client validation can be bypassed
- Returning non-serializable data (Date objects, class instances) from Server Actions
- Not handling optimistic updates for better UX

**Follow-up**: How do optimistic updates work with \`useOptimistic\` and Server Actions? What is the security model — can users call any Server Action directly?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Next.js Middleware: use cases, execution model, and limitations",
    content:
      "What is Next.js Middleware? Where does it run, what can it do, and what are its limitations? Give production examples of when to use middleware vs API routes vs Server Components.",
    answer: `**Middleware**: Code that runs before a request is completed. Executes on the Edge Runtime (not Node.js) for every matching request.

\`\`\`tsx
// middleware.ts (root of project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Runs for every matching route before the page renders
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
\`\`\`

**What middleware CAN do**:
- Read/modify request headers and cookies
- Redirect or rewrite URLs
- Return responses directly (e.g., 401)
- Set response headers (CORS, security headers)
- A/B testing (rewrite to different pages based on cookie)
- Geolocation-based routing
- Bot detection

**What middleware CANNOT do** (Edge Runtime limitations):
- Use Node.js APIs (fs, child_process, etc.)
- Use most npm packages that depend on Node.js
- Connect to databases directly (no TCP sockets in Edge)
- Run long-running operations (strict execution time limits)
- Access the response body

**Middleware vs API Routes vs Server Components**:

| Need | Use |
|---|---|
| Auth redirect before page loads | Middleware |
| CORS / security headers | Middleware |
| A/B testing / feature flags | Middleware |
| Data fetching for a page | Server Component |
| Database queries | Server Component or API Route |
| Webhook handlers | API Route |
| Complex business logic | API Route (Node.js runtime) |

**Production patterns**:

1. **Authentication gate**:
\`\`\`tsx
if (!session && isProtectedRoute(pathname)) {
  return NextResponse.redirect(new URL('/login', request.url));
}
\`\`\`

2. **Internationalization**:
\`\`\`tsx
const locale = request.headers.get('accept-language')?.split(',')[0] || 'en';
return NextResponse.rewrite(new URL(\`/\${locale}\${pathname}\`, request.url));
\`\`\`

3. **Rate limiting headers**:
\`\`\`tsx
const response = NextResponse.next();
response.headers.set('X-RateLimit-Remaining', remaining.toString());
return response;
\`\`\`

**Common mistakes**:
- Using middleware for heavy computation — it runs on every request and has time limits
- Trying to access databases or use Node.js packages in middleware
- Not using the \`matcher\` config — middleware runs for every request including static assets
- Putting auth logic only in middleware without server-side checks — middleware can be bypassed

**Follow-up**: How does Edge Runtime differ from Node.js Runtime in Next.js? Can you chain multiple middleware functions?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Next.js caching layers: Full Route Cache, Data Cache, Router Cache, and how to control them",
    content:
      "Next.js has multiple caching layers. Explain the Full Route Cache, Data Cache, Router Cache, and Request Memoization. How do they interact, and how do you opt out when needed?",
    answer: `**Four caching layers** (from server to client):

**1. Request Memoization** (per-request, server):
- Deduplicates identical \`fetch()\` calls within a single render pass
- If 3 components fetch \`/api/user\`, only 1 HTTP request is made
- Automatic, no configuration needed
- Only applies to GET requests in \`fetch()\`

**2. Data Cache** (persistent, server):
- Caches the result of \`fetch()\` calls across requests and deployments
- Stored on the server (in Vercel's infrastructure or custom cache handler)
- Controlled by \`fetch\` options:
\`\`\`tsx
fetch(url, { cache: 'force-cache' });        // Cached indefinitely
fetch(url, { cache: 'no-store' });            // Never cached
fetch(url, { next: { revalidate: 3600 } });   // Cached for 1 hour
fetch(url, { next: { tags: ['users'] } });     // Invalidated by tag
\`\`\`

**3. Full Route Cache** (persistent, server):
- Caches the entire rendered HTML + RSC payload at build time
- Only for statically rendered routes
- Invalidated when the Data Cache is invalidated
- Opt out: \`export const dynamic = 'force-dynamic'\`

**4. Router Cache** (in-memory, client):
- Caches visited route segments in the browser during a session
- Prefetched routes are also stored here
- Enables instant back/forward navigation
- Duration: 30s for dynamic pages, 5min for static (prefetched)
- Clear: \`router.refresh()\` or \`revalidatePath/revalidateTag\` from Server Action

**How they interact** (request flow):
\`\`\`
Client request
  → Router Cache (hit? return cached)
    → Full Route Cache (hit? return cached HTML)
      → Data Cache (hit? return cached data)
        → Request Memoization (deduplicate in-flight)
          → Origin server / API
\`\`\`

**Opting out of each layer**:
| Layer | Opt out |
|---|---|
| Request Memoization | Use \`AbortController\` or POST requests |
| Data Cache | \`cache: 'no-store'\` or \`revalidate: 0\` |
| Full Route Cache | \`dynamic = 'force-dynamic'\` or using dynamic functions |
| Router Cache | \`router.refresh()\`, Server Action with \`revalidatePath\` |

**Common mistakes**:
- Not understanding why data appears stale after a mutation — Router Cache still holds old data
- Confusing Data Cache with Full Route Cache — Data Cache is per-fetch, Full Route Cache is per-page
- Not using \`revalidateTag\` or \`revalidatePath\` after mutations
- Assuming \`cache: 'no-store'\` on one fetch opts the entire page out of caching — it only affects that specific fetch (but does make the route dynamic)

**Follow-up**: How does the caching behavior differ between Vercel deployment and self-hosted? How do you implement a custom cache handler?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Streaming and Suspense in Next.js: progressive rendering and loading UI patterns",
    content:
      "How does streaming work in the Next.js App Router? How do you use Suspense boundaries to progressively render a page? What are the trade-offs compared to blocking data fetching?",
    answer: `**Streaming**: Instead of waiting for all data before sending HTML, the server sends the page shell immediately and streams in content as it becomes ready.

**Without streaming** (blocking):
\`\`\`
User sees blank → 3s wait for all data → Full page appears
\`\`\`

**With streaming**:
\`\`\`
User sees shell + skeletons immediately → Data streams in as ready
\`\`\`

**How it works with Suspense**:
\`\`\`tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Shell renders immediately */}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats /> {/* Streams in when data is ready */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart /> {/* Streams independently */}
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders /> {/* Streams independently */}
      </Suspense>
    </div>
  );
}

// Each component fetches its own data
async function Stats() {
  const stats = await fetchStats(); // 200ms
  return <StatsGrid data={stats} />;
}

async function RevenueChart() {
  const data = await fetchRevenue(); // 2000ms
  return <Chart data={data} />;
}
\`\`\`

**Result**: Stats appear in 200ms, chart appears in 2s. User sees progress instead of waiting.

**\`loading.tsx\`** is syntactic sugar for Suspense:
\`\`\`
app/dashboard/loading.tsx  →  <Suspense fallback={<Loading />}>{page}</Suspense>
\`\`\`

**Nested Suspense**: Each boundary is independent. Inner boundaries don't block outer content:
\`\`\`tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<SidebarSkeleton />}>
    <Sidebar />   {/* Can stream independently */}
  </Suspense>
  <Suspense fallback={<ContentSkeleton />}>
    <Content />   {/* Can stream independently */}
  </Suspense>
</Suspense>
\`\`\`

**Trade-offs**:
- **Pro**: Faster Time-to-First-Byte (TTFB), better perceived performance
- **Pro**: Independent data fetching — slow queries don't block fast ones
- **Con**: More complex mental model than simple blocking render
- **Con**: Layout shifts if skeleton sizes don't match final content
- **Con**: SEO — search engine crawlers may not wait for streamed content

**Common mistakes**:
- Wrapping everything in one giant Suspense — defeats the purpose of granular streaming
- Not designing skeleton UIs that match final content dimensions — causes layout shift
- Putting Suspense around components that don't do async work — unnecessary boundaries
- Not leveraging parallel data fetching — sequential \`await\` inside one component still blocks

**Follow-up**: How does streaming interact with SEO and social media crawlers? What is the difference between streaming SSR and traditional SSR?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Parallel and intercepting routes: building modals, feeds, and complex layouts",
    content:
      "What are parallel routes and intercepting routes in Next.js? How do they work together to build production patterns like modal routes? Give a concrete example.",
    answer: `**Parallel routes** (\`@folder\`): Render multiple pages simultaneously in the same layout. Each slot is an independent route segment that can have its own loading/error states.

\`\`\`
app/
  layout.tsx        → receives {children, analytics, team} as props
  page.tsx          → renders in {children} slot
  @analytics/
    page.tsx        → renders in {analytics} slot
  @team/
    page.tsx        → renders in {team} slot
\`\`\`

\`\`\`tsx
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2">
        {analytics}
        {team}
      </div>
    </div>
  );
}
\`\`\`

**Intercepting routes** (\`(.)\`, \`(..)\`, \`(..)(..)\`, \`(...)\`): Intercept a route and show it in the current layout instead of navigating to it. Used for modals where the URL changes but the background page stays visible.

**Modal pattern** — Photo gallery:
\`\`\`
app/
  layout.tsx
  @modal/
    (..)photo/[id]/     → Intercepts /photo/[id] — shows as modal
      page.tsx
    default.tsx         → Returns null (no modal by default)
  feed/
    page.tsx            → The main feed page
  photo/[id]/
    page.tsx            → Full photo page (direct URL access)
\`\`\`

\`\`\`tsx
// app/layout.tsx
export default function Layout({ children, modal }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}

// app/@modal/(..)photo/[id]/page.tsx
export default function PhotoModal({ params }) {
  return (
    <Dialog>
      <Photo id={params.id} />
    </Dialog>
  );
}

// app/@modal/default.tsx
export default function Default() {
  return null; // No modal when not intercepting
}
\`\`\`

**How it works**:
1. User clicks a photo link in the feed → URL changes to \`/photo/123\`
2. Intercepting route catches it → shows photo as a modal over the feed
3. User refreshes the page → no interception → renders the full \`/photo/123\` page
4. User shares the URL → recipient sees the full photo page

**\`default.tsx\`**: Required for parallel routes to handle when there's no matching content for a slot during soft navigation. Without it, Next.js returns 404.

**Common mistakes**:
- Forgetting \`default.tsx\` in parallel route slots — causes 404 on soft navigation
- Not understanding the interception depth syntax: \`(.)\` = same level, \`(..)\` = one level up
- Expecting intercepting routes to work on hard navigation (page refresh) — they only work with soft navigation (client-side)
- Building complex modal logic without intercepting routes when a simple state toggle would suffice

**Follow-up**: How do you handle closing the modal and navigating back? Can parallel routes have independent loading and error states?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Image optimization with next/image: srcSet, sizes, priority, and common performance wins",
    content:
      "How does the `next/image` component optimize images? Explain the `sizes` prop, `priority`, automatic srcSet generation, and common mistakes that hurt Core Web Vitals.",
    answer: `**What next/image does automatically**:
- Generates responsive \`srcSet\` at multiple widths
- Converts to modern formats (WebP/AVIF) based on browser support
- Lazy loads images by default (loads when entering viewport)
- Reserves space to prevent Cumulative Layout Shift (CLS)
- Serves images through an optimization API (\`/_next/image\`)

**Key props**:
\`\`\`tsx
import Image from 'next/image';

// Static import — dimensions known at build time
import hero from './hero.jpg';
<Image src={hero} alt="Hero" priority />

// Remote image — must specify width/height or use fill
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// Fill mode — fills parent container
<div style={{ position: 'relative', height: 400 }}>
  <Image src={hero} alt="Hero" fill style={{ objectFit: 'cover' }} />
</div>
\`\`\`

**\`sizes\` prop** — tells the browser which image size to download:
\`\`\`tsx
// "On mobile, image is 100% viewport width. On desktop, 33%."
sizes="(max-width: 768px) 100vw, 33vw"
\`\`\`
Without \`sizes\`, the browser downloads the largest image. This is the most impactful optimization for bandwidth.

**\`priority\`**: Disables lazy loading and preloads the image. Use for:
- LCP (Largest Contentful Paint) images — hero banners, above-the-fold images
- Only 1-2 images per page should have \`priority\`

**Remote images configuration**:
\`\`\`js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
};
\`\`\`

**Common performance mistakes**:
1. **No \`sizes\` prop**: Browser downloads largest variant even on mobile — wastes bandwidth
2. **Missing \`priority\` on LCP image**: Delays largest contentful paint
3. **Using \`priority\` on too many images**: Blocks initial page load
4. **Not setting \`width\`/\`height\` or \`fill\`**: Causes layout shift (CLS)
5. **Using CSS to hide images on mobile**: Image still downloads — use responsive \`sizes\` or conditional rendering instead
6. **Not configuring \`remotePatterns\`**: Falls back to unoptimized images

**Common mistakes**:
- Setting \`width\`/\`height\` and thinking it determines display size — they set aspect ratio, use CSS for display size
- Using next/image for icons and tiny images — overhead of optimization API isn't worth it for small assets
- Not using \`placeholder="blur"\` for static imports — free perceived performance improvement

**Follow-up**: How does the image optimization API work internally? What is the difference between \`fill\` and explicitly setting \`width\`/\`height\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Route Handlers (API Routes in App Router): when to use them vs Server Actions vs Server Components",
    content:
      "What are Route Handlers in the Next.js App Router? When should you use them instead of Server Actions or direct data fetching in Server Components?",
    answer: `**Route Handlers**: Server-side API endpoints defined as \`route.ts\` files. They handle HTTP methods (GET, POST, PUT, DELETE, etc.).

\`\`\`tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const users = await db.users.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.users.create(body);
  return NextResponse.json(user, { status: 201 });
}
\`\`\`

**Dynamic route handler**:
\`\`\`tsx
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await db.users.findById(id);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}
\`\`\`

**When to use each**:

| Pattern | Use when |
|---|---|
| **Server Component** (direct fetch) | Rendering data on a page. No API needed — fetch directly in the component |
| **Server Action** | Form submissions, mutations from the UI. Handles revalidation automatically |
| **Route Handler** | External API consumers, webhooks, third-party integrations, mobile apps, CORS endpoints |

**Decision flowchart**:
1. Need data for a page? → **Server Component** (fetch directly)
2. User submits a form? → **Server Action** (progressive enhancement, automatic revalidation)
3. External client calls your API? → **Route Handler** (REST endpoint)
4. Webhook from Stripe/GitHub? → **Route Handler** (needs specific HTTP handling)
5. Need streaming response? → **Route Handler** (with \`ReadableStream\`)

**Caching behavior**:
- GET handlers are cached by default (like pages)
- Other methods (POST, PUT, DELETE) are not cached
- Opt out: \`export const dynamic = 'force-dynamic'\`

**Streaming response**:
\`\`\`tsx
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of data) {
        controller.enqueue(new TextEncoder().encode(chunk));
        await delay(100);
      }
      controller.close();
    },
  });
  return new Response(stream);
}
\`\`\`

**Common mistakes**:
- Creating API routes to fetch data that Server Components can access directly — unnecessary indirection
- Using Route Handlers for form submissions when Server Actions are simpler
- Not setting CORS headers when the API is consumed by external clients
- Forgetting that GET Route Handlers are cached — stale responses after mutations

**Follow-up**: How do you handle authentication in Route Handlers vs Server Actions? Can Route Handlers run on the Edge Runtime?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Metadata API: static and dynamic meta tags, Open Graph, and SEO best practices",
    content:
      "How does the Next.js Metadata API work? Explain static vs dynamic metadata, Open Graph tags, and how to generate metadata based on fetched data.",
    answer: `**Static metadata** — export a \`metadata\` object:
\`\`\`tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn about our company',
    images: [{ url: '/og-about.png', width: 1200, height: 630 }],
  },
};
\`\`\`

**Dynamic metadata** — export a \`generateMetadata\` function:
\`\`\`tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
\`\`\`

**Metadata merging**: Child routes extend parent metadata. Child values override parent for the same field:
\`\`\`
app/layout.tsx:       title: 'My App'
app/blog/page.tsx:    title: 'Blog'        → renders "Blog"
app/blog/layout.tsx:  title: { template: '%s | My App' }
app/blog/[slug]:      title: 'My Post'     → renders "My Post | My App"
\`\`\`

**Template pattern** — add suffix/prefix:
\`\`\`tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App', // child title replaces %s
  },
};
\`\`\`

**Dynamic OG images** with \`opengraph-image.tsx\`:
\`\`\`tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export default async function OGImage({ params }) {
  const post = await fetchPost(params.slug);
  return new ImageResponse(
    <div style={{ fontSize: 48, background: 'white', padding: 40 }}>
      {post.title}
    </div>,
    { width: 1200, height: 630 }
  );
}
\`\`\`

**Other metadata files**:
- \`favicon.ico\`, \`icon.tsx\`, \`apple-icon.tsx\`: App icons
- \`sitemap.ts\`: Dynamic sitemap generation
- \`robots.ts\`: Robots.txt generation
- \`manifest.ts\`: Web app manifest

**Common mistakes**:
- Not using the template pattern — manually repeating site name in every page title
- Missing Open Graph images — social shares show no preview
- Not deduplicating fetch calls — \`generateMetadata\` and the page component can share cached fetches
- Forgetting twitter card metadata — Twitter requires its own meta tags

**Follow-up**: How do you generate a dynamic sitemap for thousands of pages? How does metadata interact with streaming — is it available before the page content?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "generateStaticParams: static generation for dynamic routes and on-demand fallback",
    content:
      "How does `generateStaticParams` work in the App Router? How do you statically generate pages for dynamic routes? What happens when a user visits a path that wasn't pre-generated?",
    answer: `**\`generateStaticParams\`**: Returns an array of params to statically generate at build time. Equivalent to \`getStaticPaths\` in Pages Router.

\`\`\`tsx
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  return <Article post={post} />;
}
\`\`\`

**Build behavior**:
- At build time, Next.js calls \`generateStaticParams\` and generates HTML for each returned param
- These pages are served from the CDN — no server computation on request

**Fallback behavior** (paths NOT returned by \`generateStaticParams\`):

By default, non-generated paths are dynamically rendered on first request and then cached:
\`\`\`tsx
// First visit to /blog/new-post (not pre-generated):
// 1. Server renders the page dynamically
// 2. Result is cached
// 3. Subsequent visits serve the cached version
\`\`\`

**Control with \`dynamicParams\`**:
\`\`\`tsx
// Allow dynamic generation of non-pre-generated paths (default)
export const dynamicParams = true;

// Return 404 for any path not returned by generateStaticParams
export const dynamicParams = false;
\`\`\`

**Nested dynamic segments**:
\`\`\`tsx
// app/shop/[category]/[product]/page.tsx
export async function generateStaticParams() {
  const categories = await fetchCategories();

  return categories.flatMap((category) =>
    category.products.map((product) => ({
      category: category.slug,
      product: product.slug,
    }))
  );
}
\`\`\`

**Partial generation** — generate parent params, let children generate on-demand:
\`\`\`tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  // Only generate the top 10 most popular posts
  const posts = await fetchTopPosts(10);
  return posts.map((post) => ({ slug: post.slug }));
}
// Other posts will be generated on first visit
\`\`\`

**Combined with revalidation**:
\`\`\`tsx
// Revalidate every hour even for statically generated pages
export const revalidate = 3600;
\`\`\`

**Common mistakes**:
- Generating all possible paths when only popular ones need pre-generation — slow builds
- Setting \`dynamicParams = false\` without handling 404 gracefully
- Not understanding that \`generateStaticParams\` runs at build time — can't use runtime-only APIs
- Forgetting to combine with revalidation — pre-generated pages become permanently stale

**Follow-up**: How do you handle 10,000+ pages efficiently with \`generateStaticParams\`? What is the build time impact and how do you optimize it?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Next.js Link component and navigation: prefetching, scroll behavior, and programmatic navigation",
    content:
      "How does the Next.js `Link` component optimize navigation? Explain prefetching behavior, the difference between soft and hard navigation, and how to navigate programmatically.",
    answer: `**\`<Link>\`** wraps \`<a>\` with client-side navigation and automatic prefetching:
\`\`\`tsx
import Link from 'next/link';

<Link href="/dashboard">Dashboard</Link>
<Link href="/blog/hello-world">Read Post</Link>
<Link href={{ pathname: '/search', query: { q: 'next.js' } }}>Search</Link>
\`\`\`

**Prefetching behavior**:
- **Production**: Links in the viewport are automatically prefetched
- **Static routes**: Full route is prefetched (RSC payload + HTML)
- **Dynamic routes**: Prefetched up to the first \`loading.tsx\` boundary
- **Development**: No prefetching (only on hover)

**Control prefetching**:
\`\`\`tsx
<Link href="/heavy-page" prefetch={false}>No prefetch</Link>
<Link href="/important" prefetch={true}>Force full prefetch</Link>
\`\`\`

**Soft vs Hard navigation**:
- **Soft navigation** (default): Client-side, only changed segments re-render, state preserved, scroll position maintained for unchanged layouts
- **Hard navigation** (page refresh): Full page reload, all state lost

**Scroll behavior**:
\`\`\`tsx
// Default: scrolls to top on navigation
<Link href="/about">About</Link>

// Preserve scroll position
<Link href="/about" scroll={false}>About</Link>
\`\`\`

**Programmatic navigation**:
\`\`\`tsx
'use client';
import { useRouter } from 'next/navigation';

function SearchForm() {
  const router = useRouter();

  function handleSubmit(query: string) {
    router.push(\`/search?q=\${query}\`);    // Navigate (adds history entry)
    router.replace(\`/search?q=\${query}\`);  // Navigate (replaces history entry)
    router.refresh();                        // Re-fetch current route server data
    router.back();                           // Go back
    router.forward();                        // Go forward
    router.prefetch('/settings');             // Manually prefetch a route
  }
}
\`\`\`

**Active link pattern**:
\`\`\`tsx
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function NavLink({ href, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
}
\`\`\`

**\`router.refresh()\`** — re-fetches server data without losing client state:
\`\`\`tsx
// After a mutation, refresh the current page's server data
await updatePost(postId, data);
router.refresh(); // Re-renders Server Components with fresh data
\`\`\`

**Common mistakes**:
- Using \`<a>\` instead of \`<Link>\` — loses client-side navigation and prefetching
- Importing \`useRouter\` from \`next/router\` (Pages Router) instead of \`next/navigation\` (App Router)
- Using \`router.push\` for simple links — \`<Link>\` is preferred for prefetching
- Not understanding that \`router.refresh()\` only refreshes server data, not client state

**Follow-up**: How does prefetching interact with the Router Cache? What is the difference between \`redirect()\` in a Server Component and \`router.push()\` in a Client Component?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Environment variables in Next.js: server-only, client-exposed, and runtime configuration",
    content:
      "How do environment variables work in Next.js? What is the difference between server-only and client-exposed variables? How do you handle different environments (dev, staging, production)?",
    answer: `**Two types of environment variables**:

1. **Server-only** (default): Available only in Server Components, Route Handlers, Middleware, and Server Actions. Never sent to the browser.
\`\`\`env
# .env.local
DATABASE_URL=postgresql://localhost:5432/mydb
API_SECRET=sk_live_abc123
\`\`\`

2. **Client-exposed** (\`NEXT_PUBLIC_\` prefix): Inlined into the JavaScript bundle at build time. Visible to anyone.
\`\`\`env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
\`\`\`

**Access**:
\`\`\`tsx
// Server Component — can access all env vars
const dbUrl = process.env.DATABASE_URL;        // works
const apiUrl = process.env.NEXT_PUBLIC_API_URL; // works

// Client Component — only NEXT_PUBLIC_
const apiUrl = process.env.NEXT_PUBLIC_API_URL; // works
const dbUrl = process.env.DATABASE_URL;         // undefined!
\`\`\`

**File loading order** (later overrides earlier):
1. \`.env\` — all environments
2. \`.env.local\` — local overrides (gitignored)
3. \`.env.development\` / \`.env.production\` / \`.env.test\` — environment-specific
4. \`.env.development.local\` / \`.env.production.local\` — local env-specific (gitignored)

**Runtime vs build-time**:
- \`NEXT_PUBLIC_\` vars are inlined at **build time** — changing them requires a rebuild
- Server-only vars are read at **runtime** — can change between deployments without rebuild

**For truly runtime client configuration**:
\`\`\`tsx
// app/layout.tsx — pass to client via script tag
<script
  dangerouslySetInnerHTML={{
    __html: \`window.__CONFIG__ = \${JSON.stringify({
      apiUrl: process.env.API_URL,
    })}\`,
  }}
/>
\`\`\`

**Type safety with \`env.d.ts\`**:
\`\`\`ts
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXT_PUBLIC_API_URL: string;
    API_SECRET: string;
  }
}
\`\`\`

**Validation at startup** (with Zod):
\`\`\`ts
import { z } from 'zod';
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_SECRET: z.string().min(10),
});
envSchema.parse(process.env); // throws if missing/invalid
\`\`\`

**Common mistakes**:
- Using \`NEXT_PUBLIC_\` for secrets — they're embedded in the JS bundle
- Not understanding that \`NEXT_PUBLIC_\` vars are build-time — deploying to staging with production env vars
- Accessing server env vars in a Client Component — they're \`undefined\`
- Not adding \`.env.local\` to \`.gitignore\` — leaking credentials

**Follow-up**: How do you handle environment variables in Docker/CI pipelines for Next.js? What is \`@t3-oss/env-nextjs\` and how does it improve env safety?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "next.config.js: rewrites, redirects, headers, and production configuration patterns",
    content:
      "What are the key configuration options in `next.config.js`? Explain rewrites, redirects, and custom headers with production use cases.",
    answer: `**Redirects**: Permanently or temporarily redirect one path to another. Returns an HTTP redirect status code.

\`\`\`js
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true, // 308 status
      },
      {
        source: '/docs',
        destination: 'https://docs.example.com',
        permanent: false, // 307 status
      },
    ];
  },
};
\`\`\`

**Rewrites**: Map one path to another without changing the URL. The user sees \`/api/proxy\` but the request goes to the external API.

\`\`\`js
async rewrites() {
  return [
    {
      source: '/api/proxy/:path*',
      destination: 'https://api.backend.com/:path*',
    },
    // Useful for: API proxying, legacy URL support, A/B testing
  ];
},
\`\`\`

**Custom Headers**: Set HTTP headers on responses for specific paths.
\`\`\`js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://app.example.com' },
      ],
    },
  ];
},
\`\`\`

**Other important config options**:
\`\`\`js
module.exports = {
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Output configuration
  output: 'standalone', // For Docker deployments

  // Webpack customization
  webpack: (config, { isServer }) => {
    // Custom webpack config
    return config;
  },

  // Experimental features
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },

  // Path prefix
  basePath: '/app', // All routes prefixed with /app

  // Internationalization
  i18n: {
    locales: ['en', 'vi', 'ja'],
    defaultLocale: 'en',
  },
};
\`\`\`

**Redirects vs Rewrites vs Middleware**:
| Feature | Redirects | Rewrites | Middleware |
|---|---|---|---|
| URL changes | Yes | No | Depends |
| Runs at | Config level | Config level | Edge Runtime |
| Conditional logic | Limited (has/headers) | Limited | Full JS logic |
| Performance | Fastest | Fast | Slight overhead |

**Common mistakes**:
- Using rewrites as an API proxy without handling CORS — browser still enforces CORS for client-side fetch
- Not setting security headers — missing basic protections
- Using middleware for simple redirects that \`next.config.js\` can handle — unnecessary overhead
- Forgetting that \`basePath\` affects all routes including API routes

**Follow-up**: How do you configure \`output: 'standalone'\` for Docker? What is the difference between \`trailingSlash\` and path normalization?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Server Components vs Client Components: the 'use client' boundary and composition patterns",
    content:
      "Beyond the basic Server vs Client Component distinction, explain the 'use client' boundary in depth. How do you compose Server and Client Components together? What can and can't cross the boundary?",
    answer: `**The boundary rule**: \`'use client'\` marks the boundary. Everything imported into a Client Component becomes part of the client bundle.

\`\`\`
Server Component tree
  └── 'use client' boundary
        └── Client Component (and all its imports)
\`\`\`

**What crosses the boundary**:
- **Props**: Must be serializable (strings, numbers, plain objects, arrays, Date, null, undefined, Map, Set, FormData, etc.)
- **Cannot pass**: Functions (except Server Actions), class instances, React elements as non-JSX props, Symbols

**Composition pattern** — Server Components as children of Client Components:
\`\`\`tsx
// ClientWrapper.tsx
'use client';
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return isOpen ? <div>{children}</div> : null;
}

// page.tsx (Server Component)
import { ClientWrapper } from './ClientWrapper';
import { ServerData } from './ServerData'; // Server Component

export default function Page() {
  return (
    <ClientWrapper>
      <ServerData /> {/* Server Component rendered on the server, passed as children */}
    </ClientWrapper>
  );
}
\`\`\`

This works because \`children\` is rendered on the server as RSC payload, then passed to the Client Component as a serialized React tree — not as a function or component reference.

**Provider pattern** — Context providers must be Client Components:
\`\`\`tsx
// ThemeProvider.tsx
'use client';
import { createContext, useContext, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// app/layout.tsx (Server Component)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider> {/* children stay server-rendered */}
      </body>
    </html>
  );
}
\`\`\`

**Module-level \`'use client'\` implications**:
\`\`\`tsx
// This entire module and everything it imports becomes client-side
'use client';
import { format } from 'date-fns'; // Now in client bundle
import { validate } from './utils'; // Now in client bundle
\`\`\`

**Optimizing the boundary**:
\`\`\`tsx
// BAD: Making the whole page a Client Component for one button
'use client';
export default function Page() {
  return (
    <div>
      <HeavyServerContent /> {/* Could have been server-rendered */}
      <button onClick={() => ...}>Click</button>
    </div>
  );
}

// GOOD: Extract only the interactive part
// InteractiveButton.tsx
'use client';
export function InteractiveButton() {
  return <button onClick={() => ...}>Click</button>;
}

// page.tsx (Server Component)
export default function Page() {
  return (
    <div>
      <HeavyServerContent /> {/* Server-rendered, zero client JS */}
      <InteractiveButton /> {/* Only this ships to client */}
    </div>
  );
}
\`\`\`

**Common mistakes**:
- Adding \`'use client'\` to the top-level layout — makes everything client-side
- Trying to pass functions as props from Server to Client (except Server Actions)
- Not realizing that importing a Server Component into a Client Component makes it a Client Component
- Wrapping everything in \`'use client'\` because it's "easier" — negates the benefits of RSC

**Follow-up**: What is the RSC payload and how does it differ from HTML? How do third-party libraries work with Server Components if they use \`useState\`/\`useEffect\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Error handling in Next.js: error.tsx, global error, not-found, and production error reporting",
    content:
      "How do you handle errors in a production Next.js application? Explain the error.tsx convention, global error handling, not-found pages, and integration with error monitoring.",
    answer: `**Error hierarchy** in App Router:

1. **\`error.tsx\`** (per-segment): Catches errors in the page and child segments
2. **\`global-error.tsx\`** (root): Catches errors in the root layout
3. **\`not-found.tsx\`** (per-segment or root): Handles 404s

**\`error.tsx\`** — segment-level error boundary:
\`\`\`tsx
// app/dashboard/error.tsx
'use client'; // Required!

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to error monitoring (Sentry, DataDog, etc.)
    reportError(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong in the dashboard</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
\`\`\`

**\`global-error.tsx\`** — catches root layout errors:
\`\`\`tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
// Note: must render <html> and <body> since it replaces the root layout
\`\`\`

**\`not-found.tsx\`** — 404 handling:
\`\`\`tsx
// app/not-found.tsx (root level)
export default function NotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
      <Link href="/">Return Home</Link>
    </div>
  );
}

// Trigger programmatically in a Server Component:
import { notFound } from 'next/navigation';

async function PostPage({ params }) {
  const post = await fetchPost(params.slug);
  if (!post) notFound(); // Renders nearest not-found.tsx
  return <Article post={post} />;
}
\`\`\`

**Error boundary scoping** — granular recovery:
\`\`\`
app/
  layout.tsx
  error.tsx              → catches errors from page.tsx
  dashboard/
    layout.tsx
    error.tsx            → catches errors from dashboard pages
    analytics/
      error.tsx          → catches errors only from analytics
      page.tsx
    settings/
      page.tsx           → errors bubble up to dashboard/error.tsx
\`\`\`

**Sentry integration pattern**:
\`\`\`tsx
// instrumentation.ts (Next.js 15+)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// app/global-error.tsx
'use client';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  // ...
}
\`\`\`

**\`error.digest\`**: A hash of the error generated on the server. In production, actual error messages are stripped for security — only the digest is sent to the client. Use it to correlate client errors with server logs.

**Common mistakes**:
- Forgetting that \`error.tsx\` must be \`'use client'\` — Error Boundaries are client-side
- Not handling \`global-error.tsx\` — root layout errors crash the entire app
- Showing detailed error messages in production — use \`error.digest\` for correlation instead
- Not testing error states — happy-path-only testing misses error boundary issues

**Follow-up**: How does \`error.digest\` help in production debugging? What is the \`instrumentation.ts\` file and how does it help with error monitoring?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Authentication patterns in Next.js: middleware, Server Components, and session management",
    content:
      "What are the common authentication patterns in a Next.js App Router application? How do you protect routes, handle sessions, and manage auth state across Server and Client Components?",
    answer: `**Three layers of auth protection**:

1. **Middleware** — redirect unauthenticated users before rendering:
\`\`\`tsx
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
\`\`\`

2. **Server Component** — verify session and fetch user data:
\`\`\`tsx
// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const sessionCookie = (await cookies()).get('session')?.value;
  const user = await verifySession(sessionCookie);

  if (!user) redirect('/login');

  return <Dashboard user={user} />;
}
\`\`\`

3. **Client Component** — manage auth state for UI:
\`\`\`tsx
'use client';
import { createContext, useContext } from 'react';

const AuthContext = createContext<User | null>(null);

export function AuthProvider({ user, children }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
\`\`\`

**Session management approaches**:

| Approach | Storage | Pros | Cons |
|---|---|---|---|
| HTTP-only cookie | Server | Secure, automatic | Cookie size limits |
| JWT in cookie | Server | Stateless, scalable | Can't invalidate easily |
| Session ID + DB | Server + DB | Revocable, secure | DB lookup per request |
| NextAuth.js / Auth.js | Managed | Full solution | Learning curve |

**Auth.js (NextAuth) integration**:
\`\`\`tsx
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
});

export const { GET, POST } = handlers;

// In Server Component:
const session = await auth();
if (!session) redirect('/login');
\`\`\`

**Protection pattern — reusable auth check**:
\`\`\`tsx
// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = (await cookies()).get('session')?.value;
  if (!session) redirect('/login');

  const user = await verifySession(session);
  if (!user) redirect('/login');

  return user;
}

// Usage in any Server Component:
export default async function SettingsPage() {
  const user = await requireAuth();
  return <Settings user={user} />;
}
\`\`\`

**Common mistakes**:
- Only checking auth in middleware — middleware can be bypassed by direct API calls
- Storing sensitive data in JWT without encryption — JWTs are base64 encoded, not encrypted
- Not validating sessions on every request — cached pages may show stale auth state
- Using \`localStorage\` for tokens in SSR — not available on the server

**Follow-up**: How do you handle role-based access control (RBAC) across Server Components and middleware? What is the difference between \`auth()\` and checking cookies manually?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "next/font: self-hosted fonts, variable fonts, and eliminating layout shift",
    content:
      "How does `next/font` work? Why does it self-host fonts? Explain variable fonts, the `display` property, and how next/font eliminates CLS from font loading.",
    answer: `**What \`next/font\` does**:
- Downloads fonts at build time and self-hosts them as static assets
- Generates optimal \`@font-face\` declarations
- Uses CSS \`size-adjust\` to eliminate Cumulative Layout Shift (CLS)
- Supports Google Fonts and local fonts
- No external network requests at runtime

**Google Fonts**:
\`\`\`tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // CSS variable
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={\`\${inter.variable} \${robotoMono.variable}\`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
\`\`\`

**Local fonts**:
\`\`\`tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: './fonts/MyFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/MyFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-custom',
});
\`\`\`

**Variable fonts**: A single font file that contains all weights/styles. Smaller download, smoother transitions:
\`\`\`tsx
const inter = Inter({
  subsets: ['latin'],
  // Variable fonts automatically support all weights
  // No need to specify individual weights
});

// In CSS:
// font-weight: 100..900; — any value works
\`\`\`

**\`display\` property**:
- \`'swap'\`: Show fallback font immediately, swap when custom font loads (recommended for body text)
- \`'block'\`: Hide text briefly, then show custom font
- \`'optional'\`: Use custom font only if already cached (best for slow connections)
- \`'fallback'\`: Short block period, then fallback (compromise)

**How CLS is eliminated**:
1. \`next/font\` generates a \`size-adjust\` CSS property for the fallback font
2. This makes the fallback font take up the same space as the custom font
3. When the custom font loads, no layout shift occurs because the dimensions match

**Using with Tailwind CSS**:
\`\`\`js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
    },
  },
};
\`\`\`

**Common mistakes**:
- Loading too many font subsets — only include subsets you actually need
- Not using \`variable\` mode — missing the CSS variable integration with Tailwind
- Using \`display: 'block'\` — causes invisible text flash (FOIT)
- Loading too many font weights — each weight is an additional download

**Follow-up**: How does \`next/font\` work with the Edge Runtime? What is the performance difference between variable fonts and static fonts?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
  {
    title:
      "Deploying Next.js: standalone output, Docker, and self-hosting vs Vercel",
    content:
      "How do you deploy a Next.js application? Explain the `output: 'standalone'` option, Docker deployment, and the trade-offs between Vercel and self-hosting.",
    answer: `**Deployment modes**:

1. **Vercel** (managed): Zero-config deployment, all Next.js features work out of the box
2. **Self-hosted Node.js**: Full control, requires manual infrastructure
3. **Static export**: \`output: 'export'\` — generates static HTML, no server needed

**\`output: 'standalone'\`** — optimized for Docker:
\`\`\`js
// next.config.js
module.exports = {
  output: 'standalone',
};
\`\`\`

This creates a \`standalone\` folder with only the files needed to run in production — no \`node_modules\`. Reduces Docker image size dramatically.

**Docker deployment**:
\`\`\`dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

**Vercel vs Self-hosting trade-offs**:

| Feature | Vercel | Self-hosted |
|---|---|---|
| Setup | Zero-config | Manual (Docker, PM2, etc.) |
| Edge Runtime | Native | Not available |
| ISR | Automatic | Requires custom cache handler |
| Image Optimization | Built-in CDN | Must configure \`sharp\` |
| Middleware | Edge deployment | Runs in Node.js |
| Cost | Per-request pricing | Fixed server cost |
| Caching | Multi-layer CDN | Must configure yourself |
| Control | Limited | Full control |

**Self-hosting considerations**:
1. **ISR**: Need a shared cache (Redis, filesystem) for multi-instance deployments
2. **Image optimization**: Install \`sharp\` as a dependency
3. **Static files**: Serve \`.next/static\` and \`public\` from a CDN
4. **Health checks**: Add a \`/api/health\` endpoint
5. **Graceful shutdown**: Handle SIGTERM for container orchestration

**Custom cache handler** (for self-hosted ISR):
\`\`\`js
// next.config.js
module.exports = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // Disable in-memory caching
};
\`\`\`

**Static export** (simplest deployment):
\`\`\`js
// next.config.js
module.exports = {
  output: 'export',
};
// Deploy to any static hosting (S3, Cloudflare Pages, Nginx)
// No SSR, no API routes, no ISR, no middleware
\`\`\`

**Common mistakes**:
- Deploying without \`standalone\` output — bloated Docker image with full \`node_modules\`
- Not copying \`.next/static\` and \`public\` in Docker — missing static assets
- Assuming all Next.js features work the same on self-hosted — Edge Runtime, ISR, and image optimization need extra setup
- Not configuring a shared cache for ISR in multi-instance deployments

**Follow-up**: How do you handle zero-downtime deployments with Next.js? What is the difference between \`output: 'standalone'\` and \`output: 'export'\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nextjs",
  },
];

// ============================================
// EXPORT
// ============================================

export const middleNextjsQuestions: QuestionSeed[] = nextjsMiddleQuestions;

// Summary
console.log("=".repeat(50));
console.log("MIDDLE-LEVEL NEXT.JS INTERVIEW QUESTIONS");
console.log("=".repeat(50));
console.log(`Next.js: ${nextjsMiddleQuestions.length}`);
console.log(`Total: ${middleNextjsQuestions.length}`);
console.log("=".repeat(50));
