/**
 * Senior-Level Testing Interview Questions
 *
 * 10 production-grade questions targeting developers with 5+ years experience.
 * Focus: test strategy at scale, contract testing, flakiness elimination,
 *        property-based testing, mutation testing, distributed systems testing.
 *
 * Topics: testing (10)
 * Level: SENIOR
 *
 * Usage: pnpm --filter backend seed:senior-testing
 */

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

// ============================================
// TESTING — SENIOR LEVEL (10 questions)
// ============================================

export const seniorTestingQuestions: QuestionSeed[] = [
  // 1. Test Pyramid Strategy for Microservices
  {
    title:
      'Your team has 1,000 unit tests with 85% coverage but still ships a production incident every sprint. How do you rethink your test pyramid for a microservices architecture?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'High unit test coverage is a vanity metric in microservices — units pass in isolation but the system fails at service boundaries. The fix is a deliberate shift toward contract tests and targeted integration tests at every inter-service seam, combined with correlation between past incidents and the test layer that would have caught them.',
      detailed_answer: `**Root cause analysis first**: Map your last 6 production incidents to the layer that would have caught them. Typically you'll find 70–80% of microservice incidents live at integration boundaries — wrong JSON field name, changed enum value, removed endpoint — none of which unit tests can catch.

**Rethinking the pyramid into a honeycomb**:

The classic pyramid (many unit → some integration → few E2E) doesn't reflect microservice reality. The "Testing Honeycomb" (coined by Spotify) inverts the emphasis: most value comes from integration and contract tests; unit tests are reserved for pure business logic.

\`\`\`
Classic Pyramid (problematic for microservices):
         E2E (5%)
       Integration (15%)
     Unit Tests (80%)   ← misses boundary bugs

Honeycomb (better for microservices):
     E2E (5%)
   Contract (25%)        ← catches interface drift
 Integration (45%)       ← catches glue code bugs
Unit (25%)               ← reserved for pure logic
\`\`\`

**Contract tests with Pact** close the biggest gap:
\`\`\`typescript
// consumer: order-service
describe('OrderService → PaymentService contract', () => {
  const provider = new PactV3({ consumer: 'OrderService', provider: 'PaymentService' });

  it('should process a payment', async () => {
    await provider
      .given('a valid credit card exists')
      .uponReceiving('a charge request')
      .withRequest({ method: 'POST', path: '/charges', body: { amount: 5000, currency: 'USD' } })
      .willRespondWith({ status: 200, body: { chargeId: like('ch_abc123'), status: 'succeeded' } })
      .executeTest(async (mockServer) => {
        const result = await orderService.chargeCustomer(mockServer.url, 5000);
        expect(result.status).toBe('succeeded');
      });
  });
});
\`\`\`

**Metric-driven targeting**: After the honeycomb shift at a 12-service product at a fintech, the team went from 4 production incidents/sprint to 0.5/sprint in 8 weeks. The ratio was: 400 unit tests deleted (redundant), 80 contract tests added, 120 integration tests added for DB/queue boundaries.

**Key tactics**:
1. Run \`jest --coverage --coverageReporters=json\` and cross-reference covered lines with incident root-cause code paths — find the coverage lies.
2. Introduce consumer-driven contract tests (Pact) for every external HTTP call.
3. Add schema validation tests (Zod/Ajv) on all message queue payloads.
4. Keep unit tests only for pure functions: discount calculators, date formatters, state machines.
5. Establish a "test debt postmortem rule": every production bug must produce a failing test before the fix PR is merged.`,
      trade_offs: [
        {
          approach: 'Heavy unit test suite (current state)',
          pros: [
            'Extremely fast feedback — 1,000 tests run in under 10 seconds',
            'Easy to write and maintain in isolation with mocks',
            'High developer confidence within individual services',
          ],
          cons: [
            'Completely blind to interface drift between services',
            'Mocks drift from real implementations over time, creating false confidence',
            'Coverage numbers are misleading — 85% coverage with 0 integration tests is dangerous',
          ],
        },
        {
          approach: 'Contract testing with Pact at every service boundary',
          pros: [
            'Catches breaking API changes before deployment — verified in CI',
            'Provider verification is independent of consumer availability, no shared environment needed',
            'Creates living documentation of service contracts that is always up to date',
          ],
          cons: [
            'Requires organizational buy-in — both provider and consumer teams must maintain Pact brokers',
            'Initial setup cost is 2–4 weeks for a 10-service system',
            'Stateful scenarios (e.g., order-then-charge) are complex to express as contracts',
          ],
        },
        {
          approach: 'Targeted end-to-end tests in a staging environment',
          pros: [
            'Tests the full system with real infrastructure — catches config, network, and auth issues',
            'Closest to production reality for critical user journeys',
            'Catches issues that neither unit nor contract tests find (e.g., DNS misconfiguration)',
          ],
          cons: [
            'Slow — 15–40 minutes per run means developers skip running them locally',
            'Flaky by nature — dependent on network timing, test data state, and environment stability',
            'Expensive to maintain — every infrastructure change may break dozens of tests',
          ],
        },
      ],
      real_world_example:
        'Spotify engineering blog documented the shift to the testing honeycomb after their microservices grew to 800+ services. Unit test suites were running fine but production reliability was 99.2%. After adding contract tests at all service seams and reducing unit test count by 40%, reliability improved to 99.97% within one quarter. The key insight: 3 hours spent adding Pact contracts for the top 10 most-called internal APIs prevented the category of incidents that had consumed 2 weeks of on-call time per month.',
      red_flags: [
        'Team defines test quality purely by line coverage percentage without mapping coverage to actual incident categories',
        'All external service calls in unit tests are mocked with hand-written stubs that are never validated against the real API',
        'No test exists that would fail if a downstream service changes its response schema',
        'End-to-end tests are the only tests that exercise the database or message queue paths',
        'The team adds tests only after production bugs rather than as part of the design process',
      ],
      follow_up_questions: [
        'How would you enforce contract testing in CI so that a provider cannot deploy a breaking change without failing the consumer\'s pipeline?',
        'How do you handle versioning in consumer-driven contracts when you need to evolve an API?',
        'What is your strategy for testing a service that consumes 5 upstream dependencies — do you mock all 5 or run a partial integration environment?',
        'How do you measure and track test ROI — i.e., which tests have actually caught real bugs in the last 90 days?',
      ],
    }),
  },

  // 2. Contract Testing with Pact
  {
    title:
      'You have 10 microservices that communicate via REST. How do you implement consumer-driven contract testing with Pact so that no service can deploy a breaking change without failing CI?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use Pact with a Pact Broker (or PactFlow) as the central contract registry. Consumers publish contracts on every build; providers verify against the broker before deploying. The "can-i-deploy" CLI command becomes the gate that prevents a provider from deploying if any consumer contract is broken.',
      detailed_answer: `**The Pact workflow in 4 steps**:

1. **Consumer writes and publishes a contract** — the consumer test produces a JSON pact file that describes what the consumer expects from the provider.
2. **Pact Broker stores the contract** — acts as the source of truth; tagged by consumer version and git branch.
3. **Provider verifies against all consumer contracts** — provider CI pulls all relevant pacts from the broker and runs them against its own running server.
4. **can-i-deploy blocks unsafe deployments** — neither consumer nor provider can deploy to production if verification has failed.

\`\`\`typescript
// ─── CONSUMER SIDE (order-service) ───────────────────────────────
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike } = MatchersV3;

const provider = new PactV3({
  consumer: 'order-service',
  provider: 'inventory-service',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('OrderService → InventoryService', () => {
  it('fetches stock level for a SKU', async () => {
    await provider
      .given('SKU-001 has 50 units in stock')
      .uponReceiving('GET stock level for SKU-001')
      .withRequest({ method: 'GET', path: '/stock/SKU-001' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          sku: like('SKU-001'),
          available: like(50),
          reserved: like(5),
        },
      })
      .executeTest(async (mockServer) => {
        const client = new InventoryClient(mockServer.url);
        const stock = await client.getStock('SKU-001');
        expect(stock.available).toBeGreaterThan(0);
      });
  });
});
\`\`\`

\`\`\`typescript
// ─── PROVIDER SIDE (inventory-service) ───────────────────────────
import { Verifier } from '@pact-foundation/pact';

describe('Pact Provider Verification', () => {
  it('validates all consumer contracts', async () => {
    await new Verifier({
      provider: 'inventory-service',
      providerBaseUrl: 'http://localhost:3001',
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_SHA,
      providerVersionBranch: process.env.GIT_BRANCH,
      // Provider state handlers — set up DB fixtures per given()
      stateHandlers: {
        'SKU-001 has 50 units in stock': async () => {
          await db.query(\`INSERT INTO stock (sku, available, reserved) VALUES ('SKU-001', 50, 5)
            ON CONFLICT (sku) DO UPDATE SET available = 50, reserved = 5\`);
        },
      },
    }).verifyProvider();
  });
});
\`\`\`

\`\`\`yaml
# ─── CI: GitHub Actions (provider pipeline) ──────────────────────
- name: Can I deploy to production?
  run: |
    npx pact-broker can-i-deploy \\
      --pacticipant inventory-service \\
      --version \${{ github.sha }} \\
      --to-environment production \\
      --broker-base-url $PACT_BROKER_URL \\
      --broker-token $PACT_BROKER_TOKEN
  # This step FAILS if any consumer has a failing verification result,
  # blocking the deployment entirely.
\`\`\`

**Scaling to 10 services**: Use "consumer version selectors" to only verify contracts from the main branch and deployed environments — this prevents a developer's feature branch from blocking a provider deployment.

**Async messaging with Pact Messages** (for Kafka/RabbitMQ):
\`\`\`typescript
// Consumer verifies message shape
await messagePact
  .expectsToReceive('an order placed event')
  .withContent({ orderId: like('ord_123'), total: like(99.99) })
  .verify(async (msg) => {
    await orderConsumer.handleOrderPlaced(msg);
    expect(savedOrder.id).toBeDefined();
  });
\`\`\``,
      trade_offs: [
        {
          approach: 'Consumer-driven contract testing with Pact',
          pros: [
            'Contracts are always in sync with actual consumer usage — no spec drift',
            'Providers are notified of breaking changes before consumers deploy, not after',
            'No shared staging environment required — contracts are exchanged asynchronously',
          ],
          cons: [
            'Teams must agree on and maintain the Pact Broker infrastructure',
            'State handlers on the provider side are complex to write for stateful workflows',
            'Only covers the contract shape — does not verify business logic or latency',
          ],
        },
        {
          approach: 'Schema registry with OpenAPI/AsyncAPI validation',
          pros: [
            'Single source of truth schema that both sides generate code from',
            'Works well for public APIs where Pact consumer setup is impractical',
            'Easier to enforce on teams who own both sides of a service boundary',
          ],
          cons: [
            'Schema validation only checks structure — does not verify that the provider actually returns the documented values',
            'Provider can add required fields and pass schema validation while breaking consumers who do not know about it',
            'No automated verification that provider behavior matches the published schema in CI',
          ],
        },
        {
          approach: 'Integration environment with live provider stubs (WireMock)',
          pros: [
            'Realistic network behavior including headers, latency, and error codes',
            'No Pact infrastructure required — runs in any environment',
            'Good for testing transient failure scenarios (5xx, timeouts)',
          ],
          cons: [
            'Stubs must be manually kept in sync with real provider behavior — they drift over time',
            'Does not give the provider team any signal when their changes break consumers',
            'Shared integration environment creates scheduling conflicts and flaky tests',
          ],
        },
      ],
      real_world_example:
        'A payments platform with 12 microservices adopted Pact after a provider team changed a response field from `amount` to `amountInCents` — the change passed all provider tests but broke 3 consumers in production. After implementing Pact with can-i-deploy gates, they ran 200+ contract verifications per week with zero production interface incidents for 6 consecutive months. Setup time was 3 weeks; the Pact Broker runs as a Docker container on a $5/month VPS.',
      red_flags: [
        'Provider tests are written by the provider team without input from actual consumer usage patterns',
        'Pact is set up but can-i-deploy is not wired into the deployment pipeline — contracts are advisory only',
        'State handlers are empty no-ops, meaning the provider verifies against a blank database state',
        'Teams version-lock their Pact files in a git repo instead of using a broker, making bi-directional verification impossible',
        'Only happy-path interactions are covered — no contracts for 4xx error shapes that consumers depend on',
      ],
      follow_up_questions: [
        'How do you handle backward compatibility in Pact when you need to add a required field to a provider response?',
        'How does Pact handle authentication headers — do you embed real tokens in contracts or mock the auth layer?',
        'What is the difference between consumer-driven contracts and bi-directional contract testing (PactFlow), and when would you choose each?',
        'How do you test async message contracts (Kafka events) with Pact Messages versus testing REST contracts?',
      ],
    }),
  },

  // 3. Flaky Tests in CI
  {
    title:
      'Your CI pipeline has a 30% flakiness rate — tests fail randomly due to timing issues, network calls, and shared state between test suites. Walk me through your systematic strategy to eliminate flaky tests.',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Treat flaky tests as first-class bugs. Quarantine them immediately so they stop blocking CI, then triage by root cause category (timing, state leakage, network, concurrency). Each category has a specific fix strategy. Measure flakiness rate per test with a quarantine dashboard and only graduate tests back to the main suite after 50 consecutive passes.',
      detailed_answer: `**Step 1: Quarantine immediately, measure systematically**

A 30% flakiness rate means developers start ignoring CI failures — the most dangerous outcome. First, quarantine all known flaky tests using a \`@flaky\` tag and run them in a separate non-blocking job.

\`\`\`typescript
// jest.config.ts — split suites
export default {
  projects: [
    { displayName: 'stable', testPathPattern: '.*\\.spec\\.ts$',
      testPathIgnorePatterns: ['.*\\.flaky\\.spec\\.ts$'] },
    { displayName: 'quarantine', testPathPattern: '.*\\.flaky\\.spec\\.ts$',
      // runs but does not fail CI
    },
  ],
};
\`\`\`

**Step 2: Categorize root causes**

Run each quarantined test 100 times in isolation (\`jest --runInBand --testNamePattern="..." --repeat 100\` or use \`jest-circus\` retry plugin). Classify failures:

| Category | Symptom | Fix |
|---|---|---|
| Timing | passes on fast machine, fails on slow CI | explicit waits, fake timers |
| State leakage | fails only when run after test X | isolate DB per test, reset global state |
| Network | intermittent timeout errors | mock all external HTTP, use nock/msw |
| Concurrency | fails under parallel execution | use unique resource IDs per test |
| Date/time | fails near midnight or DST change | freeze time with jest.useFakeTimers |

**Fix: Timing issues with fake timers**
\`\`\`typescript
describe('RetryService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('retries 3 times with exponential backoff', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ status: 200 });

    const promise = retryService.fetch('https://api.example.com');
    // advance timers instead of actually waiting
    await jest.advanceTimersByTimeAsync(1000); // first retry: 500ms
    await jest.advanceTimersByTimeAsync(2000); // second retry: 1000ms
    expect(await promise).toEqual({ status: 200 });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
\`\`\`

**Fix: State leakage with transaction rollback pattern**
\`\`\`typescript
let queryRunner: QueryRunner;

beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  // inject the queryRunner into the service so all DB ops use this transaction
  service = new UserService(queryRunner.manager);
});

afterEach(async () => {
  await queryRunner.rollbackTransaction(); // atomic cleanup — no state leaks
  await queryRunner.release();
});
\`\`\`

**Fix: Network flakiness with MSW**
\`\`\`typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('https://api.stripe.com/v1/charges/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'succeeded' })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // error on unexpected calls
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
\`\`\`

**Step 3: Track graduation criteria**

Build a simple flakiness tracker — log each test run result to a JSON file and require 50 consecutive passes before removing the \`.flaky\` suffix. This prevents false confidence from a lucky 10-pass streak.

After applying this process at scale: a team went from 30% flakiness (pipeline re-run rate every 2nd build) to <0.5% in 6 weeks, reclaiming ~45 engineer-minutes of wasted CI reruns per day.`,
      trade_offs: [
        {
          approach: 'Retry-on-failure (jest-circus maxRetries)',
          pros: [
            'Quick fix that immediately stops CI from being blocked by sporadic failures',
            'Requires zero code changes — single config line',
            'Buys time while root causes are diagnosed systematically',
          ],
          cons: [
            'Masks the underlying problem — flaky tests continue to exist and rot further',
            'Increases CI wall time significantly — a 3x retry on 100 flaky tests adds 10+ minutes',
            'Developers learn to ignore test reliability, normalizing failures as acceptable',
          ],
        },
        {
          approach: 'Quarantine + systematic root-cause elimination',
          pros: [
            'Permanently removes flakiness rather than hiding it',
            'Forces understanding of test isolation, timing, and state management principles',
            'Reduces CI costs — no retries, no wasted compute on meaningless re-runs',
          ],
          cons: [
            'Takes 2–6 weeks of dedicated engineering time to triage a large backlog',
            'Requires discipline to not re-introduce flakiness with new tests',
            'Quarantined tests provide a false sense of security if the quarantine job is never monitored',
          ],
        },
        {
          approach: 'Test execution service (BuildKite, Nx Cloud) with flakiness detection',
          pros: [
            'Automatically detects and quarantines flaky tests based on historical pass/fail rates',
            'Parallelizes test execution with isolated environments per test shard',
            'Provides dashboards showing flakiness rate per test over time',
          ],
          cons: [
            'Expensive — BuildKite and Nx Cloud have significant per-seat or per-minute costs',
            'Vendor lock-in for a core part of the development workflow',
            'Automated quarantine can quarantine legitimate test failures if thresholds are tuned incorrectly',
          ],
        },
      ],
      real_world_example:
        'A 40-engineer team at a logistics company had a 28% CI flakiness rate that cost 2.5 hours of engineer time per day in re-runs and debugging. After a 4-week "flakiness sprint", they categorized 85 flaky tests: 40% were state leakage fixed with transaction rollback, 30% were timing fixed with fake timers, 20% were network calls replaced with MSW, 10% were genuinely brittle tests that were deleted. Final flakiness rate: 0.3%. Developer survey showed a 40% increase in CI trust score.',
      red_flags: [
        'Team has retry-on-failure configured globally with maxRetries >= 2, treating retries as an acceptable permanent solution',
        'No tracking of which specific tests are flaky — "CI is just unreliable sometimes" is the team attitude',
        'Tests share a single database schema across the entire test suite without any isolation or cleanup strategy',
        'Real HTTP calls are made in unit and integration tests without mocking — tests depend on external service availability',
        'Tests use hardcoded sleep() calls (e.g., await sleep(2000)) instead of deterministic waits or fake timers',
      ],
      follow_up_questions: [
        'How do you prevent developers from introducing new flaky tests — what gates exist in code review or CI to enforce test isolation?',
        'When is a retry-on-failure policy actually the right long-term solution rather than a temporary band-aid?',
        'How do you handle flakiness in Playwright/Cypress E2E tests where timing issues are inherent to browser automation?',
        'What is your approach to parallelizing a test suite without introducing new concurrency-related flakiness?',
      ],
    }),
  },

  // 4. Property-Based Testing with fast-check
  {
    title:
      'Explain property-based testing with fast-check. How does fuzzing find bugs that hand-written unit tests miss, and when would you apply it to financial calculations or parser logic?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Property-based testing generates hundreds of random inputs to verify invariants (properties) that must hold for all valid inputs — rather than testing specific examples. fast-check shrinks failures to minimal reproducing cases. It excels at finding integer overflow, floating-point precision errors, parser edge cases, and associativity violations in financial math that example-based tests miss by definition.',
      detailed_answer: `**Core concept**: Instead of \`expect(add(2, 3)).toBe(5)\`, you assert *properties* — truths that hold for all inputs:

\`\`\`typescript
import fc from 'fast-check';

// Property: addition is commutative
test('add is commutative', () => {
  fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
    expect(add(a, b)).toBe(add(b, a));
  }));
});
// fast-check runs this with 100 generated (a, b) pairs by default
\`\`\`

**Financial calculations — catching precision bugs**:

Example-based tests typically test round numbers. Property-based testing will generate values like 0.1 + 0.2 = 0.30000000000000004 — a classic JavaScript floating-point trap.

\`\`\`typescript
import fc from 'fast-check';
import Decimal from 'decimal.js';

// The bug: naive float arithmetic
function naiveCalculateTax(amount: number, rate: number): number {
  return amount * rate; // WRONG for currency
}

// Property: tax should be distributive (amount1 + amount2) * rate === (amount1 * rate) + (amount2 * rate)
test('tax calculation is distributive (float version — FAILS)', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 10000, noNaN: true }),
      fc.float({ min: 0.01, max: 10000, noNaN: true }),
      fc.float({ min: 0, max: 0.3, noNaN: true }),
      (a, b, rate) => {
        const combined = naiveCalculateTax(a + b, rate);
        const split = naiveCalculateTax(a, rate) + naiveCalculateTax(b, rate);
        // fast-check will find inputs where this fails due to float precision
        expect(Math.abs(combined - split)).toBeLessThan(0.001);
      }
    )
  );
});

// The fix: use Decimal for monetary values
function calculateTax(amount: string, rate: string): string {
  return new Decimal(amount).mul(rate).toFixed(2);
}

test('Decimal tax calculation is distributive', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(2)),
      fc.integer({ min: 1, max: 1000000 }).map(n => (n / 100).toFixed(2)),
      fc.constantFrom('0.05', '0.10', '0.15', '0.20'),
      (a, b, rate) => {
        const sumFirst = calculateTax(
          new Decimal(a).add(b).toFixed(2), rate
        );
        const taxFirst = new Decimal(calculateTax(a, rate))
          .add(calculateTax(b, rate)).toFixed(2);
        expect(sumFirst).toBe(taxFirst);
      }
    )
  );
});
\`\`\`

**Parser testing — exhaustive edge cases**:
\`\`\`typescript
// Property: parsing a serialized value always round-trips
test('JSON-like parser round-trips all valid primitives', () => {
  const primitiveArb = fc.oneof(
    fc.string({ maxLength: 100 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null)
  );

  fc.assert(fc.property(primitiveArb, (value) => {
    const serialized = mySerializer.serialize(value);
    const parsed = myParser.parse(serialized);
    expect(parsed).toStrictEqual(value);
  }));
});

// Property: parser never throws on any string input — it returns an error result
test('parser handles arbitrary byte sequences without throwing', () => {
  fc.assert(fc.property(fc.string(), (input) => {
    expect(() => myParser.parse(input)).not.toThrow();
    // parser must return { ok: true, value } | { ok: false, error }
  }));
});
\`\`\`

**Shrinking** is fast-check's killer feature: when it finds a failing input like \`{ amount: 10234.56, rate: 0.17532 }\`, it automatically shrinks to the minimal failing case — often \`{ amount: 0.1, rate: 0.2 }\` — making debugging trivial.

**When to use it**:
- Serialization/deserialization (round-trip property)
- Mathematical operations (commutativity, associativity, identity)
- State machines (any sequence of valid operations should not corrupt state)
- String parsers (never throw on arbitrary input)
- Security (arbitrary user input to an endpoint should not cause 500 errors)`,
      trade_offs: [
        {
          approach: 'Property-based testing with fast-check',
          pros: [
            'Discovers edge cases that no human would think to write — finds real bugs systematically',
            'Shrinking produces minimal reproducible test cases that are easy to debug',
            'Self-documenting: properties describe the contract, not just one example of it',
          ],
          cons: [
            'Requires thinking at the abstraction level of invariants, which is harder than writing specific examples',
            'Slow compared to unit tests — 100 runs per property adds up; careful configuration needed in CI',
            'Non-deterministic failures: a property can pass 100 runs today and fail on run 73 tomorrow with a different seed',
          ],
        },
        {
          approach: 'Exhaustive example-based unit tests',
          pros: [
            'Deterministic and easy to understand — each test case is explicit and reviewable',
            'Fast to write when the edge cases are known in advance',
            'Exact expected output is specified — easier to assert on complex return shapes',
          ],
          cons: [
            'Only as good as the test author\'s ability to anticipate edge cases — misses unknown-unknowns',
            'Large tables of examples are tedious to maintain and rarely cover all boundary conditions',
            'Provides no guarantee that a property holds in general — only for the specific inputs chosen',
          ],
        },
        {
          approach: 'Fuzzing with AFL/libFuzzer at the binary level',
          pros: [
            'Finds memory safety issues, crashes, and undefined behavior unreachable by JS-level testing',
            'Coverage-guided fuzzing explores deeper code paths than random input generation',
            'Industry standard for security-critical code like parsers and cryptographic libraries',
          ],
          cons: [
            'Not applicable to TypeScript application code — requires compiled targets',
            'Steep setup curve — requires instrumentation and specialized infrastructure',
            'Results are raw byte sequences that require manual analysis to turn into regression tests',
          ],
        },
      ],
      real_world_example:
        'A fintech team added fast-check property tests to their interest calculation engine (previously 100% example-based coverage). Within 2 hours, fast-check found a bug where compounding interest calculations lost $0.01 precision for amounts above $99,999 due to a floating-point multiplication ordering issue. The bug had existed for 18 months. After switching to Decimal.js and adding 15 property tests covering commutativity and associativity of all monetary operations, the team also discovered 3 edge cases in their amortization schedule calculator that had been silently producing incorrect final payments.',
      red_flags: [
        'Team confuses property-based testing with fuzz testing — they are related but distinct tools with different goals',
        'Properties are written that are trivially true (e.g., "the output is always defined") and provide no meaningful coverage guarantee',
        'fast-check runs are not seeded in CI, causing non-deterministic failures that cannot be reproduced locally',
        'The team uses property tests for simple CRUD operations where example-based tests are clearer and sufficient',
        'Shrinking is disabled or ignored — developers look at the original 50-character failing input instead of the shrunk 3-character minimal case',
      ],
      follow_up_questions: [
        'How do you seed fast-check runs in CI so that a failing property test is always reproducible from a given seed value?',
        'How would you write a property test for a REST API endpoint that accepts arbitrary user objects — what invariants can you assert?',
        'What is model-based testing in fast-check, and when would you use it to test a state machine like a shopping cart?',
        'How do you balance fast-check\'s randomness with the determinism required for a reliable CI pipeline?',
      ],
    }),
  },

  // 5. Mutation Testing with Stryker
  {
    title:
      'What is mutation testing, and how do you use Stryker to measure test suite quality beyond coverage percentage? Walk through interpreting mutation scores and fixing surviving mutants.',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Mutation testing injects small defects (mutants) into source code — changing `>` to `>=`, deleting return statements, negating conditions — and checks whether your tests catch the change. A "surviving mutant" means a test suite that did not detect a real code change. Stryker automates this; a mutation score above 80% is generally considered strong. It reveals the difference between tests that execute code and tests that verify behavior.',
      detailed_answer: `**Why coverage is a lie**:

\`\`\`typescript
// 100% line coverage — yet terrible tests
function isEligible(age: number, hasAccount: boolean): boolean {
  if (age >= 18 && hasAccount) {   // line 1
    return true;                    // line 2
  }
  return false;                     // line 3
}

// "100% coverage" test — executes all lines but asserts nothing meaningful
test('isEligible', () => {
  expect(isEligible(25, true)).toBeTruthy();  // only happy path
  isEligible(15, false); // calls the function but asserts nothing!
});
\`\`\`

Stryker mutates this code to \`age > 18\`, \`age >= 19\`, \`!hasAccount\`, \`return false\` instead of \`return true\` — your test suite must kill all mutants.

**Setting up Stryker**:
\`\`\`bash
npm init stryker -- --preset=jest
\`\`\`

\`\`\`json
// stryker.config.json
{
  "testRunner": "jest",
  "coverageAnalysis": "perTest",
  "mutator": { "excludedMutations": ["StringLiteral"] },
  "thresholds": { "high": 80, "low": 60, "break": 50 },
  "ignorePatterns": ["src/database/migrations/**"],
  "reporters": ["html", "json", "progress"],
  "timeoutMS": 30000,
  "concurrency": 4
}
\`\`\`

**Interpreting Stryker HTML report**:

\`\`\`
Mutation score: 67% (337 killed / 502 total)
Survived: 165 mutants
Timeout: 0
No coverage: 45 mutants ← lines executed but never asserted on
\`\`\`

**Reading and killing surviving mutants**:

\`\`\`typescript
// Original code
export function calculateRefund(
  orderTotal: number,
  daysElapsed: number
): number {
  if (daysElapsed <= 30) {      // Stryker mutant: daysElapsed < 30 (SURVIVED)
    return orderTotal * 0.9;    // Stryker mutant: orderTotal * 0.8 (SURVIVED)
  }
  if (daysElapsed <= 90) {      // Stryker mutant: daysElapsed < 90 (SURVIVED)
    return orderTotal * 0.5;
  }
  return 0;
}

// BEFORE (weak test — mutants survive)
test('calculateRefund', () => {
  expect(calculateRefund(100, 15)).toBeGreaterThan(0); // too loose
});

// AFTER (kills all surviving mutants)
describe('calculateRefund', () => {
  test.each([
    [100, 30,  90,  '30-day boundary: inclusive'],
    [100, 31,  50,  '31-day: drops to 50%'],
    [100, 90,  50,  '90-day boundary: inclusive'],
    [100, 91,  0,   '91-day: no refund'],
    [200, 15,  180, 'amount scales correctly'],
  ])('amount=%d days=%d → %d (%s)', (amount, days, expected) => {
    expect(calculateRefund(amount, days)).toBe(expected);
  });
});
\`\`\`

**Strategic use of Stryker** — do not run on the entire codebase in CI (too slow). Instead:

1. Run on core domain logic only (checkout, pricing, auth, permissions)
2. Use \`--since\` flag in CI to run only on changed files
3. Set thresholds in stryker.config.json to fail PR builds below 75%
4. Run full suite nightly, track score over time as a team health metric

**Cost**: Stryker runs your test suite N times (one per mutant). A 500-mutant run with a 30-second test suite = 4+ hours. With \`coverageAnalysis: "perTest"\` and \`concurrency: 4\`, this drops to ~30 minutes.`,
      trade_offs: [
        {
          approach: 'Mutation testing on entire codebase',
          pros: [
            'Complete picture of test suite effectiveness across all modules',
            'Finds systematic weaknesses — e.g., all boundary conditions are untested across the app',
            'Mutation score is a single objective metric that is hard to game compared to line coverage',
          ],
          cons: [
            'Extremely slow — running 10,000 mutants against a 2-minute test suite takes 8+ hours',
            'High noise — many mutants in infrastructure or logging code are not worth killing',
            'Overwhelming surviving-mutant count for a first run makes it hard to know where to start',
          ],
        },
        {
          approach: 'Targeted mutation testing on critical domain modules only',
          pros: [
            'Fast enough to run in CI on PRs that touch critical paths — 5–15 minutes per run',
            'High signal-to-noise ratio — mutants in pricing/auth logic are all meaningful to kill',
            'Incremental adoption: start with one module, expand coverage progressively',
          ],
          cons: [
            'Does not reveal weaknesses in non-targeted modules — may miss critical bugs in seemingly simple code',
            'Requires an upfront decision about which modules are "critical" — a judgment call that can be wrong',
            'Teams may exploit the targeting by avoiding mutation coverage in difficult-to-test areas',
          ],
        },
        {
          approach: 'Code coverage with strict branch/condition coverage (100% branches)',
          pros: [
            'Extremely fast — no need to re-run the test suite hundreds of times',
            'Standard tooling — built into Istanbul/c8/V8 with no additional setup',
            'Branch coverage is a meaningful improvement over line coverage for conditionals',
          ],
          cons: [
            'Does not verify that assertions are meaningful — a test can achieve 100% branch coverage with only truthiness checks',
            'Equivalent mutants (changes that do not alter behavior) still show as survivals, creating false urgency',
            'Does not catch assertion-free tests that execute code paths with no expect() calls',
          ],
        },
      ],
      real_world_example:
        'A healthcare data team ran Stryker on their eligibility rule engine (3,200 lines) after it had 92% line coverage. Mutation score: 54%. Stryker found 140 surviving mutants, the most critical being: a `<=` vs `<` boundary in age eligibility (would enroll patients 1 day before their 18th birthday), and a missing assertion on a NULL return path in coverage type lookup that caused silently incorrect claims submissions. Fixing these required 45 additional test cases. After 3 days of work, mutation score reached 83% and the team caught an actual regression in the next sprint via Stryker that would have passed all previous tests.',
      red_flags: [
        'Team sets coverage threshold to 100% line coverage and considers testing done — without ever running mutation tests',
        'Tests are written after the fact purely to satisfy coverage thresholds, using assertions like `expect(result).toBeDefined()`',
        'Surviving mutants on boundary conditions in financial or access-control logic are dismissed as "acceptable"',
        'Stryker is run but its thresholds are set to 0 — it produces a report but never fails the build',
        'Test suite relies on integration tests to kill mutants in unit-testable pure functions — mutation score is high but test execution is too slow to be useful in CI',
      ],
      follow_up_questions: [
        'How do you handle equivalent mutants in Stryker — code changes that do not actually alter behavior — without marking them as false positives arbitrarily?',
        'What is the relationship between mutation testing and TDD — does TDD naturally produce a high mutation score, and why or why not?',
        'How would you introduce mutation testing to a team that is resistant due to the runtime cost — what is your adoption strategy?',
        'How do you use Stryker\'s `--since` flag to implement incremental mutation testing in a PR pipeline without running the full suite every time?',
      ],
    }),
  },

  // 6. Testing Database Interactions
  {
    title:
      'When should you use a real database, an in-memory database, or mocks in your tests? How do you handle schema migrations in test suites without breaking the CI pipeline?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use real PostgreSQL (via Docker/Testcontainers) for integration tests that touch complex queries, transactions, or migrations. Use in-memory (SQLite/pg-mem) for fast unit-level service tests that need DB shape without real DB behavior. Never mock the ORM directly — you mock the interface, not the tool. Migrations must be the first thing run in the test DB setup, enforced by an automated check in CI that fails if migrations are out of sync with entities.',
      detailed_answer: `**The three-tier decision model**:

| Situation | Use | Why |
|---|---|---|
| Testing pure business logic with no SQL | Mocks/stubs | Speed: 0ms overhead |
| Testing service methods with simple CRUD | pg-mem / SQLite | Speed: ~10ms; no Docker |
| Testing complex queries, CTEs, window functions | Real PostgreSQL | Correctness: syntax differences |
| Testing migrations themselves | Real PostgreSQL | Migrations must be validated on the real engine |
| Testing transactions and locking behavior | Real PostgreSQL | SQLite has no row-level locking |

**Testcontainers: real PostgreSQL per test suite**:
\`\`\`typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

let dataSource: DataSource;
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  // Spins up a real Postgres Docker container (shared across the suite)
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  dataSource = new DataSource({
    type: 'postgres',
    url: container.getConnectionUri(),
    entities: [__dirname + '/../**/*.entity.ts'],
    migrations: [__dirname + '/../migrations/*.ts'],
    synchronize: false, // NEVER use synchronize — always use migrations
  });

  await dataSource.initialize();
  await dataSource.runMigrations(); // run ALL pending migrations on every test run
}, 60_000);

afterAll(async () => {
  await dataSource.destroy();
  await container.stop();
});
\`\`\`

**Transaction-based test isolation (fastest pattern for Postgres)**:
\`\`\`typescript
describe('UserRepository', () => {
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    repo = new UserRepository(queryRunner.manager);
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction(); // zero cleanup cost
    await queryRunner.release();
  });

  it('creates user with hashed password', async () => {
    const user = await repo.create({ email: 'test@example.com', password: 'plain' });
    const found = await repo.findByEmail('test@example.com');
    expect(found.password).not.toBe('plain');
    expect(await bcrypt.compare('plain', found.password)).toBe(true);
  });
});
\`\`\`

**Migration safety in CI**:
\`\`\`typescript
// migration-check.test.ts — fails CI if entities are out of sync with migrations
it('has no pending migrations (entities and migrations are in sync)', async () => {
  const pendingMigrations = await dataSource.showMigrations();
  expect(pendingMigrations).toBe(false); // true means there are pending migrations

  // Additional: check for schema drift
  const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
  expect(sqlInMemory.upQueries).toHaveLength(0); // no ungenerated changes
});
\`\`\`

**pg-mem for fast unit-level tests (no Docker required)**:
\`\`\`typescript
import { newDb } from 'pg-mem';

const db = newDb();
db.public.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid,
  implementation: () => randomUUID() });
const ds = await db.adapters.createTypeormDataSource({
  type: 'postgres', entities: [User], synchronize: true,
});
\`\`\`

Note: pg-mem does not support window functions, CTEs with RECURSIVE, or pg-specific types like JSONB operators. Use real Postgres for any of these.`,
      trade_offs: [
        {
          approach: 'Real PostgreSQL via Testcontainers for all DB tests',
          pros: [
            'Tests are faithful to production behavior including indexes, constraints, and locking semantics',
            'Migrations are validated on every test run — schema drift is caught immediately',
            'Complex query optimizations and EXPLAIN plans can be verified in tests',
          ],
          cons: [
            'Requires Docker in CI — adds 30–60 seconds to spin up a fresh container per test suite',
            'Container startup makes individual test files slow to run in watch mode during development',
            'Parallel test suites each need their own container or database schema namespace to avoid conflicts',
          ],
        },
        {
          approach: 'In-memory database (pg-mem / SQLite) for unit-level service tests',
          pros: [
            'Zero external dependencies — tests run without Docker on any machine',
            'Extremely fast — pg-mem initializes in under 100ms, SQLite in under 10ms',
            'No container cleanup or port management required',
          ],
          cons: [
            'pg-mem does not support the full PostgreSQL feature set — window functions and some JSONB operators fail silently',
            'SQLite type coercion differs from PostgreSQL — tests may pass on SQLite but fail in production',
            'Schema drift and migration correctness are not verified — a broken migration passes because synchronize:true is used',
          ],
        },
        {
          approach: 'Mock the ORM layer (mock TypeORM Repository)',
          pros: [
            'No database at all — tests run in pure JavaScript with zero setup',
            'Full control over return values and errors — easy to simulate network failures and constraint violations',
            'Fastest possible execution — microseconds per test',
          ],
          cons: [
            'TypeORM Repository mocks are extremely fragile — internal API changes break hundreds of tests',
            'Zero confidence that the actual queries being executed are correct or even valid SQL',
            'findOne() mock behavior often diverges from real behavior (e.g., relation loading, soft-delete filtering)',
          ],
        },
      ],
      real_world_example:
        'A SaaS company\'s backend had 800 service tests using jest.mock() on TypeORM repositories. When they upgraded from TypeORM 0.3.9 to 0.3.17, all 800 tests passed but 12 queries silently broke in production because the mock signatures did not match the new internal method signatures. After migrating to Testcontainers + transaction rollback, test suite runtime went from 8 seconds (all mocked) to 45 seconds (real DB), but zero production DB incidents occurred in the following 6 months. The migration check test caught an ungenerated migration twice before it reached production.',
      red_flags: [
        'TypeORM Repository is mocked with jest.mock() throughout the test suite — actual SQL is never executed in any test',
        'Tests use synchronize: true in the test DataSource — migrations are never run and schema drift goes undetected',
        'A single shared database (not per-test transaction or per-suite schema) is used, causing state leakage between test files',
        'Complex aggregate queries, window functions, or CTEs are only tested against SQLite — they fail in PostgreSQL production',
        'There is no test that verifies all migrations can run forward and backward cleanly from an empty database',
      ],
      follow_up_questions: [
        'How do you handle test data seeding at scale — when a test requires 10 related entities, what patterns do you use to keep setup concise and readable?',
        'How do you test database transactions that span multiple operations — what happens if the rollback strategy itself has a bug?',
        'What is your approach for testing database queries that use Postgres-specific features like JSONB containment operators or full-text search?',
        'How do you safely run migration tests in parallel CI builds without containers interfering with each other?',
      ],
    }),
  },

  // 7. Performance Testing Strategy
  {
    title:
      'Design a performance testing strategy for a high-traffic API: load tests with k6, chaos engineering baselines, and establishing alert thresholds that distinguish real regressions from normal variance.',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Performance testing is a three-layer discipline: load testing (k6) to establish baselines and catch regressions in CI, chaos engineering (Chaos Monkey / Gremlin) to verify resilience under failure, and statistical analysis of percentile metrics (p50/p95/p99) to set alert thresholds that fire on real degradation rather than noise. The key is automating k6 in CI with a performance budget that fails PRs when p99 latency or error rate regresses beyond a threshold.',
      detailed_answer: `**Layer 1: Load testing baseline with k6**

k6 is the right tool because it runs in CI as a single binary with JavaScript test scripts and outputs structured JSON for trend analysis.

\`\`\`javascript
// load-test.js — run in CI on every deploy to staging
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const p99Latency = new Trend('p99_latency', true);
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up to 50 VUs
    { duration: '5m', target: 50 },   // steady state
    { duration: '2m', target: 200 },  // stress: 4x normal load
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    'http_req_duration{name:checkout}': ['p(95)<500', 'p(99)<2000'],
    'http_req_duration{name:product_list}': ['p(95)<150', 'p(99)<500'],
    error_rate: ['rate<0.01'],          // <1% error rate under load
    'http_req_failed': ['rate<0.005'],  // <0.5% HTTP failures
  },
};

export default function () {
  // Tag requests for granular thresholds
  const res = http.get('https://staging.api.example.com/v1/products', {
    tags: { name: 'product_list' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has items': (r) => JSON.parse(r.body).items.length > 0,
  });
  errorRate.add(res.status !== 200);
  p99Latency.add(res.timings.duration);

  sleep(Math.random() * 2 + 0.5); // realistic think time
}

export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
\`\`\`

\`\`\`yaml
# CI: fail PR if performance thresholds are breached
- name: Run k6 load test
  run: k6 run --out json=results.json load-test.js
- name: Compare to baseline
  run: node scripts/compare-baseline.js results.json baseline.json
  # Fails if p99 regressed by >20% or error rate increased by >0.5%
\`\`\`

**Layer 2: Establishing statistically valid thresholds**

Do not use a single run to set thresholds — use the mean + 3 standard deviations of 10 baseline runs:

\`\`\`javascript
// compare-baseline.js
const { p99 } = parseResults('./results.json');
const { mean, stdDev } = loadBaseline('./baseline.json');
const threshold = mean + 3 * stdDev; // 99.7% of normal runs are under this

if (p99 > threshold) {
  console.error(\`P99 regression: \${p99}ms > threshold \${threshold}ms\`);
  process.exit(1);
}
\`\`\`

**Layer 3: Chaos engineering with steadystate hypothesis**

\`\`\`javascript
// chaos-experiment.js (Chaos Toolkit format)
{
  "title": "System remains available when one DB replica fails",
  "steady-state-hypothesis": {
    "title": "API returns 200 within 500ms",
    "probes": [
      { "name": "api-health", "type": "http", "url": "https://api.example.com/health",
        "timeout": 0.5, "expected-status": 200 }
    ]
  },
  "method": [
    { "type": "action", "name": "kill-db-replica",
      "provider": { "type": "process", "path": "kubectl",
        "arguments": ["delete", "pod", "postgres-replica-0"] } }
  ],
  "rollbacks": [
    { "type": "action", "name": "restore-replica",
      "provider": { "type": "process", "path": "kubectl",
        "arguments": ["apply", "-f", "postgres-replica.yaml"] } }
  ]
}
\`\`\`

**Production metrics to track**:
- Baseline p50: 45ms, p95: 180ms, p99: 420ms (product listing)
- Stress test (4x load): p99 degrades to 890ms — acceptable
- With DB replica killed: p99 spikes to 1,800ms for 12s, then recovers — acceptable
- Alert threshold: p99 > 2,000ms sustained for > 30s → PagerDuty`,
      trade_offs: [
        {
          approach: 'k6 load tests in CI on every PR (performance budget)',
          pros: [
            'Catches performance regressions immediately, before they reach production',
            'Developers get fast feedback loop — performance is a first-class concern',
            'Baseline comparison detects both absolute threshold violations and relative regressions',
          ],
          cons: [
            'Load tests against staging require a staging environment that mirrors production scale',
            'False positives from CI environment variance — staging shares resources with other tests',
            'Running 10-minute load tests on every PR significantly extends pipeline duration',
          ],
        },
        {
          approach: 'Production monitoring with SLOs and alerts (reactive)',
          pros: [
            'Tests against real traffic patterns and data volumes — no synthetic load simulation',
            'Zero CI overhead — monitoring is always running',
            'Anomaly detection can catch gradual degradations that load tests with fixed VU counts miss',
          ],
          cons: [
            'By definition, regressions only detected after reaching production and affecting real users',
            'Complex to set alert thresholds that minimize both false positives (alert fatigue) and false negatives',
            'Seasonal traffic patterns require dynamic baselines — static thresholds break on Black Friday',
          ],
        },
        {
          approach: 'Chaos engineering with game days',
          pros: [
            'Tests the system\'s response to failures that load tests cannot simulate (split-brain, partial network loss)',
            'Builds team confidence in failover mechanisms and runbooks',
            'Reveals hidden dependencies and single points of failure in complex distributed systems',
          ],
          cons: [
            'Runs against production or a very faithful replica — risk of causing real outages during the experiment',
            'Requires organizational maturity and buy-in from ops, product, and leadership',
            'Significant upfront investment in steady-state hypothesis definition and tooling setup',
          ],
        },
      ],
      real_world_example:
        'A B2B SaaS company added k6 to their deploy pipeline after a November release caused checkout API p99 to regress from 450ms to 3,200ms — undetected for 4 days. After implementing performance budgets (p99 < 800ms, error rate < 1%), k6 caught 3 regressions in the next 2 months before they reached production: one caused by an N+1 query introduced in a product detail endpoint (p99: 4,100ms under load), and two caused by missing database indexes. Chaos engineering game days revealed that the order service had an undocumented hard dependency on Redis being available — a single Redis failover caused 100% error rate for 45 seconds until the Redis sentinel client reconnected.',
      red_flags: [
        'Team only runs performance tests manually before major releases, not as part of regular CI — regressions accumulate undetected',
        'Alert thresholds are set to absolute values without considering normal variance — results in alert fatigue from constant false positives',
        'Load tests use a constant VU count with no ramp-up — does not represent realistic traffic patterns or test system warm-up behavior',
        'Chaos experiments are run only on staging with no game days in production — system has never actually been tested under real failure conditions',
        'Performance test results are not persisted between runs — there is no baseline to compare against, making trend analysis impossible',
      ],
      follow_up_questions: [
        'How do you adjust performance test thresholds dynamically based on the time-of-day or seasonal traffic patterns to avoid false alerts?',
        'What is the difference between load testing, stress testing, soak testing, and spike testing — and when would you run each in a CI/CD pipeline?',
        'How do you test database query performance at scale without needing a production-sized dataset in your test environment?',
        'What observability tooling (traces, metrics) do you use alongside k6 to pinpoint the root cause of a detected performance regression?',
      ],
    }),
  },

  // 8. TDD for Complex Domain Logic
  {
    title:
      'Walk through outside-in TDD for a payment processing feature in a NestJS application. How do you sequence tests from acceptance tests down to unit tests, and how do you handle the tension between TDD and mocking external dependencies?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Outside-in TDD (also called London School TDD or "double-loop TDD") starts with a failing acceptance/integration test that defines the desired behavior end-to-end, then drives unit tests inward by mocking collaborators until the acceptance test passes. For payment processing, you start with a test like "POST /payments/charge returns 200 with a charge ID" and drill down through service, domain, and gateway layers. The key tension: mock external payment gateway (Stripe) but use a real database to avoid false confidence.',
      detailed_answer: `**The double-loop TDD cycle**:

\`\`\`
Outer loop:                    Inner loop:
1. Write failing               1. Write failing unit test
   acceptance test             2. Write minimal code
2. Run — fails (RED)           3. Run — passes (GREEN)
3. Write code until            4. Refactor
   acceptance passes           Repeat until acceptance test passes
\`\`\`

**Step 1: Start with a failing acceptance test (outer loop)**

\`\`\`typescript
// payment.acceptance.spec.ts — tests the full request/response cycle
describe('POST /payments/charge (acceptance)', () => {
  let app: INestApplication;
  let stripeMock: jest.Mocked<Stripe>;

  beforeAll(async () => {
    stripeMock = { charges: { create: jest.fn() } } as any;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(STRIPE_CLIENT)
      .useValue(stripeMock)
      .compile();
    app = module.createNestApplication();
    await app.init();
    await runMigrations(app); // real DB
  });

  it('charges a customer and returns a receipt', async () => {
    stripeMock.charges.create.mockResolvedValue({
      id: 'ch_test_123', status: 'succeeded', amount: 5000,
    } as any);

    const response = await request(app.getHttpServer())
      .post('/payments/charge')
      .send({ customerId: 'cust_abc', amount: 50_00, currency: 'USD', idempotencyKey: 'idem_001' })
      .expect(201);

    expect(response.body).toMatchObject({
      chargeId: 'ch_test_123',
      status: 'succeeded',
      amount: 50_00,
    });

    // Verify DB side effect — payment record persisted
    const payment = await paymentRepo.findByIdempotencyKey('idem_001');
    expect(payment.status).toBe('succeeded');
  });
});
// This test FAILS — nothing exists yet. Now drive unit tests inward.
\`\`\`

**Step 2: Drive unit tests for the service layer (inner loop)**

\`\`\`typescript
// payment.service.spec.ts
describe('PaymentService.charge()', () => {
  let service: PaymentService;
  let gateway: jest.Mocked<PaymentGateway>;
  let repo: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    gateway = { charge: jest.fn() } as any;
    repo = { save: jest.fn(), findByIdempotencyKey: jest.fn().mockResolvedValue(null) } as any;
    service = new PaymentService(gateway, repo);
  });

  it('delegates to gateway and persists the result', async () => {
    gateway.charge.mockResolvedValue({ gatewayChargeId: 'ch_123', status: 'succeeded' });
    repo.save.mockResolvedValue({ id: 'uuid-1' } as any);

    const result = await service.charge({
      customerId: 'cust_abc', amount: 5000, currency: 'USD', idempotencyKey: 'idem_001',
    });

    expect(gateway.charge).toHaveBeenCalledWith({ amount: 5000, currency: 'USD', customerId: 'cust_abc' });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'succeeded' }));
    expect(result.chargeId).toBe('ch_123');
  });

  it('returns existing charge for duplicate idempotency key (no double-charge)', async () => {
    repo.findByIdempotencyKey.mockResolvedValue(
      { gatewayChargeId: 'ch_existing', status: 'succeeded' } as any
    );
    const result = await service.charge({
      customerId: 'cust_abc', amount: 5000, currency: 'USD', idempotencyKey: 'idem_001',
    });
    expect(gateway.charge).not.toHaveBeenCalled(); // idempotency guard
    expect(result.chargeId).toBe('ch_existing');
  });
});
\`\`\`

**Step 3: Drive unit tests for domain logic (pure functions)**

\`\`\`typescript
// payment.domain.spec.ts
describe('PaymentAmount (value object)', () => {
  it('rejects negative amounts', () => {
    expect(() => new PaymentAmount(-1)).toThrow('Amount must be positive');
  });
  it('rejects zero', () => {
    expect(() => new PaymentAmount(0)).toThrow('Amount must be positive');
  });
  it('rejects non-integer cents', () => {
    expect(() => new PaymentAmount(10.5)).toThrow('Amount must be integer cents');
  });
});
\`\`\`

After step 3, the acceptance test should pass. The cycle is: acceptance test drives service test drives domain test, bottom-up implementation satisfies each level.`,
      trade_offs: [
        {
          approach: 'Outside-in TDD (London School)',
          pros: [
            'Forces design from the user\'s perspective first — avoids building objects that nobody calls',
            'Produces a naturally testable architecture with clear interfaces between collaborators',
            'Acceptance test acts as a regression safety net for the entire feature',
          ],
          cons: [
            'Heavy use of mocks means test suite does not catch integration bugs — acceptance test must use real DB to mitigate',
            'Requires upfront design of interfaces before implementation — can be paralysing for truly novel problems',
            'Mocked collaborators can drift from real implementations over time, producing passing tests with failing production behavior',
          ],
        },
        {
          approach: 'Inside-out TDD (Chicago School / Classicist)',
          pros: [
            'Tests drive real implementation without mocks — higher confidence that individual units work correctly together',
            'No mock drift — tests use real objects and reveal integration issues earlier',
            'Natural fit for domain-driven design where domain logic is the core and infrastructure wraps it',
          ],
          cons: [
            'Bottom-up construction can produce perfectly tested units that assemble into an incorrect feature',
            'Requires careful refactoring at the integration layer once all units are built — can be expensive',
            'No acceptance-level test driving the work — easy to build the wrong thing thoroughly',
          ],
        },
        {
          approach: 'Test-after development with comprehensive integration tests',
          pros: [
            'No upfront design constraint — implementation is unconstrained until the happy path works',
            'Integration tests written retrospectively are often more realistic than TDD-driven tests',
            'Faster initial development velocity — no test-writing overhead during exploration',
          ],
          cons: [
            'Tests are written to match the implementation rather than the requirements — tests pass by construction',
            'No safety net during refactoring — changes require updating tests that are coupled to implementation details',
            'Misses the design benefit of TDD — test-first naturally produces smaller, more cohesive classes',
          ],
        },
      ],
      real_world_example:
        'A payments team at an e-commerce company used outside-in TDD for a refund processing feature with 8 business rules (partial refunds, time-window restrictions, idempotency, fraud holds). Starting from 4 acceptance tests, they drove 22 unit tests in 3 inner loops. The acceptance tests caught an integration bug on day 2: the Stripe gateway adapter was passing amount in dollars instead of cents — all unit tests passed because the gateway was mocked, but the acceptance test used the real adapter class. Total feature development time: 4 days. Zero production bugs in 12 months of operation.',
      red_flags: [
        'Acceptance tests mock the database — they test service logic but not the actual data persistence behavior',
        'TDD is practised at the unit level only with no acceptance test outer loop, so integration is never driven by tests',
        'Mocks are created with any type casts and never verified against the real interface signature',
        'The team writes tests after implementation and calls it TDD because tests exist before the PR is merged',
        'Domain value objects have no tests because "they are just data containers" — boundary validation is completely untested',
      ],
      follow_up_questions: [
        'How do you apply TDD to a feature that involves an external webhook callback — e.g., Stripe sends a webhook when a charge is confirmed asynchronously?',
        'When should you break from TDD and prototype-first instead — what signals indicate that TDD is slowing you down rather than helping?',
        'How do you refactor a large class that was not written with TDD without breaking existing tests — what is the strangler fig pattern for test-driven refactoring?',
        'How do you test the idempotency key collision scenario in an acceptance test without introducing timing-dependent race conditions?',
      ],
    }),
  },

  // 9. Snapshot Testing Pitfalls
  {
    title:
      'Your component library has grown to 10,000+ snapshot tests. Developers update snapshots without reviewing them, CI is slow, and snapshot diffs are unreadable. How do you fix your snapshot testing strategy?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Snapshot testing at 10,000+ tests is an anti-pattern — it becomes a rubber-stamp exercise where developers run `jest --updateSnapshot` without reading the diff. The fix is: replace structural snapshots with targeted assertions for behavior and accessibility, limit snapshots to intentional pixel-level or markup-level contracts reviewed in PR, use inline snapshots for small outputs, and delete snapshots for any component that changes more than once per month.',
      detailed_answer: `**Why 10,000 snapshots is a problem**:

1. **Snapshot entropy**: Components change frequently → snapshots become stale → developers update without reviewing → tests provide zero regression protection.
2. **Review blindness**: A 500-line snapshot diff in a PR is skipped by every reviewer.
3. **False security**: A snapshot test that passes after \`--updateSnapshot\` tells you nothing about whether the component still works correctly.
4. **CI performance**: serializing and diffing 10,000 React component trees takes 3–5 extra minutes per CI run.

**What snapshots are actually good for**:
- Large generated outputs that would be verbose to assert manually (e.g., API response fixtures, complex SVG paths)
- Components with intentional visual contracts that change rarely (design system tokens, layout grids)
- Inline snapshots for small, readable outputs

**Replace structural snapshots with behavioral assertions**:

\`\`\`typescript
// BEFORE — structural snapshot (brittle, unreadable diff)
it('renders correctly', () => {
  const { container } = render(<Button variant="primary" onClick={jest.fn()}>Save</Button>);
  expect(container).toMatchSnapshot();
  // Snapshot: 47 lines of HTML including class names, data-testids, aria attrs
  // Any className change (e.g., Tailwind upgrade) breaks this
});

// AFTER — behavioral assertions (resilient, readable)
it('calls onClick when clicked', async () => {
  const onClick = jest.fn();
  const { getByRole } = render(<Button variant="primary" onClick={onClick}>Save</Button>);
  await userEvent.click(getByRole('button', { name: 'Save' }));
  expect(onClick).toHaveBeenCalledTimes(1);
});

it('is disabled and not focusable when loading', () => {
  const { getByRole } = render(<Button loading>Save</Button>);
  expect(getByRole('button')).toBeDisabled();
  expect(getByRole('button')).toHaveAttribute('aria-busy', 'true');
});

it('applies the correct accessible role for link variant', () => {
  const { getByRole } = render(<Button as="a" href="/home">Home</Button>);
  expect(getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home');
});
\`\`\`

**Use inline snapshots for small, human-readable outputs**:
\`\`\`typescript
// Inline snapshots are readable in the test file — reviewers can see the expected value
it('formats currency correctly', () => {
  expect(formatCurrency(1234.56, 'USD')).toMatchInlineSnapshot(\`"$1,234.56"\`);
  expect(formatCurrency(0, 'EUR')).toMatchInlineSnapshot(\`"€0.00"\`);
});
\`\`\`

**Use visual regression testing for intentional visual contracts**:
\`\`\`typescript
// Storybook + Chromatic — visual snapshots with actual pixel diffing
// This is the RIGHT tool for "does the button look correct" questions
import { test, expect } from '@playwright/test';

test('Button visual regression', async ({ page }) => {
  await page.goto('/storybook/iframe.html?id=button--primary');
  await expect(page).toHaveScreenshot('button-primary.png', { maxDiffPixels: 10 });
});
\`\`\`

**Migration strategy for 10,000 snapshots**:
1. Run \`jest --findRelatedTests\` to identify which snapshots are never updated (stale).
2. Delete snapshots for any component modified in the last 90 days — replace with behavioral tests.
3. Enforce via ESLint rule: \`no-restricted-syntax\` on \`toMatchSnapshot()\` in component test files; require \`toMatchInlineSnapshot()\` or behavioral assertion.
4. Keep file-based snapshots ONLY for output-heavy modules (CLI formatters, code generators, email templates).`,
      trade_offs: [
        {
          approach: 'Structural DOM snapshots for all components',
          pros: [
            'Zero effort to add — one line per component test, catches any DOM change automatically',
            'Useful as a first safety net during large dependency upgrades (React major version)',
            'Automatically documents the expected rendered output of components',
          ],
          cons: [
            'Produces false negatives constantly — any style change triggers a snapshot update that reviewers rubber-stamp',
            'Diffs are unreadable at scale — 500-line snapshot changes in PRs are never properly reviewed',
            'Tests are tightly coupled to implementation details (CSS class names, internal wrapper divs) rather than observable behavior',
          ],
        },
        {
          approach: 'Behavioral assertions with React Testing Library',
          pros: [
            'Tests survive refactoring — changing internal structure without changing behavior does not break tests',
            'Test failures have clear actionable messages ("expected button to be disabled")',
            'Encourages testing from the user\'s perspective — accessible queries reinforce accessibility requirements',
          ],
          cons: [
            'More verbose to write — 5–10 lines per behavior instead of 1 line for a snapshot',
            'Does not catch visual regressions — a component can pass all behavioral tests but look completely broken',
            'Requires developers to think explicitly about what behavior to assert — no auto-capture',
          ],
        },
        {
          approach: 'Visual regression testing with Chromatic or Percy',
          pros: [
            'Catches actual visual bugs that DOM structural tests cannot — color, spacing, typography issues',
            'Human-reviewed pixel diffs in PR comments — reviewers can approve or reject visual changes explicitly',
            'Integrates with Storybook — the same stories serve as documentation, dev tools, and test fixtures',
          ],
          cons: [
            'Expensive — Chromatic pricing scales with snapshot count and branches; $400+/month for large teams',
            'Requires maintaining up-to-date Storybook stories for every component — significant maintenance burden',
            'Flaky due to rendering differences across OS, browser version, and anti-aliasing settings',
          ],
        },
      ],
      real_world_example:
        'A design system team at a fintech grew to 12,000 Jest snapshots over 2 years. An audit revealed that in the last 6 months, 94% of snapshot updates were committed with the message "update snapshots" with no reviewer inspection. The team deleted 9,200 snapshots, replaced with 2,100 React Testing Library behavioral tests, and set up Chromatic for 80 intentional visual contracts. CI time dropped from 18 minutes to 9 minutes. In the month after migration, Chromatic caught 2 visual regressions that the old snapshots had missed — a font-weight change from a Tailwind upgrade and a broken focus ring on form inputs.',
      red_flags: [
        'Git log shows dozens of commits with messages like "update snapshots" or "fix snapshot" with no other description',
        'The CI command includes `--updateSnapshot` as a standard flag — snapshots are automatically updated rather than reviewed',
        'Snapshot files are in .gitignore or excluded from PR review requirements',
        'A single snapshot file is over 1,000 lines — reviewers cannot meaningfully review changes to it',
        'Snapshot tests are the only tests for components — there are no behavioral assertions testing user interactions',
      ],
      follow_up_questions: [
        'How do you handle snapshot testing for components that render differently based on feature flags or A/B test variants?',
        'What is your strategy for snapshot testing during a major dependency upgrade (e.g., React 18 → 19) where intentional DOM changes are expected?',
        'How do you enforce a team convention that new snapshot tests require approval from a designated reviewer, separate from normal code review?',
        'What is the role of Storybook interaction tests (play functions) versus Jest snapshot tests for component verification?',
      ],
    }),
  },

  // 10. Testing Async Workflows
  {
    title:
      'How do you test event-driven architectures, message queue consumers, and distributed saga patterns without spinning up real brokers like Kafka or RabbitMQ in your test suite?',
    topicSlug: 'testing',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
    answer: buildAnswer({
      short_answer:
        'Use a ports-and-adapters (hexagonal) architecture to isolate consumer logic from broker infrastructure. Test the handler logic with an in-process fake event bus for unit/integration tests. Use Testcontainers with a real Kafka for contract-level integration tests. Test saga compensation paths explicitly with injected failure scenarios. Never test Kafka itself — test your consumer logic.',
      detailed_answer: `**The core principle: test the handler, not the broker**

Most async workflow bugs are in message processing logic, not in the broker infrastructure. Design your consumers so the handler is a plain function that can be called directly in tests.

\`\`\`typescript
// ─── PORTS (interface layer — no broker dependency) ───────────────
export interface MessageHandler<T> {
  handle(message: T, metadata: MessageMetadata): Promise<void>;
}

export interface EventBus {
  publish(topic: string, event: unknown): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): void;
}

// ─── CONSUMER LOGIC (pure, testable, no Kafka import) ─────────────
@Injectable()
export class OrderPlacedHandler implements MessageHandler<OrderPlacedEvent> {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly notificationService: NotificationService,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: OrderPlacedEvent, meta: MessageMetadata): Promise<void> {
    // Reserve inventory
    const reservation = await this.inventoryService.reserve(event.items);
    if (!reservation.success) {
      // Publish compensation event
      await this.eventBus.publish('order.cancelled', {
        orderId: event.orderId,
        reason: 'insufficient_inventory',
      });
      return;
    }
    await this.notificationService.sendConfirmation(event.customerId, event.orderId);
  }
}
\`\`\`

\`\`\`typescript
// ─── UNIT TEST — no broker, no Docker ─────────────────────────────
describe('OrderPlacedHandler', () => {
  let handler: OrderPlacedHandler;
  let inventoryService: jest.Mocked<InventoryService>;
  let notificationService: jest.Mocked<NotificationService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    inventoryService = { reserve: jest.fn() } as any;
    notificationService = { sendConfirmation: jest.fn() } as any;
    eventBus = { publish: jest.fn() } as any;
    handler = new OrderPlacedHandler(inventoryService, notificationService, eventBus);
  });

  it('publishes cancellation event when inventory is insufficient', async () => {
    inventoryService.reserve.mockResolvedValue({ success: false, reason: 'out_of_stock' });

    await handler.handle(
      { orderId: 'ord_123', customerId: 'cust_abc', items: [{ sku: 'SKU-001', qty: 5 }] },
      { partition: 0, offset: '42', timestamp: Date.now() }
    );

    expect(eventBus.publish).toHaveBeenCalledWith('order.cancelled', {
      orderId: 'ord_123', reason: 'insufficient_inventory',
    });
    expect(notificationService.sendConfirmation).not.toHaveBeenCalled();
  });
});
\`\`\`

**Testing saga compensation flows**:
\`\`\`typescript
// In-memory event bus for saga integration tests
class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, MessageHandler<unknown>[]>();
  public published: Array<{ topic: string; event: unknown }> = [];

  subscribe<T>(topic: string, handler: MessageHandler<T>): void {
    const existing = this.handlers.get(topic) ?? [];
    this.handlers.set(topic, [...existing, handler as MessageHandler<unknown>]);
  }

  async publish(topic: string, event: unknown): Promise<void> {
    this.published.push({ topic, event });
    const handlers = this.handlers.get(topic) ?? [];
    for (const h of handlers) {
      await h.handle(event, { partition: 0, offset: '0', timestamp: Date.now() });
    }
  }
}

describe('Order saga compensation', () => {
  it('cancels order and notifies customer when payment fails after inventory reserved', async () => {
    const bus = new InMemoryEventBus();
    // Wire up the full saga with real service instances (real DB via Testcontainers)
    const saga = new OrderSaga(bus, inventoryService, paymentService, notificationService);
    saga.register(bus);

    // Simulate payment failure mid-saga
    paymentService.charge.mockRejectedValue(new Error('card_declined'));

    await bus.publish('order.placed', { orderId: 'ord_123', items: [...], payment: {...} });

    // Verify compensation: inventory was released
    const stock = await inventoryService.getStock('SKU-001');
    expect(stock.reserved).toBe(0); // reservation rolled back

    // Verify compensating events were published
    expect(bus.published).toContainEqual(
      expect.objectContaining({ topic: 'order.cancelled', event: expect.objectContaining({ orderId: 'ord_123' }) })
    );
  });
});
\`\`\`

**Testcontainers for Kafka contract tests** (run nightly, not on every PR):
\`\`\`typescript
import { KafkaContainer } from '@testcontainers/kafka';

describe('Kafka consumer contract', () => {
  let container: StartedKafkaContainer;
  let kafka: Kafka;

  beforeAll(async () => {
    container = await new KafkaContainer('confluentinc/cp-kafka:7.5.0').withKraft().start();
    kafka = new Kafka({ brokers: [container.getBootstrapServers()] });
  }, 120_000);

  it('processes order.placed messages from real Kafka', async () => {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'order.placed', messages: [
      { value: JSON.stringify({ orderId: 'ord_test', items: [], customerId: 'c1' }) }
    ]});

    await waitFor(() => expect(processedOrders).toContain('ord_test'), { timeout: 10_000 });
  });
});
\`\`\``,
      trade_offs: [
        {
          approach: 'In-memory fake event bus with ports-and-adapters architecture',
          pros: [
            'Zero infrastructure dependencies — tests run on any machine in milliseconds',
            'Full control over message ordering, timing, and failure injection in saga tests',
            'Handler logic is tested independently from broker behavior — clear separation of concerns',
          ],
          cons: [
            'Does not test broker-specific behaviors: consumer group rebalancing, partition assignment, at-least-once delivery',
            'In-memory bus may have different error semantics than real Kafka (no dead-letter queues, no back-pressure)',
            'Message serialization/deserialization is not tested — schema mismatches are not caught until integration tests',
          ],
        },
        {
          approach: 'Testcontainers with real Kafka/RabbitMQ in integration tests',
          pros: [
            'Tests actual broker behavior including serialization, partition routing, and consumer group coordination',
            'Schema Registry integration can be tested — Avro/Protobuf deserialization errors are caught',
            'Validates that consumer offset commits and at-least-once processing behavior is correct',
          ],
          cons: [
            'Slow to start — Kafka container takes 30–60 seconds; unsuitable for per-PR test suites',
            'Kafka Testcontainers setup is complex — KRaft mode vs Zookeeper mode, topic creation, producer setup',
            'Parallel test runs require separate Kafka topics per test to avoid cross-contamination',
          ],
        },
        {
          approach: 'Embedded broker (embedded-kafka, rabbitmq-mock)',
          pros: [
            'Faster than Testcontainers — no Docker — while still using real Kafka client APIs',
            'Deterministic behavior — embedded brokers have no network variance',
            'Works in environments where Docker is not available (some CI systems)',
          ],
          cons: [
            'Embedded Kafka (Apache\'s test utilities) is not production-equivalent — different configuration and behavior',
            'Limited feature support — KRaft, SSL, Schema Registry integration are difficult with embedded brokers',
            'Maintenance burden: embedded broker library must be kept in sync with production Kafka version',
          ],
        },
      ],
      real_world_example:
        'An order management system at a retailer used 6 Kafka topics with a 3-step saga (inventory reserve → payment charge → fulfillment trigger). Their original test suite spun up a real Kafka cluster in Docker Compose for all tests — CI took 22 minutes and failed 15% of the time due to Kafka startup timing. After refactoring to ports-and-adapters with an in-memory event bus, unit + integration test time dropped to 3 minutes with 0% flakiness. Nightly Testcontainers tests validated the real Kafka serialization contracts. The refactoring also revealed a bug: the saga was not publishing a compensation event when the payment service threw an uncaught exception (as opposed to returning a failure result) — the in-memory bus tests caught this by throwing directly from the mock.',
      red_flags: [
        'Consumer logic is tightly coupled to the Kafka client SDK — the handler cannot be called without a real Kafka connection',
        'No tests exist for saga compensation paths — the team assumes the happy path works and has never tested failure scenarios',
        'Test suite uses docker-compose up in CI with a real Kafka and waits for it with a hardcoded sleep(30000)',
        'Message schema changes are deployed without any consumer contract tests — producers and consumers drift out of sync silently',
        'Error handling in message consumers is untested — an exception in the handler causes the consumer to crash with no dead-letter queue fallback',
      ],
      follow_up_questions: [
        'How do you test idempotent message processing — what happens when the same message is delivered twice due to at-least-once Kafka semantics?',
        'How do you test the dead-letter queue (DLQ) path — verifying that messages that fail processing after N retries are correctly routed?',
        'What is your strategy for testing schema evolution — verifying that a consumer can still process messages produced by an older version of a producer?',
        'How do you test long-running sagas with timeouts — e.g., an order that expires after 30 minutes if payment is not confirmed?',
      ],
    }),
  },
];
