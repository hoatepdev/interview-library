/**
 * Middle-Level Testing Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: unit testing, integration testing, E2E, mocking, TDD, test architecture.
 *
 * Topics: testing (20)
 * Level: MIDDLE
 *
 * NOTE: This batch also creates the "testing" topic if it doesn't exist.
 *
 * Usage: pnpm --filter backend seed:middle-testing
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

export const newTopic = {
  name: "Testing",
  slug: "testing",
  description:
    "Unit testing, integration testing, E2E, mocking, TDD, test architecture",
  icon: "FlaskConical",
  color: "#10B981",
};

// ============================================
// TESTING — MIDDLE LEVEL (20 questions)
// ============================================

export const middleTestingQuestions: QuestionSeed[] = [
  // 1. Unit vs Integration vs E2E
  {
    title: "Explain the testing pyramid and when to use unit, integration, and E2E tests",
    content:
      "What is the testing pyramid? How do you decide what percentage of each test type to write? What are the trade-offs?",
    answer: `**Testing Pyramid**:
\`\`\`
        /  E2E  \\          Few — slow, expensive, fragile
       / Integration \\     Some — moderate speed, realistic
      /    Unit Tests    \\  Many — fast, cheap, isolated
\`\`\`

**Unit Tests** — test a single function/class in isolation:
\`\`\`typescript
// Pure function — ideal for unit testing
function calculateDiscount(price: number, tier: string): number {
  if (tier === 'gold') return price * 0.2;
  if (tier === 'silver') return price * 0.1;
  return 0;
}

describe('calculateDiscount', () => {
  it('should return 20% for gold tier', () => {
    expect(calculateDiscount(100, 'gold')).toBe(20);
  });
  it('should return 0 for unknown tier', () => {
    expect(calculateDiscount(100, 'bronze')).toBe(0);
  });
});
\`\`\`

**Integration Tests** — test multiple components working together:
\`\`\`typescript
// Test service + database interaction
describe('UserService (integration)', () => {
  let service: UserService;
  let db: DataSource;

  beforeAll(async () => {
    db = await createTestDatabase();
    service = new UserService(db.getRepository(User));
  });

  it('should create and retrieve a user', async () => {
    const user = await service.create({ name: 'John', email: 'john@test.com' });
    const found = await service.findById(user.id);
    expect(found.email).toBe('john@test.com');
  });

  afterAll(() => db.destroy());
});
\`\`\`

**E2E Tests** — test the full system as a user would:
\`\`\`typescript
// Playwright / Cypress
test('user can log in and see dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@test.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
\`\`\`

**Comparison**:

| Type | Speed | Confidence | Maintenance | Isolation |
|------|-------|------------|-------------|-----------|
| Unit | ~1ms | Low (tested in isolation) | Low | Full |
| Integration | ~100ms | Medium | Medium | Partial |
| E2E | ~5s | High (real user flow) | High | None |

**Practical ratio**: 70% unit, 20% integration, 10% E2E — but adjust to your app. API-heavy backend: more integration. UI-heavy frontend: more E2E.

**The "Testing Trophy"** (Kent C. Dodds): Emphasizes integration tests over unit tests for frontend code — because UI components rarely work in isolation.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 2. Mocking and Stubbing
  {
    title: "Explain the difference between mocks, stubs, spies, and fakes",
    content:
      "When should you use each type of test double? What are the dangers of over-mocking?",
    answer: `**Test Doubles** — objects that stand in for real dependencies:

**Stub** — returns predetermined data, no behavior verification:
\`\`\`typescript
// Stub: replace DB call with fixed data
const userRepo = {
  findById: jest.fn().mockResolvedValue({ id: '1', name: 'John', email: 'john@test.com' }),
};
const service = new UserService(userRepo as any);
const user = await service.getUser('1');
expect(user.name).toBe('John');
// We don't care HOW findById was called — just that service returns the right result
\`\`\`

**Mock** — verifies interactions (was it called? with what args?):
\`\`\`typescript
// Mock: verify that the email service was called correctly
const emailService = { sendWelcome: jest.fn() };
const service = new UserService(userRepo, emailService as any);
await service.createUser({ name: 'John', email: 'john@test.com' });

expect(emailService.sendWelcome).toHaveBeenCalledWith('john@test.com', 'John');
expect(emailService.sendWelcome).toHaveBeenCalledTimes(1);
\`\`\`

**Spy** — wraps real implementation, records calls:
\`\`\`typescript
// Spy: use real implementation but track calls
const spy = jest.spyOn(userRepo, 'save');
await service.createUser(userData);
expect(spy).toHaveBeenCalledWith(expect.objectContaining({ email: 'john@test.com' }));
spy.mockRestore(); // restore original implementation
\`\`\`

**Fake** — simplified working implementation:
\`\`\`typescript
// Fake: in-memory database instead of real PostgreSQL
class FakeUserRepository {
  private users: User[] = [];

  async save(user: User) {
    this.users.push(user);
    return user;
  }

  async findById(id: string) {
    return this.users.find(u => u.id === id) || null;
  }
}
\`\`\`

**When to use each**:

| Double | Use When |
|--------|----------|
| Stub | You need canned data; don't care about interactions |
| Mock | You need to verify a side effect happened (email sent, event published) |
| Spy | You want to verify calls but keep real behavior |
| Fake | You need a working in-memory replacement (DB, file system) |

**Dangers of over-mocking**:
- Tests pass but production breaks (mocks don't match real behavior)
- Tests become coupled to implementation, not behavior
- Refactoring breaks tests even when behavior is unchanged
- False confidence — "100% test pass" but nothing actually tested

**Rule of thumb**: Mock at the boundary (HTTP, DB, external APIs), test business logic with real objects.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 3. Testing Async Code
  {
    title: "How do you test asynchronous code in JavaScript?",
    content:
      "Explain patterns for testing promises, async/await, callbacks, timers, and event-driven code with Jest.",
    answer: `**Async/await** — most common and cleanest:
\`\`\`typescript
it('should fetch user data', async () => {
  const user = await userService.findById('123');
  expect(user.name).toBe('John');
});

it('should throw on invalid id', async () => {
  await expect(userService.findById('invalid')).rejects.toThrow('User not found');
});
\`\`\`

**Promise-based**:
\`\`\`typescript
it('should resolve with user', () => {
  return userService.findById('123').then(user => {
    expect(user.name).toBe('John');
  });
});
\`\`\`

**Callbacks** (legacy):
\`\`\`typescript
it('should call back with data', (done) => {
  fetchData((err, data) => {
    expect(err).toBeNull();
    expect(data).toBe('hello');
    done(); // MUST call done() or test times out
  });
});
\`\`\`

**Fake timers** (setTimeout, setInterval, Date):
\`\`\`typescript
describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('should call function after delay', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on rapid calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    jest.advanceTimersByTime(200);
    debounced(); // reset timer
    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled(); // only 200ms since last call

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
\`\`\`

**Testing intervals/polling**:
\`\`\`typescript
it('should poll until condition is met', async () => {
  jest.useFakeTimers();
  let count = 0;
  const checkReady = jest.fn(() => ++count >= 3);

  const promise = pollUntilReady(checkReady, 1000);

  jest.advanceTimersByTime(1000); // 1st poll
  jest.advanceTimersByTime(1000); // 2nd poll
  jest.advanceTimersByTime(1000); // 3rd poll — ready

  await promise;
  expect(checkReady).toHaveBeenCalledTimes(3);
  jest.useRealTimers();
});
\`\`\`

**Mocking Date**:
\`\`\`typescript
it('should use current date', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));

  const result = createToken();
  expect(result.issuedAt).toBe('2024-01-15T10:00:00.000Z');

  jest.useRealTimers();
});
\`\`\`

**Common pitfall**: Forgetting \`await\` in async tests — test passes but assertions never run:
\`\`\`typescript
// BAD: Missing await — test always passes!
it('should throw', () => {
  expect(asyncFn()).rejects.toThrow(); // no await!
});

// GOOD:
it('should throw', async () => {
  await expect(asyncFn()).rejects.toThrow();
});
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 4. Testing React Components
  {
    title: "How do you test React components with React Testing Library?",
    content:
      "Explain the philosophy of React Testing Library, how to query elements, test user interactions, and test hooks.",
    answer: `**Philosophy**: Test components the way users interact with them — by visible text, labels, roles — not by implementation details (class names, component state).

**Basic component test**:
\`\`\`typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'john@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'john@test.com',
      password: 'password123',
    });
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
\`\`\`

**Query priority** (from most to least preferred):
\`\`\`typescript
// 1. Accessible queries (best — how screen readers see it)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/search/i);
screen.getByText(/welcome/i);
screen.getByAltText(/profile photo/i);

// 2. Semantic queries
screen.getByTitle(/close/i);

// 3. Test IDs (last resort — implementation detail)
screen.getByTestId('submit-btn');
\`\`\`

**Async queries** (waiting for elements to appear):
\`\`\`typescript
it('should load and display users', async () => {
  render(<UserList />);

  // Wait for loading to finish
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // waitFor / findBy — waits up to 1s by default
  const users = await screen.findAllByRole('listitem');
  expect(users).toHaveLength(3);
});
\`\`\`

**Mocking API calls**:
\`\`\`typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) =>
    res(ctx.json([{ id: '1', name: 'John' }]))
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('should display users from API', async () => {
  render(<UserList />);
  expect(await screen.findByText('John')).toBeInTheDocument();
});
\`\`\`

**Testing custom hooks**:
\`\`\`typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);

  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 5. Testing API Endpoints
  {
    title: "How do you write integration tests for REST API endpoints?",
    content:
      "Explain how to test NestJS or Express endpoints with Supertest, including authentication, database setup, and cleanup.",
    answer: `**Supertest** — HTTP assertions without starting a real server:

**NestJS E2E test setup**:
\`\`\`typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should return 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });

    it('should return users for authenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', \`Bearer \${testToken}\`)
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
        ]),
      );
    });
  });

  describe('POST /api/users', () => {
    it('should create a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ name: 'Jane', email: 'jane@test.com' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Jane',
        email: 'jane@test.com',
      });
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ name: 'Jane', email: 'not-an-email' })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });
});
\`\`\`

**Database setup and cleanup**:
\`\`\`typescript
// Use a test database
// .env.test: DB_NAME=myapp_test

// Option A: Transaction rollback (fastest)
beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();
});
afterEach(async () => {
  await queryRunner.rollbackTransaction();
  await queryRunner.release();
});

// Option B: Truncate tables between tests
afterEach(async () => {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repo = dataSource.getRepository(entity.name);
    await repo.query(\`TRUNCATE TABLE "\${entity.tableName}" CASCADE\`);
  }
});

// Option C: Testcontainers (fresh DB per test suite)
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  // Use container.getConnectionUri() for DB connection
}, 30000);
afterAll(async () => {
  await container.stop();
});
\`\`\`

**Test helpers**:
\`\`\`typescript
// Factory functions for test data
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: randomUUID(),
    name: 'Test User',
    email: \`test-\${randomUUID()}@example.com\`,
    role: 'USER',
    ...overrides,
  };
}
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 6. Test-Driven Development
  {
    title: "What is TDD and what are its benefits and drawbacks?",
    content:
      "Explain the Red-Green-Refactor cycle. When does TDD work well and when does it not? How do you practice TDD with a real example?",
    answer: `**TDD (Test-Driven Development)**: Write failing tests first, then write just enough code to pass, then refactor.

**Red-Green-Refactor cycle**:
\`\`\`
1. 🔴 RED:    Write a failing test (test first!)
2. 🟢 GREEN:  Write minimal code to pass the test
3. 🔵 REFACTOR: Clean up code while keeping tests green
4. Repeat
\`\`\`

**Practical example — building a password validator**:

\`\`\`typescript
// Step 1: 🔴 RED — Write failing test
describe('validatePassword', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toEqual({
      valid: false,
      errors: ['Password must be at least 8 characters'],
    });
  });
});

// Step 2: 🟢 GREEN — Minimal implementation
function validatePassword(password: string) {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  return { valid: errors.length === 0, errors };
}

// Step 3: 🔴 RED — Add next failing test
it('should require at least one uppercase letter', () => {
  expect(validatePassword('alllowercase')).toEqual({
    valid: false,
    errors: ['Password must contain at least one uppercase letter'],
  });
});

// Step 4: 🟢 GREEN — Add uppercase check
if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');

// Step 5: 🔵 REFACTOR — Extract rules
const rules = [
  { test: (p: string) => p.length >= 8, message: 'Password must be at least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), message: 'Password must contain at least one uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), message: 'Password must contain at least one number' },
];

function validatePassword(password: string) {
  const errors = rules.filter(r => !r.test(password)).map(r => r.message);
  return { valid: errors.length === 0, errors };
}
\`\`\`

**Benefits**:
- Forces you to think about API design before implementation
- Guarantees high test coverage
- Catches bugs immediately
- Acts as documentation — tests show expected behavior
- Enables confident refactoring

**When TDD works well**:
- Business logic with clear rules (validation, calculation, state machines)
- Library/utility code
- Bug fixes (write a test that reproduces the bug first)
- Algorithms and data transformations

**When TDD is less practical**:
- Exploratory/prototyping phase — you don't know the API yet
- UI code — visual output is hard to test-first
- Integration with external APIs — too many unknowns
- Highly coupled legacy code — hard to isolate

**Common TDD mistakes**:
- Writing too many tests at once (write ONE, make it pass, repeat)
- Tests that are too implementation-specific (test behavior, not internals)
- Skipping the refactor step
- Testing trivial code (getters/setters) — focus on logic`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 7. Code Coverage
  {
    title: "What does code coverage really tell you and what are its limitations?",
    content:
      "Explain statement, branch, function, and line coverage. Is 100% coverage the goal? What does coverage NOT tell you?",
    answer: `**Coverage types**:

\`\`\`typescript
function calculatePrice(quantity: number, isPremium: boolean): number {
  let price = quantity * 10;           // Line 1

  if (isPremium) {                     // Branch A
    price *= 0.8;                      // Line 2
  } else {                             // Branch B
    if (quantity > 100) {              // Branch C
      price *= 0.9;                    // Line 3
    }
  }

  return price;                        // Line 4
}
\`\`\`

| Coverage Type | What It Measures |
|--------------|-----------------|
| **Statement** | Was each statement executed? |
| **Branch** | Was each if/else path taken? |
| **Function** | Was each function called? |
| **Line** | Was each line executed? |

**Test that gives 100% line but NOT 100% branch**:
\`\`\`typescript
it('premium customer', () => {
  expect(calculatePrice(10, true)).toBe(80);  // Covers lines 1, 2, 4 + Branch A
});
it('regular customer', () => {
  expect(calculatePrice(10, false)).toBe(100); // Covers lines 1, 4 + Branch B
  // MISSING: Branch C (quantity > 100) — not tested!
});
// Line coverage: 100% (all lines hit)
// Branch coverage: 75% (Branch C never tested)
\`\`\`

**What coverage does NOT tell you**:

1. **Quality of assertions**: Tests can execute code without checking results
\`\`\`typescript
// 100% coverage, 0% usefulness
it('runs without crashing', () => {
  calculatePrice(10, true); // no assertion!
});
\`\`\`

2. **Edge cases**: Coverage doesn't catch missing tests
\`\`\`typescript
// Coverage = 100%, but never tests: negative quantity, zero, MAX_INT, NaN
\`\`\`

3. **Integration issues**: Unit test coverage says nothing about components working together

4. **Error handling**: Covered ≠ correctly handled

**Healthy coverage targets**:
- **80% overall** is a good baseline for most projects
- **90%+ for business-critical code** (payment, auth, core domain)
- **Don't aim for 100%** — diminishing returns, brittle tests
- Some code isn't worth testing (boilerplate, generated code, config)

**Jest coverage**:
\`\`\`bash
jest --coverage

# Enforce minimums in jest.config.js:
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/services/payment.ts': {
    branches: 95,
    lines: 95,
  },
}
\`\`\`

**Mutation testing** (better metric than coverage):
\`\`\`
Stryker mutates your code (change + to -, flip conditions)
If tests still pass → "mutant survived" → tests are weak
If tests fail → "mutant killed" → tests are effective
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 8. Mocking HTTP Requests
  {
    title: "How do you mock HTTP requests in tests? Compare different approaches.",
    content:
      "Explain MSW, nock, and jest.mock for mocking API calls. When should you use each approach?",
    answer: `**Three approaches**:

**1. MSW (Mock Service Worker)** — intercepts at the network level:
\`\`\`typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body }, { status: 201 });
  }),

  http.get('/api/users/:id', ({ params }) => {
    if (params.id === '404') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({ id: params.id, name: 'John' });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override for specific test:
it('should handle server error', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json(null, { status: 500 })),
  );
  // test error handling...
});
\`\`\`

**2. Nock** — intercepts Node.js HTTP module:
\`\`\`typescript
import nock from 'nock';

it('should fetch users', async () => {
  nock('https://api.example.com')
    .get('/users')
    .reply(200, [{ id: '1', name: 'John' }]);

  const users = await fetchUsers();
  expect(users).toHaveLength(1);
});

afterEach(() => nock.cleanAll());
\`\`\`

**3. jest.mock** — replace the module entirely:
\`\`\`typescript
import { fetchUsers } from './api';

jest.mock('./api', () => ({
  fetchUsers: jest.fn().mockResolvedValue([{ id: '1', name: 'John' }]),
}));

it('should display users', async () => {
  render(<UserList />);
  expect(await screen.findByText('John')).toBeInTheDocument();
});
\`\`\`

**Comparison**:

| Feature | MSW | Nock | jest.mock |
|---------|-----|------|-----------|
| Intercept level | Network | HTTP module | Module import |
| Works in browser | Yes | No | No |
| Framework agnostic | Yes | Node.js only | Jest only |
| Tests real fetch code | Yes | Yes | No (bypassed) |
| Learning curve | Medium | Low | Low |
| Reusable handlers | Yes (handler files) | Per-test | Per-test |

**Recommendation**:
- **MSW**: Best overall — works in tests AND browser (Storybook), tests your actual HTTP code
- **Nock**: Good for Node.js backend tests, simpler setup
- **jest.mock**: Quick and dirty, but doesn't test HTTP layer at all

**Key principle**: Mock at the outermost boundary. MSW mocks the network, so your entire HTTP pipeline (interceptors, serialization, error handling) is tested.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 9. Testing Error Handling
  {
    title: "How do you test error handling and edge cases effectively?",
    content:
      "Explain patterns for testing exceptions, boundary conditions, null/undefined values, and unhappy paths.",
    answer: `**Testing exceptions**:
\`\`\`typescript
// Async errors
it('should throw NotFoundError for missing user', async () => {
  await expect(service.findById('nonexistent'))
    .rejects
    .toThrow(NotFoundException);
});

it('should throw with specific message', async () => {
  await expect(service.findById('bad'))
    .rejects
    .toThrow('User not found');
});

// Sync errors
it('should throw for invalid input', () => {
  expect(() => validateEmail('')).toThrow('Email is required');
});

// Check error properties
it('should include error details', async () => {
  try {
    await service.createOrder({ items: [] });
    fail('Expected error');
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
    expect(error.details).toContain('items must not be empty');
  }
});
\`\`\`

**Boundary conditions**:
\`\`\`typescript
describe('paginate', () => {
  // Normal case
  it('should return first page', () => {
    expect(paginate(items, { page: 1, limit: 10 })).toHaveLength(10);
  });

  // Edge cases
  it('should handle page 0 as page 1', () => {
    expect(paginate(items, { page: 0, limit: 10 })).toHaveLength(10);
  });

  it('should handle negative page', () => {
    expect(paginate(items, { page: -1, limit: 10 })).toHaveLength(10);
  });

  it('should return empty for page beyond data', () => {
    expect(paginate(items, { page: 999, limit: 10 })).toHaveLength(0);
  });

  it('should handle limit of 0', () => {
    expect(paginate(items, { page: 1, limit: 0 })).toHaveLength(0);
  });

  it('should handle empty array', () => {
    expect(paginate([], { page: 1, limit: 10 })).toHaveLength(0);
  });
});
\`\`\`

**Null / undefined handling**:
\`\`\`typescript
describe('formatUserName', () => {
  it('should handle null user', () => {
    expect(formatUserName(null)).toBe('Unknown');
  });

  it('should handle missing firstName', () => {
    expect(formatUserName({ lastName: 'Doe' })).toBe('Doe');
  });

  it('should handle empty strings', () => {
    expect(formatUserName({ firstName: '', lastName: '' })).toBe('Unknown');
  });
});
\`\`\`

**Testing race conditions / concurrency**:
\`\`\`typescript
it('should handle concurrent updates safely', async () => {
  // Both try to update the same resource simultaneously
  const [result1, result2] = await Promise.allSettled([
    service.updateBalance(userId, +100),
    service.updateBalance(userId, +50),
  ]);

  const finalBalance = await service.getBalance(userId);
  expect(finalBalance).toBe(initialBalance + 100 + 50);
});
\`\`\`

**The "Given-When-Then" pattern** for readability:
\`\`\`typescript
it('should refund order when cancelled within 24 hours', async () => {
  // Given: an order placed 2 hours ago
  const order = await createOrder({ createdAt: hoursAgo(2) });

  // When: the order is cancelled
  const result = await service.cancelOrder(order.id);

  // Then: a refund is issued
  expect(result.refundStatus).toBe('processed');
  expect(result.refundAmount).toBe(order.total);
});
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 10. Snapshot Testing
  {
    title: "What is snapshot testing and when should you use it?",
    content:
      "Explain how Jest snapshots work, their pros and cons, and when they add value vs when they become a maintenance burden.",
    answer: `**Snapshot testing**: Capture output and compare against stored snapshot. If it changes, test fails until you approve the change.

**Basic snapshot**:
\`\`\`typescript
it('should render user card correctly', () => {
  const { container } = render(<UserCard user={{ name: 'John', role: 'admin' }} />);
  expect(container).toMatchSnapshot();
  // First run: creates __snapshots__/UserCard.test.tsx.snap
  // Next runs: compares output against saved snapshot
});
\`\`\`

**Inline snapshot** (stored in test file):
\`\`\`typescript
it('should format error response', () => {
  const error = formatError(new ValidationError('Invalid email'));
  expect(error).toMatchInlineSnapshot(\`
    {
      "message": "Invalid email",
      "statusCode": 400,
      "type": "ValidationError",
    }
  \`);
});
\`\`\`

**When snapshots add value**:
- ✅ Serializable data structures (API responses, config objects, error formats)
- ✅ Detecting unintended changes to output
- ✅ Quick coverage for stable components
- ✅ CLI output, log format, email templates

**When snapshots are a burden**:
- ❌ Large component trees (1000+ line snapshots nobody reads)
- ❌ Frequently changing UI (every CSS change breaks snapshot)
- ❌ Dynamic content (timestamps, random IDs)
- ❌ Blindly updating snapshots (\`jest -u\`) without reviewing changes

**Better alternatives to full snapshots**:
\`\`\`typescript
// Instead of snapshotting entire component:
expect(container).toMatchSnapshot(); // ❌ fragile, noisy

// Test specific elements:
expect(screen.getByRole('heading')).toHaveTextContent('Welcome, John');
expect(screen.getByText('admin')).toHaveClass('badge-admin');
\`\`\`

**Property matchers** (ignore dynamic values):
\`\`\`typescript
it('should create user with id and timestamp', () => {
  const user = createUser({ name: 'John' });
  expect(user).toMatchSnapshot({
    id: expect.any(String),
    createdAt: expect.any(Date),
    // name: 'John' — exact match from snapshot
  });
});
\`\`\`

**Updating snapshots**:
\`\`\`bash
jest --updateSnapshot     # or jest -u
# DANGER: Always review snapshot diffs before updating!
# git diff __snapshots__/ — verify changes are intentional
\`\`\`

**Best practices**:
- Keep snapshots small and focused
- Use inline snapshots for small outputs
- Review snapshot diffs in code review
- Don't snapshot third-party component output
- Prefer explicit assertions over snapshots for critical behavior`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 11. Test Organization
  {
    title: "How do you organize tests in a large codebase?",
    content:
      "What are the best practices for test file structure, naming, setup/teardown, test utilities, and test configuration?",
    answer: `**File structure options**:

**Option A: Co-located tests** (recommended):
\`\`\`
src/
├── users/
│   ├── users.service.ts
│   ├── users.service.spec.ts     ← unit test next to source
│   ├── users.controller.ts
│   └── users.controller.spec.ts
├── orders/
│   ├── orders.service.ts
│   └── orders.service.spec.ts
test/
├── e2e/
│   ├── users.e2e-spec.ts         ← E2E tests separate
│   └── orders.e2e-spec.ts
└── utils/
    ├── test-database.ts           ← shared test utilities
    └── factories.ts
\`\`\`

**Option B: Separate test directory** (mirror structure):
\`\`\`
src/
├── users/users.service.ts
test/
├── unit/users/users.service.spec.ts
├── integration/users/users.integration.spec.ts
├── e2e/users.e2e.spec.ts
\`\`\`

**Naming conventions**:
\`\`\`
*.spec.ts     — unit tests
*.test.ts     — integration tests
*.e2e-spec.ts — end-to-end tests
\`\`\`

**Test structure** (Arrange-Act-Assert):
\`\`\`typescript
describe('OrderService', () => {
  // Group by method
  describe('createOrder', () => {
    // Group by scenario
    describe('when cart is valid', () => {
      it('should create order with correct total', async () => {
        // Arrange
        const cart = createTestCart({ items: [{ price: 100, qty: 2 }] });

        // Act
        const order = await service.createOrder(cart);

        // Assert
        expect(order.total).toBe(200);
      });
    });

    describe('when cart is empty', () => {
      it('should throw EmptyCartError', async () => {
        await expect(service.createOrder(emptyCart)).rejects.toThrow(EmptyCartError);
      });
    });
  });
});
\`\`\`

**Shared test utilities**:
\`\`\`typescript
// test/utils/factories.ts — reusable test data
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: randomUUID(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'USER',
    createdAt: new Date(),
    ...overrides,
  };
}

// test/utils/test-database.ts
export async function createTestApp() {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  return app;
}
\`\`\`

**Jest configuration** for multiple test types:
\`\`\`javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      transform: { '^.+\\\\.ts$': 'ts-jest' },
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      testTimeout: 30000,
    },
  ],
};
\`\`\`

\`\`\`bash
jest --selectProjects unit    # run only unit tests
jest --selectProjects e2e     # run only e2e tests
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 12. Testing Database Interactions
  {
    title: "How do you test code that interacts with a database?",
    content:
      "Compare testing strategies: in-memory DB, test containers, transaction rollback, and mocking the repository layer.",
    answer: `**Strategy 1: Mock the repository** (unit test):
\`\`\`typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new UserService(mockRepo);
  });

  it('should return user by id', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', name: 'John' } as User);
    const user = await service.findById('1');
    expect(user.name).toBe('John');
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
\`\`\`
**Pros**: Fast, no DB needed. **Cons**: Doesn't test actual queries, SQL, constraints.

**Strategy 2: Test database** (integration test):
\`\`\`typescript
describe('UserService (integration)', () => {
  let dataSource: DataSource;
  let service: UserService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      database: 'myapp_test',     // dedicated test database
      synchronize: true,           // auto-create schema
      entities: [User, Order],
    });
    await dataSource.initialize();
    service = new UserService(dataSource.getRepository(User));
  });

  afterEach(async () => {
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should enforce unique email constraint', async () => {
    await service.create({ name: 'John', email: 'john@test.com' });
    await expect(service.create({ name: 'Jane', email: 'john@test.com' }))
      .rejects.toThrow(/duplicate key/);
  });
});
\`\`\`

**Strategy 3: Testcontainers** (disposable DB per suite):
\`\`\`typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container;
let dataSource: DataSource;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();
  dataSource = new DataSource({
    type: 'postgres',
    url: container.getConnectionUri(),
    synchronize: true,
    entities: [User],
  });
  await dataSource.initialize();
}, 60000); // container startup can take 10-30s

afterAll(async () => {
  await dataSource.destroy();
  await container.stop();
});
\`\`\`
**Pros**: Fully isolated, real PostgreSQL, CI-friendly. **Cons**: Slower startup.

**Strategy 4: Transaction rollback** (fastest cleanup):
\`\`\`typescript
let queryRunner: QueryRunner;

beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();
  // Override repository to use this queryRunner's manager
});

afterEach(async () => {
  await queryRunner.rollbackTransaction(); // undo all changes
  await queryRunner.release();
});
\`\`\`

**Recommendation by test type**:

| Test Type | Strategy | Speed |
|-----------|----------|-------|
| Unit (service logic) | Mock repository | ~1ms |
| Integration (queries, constraints) | Test DB + truncate | ~100ms |
| CI pipeline | Testcontainers | ~30s startup |
| Complex transactions | Transaction rollback | ~10ms |`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 13. Testing Patterns and Anti-Patterns
  {
    title: "What are common testing anti-patterns and how do you avoid them?",
    content:
      "Describe the most frequent testing mistakes: flaky tests, testing implementation details, test coupling, and slow test suites.",
    answer: `**Anti-pattern 1: Testing implementation details**
\`\`\`typescript
// ❌ BAD: Tests HOW it works (coupled to implementation)
it('should call setState with user data', () => {
  const wrapper = shallow(<UserProfile userId="1" />);
  expect(wrapper.state('user')).toEqual({ name: 'John' });
});

// ✅ GOOD: Tests WHAT the user sees (behavior)
it('should display user name', async () => {
  render(<UserProfile userId="1" />);
  expect(await screen.findByText('John')).toBeInTheDocument();
});
\`\`\`

**Anti-pattern 2: Flaky tests** (pass/fail randomly)
\`\`\`typescript
// ❌ BAD: Depends on timing
it('should load data', async () => {
  render(<DataList />);
  await new Promise(r => setTimeout(r, 500)); // arbitrary wait
  expect(screen.getByText('item 1')).toBeInTheDocument();
});

// ✅ GOOD: Wait for specific condition
it('should load data', async () => {
  render(<DataList />);
  expect(await screen.findByText('item 1')).toBeInTheDocument();
});
\`\`\`

**Anti-pattern 3: Shared mutable state between tests**
\`\`\`typescript
// ❌ BAD: Tests depend on execution order
let counter = 0;
it('first test', () => { counter++; expect(counter).toBe(1); });
it('second test', () => { expect(counter).toBe(1); }); // fails if first test didn't run

// ✅ GOOD: Each test sets up its own state
beforeEach(() => { counter = 0; });
\`\`\`

**Anti-pattern 4: Testing everything through E2E**
\`\`\`typescript
// ❌ BAD: E2E test for input validation
it('should reject empty email', async ({ page }) => {
  await page.goto('/signup');
  await page.click('button[type=submit]');
  await expect(page.locator('.error')).toContainText('Email required');
});
// 5 seconds for something a unit test can check in 5ms

// ✅ GOOD: Unit test for validation logic
it('should return error for empty email', () => {
  expect(validate({ email: '' })).toContain('Email required');
});
\`\`\`

**Anti-pattern 5: Excessive mocking**
\`\`\`typescript
// ❌ BAD: Mock everything — test proves nothing
jest.mock('./db');
jest.mock('./email');
jest.mock('./logger');
jest.mock('./validator');
// What are you even testing at this point?

// ✅ GOOD: Mock boundaries, test real logic
jest.mock('./email'); // external side effect — mock this
// But use real validator, real business logic
\`\`\`

**Anti-pattern 6: No assertion (false positive)**
\`\`\`typescript
// ❌ BAD: Test always passes — no assertion
it('should process order', async () => {
  await processOrder(testOrder);
  // ...nothing checked!
});

// ✅ GOOD: Explicit assertions
it('should process order', async () => {
  const result = await processOrder(testOrder);
  expect(result.status).toBe('completed');
  expect(mockPayment.charge).toHaveBeenCalledWith(testOrder.total);
});
\`\`\`

**Anti-pattern 7: Giant setup / one-test-does-everything**
\`\`\`typescript
// ❌ BAD: 200 lines of setup, tests everything in one test
it('should handle the entire order flow', async () => { /* 50 assertions */ });

// ✅ GOOD: Focused tests with descriptive names
it('should calculate correct subtotal', () => {});
it('should apply discount for premium users', () => {});
it('should reject negative quantity', () => {});
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 14. E2E Testing with Playwright
  {
    title: "How do you write E2E tests with Playwright?",
    content:
      "Explain Playwright setup, page object pattern, handling authentication, and best practices for reliable E2E tests.",
    answer: `**Playwright basics**:
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('user can search for products', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search-input"]', 'headphones');
  await page.click('button:has-text("Search")');
  await expect(page.locator('.product-card')).toHaveCount(5);
  await expect(page.locator('.product-card').first()).toContainText('Wireless');
});
\`\`\`

**Page Object Pattern** — encapsulate page interaction:
\`\`\`typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name=email]', email);
    await this.page.fill('[name=password]', password);
    await this.page.click('button[type=submit]');
    await this.page.waitForURL('/dashboard');
  }

  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}

// tests/login.spec.ts
test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
\`\`\`

**Authentication** — reuse auth state across tests:
\`\`\`typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\\.setup\\.ts/ },
    {
      name: 'authenticated',
      dependencies: ['setup'],
      use: { storageState: 'playwright/.auth/user.json' },
    },
  ],
});

// auth.setup.ts
test('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', process.env.TEST_EMAIL);
  await page.fill('[name=password]', process.env.TEST_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
  // Save signed-in state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
\`\`\`

**Handling flakiness**:
\`\`\`typescript
// Wait for specific conditions, not arbitrary timeouts
await page.waitForSelector('.data-loaded');
await expect(page.locator('table tbody tr')).toHaveCount(10, { timeout: 10000 });

// Retry assertions automatically (Playwright does this by default)
await expect(page.locator('.status')).toHaveText('Complete'); // retries for 5s

// Auto-retry failed tests in CI
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
\`\`\`

**Visual regression testing**:
\`\`\`typescript
test('homepage visual', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,
  });
});
\`\`\`

**Best practices**:
- Use \`data-testid\` for stable selectors (not CSS classes)
- Run E2E tests against a staging environment, not production
- Seed test data before each test suite
- Keep E2E tests focused on critical user flows (login, checkout, signup)
- Use Playwright's trace viewer for debugging: \`npx playwright show-trace trace.zip\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 15. Testing NestJS Services
  {
    title: "How do you write unit tests for NestJS services?",
    content:
      "Explain how to set up testing modules, mock providers, and test services with dependency injection.",
    answer: `**NestJS Testing Module** — creates a minimal module for testing:

\`\`\`typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('should return a user', async () => {
      const user = { id: '1', name: 'John', email: 'john@test.com' };
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return user', async () => {
      const dto = { name: 'Jane', email: 'jane@test.com' };
      const created = { id: '2', ...dto };

      mockUserRepo.create.mockReturnValue(created);
      mockUserRepo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockUserRepo.create).toHaveBeenCalledWith(dto);
      expect(mockUserRepo.save).toHaveBeenCalledWith(created);
    });
  });
});
\`\`\`

**Mocking multiple dependencies**:
\`\`\`typescript
const module = await Test.createTestingModule({
  providers: [
    OrdersService,
    { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
    { provide: PaymentService, useValue: { charge: jest.fn() } },
    { provide: EmailService, useValue: { send: jest.fn() } },
    { provide: ConfigService, useValue: { get: jest.fn((key) => config[key]) } },
  ],
}).compile();
\`\`\`

**Testing guards and interceptors**:
\`\`\`typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should allow access for correct role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockExecutionContext({
      user: { roles: ['ADMIN'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access for wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const context = createMockExecutionContext({
      user: { roles: ['USER'] },
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
\`\`\`

**Key principle**: NestJS's DI makes testing easy — replace any provider with a mock. Keep services focused on one responsibility for easy testing.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 16. Testing with Fixtures and Factories
  {
    title: "How do you manage test data with fixtures and factories?",
    content:
      "Compare hardcoded test data, fixture files, and factory functions. How do you keep test data maintainable?",
    answer: `**Hardcoded data** (simple but repetitive):
\`\`\`typescript
// ❌ Repeated across tests, hard to maintain
it('should validate user', () => {
  const user = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    createdAt: new Date('2024-01-01'),
  };
  expect(validate(user)).toBe(true);
});
\`\`\`

**Factory functions** (recommended):
\`\`\`typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

let userIdCounter = 0;

export function createUser(overrides?: Partial<User>): User {
  return {
    id: \`user-\${++userIdCounter}\`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,   // override any field
  };
}

export function createAdmin(overrides?: Partial<User>): User {
  return createUser({ role: 'ADMIN', ...overrides });
}

// Usage in tests — clean and focused
it('should allow admin to delete users', async () => {
  const admin = createAdmin();
  const targetUser = createUser();
  // test only specifies what matters for THIS test
});

it('should reject inactive users', async () => {
  const user = createUser({ isActive: false });
  await expect(service.login(user)).rejects.toThrow('Account inactive');
});
\`\`\`

**Builder pattern** (for complex objects):
\`\`\`typescript
class OrderBuilder {
  private order: Partial<Order> = {};

  withItems(items: OrderItem[]) {
    this.order.items = items;
    return this;
  }

  withStatus(status: OrderStatus) {
    this.order.status = status;
    return this;
  }

  withUser(user: User) {
    this.order.userId = user.id;
    return this;
  }

  build(): Order {
    return {
      id: randomUUID(),
      status: 'pending',
      items: [],
      total: this.order.items?.reduce((sum, i) => sum + i.price * i.qty, 0) ?? 0,
      createdAt: new Date(),
      ...this.order,
    } as Order;
  }
}

// Usage
const order = new OrderBuilder()
  .withUser(adminUser)
  .withItems([{ productId: '1', price: 100, qty: 2 }])
  .withStatus('confirmed')
  .build();
\`\`\`

**Database fixtures** (for integration tests):
\`\`\`typescript
// test/fixtures/seed-test-data.ts
export async function seedTestData(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const orderRepo = dataSource.getRepository(Order);

  const user = await userRepo.save(createUser({ email: 'test@test.com' }));
  const order = await orderRepo.save(createOrder({ userId: user.id }));

  return { user, order };
}

// In test
let fixtures: { user: User; order: Order };
beforeEach(async () => {
  fixtures = await seedTestData(dataSource);
});
\`\`\`

**Best practices**:
- Factories > fixtures > hardcoded data
- Only specify values relevant to the test (use defaults for everything else)
- Use faker for realistic but random data
- Reset factory counters in \`beforeEach\` if IDs matter
- Create domain-specific factories (\`createPremiumUser\`, \`createExpiredOrder\`)`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 17. Contract Testing
  {
    title: "What is contract testing and how does it differ from integration testing?",
    content:
      "Explain consumer-driven contract testing with Pact. When is it more appropriate than traditional integration tests?",
    answer: `**The problem**: In microservices, service A calls service B. How do you test they're compatible without running both?

**Integration test approach**: Run both services, hit real endpoints.
- Slow, flaky, complex setup, hard to test all scenarios

**Contract testing**: Define the expected API contract between consumer and provider. Test each side independently.

\`\`\`
Consumer (frontend/service A)     Contract (agreed schema)     Provider (API/service B)
      ↓                               ↓                            ↓
Consumer test:                    Pact file:                  Provider test:
"I expect GET /users/1            { method: GET,              "Given a user exists,
 to return { name, email }"        path: /users/1,            GET /users/1 returns
                                   response: { name, email }}  { name, email }"
\`\`\`

**Consumer-Driven Contract Testing** with Pact:

**Step 1: Consumer writes contract**:
\`\`\`typescript
// frontend/tests/user-api.pact.spec.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'frontend',
  provider: 'user-service',
});

describe('User API', () => {
  it('should fetch user by id', async () => {
    await provider
      .given('user with id 1 exists')
      .uponReceiving('a request for user 1')
      .withRequest({
        method: 'GET',
        path: '/api/users/1',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        body: MatchersV3.like({
          id: '1',
          name: MatchersV3.string('John'),
          email: MatchersV3.email(),
        }),
      })
      .executeTest(async (mockServer) => {
        const user = await fetchUser('1', mockServer.url);
        expect(user.name).toBe('John');
      });
    // Generates a Pact contract file (JSON)
  });
});
\`\`\`

**Step 2: Provider verifies contract**:
\`\`\`typescript
// user-service/tests/pact-verification.spec.ts
import { Verifier } from '@pact-foundation/pact';

describe('Pact Verification', () => {
  it('should fulfill frontend contract', async () => {
    await new Verifier({
      providerBaseUrl: 'http://localhost:3001',
      pactUrls: ['./pacts/frontend-user-service.json'],
      stateHandlers: {
        'user with id 1 exists': async () => {
          await db.users.create({ id: '1', name: 'John', email: 'john@test.com' });
        },
      },
    }).verifyProvider();
  });
});
\`\`\`

**Contract test vs Integration test**:

| Aspect | Contract Test | Integration Test |
|--------|--------------|------------------|
| Services needed | 1 (test each independently) | All (run everything) |
| Speed | Fast | Slow |
| Reliability | Stable | Flaky (network, timing) |
| What it tests | API schema compatibility | Full system behavior |
| Setup complexity | Medium | High |
| Best for | Microservices, multi-team | Monolith, small systems |

**When to use contract testing**:
- Multiple teams own different services
- Services deploy independently
- Breaking API changes are frequent
- Integration tests are too slow/flaky

**Pact Broker** (CI/CD integration):
\`\`\`
Consumer publishes contract → Pact Broker (shared) → Provider verifies
Can I Deploy? → Pact Broker checks if all contracts are verified → yes/no
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 18. Performance Testing
  {
    title: "How do you performance test a web application?",
    content:
      "Explain load testing, stress testing, and soak testing. What tools do you use and what metrics matter?",
    answer: `**Types of performance testing**:

| Type | Goal | Pattern |
|------|------|---------|
| **Load test** | Verify system under expected load | Ramp to expected users |
| **Stress test** | Find breaking point | Increase until failure |
| **Soak test** | Detect memory leaks, resource exhaustion | Sustained load for hours |
| **Spike test** | Handle sudden traffic bursts | Sudden jump in users |

**k6 example** (modern load testing tool):
\`\`\`javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 200 },  // Ramp up to 200
    { duration: '3m', target: 200 },  // Stay at 200
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                   // <1% error rate
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'body has products': (r) => JSON.parse(r.body).length > 0,
  });
  sleep(1); // Think time between requests
}
\`\`\`

\`\`\`bash
k6 run load-test.js
# Output: avg, min, max, p90, p95, p99 latency + error rate
\`\`\`

**Key metrics to track**:
- **Throughput**: Requests per second (RPS)
- **Latency**: p50, p95, p99 response times
- **Error rate**: % of failed requests (5xx, timeouts)
- **Concurrency**: Simultaneous active connections
- **Saturation**: CPU, memory, DB connections during test

**Stress test** (find the breaking point):
\`\`\`javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },  // Keep increasing
    { duration: '5m', target: 0 },     // Recovery
  ],
};
// Watch for: increased error rate, latency spike, OOMKills, DB connection exhaustion
\`\`\`

**Soak test** (detect leaks):
\`\`\`javascript
export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '4h', target: 100 },  // Sustained load for 4 hours
    { duration: '5m', target: 0 },
  ],
};
// Watch for: memory growing over time, connection pool exhaustion, disk fill
\`\`\`

**Tools comparison**:

| Tool | Language | Protocol | Best For |
|------|----------|----------|----------|
| k6 | JavaScript | HTTP, WebSocket, gRPC | Developer-friendly load tests |
| Artillery | JavaScript | HTTP, WebSocket | Quick and simple |
| JMeter | Java | HTTP, JDBC, FTP | Enterprise, GUI-based |
| Locust | Python | HTTP | Custom scenarios |
| Gatling | Scala | HTTP | Detailed reports |

**In CI/CD**: Run a lightweight load test on every deploy to staging — catch performance regressions early.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 19. Testing Environment Setup
  {
    title: "How do you set up a reliable test environment?",
    content:
      "Explain test database setup, environment variables for tests, CI configuration, and ensuring test isolation.",
    answer: `**Test environment configuration**:
\`\`\`bash
# .env.test — separate env for tests
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_test          # NEVER use production/dev DB
DB_USERNAME=postgres
DB_PASSWORD=postgres
LOG_LEVEL=error              # Reduce noise in test output
JWT_SECRET=test-secret-key
\`\`\`

\`\`\`typescript
// jest.config.ts
export default {
  setupFiles: ['dotenv/config'],         // Load .env.test
  setupFilesAfterFramework: ['./test/setup.ts'],
  testTimeout: 10000,
  maxWorkers: '50%',                     // Don't overwhelm CI
};
\`\`\`

**Global setup / teardown**:
\`\`\`typescript
// test/setup.ts — runs once before all test suites
import { DataSource } from 'typeorm';

let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'postgres',
    database: process.env.DB_NAME,
    synchronize: true,           // Create schema for tests
    dropSchema: true,            // Clean start
    entities: ['src/**/*.entity.ts'],
  });
  await dataSource.initialize();
  (global as any).__DATA_SOURCE__ = dataSource;
});

afterAll(async () => {
  await dataSource.destroy();
});
\`\`\`

**Test isolation** — each test must be independent:
\`\`\`typescript
// Option 1: Truncate between tests
afterEach(async () => {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    await dataSource.query(\`TRUNCATE TABLE "\${entity.tableName}" CASCADE\`);
  }
});

// Option 2: Transaction rollback (faster)
let queryRunner: QueryRunner;
beforeEach(async () => {
  queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();
});
afterEach(async () => {
  await queryRunner.rollbackTransaction();
  await queryRunner.release();
});
\`\`\`

**CI configuration** (GitHub Actions):
\`\`\`yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: myapp_test
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-retries 5

      redis:
        image: redis:7
        ports: ["6379:6379"]

    env:
      DB_HOST: localhost
      DB_NAME: myapp_test
      DB_PASSWORD: postgres
      NODE_ENV: test

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage --forceExit
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
\`\`\`

**Parallel test execution**:
\`\`\`typescript
// Jest runs test files in parallel by default
// Each file gets its own worker process
// Ensure tests don't share state (use unique DB names or transaction isolation)

// For E2E: use --workers=1 to avoid port conflicts
// jest.e2e.config.ts
maxWorkers: 1,
\`\`\`

**Debugging failing CI tests**:
- Check for timing-dependent tests (use fake timers or waitFor)
- Check for port conflicts (use random ports)
- Check for uncleared state between tests
- Run with \`--verbose --detectOpenHandles\` locally`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },

  // 20. Testing Strategy for a New Project
  {
    title: "How do you define a testing strategy for a new project?",
    content:
      "As a mid-level developer, how do you decide what to test, what testing tools to adopt, and how to balance speed with coverage?",
    answer: `**Step 1: Assess the project**

| Factor | Implication |
|--------|------------|
| API-heavy backend | Focus on integration tests (Supertest) |
| Complex business logic | Focus on unit tests (pure functions) |
| User-facing frontend | Focus on component tests (RTL) + critical E2E |
| Multi-service architecture | Add contract tests (Pact) |
| Financial/medical data | Maximize coverage, add edge case tests |
| Startup/MVP | Focus on critical paths, don't over-test |

**Step 2: Choose your stack**

\`\`\`
Backend (NestJS):
├── Unit: Jest + ts-jest
├── Integration: Supertest + test database
├── E2E: Supertest or Playwright (for full stack)
└── Contract: Pact (if microservices)

Frontend (Next.js):
├── Unit: Jest + React Testing Library
├── Component: Storybook + Chromatic (visual)
├── Integration: RTL with MSW (mocked API)
└── E2E: Playwright (critical user flows)
\`\`\`

**Step 3: Decide what to test**

**Always test** (high value):
- Authentication / authorization logic
- Payment / billing calculations
- Data validation and sanitization
- Core business rules (pricing, permissions, workflows)
- API endpoint response shapes

**Sometimes test** (medium value):
- UI component rendering
- Error handling paths
- Edge cases for complex functions
- Database queries and constraints

**Rarely test** (low value):
- Getters/setters, trivial code
- Third-party library wrappers
- Config files
- Console.log statements

**Step 4: Set up CI pipeline**

\`\`\`yaml
# Run order: fastest first
1. Lint (5s)           — catch syntax/style issues
2. Type check (10s)    — catch type errors
3. Unit tests (30s)    — catch logic errors
4. Integration (2min)  — catch integration issues
5. E2E (5min)          — catch user flow breaks
\`\`\`

**Step 5: Establish team practices**

- **PR requirement**: All new code must have tests
- **Coverage threshold**: 80% global, 90% for critical modules
- **Test in CI**: All tests must pass before merge
- **TDD for bugs**: Reproduce bug with test first, then fix
- **Review tests in PRs**: Test quality matters as much as code quality

**Testing ROI matrix**:
\`\`\`
High confidence, low cost → Unit tests for pure logic
High confidence, medium cost → Integration tests for APIs
High confidence, high cost → E2E for critical flows (keep minimal)
Low confidence, high cost → E2E for every UI variation (avoid!)
\`\`\`

**Evolving the strategy**: Start minimal (unit + key integration tests). Add E2E for the most critical user flow. Expand as the team and codebase grow. Don't aim for perfection on day one.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "testing",
  },
];
