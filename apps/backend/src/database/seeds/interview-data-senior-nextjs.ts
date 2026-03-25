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

export const seniorNextjsQuestions: QuestionSeed[] = [
  {
    title:
      'Your Next.js application has Core Web Vitals failing in production — LCP is 4.2s and CLS is 0.18 on mobile. How do you diagnose and fix these issues systematically?',
    answer: buildAnswer({
      short_answer:
        'Use Lighthouse CI + Web Vitals in production (from real users) to identify LCP element and CLS sources. LCP fixes: preload the LCP image, use `priority` on above-fold `<Image>`, optimize server response time. CLS fixes: reserve space for dynamic content, specify image dimensions, avoid layout shifts from late-loading fonts.',
      detailed_answer:
        'LCP at 4.2s means the largest content element (usually a hero image or H1) takes too long. CLS at 0.18 means significant unexpected layout shifts.\n\n**Step 1: Identify the LCP element:**\n```javascript\n// Add to _app.tsx or layout.tsx to measure real LCP\nimport { onLCP, onCLS, onINP } from \'web-vitals\';\n\nfunction sendToAnalytics({ name, value, id }) {\n  // Send to your analytics (Vercel Analytics, GA4)\n  gtag(\'event\', name, { value: Math.round(value), metric_id: id });\n}\n\nonLCP(sendToAnalytics);\nonCLS(sendToAnalytics);\nonINP(sendToAnalytics);\n```\n\nIn Chrome DevTools → Performance tab, identify which element is the LCP element.\n\n**LCP optimization — most common causes:**\n\n1. Hero image not preloaded:\n```tsx\n// ❌ BAD: Next.js Image without priority\n<Image src="/hero.webp" width={1200} height={600} alt="Hero" />\n\n// ✅ GOOD: priority flag generates <link rel="preload">\n<Image src="/hero.webp" width={1200} height={600} alt="Hero" priority />\n```\n\n2. LCP text is web font that hasn\'t loaded:\n```html\n<!-- In layout.tsx head -->\n<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />\n<!-- Font loaded with display=swap to prevent FOIT -->\n```\nBetter: use `next/font` which automatically optimizes font loading:\n```typescript\nconst inter = Inter({ subsets: [\'latin\'], display: \'swap\' });\n```\n\n3. Server response time (TTFB) too slow:\nIf HTML arrives late, LCP starts late. Check:\n- Server-side rendering time per route with Vercel Analytics\n- Database query time in server components\n- Enable incremental static regeneration for semi-static pages\n\n**CLS optimization — most common causes:**\n\n1. Images without dimensions:\n```tsx\n// ❌ BAD: browser reserves no space, shifts when image loads\n<img src="/product.jpg" />\n\n// ✅ GOOD: explicit dimensions or fill with container\n<Image src="/product.jpg" width={400} height={300} alt="Product" />\n```\n\n2. Late-injected content (ads, banners, cookie notices):\n```css\n/* Reserve space for cookie banner */\n.cookie-banner-placeholder {\n  min-height: 80px; /* Match banner height */\n}\n```\n\n3. Dynamic content above existing content:\n```tsx\n// ❌ BAD: alert banner prepended to page after load\n{showAlert && <AlertBanner />} \n<MainContent />\n\n// ✅ GOOD: always render placeholder space\n<div style={{ minHeight: showAlert ? \'auto\' : 48 }}>\n  {showAlert && <AlertBanner />}\n</div>\n```\n\nVerification: run Lighthouse CI in GitHub Actions to prevent regression:\n```yaml\n- name: Lighthouse CI\n  uses: treosh/lighthouse-ci-action@v10\n  with:\n    budgetPath: .lighthouserc.json\n  # Fails PR if LCP > 2.5s or CLS > 0.1\n```',
      trade_offs: [
        {
          approach: 'Static generation (SSG) for maximum LCP performance',
          pros: ['Fastest possible TTFB (CDN-served HTML)', 'No server computation on request', 'LCP can be sub-1s'],
          cons: [
            'Stale data until revalidation',
            'Long build times for many pages',
            'Not suitable for personalized content',
          ],
        },
        {
          approach: 'Server components with streaming (Next.js 13+)',
          pros: ['Fresh data on every request', 'Streams HTML progressively', 'Selective hydration reduces JS bundle'],
          cons: [
            'More complex caching strategy',
            'TTFB is higher than static',
            'Waterfall risk if nested async components are not parallel',
          ],
        },
        {
          approach: 'Client-side rendering for dynamic content',
          pros: ['Maximum personalization', 'No server needed for content', 'CDN-cacheable shell HTML'],
          cons: [
            'Worst LCP — content only visible after JS loads and API responds',
            'Blank screen during loading (CLS risk)',
            'Poor SEO for content-heavy pages',
          ],
        },
      ],
      real_world_example:
        'An e-commerce site had LCP of 4.8s on mobile. Investigation: hero image was 1.2MB JPEG served without preloading, and the LCP was actually the product name H1 which used a Google Font with `display=block` (FOIT). Fixes: (1) converted hero to WebP (1.2MB → 180KB), added `priority` to `<Image>`, (2) switched to `next/font` with `display=swap`, (3) enabled ISR with 60s revalidation for product pages. LCP: 4.8s → 1.4s. Conversion rate increased 12%.',
      red_flags: [
        'Using `<img>` tags instead of Next.js `<Image>` — loses optimization, lazy loading, and dimension enforcement',
        'Importing large libraries in components that are above the fold — delays TTI and indirectly affects LCP',
        'Not testing on real mobile devices — DevTools throttling is not accurate',
        'Ignoring TTFB — even with perfect assets, slow server response pushes LCP past 2.5s',
        'CSS transitions on layout properties (width, height, top) — causes CLS',
      ],
      follow_up_questions: [
        'What is Interaction to Next Paint (INP) and how does it differ from FID?',
        'How do you implement resource hints (preload, prefetch, preconnect) in Next.js App Router?',
        'What is the difference between loading strategies (eager, lazy, priority) for Next.js Image?',
        'How do you measure and monitor Core Web Vitals from real users in production?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your Next.js App Router application has unpredictable caching behavior — some pages show stale data, others always refetch. How do you design a coherent data fetching and caching strategy?',
    answer: buildAnswer({
      short_answer:
        'Understand the three cache layers in Next.js 14+: Request Memoization (per-request), Data Cache (persistent, per fetch), and Full Route Cache (HTML). Use explicit `cache: "force-cache"`, `revalidate`, and `tags` for deterministic behavior. Use `revalidatePath`/`revalidateTag` for on-demand invalidation from Server Actions.',
      detailed_answer:
        'Next.js App Router has four caching mechanisms that interact in non-obvious ways:\n\n1. **Request Memoization** (automatic, cannot disable):\nSame `fetch()` URL called multiple times in one render → deduplicated into one request. Only lasts for one server render cycle.\n\n2. **Data Cache** (persistent, opt-out with `cache: "no-store"`):\n```typescript\n// Cached indefinitely (default in Next.js 14+)\nconst data = await fetch(\'https://api.example.com/products\');\n\n// Cached for 60 seconds then revalidated\nconst data = await fetch(\'https://api.example.com/products\', {\n  next: { revalidate: 60 },\n});\n\n// Never cached\nconst data = await fetch(\'https://api.example.com/user-profile\', {\n  cache: \'no-store\',\n});\n\n// Tagged for on-demand invalidation\nconst data = await fetch(\'https://api.example.com/products\', {\n  next: { tags: [\'products\', \'category-electronics\'] },\n});\n```\n\n3. **Full Route Cache** (HTML + RSC payload cached on disk):\nOnly applies to statically rendered routes. Any `dynamic = "force-dynamic"` or `cookies()`/`headers()` call opts the route into dynamic rendering — no HTML cache.\n\n4. **Router Cache** (client-side, in-memory):\nPrefetched route payloads cached in browser for 30s (dynamic) or 5min (static). `router.refresh()` invalidates it.\n\n**Recommended caching strategy by data type:**\n\n```typescript\n// Product catalog — changes rarely, high traffic\nasync function getProducts() {\n  return fetch(\'https://api.example.com/products\', {\n    next: { revalidate: 3600, tags: [\'products\'] }, // 1h ISR + tag\n  }).then(r => r.json());\n}\n\n// User-specific data — never cache\nasync function getUserOrders(userId: string) {\n  return fetch(`https://api.example.com/users/${userId}/orders`, {\n    cache: \'no-store\', // Never cache, always fresh\n  }).then(r => r.json());\n}\n\n// Config/settings — long cache, invalidate on admin update\nasync function getSiteConfig() {\n  return fetch(\'https://api.example.com/config\', {\n    next: { tags: [\'config\'] }, // Indefinite, invalidate manually\n  }).then(r => r.json());\n}\n```\n\n**On-demand invalidation from Server Actions:**\n```typescript\n\'use server\';\nimport { revalidateTag, revalidatePath } from \'next/cache\';\n\nexport async function updateProduct(productId: string, data: ProductDto) {\n  await productService.update(productId, data);\n  revalidateTag(\'products\');            // Invalidate all products fetches\n  revalidateTag(`product-${productId}`); // Invalidate specific product\n  revalidatePath(\'/products\');           // Invalidate page HTML\n}\n```\n\n**Debugging cache behavior:**\n```bash\n# Development: see cache status in terminal\nNEXT_CACHE=1 pnpm dev\n# Shows HIT/MISS/SKIP for each fetch\n```\n\n**TypeORM / Prisma (not fetch-based): these bypass Data Cache entirely!**\nFor ORM calls, use React `cache()` for request memoization:\n```typescript\nimport { cache } from \'react\';\nexport const getProductById = cache(async (id: string) => {\n  return db.products.findUnique({ where: { id } });\n  // Deduplicated within same render, but NOT persistently cached\n});\n```',
      trade_offs: [
        {
          approach: 'ISR (revalidate interval)',
          pros: ['Balance between freshness and performance', 'No CDN invalidation needed', 'Works for most content types'],
          cons: [
            'Stale data during revalidation window',
            'First request after stale serves old data (background revalidation)',
            'Interval must be chosen carefully — too long = stale, too short = no benefit',
          ],
        },
        {
          approach: 'On-demand revalidation with tags',
          pros: [
            'Instant freshness after mutations',
            'Precise control',
            'Works with CMS webhooks',
          ],
          cons: [
            'Requires webhook/Server Action integration',
            'Missed invalidation = stale data indefinitely',
            'Tag management complexity as app grows',
          ],
        },
        {
          approach: 'No caching (cache: "no-store" everywhere)',
          pros: ['Always fresh', 'Simple mental model', 'No invalidation logic needed'],
          cons: [
            'Full database load on every request',
            'Cannot use CDN for content',
            'Defeats purpose of Next.js caching advantages',
          ],
        },
      ],
      real_world_example:
        'A news site migrated from Pages Router to App Router and saw product pages showing 2-day-old articles. Root cause: they used `fetch` without `cache: "no-store"`, so Next.js cached API responses indefinitely by default (Next.js 14 changed default to `no-store` but their Next.js 13 project had `force-cache` as default). Fix: explicit cache configuration per fetch call based on content type (articles: `revalidate: 300`, breaking news: `no-store`, static config: indefinite with tags). Cache confusion eliminated.',
      red_flags: [
        'Mixing fetch-based caching and ORM queries — ORM calls don\'t participate in Data Cache',
        'Using `dynamic = "force-dynamic"` everywhere — opts out of all HTML caching, defeats Next.js performance',
        'Not tagging fetches — cannot do precise on-demand invalidation',
        'Relying on Router Cache for data freshness — it\'s client-only and has fixed TTL',
        'Not testing cache behavior in production-like environment — development mode disables most caching',
      ],
      follow_up_questions: [
        'What is the difference between `revalidatePath` and `revalidateTag`?',
        'How do you implement on-demand ISR with a CMS webhook in Next.js App Router?',
        'What happens to cache when you deploy a new version of Next.js?',
        'How do you cache Server Component results that depend on user authentication?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you architect a Next.js application for a B2B SaaS with tenant-specific subdomains, per-tenant feature flags, and white-label branding?',
    answer: buildAnswer({
      short_answer:
        'Use Next.js middleware to extract tenant from subdomain/custom domain, resolve tenant config (branding, features) from edge-cached KV store, inject into request context. Use CSS variables for white-label theming and feature flags from a centralized store (LaunchDarkly or edge config) evaluated per-tenant in middleware.',
      detailed_answer:
        'Multi-tenant Next.js requires routing, theming, and feature management at the edge.\n\n**Step 1: Middleware for tenant resolution:**\n```typescript\n// middleware.ts\nimport { NextRequest, NextResponse } from \'next/server\';\n\nexport async function middleware(request: NextRequest) {\n  const hostname = request.headers.get(\'host\') || \'\';\n  \n  // Extract tenant from subdomain\n  const subdomain = hostname.split(\'.\')[0];\n  const isCustomDomain = !hostname.includes(\'myapp.com\');\n  \n  // Resolve tenant from edge KV (Vercel Edge Config or Cloudflare KV)\n  const tenant = isCustomDomain \n    ? await resolveTenantFromCustomDomain(hostname)\n    : await resolveTenantFromSlug(subdomain);\n  \n  if (!tenant) {\n    return NextResponse.redirect(new URL(\'/404\', request.url));\n  }\n  \n  // Inject tenant into headers for Server Components\n  const requestHeaders = new Headers(request.headers);\n  requestHeaders.set(\'x-tenant-id\', tenant.id);\n  requestHeaders.set(\'x-tenant-slug\', tenant.slug);\n  \n  return NextResponse.next({ request: { headers: requestHeaders } });\n}\n\nexport const config = {\n  matcher: [\'/((?!api|_next/static|_next/image|favicon.ico).*)\'],\n};\n```\n\n**Step 2: Tenant context in Server Components:**\n```typescript\n// lib/tenant.ts\nimport { headers } from \'next/headers\';\nimport { cache } from \'react\';\n\nexport const getTenant = cache(async () => {\n  const headersList = await headers();\n  const tenantId = headersList.get(\'x-tenant-id\');\n  \n  // Fetch full tenant config (cached by request memoization)\n  return fetchTenantConfig(tenantId);\n});\n\n// In any Server Component:\nexport default async function ProductsPage() {\n  const tenant = await getTenant();\n  return <ProductList tenantId={tenant.id} features={tenant.features} />;\n}\n```\n\n**Step 3: White-label theming with CSS variables:**\n```typescript\n// layout.tsx\nexport default async function RootLayout({ children }) {\n  const tenant = await getTenant();\n  \n  const themeVars = {\n    \'--primary-color\': tenant.branding.primaryColor,\n    \'--font-family\': tenant.branding.fontFamily,\n    \'--logo-url\': `url(${tenant.branding.logoUrl})`,\n  } as React.CSSProperties;\n  \n  return (\n    <html>\n      <body style={themeVars}>\n        {children}\n      </body>\n    </html>\n  );\n}\n```\n\n**Step 4: Feature flags per tenant:**\n```typescript\n// Evaluate flags at edge in middleware OR in Server Components\nasync function getFeatureFlags(tenantId: string): Promise<FeatureFlags> {\n  // LaunchDarkly Edge SDK or Vercel Edge Config\n  return edgeConfig.get(`tenant:${tenantId}:features`);\n}\n\n// Usage in Server Component\nconst flags = await getFeatureFlags(tenant.id);\nif (flags.advancedReporting) {\n  return <AdvancedReports />;\n}\n```\n\n**Custom domain support:**\n```typescript\n// DNS: customer.com CNAME → app.myapp.com\n// Middleware checks custom domain map in KV:\nasync function resolveTenantFromCustomDomain(hostname: string) {\n  return edgeConfig.get(`custom_domain:${hostname}`);\n  // Returns: { tenantId: \'xxx\', slug: \'acme\' }\n}\n```\n\nVercel supports custom domains per deployment via API, allowing each tenant to verify and add their domain through a UI.',
      trade_offs: [
        {
          approach: 'Subdomain-per-tenant (tenant.app.com)',
          pros: ['Simple routing in middleware', 'No DNS delegation needed', 'Wildcard SSL covers all subdomains'],
          cons: [
            'Cookie sharing issues (cookies scoped to app.com, not subdomain)',
            'Some enterprise proxies block subdomains',
            'Less professional than custom domain',
          ],
        },
        {
          approach: 'Custom domain per tenant (customer.com)',
          pros: ['Professional appearance', 'Tenant controls their domain', 'Better for white-label products'],
          cons: [
            'SSL certificate provisioning per domain (Let\'s Encrypt or ACM)',
            'DNS verification UX is complex',
            'DNS propagation delays',
          ],
        },
        {
          approach: 'Path-based multi-tenancy (/tenant-slug/...)',
          pros: ['Simpler to implement', 'Single domain for all tenants', 'No DNS configuration'],
          cons: [
            'Exposes tenant slug in URL',
            'Cannot do white-label (URL shows your domain)',
            'Breaks absolute URL assumptions in code',
          ],
        },
      ],
      real_world_example:
        'A legal tech SaaS had 200 law firm tenants, each expecting their brand colors, logo, and custom domain (client.lawfirm.com). Implementation: Vercel Edge Config stored domain-to-tenantId mappings (reads in ~2ms at edge), tenant branding stored in PostgreSQL but cached in Redis for 10 minutes. Middleware added tenant headers, layout.tsx applied CSS variables. New tenant onboarding: add Edge Config entry + provision ACM certificate via API. Time to onboard new tenant: 5 minutes (automated).',
      red_flags: [
        'Fetching tenant config from database in middleware — middleware runs on edge, no direct DB access',
        'Storing tenant state in cookies scoped to wrong domain level',
        'Not caching tenant config at edge — every request hits origin database for tenant lookup',
        'Hardcoding tenant-specific logic in components instead of config-driven approach',
        'Not handling undefined tenant gracefully — unauthenticated access shows other tenant\'s data',
      ],
      follow_up_questions: [
        'How do you handle session management when a user can belong to multiple tenants?',
        'What is Vercel Edge Config and how does it differ from a regular database for edge use cases?',
        'How do you implement per-tenant rate limiting in Next.js middleware?',
        'How do you test multi-tenant functionality in local development without DNS configuration?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your Next.js bundle size is 2.5MB gzipped, causing poor Time to Interactive on mobile. How do you analyze and systematically reduce it?',
    answer: buildAnswer({
      short_answer:
        'Use `@next/bundle-analyzer` to identify largest modules, apply dynamic imports for below-fold components and heavy libraries, switch to tree-shakeable alternatives (dayjs vs moment, date-fns), move server-only code to Server Components (no client bundle), and audit third-party scripts.',
      detailed_answer:
        '2.5MB gzipped is 8-12MB uncompressed JavaScript. On mobile with 4G, parsing alone takes 5-10 seconds.\n\n**Step 1: Analyze bundle composition:**\n```bash\n# Install bundle analyzer\npnpm add -D @next/bundle-analyzer\n\n# next.config.js\nconst withBundleAnalyzer = require(\'@next/bundle-analyzer\')({\n  enabled: process.env.ANALYZE === \'true\',\n});\nmodule.exports = withBundleAnalyzer({});\n\n# Run\nANALYZE=true pnpm build\n```\nOpens treemap showing which module takes what percentage.\n\n**Step 2: Move heavy components below fold with dynamic import:**\n```typescript\n// ❌ BAD: Chart library loaded on initial render (1.2MB)\nimport { LineChart } from \'recharts\';\n\n// ✅ GOOD: Loaded only when user scrolls to it\nimport dynamic from \'next/dynamic\';\nconst LineChart = dynamic(\n  () => import(\'recharts\').then(mod => mod.LineChart),\n  { loading: () => <ChartSkeleton />, ssr: false }\n);\n```\n\n**Step 3: Replace heavy libraries:**\n```bash\n# moment.js (70KB gzipped) → day.js (2KB) or date-fns (tree-shakeable)\nbundle-phobia check moment\n\n# lodash (70KB full) → lodash-es (tree-shakeable) or native methods\nimport { debounce } from \'lodash-es\'; // Only debounce, not full lodash\n\n# Replace large icon libraries\n# react-icons (download specific icons only)\nimport { FiSearch } from \'react-icons/fi\'; // Only Fi icons, not entire set\n```\n\n**Step 4: Move computation to Server Components (zero client bundle):**\n```typescript\n// ❌ BAD: markdown parser shipped to client\n\'use client\';\nimport { marked } from \'marked\'; // 40KB\nexport function BlogPost({ markdown }) {\n  return <div dangerouslySetInnerHTML={{ __html: marked(markdown) }} />;\n}\n\n// ✅ GOOD: parse on server, ship HTML only\n// server-component.tsx (no \'use client\')\nimport { marked } from \'marked\'; // Not in client bundle!\nexport async function BlogPost({ markdown }) {\n  const html = await marked(markdown);\n  return <div dangerouslySetInnerHTML={{ __html: html }} />;\n}\n```\n\n**Step 5: Third-party script optimization:**\n```typescript\nimport Script from \'next/script\';\n\n// Load analytics after page is interactive\n<Script src="https://analytics.example.com/script.js" strategy="lazyOnload" />\n\n// Critical scripts\n<Script src="..." strategy="afterInteractive" />\n```\n\n**Step 6: Font optimization:**\n```typescript\n// next/font eliminates FOIT, subsets font automatically\nconst inter = Inter({ \n  subsets: [\'latin\'], // Only Latin chars, not full unicode\n  variable: \'--font-inter\',\n});\n// Result: 200KB Google Font → 8KB subset\n```\n\n**Monitoring regression:**\n```yaml\n# .github/workflows/bundle-size.yml\n- uses: preactjs/compressed-size-action@v2\n  with:\n    repo-token: ${{ secrets.GITHUB_TOKEN }}\n    build-script: pnpm build\n    # Comments bundle size diff on every PR\n```',
      trade_offs: [
        {
          approach: 'Heavy dynamic imports for all non-critical components',
          pros: ['Maximum initial bundle reduction', 'Components load on demand', 'Can show loading skeletons'],
          cons: [
            'Additional round trips for each dynamic import',
            'Worse UX if user interacts before chunk loads',
            'More complex code splitting strategy needed',
          ],
        },
        {
          approach: 'Server Components for all data fetching',
          pros: ['Eliminates client-side data fetching libraries', 'No client bundle for data logic', 'Better SEO'],
          cons: [
            'No interactivity — user interactions need "use client" boundary',
            'Complex mental model of server/client boundary',
            'Cannot access browser APIs (localStorage, etc.)',
          ],
        },
        {
          approach: 'Module federation (micro-frontends)',
          pros: ['Split bundle across teams', 'Independent deployment', 'Shared dependencies deduped at runtime'],
          cons: ['Very high complexity', 'Runtime dependency resolution', 'Version mismatch issues'],
        },
      ],
      real_world_example:
        'An analytics dashboard had 3.1MB bundle. Bundle analyzer revealed: recharts (800KB), moment.js (280KB), full lodash (280KB), and an admin panel component tree loaded on all pages including login page. Fixes: (1) moment → dayjs (saved 270KB), (2) lodash → lodash-es with tree shaking (saved 250KB), (3) recharts dynamically imported with `ssr: false` (saved 800KB from initial), (4) admin components moved to `(admin)` route group with separate layout. Bundle: 3.1MB → 620KB. TTI on mobile: 8.2s → 2.1s.',
      red_flags: [
        'Importing entire libraries when only one function is needed (`import * as _ from \'lodash\'`)',
        'Using \'use client\' on every component — defeats Server Components entirely',
        'Not code-splitting route-specific heavy components',
        'Third-party scripts loaded synchronously in `<head>` — blocks rendering',
        'Checking bundle size only locally — different from production build output',
      ],
      follow_up_questions: [
        'What is tree shaking and why does it require ES modules?',
        'How do you prevent bundle size regression in a team with many developers?',
        'What is module federation and how does it differ from Next.js dynamic imports?',
        'How do you measure and optimize Time to Interactive (TTI) vs Time to First Byte (TTFB)?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement real-time features (live notifications, collaborative editing) in Next.js App Router without losing the benefits of Server Components?',
    answer: buildAnswer({
      short_answer:
        'Use a hybrid approach: Server Components for initial static/data rendering, Client Components only for real-time UI boundaries, WebSocket or SSE connection managed in a Client Component with React Context or Zustand. Keep real-time state minimal — propagate updates to Server Component data by calling `router.refresh()` or using revalidation.',
      detailed_answer:
        'Real-time features require persistent connections — this is inherently client-side. The key is minimizing the Client Component boundary.\n\n**Architecture: Server Component shell + Client Component real-time layer:**\n```typescript\n// ✅ page.tsx — Server Component fetches initial state\nexport default async function NotificationsPage() {\n  const notifications = await getNotifications(); // Server-side fetch, cached\n  return (\n    <div>\n      <StaticHeader />\n      {/* Client boundary only where needed */}\n      <NotificationsClient initialData={notifications} />\n    </div>\n  );\n}\n\n// ✅ notifications-client.tsx — Client Component for real-time\n\'use client\';\nexport function NotificationsClient({ initialData }) {\n  const [notifications, setNotifications] = useState(initialData);\n  \n  useEffect(() => {\n    const socket = new WebSocket(\'wss://api.example.com/ws\');\n    socket.onmessage = (event) => {\n      const notification = JSON.parse(event.data);\n      setNotifications(prev => [notification, ...prev]);\n    };\n    return () => socket.close();\n  }, []);\n  \n  return <NotificationsList notifications={notifications} />;\n}\n```\n\n**Server-Sent Events (SSE) for unidirectional real-time:**\n```typescript\n// app/api/notifications/stream/route.ts\nexport async function GET(request: Request) {\n  const userId = getUserIdFromSession(request);\n  \n  const stream = new ReadableStream({\n    start(controller) {\n      const unsubscribe = notificationBus.subscribe(userId, (notification) => {\n        const data = `data: ${JSON.stringify(notification)}\\n\\n`;\n        controller.enqueue(new TextEncoder().encode(data));\n      });\n      \n      request.signal.addEventListener(\'abort\', () => {\n        unsubscribe();\n        controller.close();\n      });\n    },\n  });\n  \n  return new Response(stream, {\n    headers: {\n      \'Content-Type\': \'text/event-stream\',\n      \'Cache-Control\': \'no-cache\',\n      \'Connection\': \'keep-alive\',\n    },\n  });\n}\n\n// Client Component consuming SSE\n\'use client\';\nuseEffect(() => {\n  const eventSource = new EventSource(\'/api/notifications/stream\');\n  eventSource.onmessage = (e) => {\n    setNotifications(prev => [JSON.parse(e.data), ...prev]);\n  };\n  return () => eventSource.close();\n}, []);\n```\n\n**Collaborative editing with operational transforms:**\nFor document collaboration, use dedicated libraries:\n- Yjs (CRDT-based) + y-websocket server\n- Liveblocks (SaaS, handles conflict resolution)\n\n```typescript\n\'use client\';\nimport * as Y from \'yjs\';\nimport { WebsocketProvider } from \'y-websocket\';\n\nexport function CollaborativeEditor({ documentId }) {\n  const { editor } = useEditor({ extensions: [Collaboration.configure({ document: ydoc })] });\n  \n  useEffect(() => {\n    const ydoc = new Y.Doc();\n    const provider = new WebsocketProvider(\'wss://ws.example.com\', documentId, ydoc);\n    return () => provider.destroy();\n  }, [documentId]);\n}\n```\n\n**Global real-time state with React Context:**\n```typescript\n// providers/realtime-provider.tsx\n\'use client\';\nexport function RealtimeProvider({ children }) {\n  const socket = useWebSocket(\'wss://api.example.com/ws\');\n  return (\n    <RealtimeContext.Provider value={{ socket }}>\n      {children}\n    </RealtimeContext.Provider>\n  );\n}\n\n// In layout.tsx (wraps all Client Components)\nexport default function Layout({ children }) {\n  return (\n    <RealtimeProvider> {/* Client Component wrapper */}\n      {children}        {/* Server Components still work inside! */}\n    </RealtimeProvider>\n  );\n}\n```',
      trade_offs: [
        {
          approach: 'WebSockets (bidirectional)',
          pros: ['Full duplex', 'Lower latency than SSE', 'Better for collaborative editing'],
          cons: [
            'Load balancer sticky sessions needed (or shared state via Redis pub/sub)',
            'WebSocket not cached by CDN',
            'More complex server (need WebSocket server)',
          ],
        },
        {
          approach: 'Server-Sent Events (unidirectional)',
          pros: ['Works over HTTP/1.1', 'Automatic reconnect', 'Simpler than WebSocket', 'Works with Next.js API routes'],
          cons: [
            'Unidirectional — client cannot send messages',
            'Limited to 6 connections per domain in some browsers',
            'Higher latency than WebSocket',
          ],
        },
        {
          approach: 'Polling (setInterval)',
          pros: ['Simplest implementation', 'Works everywhere', 'No persistent connection'],
          cons: [
            'High server load (every client polls every N seconds)',
            'Minimum latency = poll interval',
            'Wasted bandwidth when no updates',
          ],
        },
      ],
      real_world_example:
        'A project management tool implemented real-time task updates. Initial approach: WebSocket per user, but load balancer didn\'t support sticky sessions — users connected to different pods, lost updates. Fix: moved WebSocket server to a separate service (Node.js + socket.io with Redis adapter), Next.js API routes proxied to it. Server Components loaded initial task data, Client Components subscribed to real-time updates. Moving task: SSE event → Client Component state update → optimistic UI. Server Component data refreshed via `router.refresh()` every 5 minutes for cache coherence.',
      red_flags: [
        'Opening WebSocket connection in Server Components — impossible, Server Components run on server only',
        'Fetching real-time data on every render in useEffect without cleanup — connection leak',
        'Not handling WebSocket reconnection — users silently stop receiving updates after network hiccup',
        'Real-time updates that mutate Server Component cached data without revalidation',
        'Multiple WebSocket connections per page — consolidate into single connection with channels/topics',
      ],
      follow_up_questions: [
        'How do you scale WebSocket connections across multiple server instances?',
        'What is the difference between CRDTs and operational transforms for collaborative editing?',
        'How do you handle optimistic updates with Server Actions in Next.js?',
        'What are the implications of SSE connection limits in browsers?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your Next.js e-commerce site needs to handle Black Friday traffic — 50× normal load for 4 hours. How do you architect it to survive without scaling the backend to 50×?',
    answer: buildAnswer({
      short_answer:
        'Maximize CDN cache hit rate: static generate product pages with ISR, use edge middleware for personalization without origin roundtrip, implement stale-while-revalidate for cart/session, preload inventory data at edge, and use DDoS protection + rate limiting at CDN layer. Target 95%+ cache hit rate to reduce origin load by 20×.',
      detailed_answer:
        '50× traffic for 4 hours cannot be served purely from origin servers cost-effectively. Cache and edge computing are the solution.\n\n**Strategy: CDN-first architecture**\n\nTarget: 95% cache hit rate → only 5% of requests reach origin → origin handles 2.5× normal load (manageable).\n\n**Step 1: Maximize cacheable pages:**\n```typescript\n// Product pages — static with ISR\n// app/products/[slug]/page.tsx\nexport const revalidate = 60; // Rebuild every 60s max\nexport const dynamicParams = true; // Cache unknown slugs on first hit\n\nexport async function generateStaticParams() {\n  // Pre-generate top 1000 products (80% of traffic)\n  const topProducts = await getTopProducts(1000);\n  return topProducts.map(p => ({ slug: p.slug }));\n}\n```\n\n**Step 2: Edge personalization without origin:**\n```typescript\n// middleware.ts — runs at edge, no origin roundtrip\nexport function middleware(request: NextRequest) {\n  const userSegment = request.cookies.get(\'user-segment\')?.value ?? \'default\';\n  const country = request.geo?.country ?? \'US\';\n  \n  // Rewrite to segment-specific page (served from CDN)\n  const url = request.nextUrl.clone();\n  url.pathname = `/products/${url.pathname.split(\'/products/\')[1]}?segment=${userSegment}`;\n  \n  return NextResponse.rewrite(url);\n}\n```\n\n**Step 3: Cart and checkout — minimize origin hits:**\n```typescript\n// Cart in cookies (no server needed for reads)\n// app/api/cart/route.ts — only called for mutations\nexport async function POST(request: Request) {\n  const { productId, quantity } = await request.json();\n  \n  // Verify inventory at edge (Cloudflare KV) before hitting origin\n  const stock = await edgeKV.get(`stock:${productId}`);\n  if (parseInt(stock) < quantity) {\n    return Response.json({ error: \'out_of_stock\' }, { status: 409 });\n  }\n  \n  // Origin hit only for actual cart update\n  return await cartService.addItem(productId, quantity);\n}\n```\n\n**Step 4: Inventory pre-load at edge:**\n```typescript\n// Sync top products inventory to edge KV every 30s\n// Separate worker process\nsetInterval(async () => {\n  const topProducts = await db.query(`\n    SELECT id, stock_count FROM products \n    ORDER BY views_today DESC LIMIT 1000\n  `);\n  await Promise.all(\n    topProducts.map(p => edgeKV.put(`stock:${p.id}`, p.stock_count.toString(), { expirationTtl: 60 }))\n  );\n}, 30000);\n```\n\n**Step 5: Rate limiting at edge:**\n```typescript\n// middleware.ts — bot protection before hitting origin\nconst rateLimit = {\n  \'checkout\': { limit: 5, window: 60 }, // 5 checkouts per minute\n  \'api\': { limit: 100, window: 60 },\n};\n```\n\n**Pre-event preparation:**\n- Warm CDN cache: crawl all product URLs 2h before event\n- Scale database read replicas (not primary) — reads dominate\n- Enable Postgres connection pooler (PgBouncer)\n- Disable non-critical features (recommendations, reviews) via feature flags\n- Load test with k6 targeting 60× normal load\n\n**Graceful degradation plan:**\n- Reviews disabled (non-critical)\n- Recommendations from static file (pre-computed) not live query\n- Checkout queue with virtual waiting room if inventory overwhelmed',
      trade_offs: [
        {
          approach: 'ISR (Incremental Static Regeneration)',
          pros: ['Served from CDN edge', 'Handles any traffic level', 'Automatic fallback to stale'],
          cons: [
            'Slightly stale product data (price, stock) during revalidation window',
            'Price discrepancy risk if cart and product page have different data age',
          ],
        },
        {
          approach: 'Real-time SSR for product pages',
          pros: ['Always accurate price/stock', 'No stale data risk'],
          cons: [
            'Every request hits origin — cannot sustain 50× load without 50× servers',
            'Cache poisoning risk with wrong Cache-Control headers',
          ],
        },
        {
          approach: 'Client-side rendering for dynamic data',
          pros: ['Static shell served from CDN', 'Dynamic data loaded separately'],
          cons: [
            'LCP delayed until client fetch completes',
            'More API requests to origin',
            'Inventory shown inaccurately until fetch completes',
          ],
        },
      ],
      real_world_example:
        'A fashion e-commerce site had 800 req/s normal load, expecting 40,000 req/s during a celebrity collaboration drop. Infrastructure limit: could realistically scale to 4,000 req/s origin capacity. Solution: ISR for all product pages (60s revalidate), inventory synced to Cloudflare KV every 15s, middleware did stock check at edge for add-to-cart. Cache hit rate: 97.3%. Origin handled: ~1,100 req/s peak. Zero downtime. Post-event analysis: if cache had missed 10% instead of 3%, origin would have been overwhelmed.',
      red_flags: [
        'Assuming you can scale origin servers linearly without a cache strategy — cost explodes',
        'Not warming CDN cache before traffic spike — first wave of users all miss cache simultaneously',
        'Cart and checkout sharing infrastructure with browse pages — checkout failure hurts revenue most',
        'No graceful degradation plan — all-or-nothing failure mode',
        'Not load testing before Black Friday — first real test is the actual event',
      ],
      follow_up_questions: [
        'What is stale-while-revalidate and how does it differ from ISR?',
        'How do you implement a virtual waiting room for flash sales?',
        'What is cache stampede and how do you prevent it with CDN?',
        'How do you handle inventory overselling in a distributed system?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement comprehensive authentication in Next.js App Router with OAuth, session management, route protection, and multi-factor authentication?',
    answer: buildAnswer({
      short_answer:
        'Use Auth.js (NextAuth v5) or a custom solution with iron-session or JWT. Protect routes in middleware using session cookies, not API routes. Server Components read session server-side. For MFA: implement TOTP with speakeasy/otplib, store TOTP secret encrypted in database, verify in Server Action before sensitive operations.',
      detailed_answer:
        'Authentication in App Router is fundamentally different from Pages Router — middleware protects routes, Server Components read auth state, Server Actions handle mutations.\n\n**Auth.js (NextAuth v5) setup:**\n```typescript\n// auth.ts\nimport NextAuth from \'next-auth\';\nimport Google from \'next-auth/providers/google\';\n\nexport const { handlers, auth, signIn, signOut } = NextAuth({\n  providers: [Google],\n  callbacks: {\n    session: ({ session, token }) => ({\n      ...session,\n      user: { ...session.user, id: token.sub, role: token.role },\n    }),\n    jwt: async ({ token, user }) => {\n      if (user) {\n        token.role = await getUserRole(user.id);\n      }\n      return token;\n    },\n  },\n});\n\n// app/api/auth/[...nextauth]/route.ts\nexport const { GET, POST } = handlers;\n```\n\n**Middleware for route protection (runs at edge):**\n```typescript\n// middleware.ts\nimport { auth } from \'./auth\';\n\nexport default auth((request) => {\n  const isLoggedIn = !!request.auth;\n  const isAuthPage = request.nextUrl.pathname.startsWith(\'/login\');\n  const isProtectedRoute = request.nextUrl.pathname.startsWith(\'/dashboard\');\n  \n  if (isProtectedRoute && !isLoggedIn) {\n    return Response.redirect(new URL(\'/login\', request.nextUrl));\n  }\n  \n  if (isLoggedIn && isAuthPage) {\n    return Response.redirect(new URL(\'/dashboard\', request.nextUrl));\n  }\n});\n\nexport const config = { matcher: [\'/dashboard/:path*\', \'/login\'] };\n```\n\n**Server Component auth check:**\n```typescript\n// app/dashboard/page.tsx\nimport { auth } from \'@/auth\';\nimport { redirect } from \'next/navigation\';\n\nexport default async function DashboardPage() {\n  const session = await auth();\n  if (!session) redirect(\'/login\');\n  if (session.user.role !== \'admin\') redirect(\'/403\');\n  \n  return <Dashboard user={session.user} />;\n}\n```\n\n**TOTP MFA implementation:**\n```typescript\n// Server Action for MFA setup\n\'use server\';\nimport { authenticator } from \'otplib\';\nimport { encrypt } from \'@/lib/encryption\';\n\nexport async function setupMFA() {\n  const session = await auth();\n  const secret = authenticator.generateSecret();\n  \n  // Store encrypted secret (never in plaintext)\n  await db.users.update({\n    where: { id: session.user.id },\n    data: { totpSecret: encrypt(secret), mfaEnabled: false },\n  });\n  \n  const uri = authenticator.keyuri(session.user.email, \'MyApp\', secret);\n  return { qrCodeUri: uri }; // Display QR code\n}\n\nexport async function verifyAndEnableMFA(token: string) {\n  const session = await auth();\n  const user = await db.users.findUnique({ where: { id: session.user.id } });\n  const secret = decrypt(user.totpSecret);\n  \n  if (!authenticator.verify({ token, secret })) {\n    throw new Error(\'Invalid token\');\n  }\n  \n  await db.users.update({\n    where: { id: user.id },\n    data: { mfaEnabled: true },\n  });\n}\n```\n\n**MFA enforcement in login flow:**\nAfter OAuth callback, check `mfaEnabled`. If true, redirect to `/verify-mfa` instead of dashboard. Store partial auth state in encrypted cookie. Full session issued only after TOTP verification.',
      trade_offs: [
        {
          approach: 'Auth.js (NextAuth)',
          pros: ['Handles OAuth complexity', 'Built-in session management', 'Adapters for many DBs', 'Active maintenance'],
          cons: ['Magic can hide auth bugs', 'v4→v5 breaking changes', 'Limited customization for complex flows'],
        },
        {
          approach: 'Custom auth (iron-session + JWT)',
          pros: ['Full control', 'Lightweight', 'Easier to add custom claims', 'No framework magic'],
          cons: ['Must implement OAuth yourself', 'Easy to introduce security vulnerabilities', 'More code to maintain'],
        },
        {
          approach: 'External auth provider (Clerk, Supabase Auth, WorkOS)',
          pros: ['MFA, SSO, org management built-in', 'No auth code to maintain', 'SOC 2 compliance handled'],
          cons: ['Vendor lock-in', 'Cost at scale ($500-$5000/month)', 'Less control over UX', 'Data leaves your infrastructure'],
        },
      ],
      real_world_example:
        'A healthcare dashboard needed OAuth (Google Workspace SSO), TOTP MFA for PHI access, and role-based route protection. Implementation: Auth.js v5 with Google provider, middleware protecting `/patients/:path*` and `/reports/:path*`, Server Components double-checking role to prevent middleware bypass. MFA: TOTP with 30s window, otplib, secret encrypted with AES-256-GCM using environment key. Compliance audit passed. HIPAA requirement: MFA required — enforced at middleware level, cannot be bypassed.',
      red_flags: [
        'Storing session token in localStorage — vulnerable to XSS, use httpOnly cookies',
        'Protecting routes only in client components — middleware bypass via direct API calls',
        'TOTP secret stored unencrypted in database — if DB is breached, MFA is compromised',
        'Not using `secure` and `sameSite: "lax"` on auth cookies — CSRF risk',
        'JWT with no expiry — compromised token valid forever',
      ],
      follow_up_questions: [
        'What is the difference between session-based auth and JWT-based auth in Next.js?',
        'How do you implement PKCE (Proof Key for Code Exchange) in OAuth flows?',
        'How do you handle auth state in Client Components without exposing sensitive data?',
        'What are WebAuthn/passkeys and how would you add them as an MFA option?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A Next.js Server Action is causing race conditions — multiple users submitting forms simultaneously lead to duplicate database records. How do you implement idempotent Server Actions?',
    answer: buildAnswer({
      short_answer:
        'Generate a client-side idempotency key (UUID) before form submission, include it in the Server Action payload, check for duplicates in a database transaction using the key, and return the existing result if found. Add unique constraints on the idempotency key column with appropriate TTL for cleanup.',
      detailed_answer:
        'Race conditions in Server Actions occur when: (1) user double-clicks submit, (2) network retry on timeout, (3) concurrent tab submissions.\n\n**Client-side: generate and track idempotency key:**\n```typescript\n\'use client\';\nimport { useRef, useTransition } from \'react\';\n\nexport function PaymentForm() {\n  const [isPending, startTransition] = useTransition();\n  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());\n  \n  async function handleSubmit(formData: FormData) {\n    // Attach idempotency key to form data\n    formData.set(\'idempotencyKey\', idempotencyKeyRef.current);\n    \n    startTransition(async () => {\n      const result = await submitPayment(formData);\n      // Reset key on success — new submission = new key\n      if (result.success) {\n        idempotencyKeyRef.current = crypto.randomUUID();\n      }\n    });\n  }\n  \n  return (\n    <form action={handleSubmit}>\n      {/* Disable button while pending — client-side protection */}\n      <button disabled={isPending}>Pay Now</button>\n    </form>\n  );\n}\n```\n\n**Server Action with idempotency:**\n```typescript\n\'use server\';\nimport { auth } from \'@/auth\';\n\nexport async function submitPayment(formData: FormData) {\n  const session = await auth();\n  const idempotencyKey = formData.get(\'idempotencyKey\') as string;\n  \n  // Validate idempotency key format\n  if (!isValidUUID(idempotencyKey)) {\n    throw new Error(\'Invalid idempotency key\');\n  }\n  \n  return await db.transaction(async (tx) => {\n    // Atomic check-and-insert\n    const existing = await tx.query(`\n      SELECT id, status, result FROM payment_idempotency_keys\n      WHERE key = $1 AND user_id = $2\n      FOR UPDATE SKIP LOCKED\n    `, [idempotencyKey, session.user.id]);\n    \n    if (existing.rows[0]) {\n      // Duplicate request — return cached result\n      return existing.rows[0].result;\n    }\n    \n    // Reserve the key (prevents race condition)\n    await tx.query(`\n      INSERT INTO payment_idempotency_keys (key, user_id, created_at)\n      VALUES ($1, $2, NOW())\n    `, [idempotencyKey, session.user.id]);\n    \n    // Process payment\n    const payment = await processPayment(formData);\n    \n    // Store result for future duplicate requests\n    await tx.query(`\n      UPDATE payment_idempotency_keys\n      SET result = $1, status = \'completed\'\n      WHERE key = $2\n    `, [JSON.stringify(payment), idempotencyKey]);\n    \n    return payment;\n  });\n}\n```\n\n**Database schema:**\n```sql\nCREATE TABLE payment_idempotency_keys (\n  key UUID PRIMARY KEY,\n  user_id UUID NOT NULL REFERENCES users(id),\n  result JSONB,\n  status TEXT DEFAULT \'processing\',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL \'24 hours\'\n);\n\nCREATE INDEX idx_idempotency_expires ON payment_idempotency_keys (expires_at);\n-- Cleanup job: DELETE FROM payment_idempotency_keys WHERE expires_at < NOW();\n```\n\n**Unique constraint as additional safety net:**\n```sql\n-- Even if application logic fails, DB prevents duplicates\nCREATE UNIQUE INDEX idx_payment_idempotency ON payment_idempotency_keys (key, user_id);\n```\n\n**`useOptimistic` for immediate UI feedback:**\n```typescript\nconst [optimisticPayments, addOptimisticPayment] = useOptimistic(\n  payments,\n  (state, newPayment) => [...state, { ...newPayment, status: \'pending\' }]\n);\n```',
      trade_offs: [
        {
          approach: 'Client-generated idempotency keys (UUID)',
          pros: ['No server roundtrip to generate key', 'Works with offline scenarios', 'Simple to implement'],
          cons: [
            'Key must be validated on server',
            'Malicious clients can reuse keys across different requests',
            'Need to scope key by userId to prevent cross-user collisions',
          ],
        },
        {
          approach: 'Server-generated idempotency keys (on form load)',
          pros: ['Server controls key format and validity', 'Easier to enforce one-time use', 'Cannot be replayed by client'],
          cons: [
            'Extra roundtrip to get key before submission',
            'Key expires if user takes too long to submit',
            'Complex with multiple forms on same page',
          ],
        },
        {
          approach: 'Unique constraint on business data (e.g., orderId + userId)',
          pros: ['No separate idempotency key infrastructure', 'Business-level deduplication'],
          cons: [
            'Only works when request has naturally unique business data',
            'Raises unique constraint error (not a clean "already processed" response)',
          ],
        },
      ],
      real_world_example:
        'An event ticketing platform had duplicate purchases on high-demand shows — users clicking "Buy" multiple times during checkout panic created duplicate orders. Investigation: Server Action had no deduplication. Fix: UUID idempotency key generated on page load, stored in hidden form field, checked in transaction before processing Stripe charge. Stripe also supports idempotency keys natively — passed the same key to Stripe API to prevent duplicate charges. Duplicate orders: reduced from ~2% of transactions to 0%.',
      red_flags: [
        'Relying only on `disabled` button state — network retries bypass client protection',
        'Idempotency key scoped globally without userId — tenant A can replay tenant B\'s key',
        'No expiry on idempotency records — table grows infinitely',
        'Using request timestamp as idempotency key — two requests in same millisecond collide',
        'Idempotency check outside of transaction — race condition between check and insert',
      ],
      follow_up_questions: [
        'What is the difference between idempotency and exactly-once processing?',
        'How do you handle idempotency for Server Actions that call external APIs (Stripe, SendGrid)?',
        'What is `useOptimistic` in React 19 and how does it improve form UX?',
        'How do you implement pessimistic locking vs optimistic locking for concurrent form submissions?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'How do you implement internationalization (i18n) in Next.js App Router for a global SaaS with 15 locales, RTL support, and locale-specific routing?',
    answer: buildAnswer({
      short_answer:
        'Use next-intl or next-i18next with App Router, configure locale-prefixed routing in middleware, lazy-load translation files per locale (not all at once), implement RTL with CSS logical properties or dir="rtl" on html element, and use TypeScript-safe translation keys with code generation.',
      detailed_answer:
        'i18n in App Router requires routing, translation loading, and directionality.\n\n**Routing setup with next-intl:**\n```typescript\n// middleware.ts\nimport createMiddleware from \'next-intl/middleware\';\n\nexport default createMiddleware({\n  locales: [\'en\', \'vi\', \'ar\', \'ja\', \'zh-CN\', \'de\', \'fr\', \'es\', \'pt\', \'ko\', \'th\', \'id\', \'ms\', \'hi\', \'ru\'],\n  defaultLocale: \'en\',\n  localeDetection: true,\n  // /en/dashboard, /vi/dashboard, /ar/dashboard\n});\n\nexport const config = { matcher: [\'/((?!api|_next|.*\\\\.).*)\']};\n```\n\n**App Router layout with locale:**\n```typescript\n// app/[locale]/layout.tsx\nimport { NextIntlClientProvider } from \'next-intl\';\nimport { getMessages, getLocale } from \'next-intl/server\';\n\nexport default async function LocaleLayout({ children, params: { locale } }) {\n  const messages = await getMessages(); // Loads only current locale messages\n  const isRTL = [\'ar\', \'he\', \'fa\', \'ur\'].includes(locale);\n  \n  return (\n    <html lang={locale} dir={isRTL ? \'rtl\' : \'ltr\'}>\n      <body>\n        <NextIntlClientProvider messages={messages}>\n          {children}\n        </NextIntlClientProvider>\n      </body>\n    </html>\n  );\n}\n```\n\n**Server Component translations:**\n```typescript\n// app/[locale]/dashboard/page.tsx\nimport { useTranslations } from \'next-intl\';\n\nexport default function DashboardPage() {\n  const t = useTranslations(\'Dashboard\');\n  return <h1>{t(\'title\')}</h1>;\n}\n```\n\n**Translation file structure (lazy loading):**\n```\nmessages/\n  en.json          # 15KB\n  vi.json          # 14KB\n  ar.json          # 16KB (RTL)\n  zh-CN.json       # 18KB\n  ...\n```\nOnly the current locale file is loaded — not all 15 simultaneously.\n\n**RTL support with CSS logical properties:**\n```css\n/* ❌ BAD: Fixed direction properties */\n.sidebar { margin-left: 16px; padding-right: 24px; }\n\n/* ✅ GOOD: Logical properties — auto-flip in RTL */\n.sidebar { margin-inline-start: 16px; padding-inline-end: 24px; }\n```\n\nTailwind CSS with RTL:\n```tsx\n/* Tailwind v3.3+ supports logical properties */\n<div className="ms-4 pe-6"> {/* margin-inline-start, padding-inline-end */}\n```\n\n**TypeScript-safe translation keys:**\n```typescript\n// Generate types from en.json\n// messages/en.json structure\n{\n  "Dashboard": {\n    "title": "Dashboard",\n    "welcome": "Welcome, {name}!"\n  }\n}\n\n// Usage with full type safety\nconst t = useTranslations(\'Dashboard\');\nt(\'title\');           // OK\nt(\'welcome\', { name: \'Alice\' }); // OK\nt(\'nonexistent\');     // TypeScript error\n```\n\n**Locale-specific number/date formatting:**\n```typescript\nimport { useFormatter } from \'next-intl\';\n\nexport function PriceDisplay({ amount }: { amount: number }) {\n  const format = useFormatter();\n  return <span>{format.number(amount, { style: \'currency\', currency: \'USD\' })}</span>;\n  // en: $1,234.56\n  // de: 1.234,56 $\n  // ar: ١٬٢٣٤٫٥٦ US$\n}\n```',
      trade_offs: [
        {
          approach: 'next-intl (App Router native)',
          pros: ['Built for App Router', 'Server Component support', 'TypeScript types from messages', 'Active maintenance'],
          cons: ['Relatively new', 'Some App Router patterns still evolving', 'Migration from Pages Router'],
        },
        {
          approach: 'next-i18next',
          pros: ['Battle-tested', 'Huge ecosystem', 'Easy Pages Router migration'],
          cons: ['Not optimized for App Router', 'Client-side hydration overhead', 'Not actively maintained for App Router patterns'],
        },
        {
          approach: 'Custom i18n with React Context',
          pros: ['Full control', 'No external dependency', 'Smallest bundle'],
          cons: [
            'Reinventing the wheel (pluralization, ICU message format)',
            'No TypeScript types without code generation',
            'RTL support not automatic',
          ],
        },
      ],
      real_world_example:
        'An HR SaaS launched in 12 countries including Saudi Arabia (Arabic, RTL) and Japan. Issues: (1) all 12 locale files loaded for every request (200KB+), (2) flexbox layouts broke in RTL — sidebar appeared on wrong side, (3) dates showed US format in all locales. Fixes: next-intl for locale-specific loading, CSS logical properties throughout (3-day refactor), `Intl.DateTimeFormat` with locale parameter for all dates. Arabic launch: zero RTL bugs reported. Translation file load: 200KB → 15KB per request.',
      red_flags: [
        'Loading all locale files on every request — massive bandwidth waste with 15 locales',
        'Hardcoded LTR CSS (margin-left, text-align: left) that breaks RTL layouts',
        'Storing locale in component state — inconsistent with URL-based routing',
        'Not handling plural forms (n=1 vs n>1 different in many languages)',
        'Translating only UI strings but not date formats, number formats, currency symbols',
      ],
      follow_up_questions: [
        'What is ICU message format and how does it handle pluralization and gender?',
        'How do you implement SEO for multilingual Next.js with hreflang tags?',
        'How do you handle locale detection order (URL > cookie > Accept-Language header)?',
        'What are CSS logical properties and how do they improve RTL support compared to direction: rtl?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your Next.js application deployed to multiple regions is showing data inconsistency — users in Asia see different data than users in US due to edge caching. How do you fix this?',
    answer: buildAnswer({
      short_answer:
        'Classify data by mutability: static (CDN-cacheable everywhere), dynamic (cache with vary headers by user/region), real-time (no cache, always origin). Use `Cache-Control: s-maxage` for shared cache TTL, `Vary: Cookie` for session-sensitive data, and `revalidateTag` for immediate invalidation across all edge nodes when data changes.',
      detailed_answer:
        'Multi-region edge caching inconsistency has three root causes: (1) different regions serving stale cache, (2) different origin regions returning different data, (3) user-session data incorrectly cached as shared.\n\n**Classify every endpoint by data type:**\n\n1. **Static/public** — same for all users, cacheable at edge:\n```typescript\n// app/api/products/route.ts\nexport async function GET() {\n  const products = await getProducts(); // Could be stale up to 60s\n  return Response.json(products, {\n    headers: {\n      \'Cache-Control\': \'public, s-maxage=60, stale-while-revalidate=3600\',\n      // s-maxage: edge cache (CDN) TTL\n      // stale-while-revalidate: serve stale while revalidating in background\n    },\n  });\n}\n```\n\n2. **User-specific** — MUST NOT share across users:\n```typescript\n// app/api/user/profile/route.ts\nexport async function GET() {\n  const session = await auth();\n  const profile = await getUserProfile(session.user.id);\n  return Response.json(profile, {\n    headers: {\n      // Private = CDN does NOT cache this\n      \'Cache-Control\': \'private, no-cache, must-revalidate\',\n    },\n  });\n}\n```\n\n3. **Tenant-specific public** — cacheable but varies by tenant:\n```typescript\nexport async function GET(request: Request) {\n  const tenantId = getTenantFromHost(request.headers.get(\'host\'));\n  const config = await getTenantConfig(tenantId);\n  return Response.json(config, {\n    headers: {\n      \'Cache-Control\': \'public, s-maxage=300\',\n      \'Vary\': \'Host\',  // Different cache per hostname (per tenant)\n    },\n  });\n}\n```\n\n**On-demand invalidation across all edge nodes:**\n```typescript\n// Server Action after data mutation\n\'use server\';\nimport { revalidateTag } from \'next/cache\';\n\nexport async function updateProductPrice(productId: string, price: number) {\n  await db.products.update({ where: { id: productId }, data: { price } });\n  \n  // Invalidates ALL edge nodes\' cache for this tag\n  revalidateTag(`product-${productId}`);\n  revalidateTag(\'products\');\n}\n```\n\n**Multi-region origin consistency:**\nIf your backend runs in multiple regions with separate databases:\n- Read replicas lag (50-200ms replication delay)\n- Solution: always write to primary, read from primary for user-visible mutations\n- Or: use global consistency DB (PlanetScale, CockroachDB) that handles cross-region sync\n\n**Diagnosing which edge node served the response:**\n```typescript\n// Add debug headers in development\nreturn Response.json(data, {\n  headers: {\n    \'X-Cache-Region\': process.env.VERCEL_REGION ?? \'unknown\',\n    \'X-Cache-Status\': \'HIT\', // or MISS\n  },\n});\n```\n\n**Vercel-specific: `x-vercel-cache` header:**\n- `HIT`: served from edge cache\n- `MISS`: served from origin\n- `BYPASS`: cache bypassed (e.g., user has session cookie)\n- `REVALIDATED`: stale data being revalidated\n\nCheck `curl -I https://your-app.com/api/products | grep x-vercel-cache` to debug.',
      trade_offs: [
        {
          approach: 'Aggressive edge caching (long TTL)',
          pros: ['Maximum throughput', 'Lowest latency', 'Lowest origin cost'],
          cons: [
            'Stale data during TTL window',
            'Invalidation must be precise — missed tags = indefinitely stale',
            'Cache stampede on TTL expiry',
          ],
        },
        {
          approach: 'Short TTL with stale-while-revalidate',
          pros: ['Near-real-time data', 'Background revalidation keeps latency low', 'Good balance'],
          cons: [
            'Still serves stale data during revalidation window',
            'Not suitable for financial or real-time data',
          ],
        },
        {
          approach: 'No edge caching, always origin',
          pros: ['Always consistent', 'Simple mental model'],
          cons: [
            'Higher latency for non-local users',
            'High origin load',
            'Cannot handle traffic spikes without scaling origin',
          ],
        },
      ],
      real_world_example:
        'A fintech app had pricing data served from Vercel Edge Network. After a price update, traders in Singapore still saw old prices for 5 minutes (Tokyo edge node had cached the old price). Root cause: the products API returned `Cache-Control: public, max-age=300` without cache tags, so on-demand invalidation via `revalidateTag` had no effect. Fix: added `next: { tags: ["pricing", "product-${id}"] }` to all product fetches, ensured every price update called `revalidateTag`. Stale price window: 5min → 0 (immediate invalidation).',
      red_flags: [
        'Not setting `Cache-Control: private` for user-specific data — other users see your data',
        'Missing `Vary: Cookie` for session-dependent but cacheable content — wrong user sees cached data',
        'No cache invalidation strategy — mutations never reflected at edge',
        'Caching GraphQL POST requests without CDN fragment cache support',
        'Debugging cache issues in development — dev mode disables most caching, behavior differs from prod',
      ],
      follow_up_questions: [
        'What is the difference between `max-age`, `s-maxage`, and `stale-while-revalidate` in Cache-Control?',
        'How does Vercel\'s Edge Cache differ from Cloudflare CDN caching for Next.js?',
        'What is cache stampede and how do you prevent it?',
        'How do you implement geo-specific content (different prices per country) without serving wrong region\'s cache?',
      ],
    }),
    topicSlug: 'nextjs',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
];
