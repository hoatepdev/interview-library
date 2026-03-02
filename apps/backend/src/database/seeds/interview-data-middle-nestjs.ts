/**
 * Middle-Level NestJS Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: providers, request lifecycle, decorators, TypeORM, auth, testing,
 * configuration, caching, scheduling, and real-world architecture patterns.
 *
 * Topic: nestjs
 * Level: MIDDLE
 *
 * Usage: npm run seed:middle-nestjs
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

const nestjsMiddleQuestions: QuestionSeed[] = [
  {
    title:
      "NestJS request lifecycle: the exact order Guards, Interceptors, Pipes, and Filters execute",
    content:
      "Walk through the complete lifecycle of an HTTP request in NestJS from the moment it hits the server to the moment the response is sent. What is the execution order of all middleware and pipeline components?",
    answer: `**Complete request lifecycle** (in order):

\`\`\`
Incoming Request
      ↓
1. Middleware (app.use / module middleware)
      ↓
2. Guards (@UseGuards)
      ↓
3. Interceptors — pre-handler (next.handle() not yet called)
      ↓
4. Pipes (@UsePipes, @Body(), @Param(), etc.)
      ↓
5. Route Handler (controller method)
      ↓
6. Interceptors — post-handler (after next.handle())
      ↓
7. Exception Filters (if error thrown at any stage)
      ↓
Response
\`\`\`

**Middleware**: Runs first, before any NestJS pipeline. Used for request modification, logging, CORS, session parsing. Has access to raw \`req\`/\`res\` objects. Cannot stop the pipeline cleanly (must call \`next()\`).

**Guards**: Determine whether a request should proceed (authentication, authorization). Return \`true\` (proceed) or \`false\`/throw (reject). Executed after middleware.

**Interceptors (pre-handler)**: Wrap the route handler. Code before \`next.handle()\` runs before the handler. Can modify the incoming request context, add timing, log entry.

**Pipes**: Transform and validate route handler arguments. Executed for each decorated parameter (\`@Body\`, \`@Param\`, \`@Query\`). Run immediately before the handler receives arguments.

**Route Handler**: The actual controller method.

**Interceptors (post-handler)**: Code after \`next.handle()\` (using \`pipe\`, \`tap\`, \`map\`). Can transform the response, log the result, handle cleanup.

**Exception Filters**: Catch exceptions thrown anywhere in the pipeline. Run last — even if a guard or interceptor throws.

**Global vs Controller vs Route scope** — executed in order:
\`\`\`
Global → Controller → Route
\`\`\`

\`\`\`typescript
// Execution order for a route with multiple guards:
@UseGuards(GlobalAuthGuard)       // 3rd (global registered with app.useGlobalGuards)
@UseGuards(ControllerRoleGuard)   // Applied at controller level → 1st
@UseGuards(RouteSpecificGuard)    // Applied at route level → 2nd
\`\`\`

Wait — global guards registered with \`useGlobalGuards\` actually run BEFORE controller/route guards because they're applied to the entire app first.

**Correct global scope order**:
\`\`\`
Global (useGlobal*) → Controller-level → Route-level
\`\`\`

**Practical example — timing interceptor**:
\`\`\`typescript
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    console.log('Before handler'); // Runs BEFORE route handler

    return next.handle().pipe(
      tap(() => {
        console.log(\`After handler: \${Date.now() - start}ms\`); // AFTER
      }),
    );
  }
}
\`\`\`

**Common mistakes**:
- Confusing middleware with guards — middleware can't cleanly short-circuit; guards can
- Thinking pipes run before guards — they don't; guards run first
- Placing business logic in exception filters — they're for error formatting only
- Not understanding that interceptor post-processing runs even when the response is already sent in streaming scenarios

**Follow-up**: Where does the \`@UsePipes\` decorator at the controller level apply — to all methods or per-method parameters?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Custom providers: useFactory, useValue, useClass, useExisting — when to use each",
    content:
      "NestJS supports multiple provider syntaxes beyond simple class injection. Explain useFactory, useValue, useClass, and useExisting with production examples for each.",
    answer: `**Standard provider** (shorthand for useClass):
\`\`\`typescript
// These are equivalent:
@Module({ providers: [UserService] })
@Module({ providers: [{ provide: UserService, useClass: UserService }] })
\`\`\`

**useValue** — inject a static value or mock:
\`\`\`typescript
// Configuration object
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: {
        apiUrl: process.env.API_URL,
        maxRetries: 3,
      },
    },
  ],
})

// In service:
constructor(@Inject('APP_CONFIG') private config: AppConfig) {}

// Testing — replace real service with mock
{
  provide: UserService,
  useValue: {
    findById: jest.fn().mockResolvedValue({ id: '1', name: 'Alice' }),
  },
}
\`\`\`

**useClass** — conditionally swap implementations:
\`\`\`typescript
// Use different implementation based on environment
{
  provide: PaymentService,
  useClass: process.env.NODE_ENV === 'production'
    ? StripePaymentService
    : MockPaymentService,
}

// Or swap via a constant token:
{
  provide: 'CACHE_SERVICE',
  useClass: process.env.REDIS_URL ? RedisCache : InMemoryCache,
}
\`\`\`

**useFactory** — async initialization, inject dependencies:
\`\`\`typescript
// Database connection pool (async)
{
  provide: 'DB_POOL',
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({
      host: config.get('DB_HOST'),
      port: config.get('DB_PORT'),
      database: config.get('DB_NAME'),
    });
    await pool.query('SELECT 1'); // Verify connection
    return pool;
  },
  inject: [ConfigService],
}

// Third-party SDK requiring async setup
{
  provide: 'STRIPE',
  useFactory: (config: ConfigService) =>
    new Stripe(config.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' }),
  inject: [ConfigService],
}
\`\`\`

**useExisting** — alias an existing provider (same instance):
\`\`\`typescript
// UserService implements both UserService and UserRepository interfaces
{
  provide: 'USER_REPOSITORY',
  useExisting: UserService,   // Same singleton instance, different token
}

// Useful for: providing a service under multiple tokens,
// backwards compatibility when renaming providers
\`\`\`

**Token types** — string, symbol, or class:
\`\`\`typescript
// String token (prone to typos — prefer symbols or InjectionToken)
@Inject('DATABASE_URL') private dbUrl: string

// Symbol token (unique, no collision)
export const DATABASE_URL = Symbol('DATABASE_URL');
@Inject(DATABASE_URL) private dbUrl: string

// InjectionToken (typed, best practice)
export const DB_URL = new InjectionToken<string>('DATABASE_URL');
\`\`\`

**Common mistakes**:
- Using string tokens without constants — typos cause \`undefined\` injection
- Forgetting \`inject\` array in \`useFactory\` — dependencies are \`undefined\`
- Using \`useExisting\` when you need separate instances — use \`useClass\` instead
- Not making factory async when it needs to await initialization

**Follow-up**: How does \`forwardRef\` work with custom providers? What is the difference between \`@Optional()\` and a default value in the factory?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Custom decorators: createParamDecorator, SetMetadata, and composing decorators",
    content:
      "How do you create custom parameter decorators and method decorators in NestJS? How does SetMetadata work with Reflector? Show how to compose multiple decorators into one.",
    answer: `**createParamDecorator** — extract data from the request:
\`\`\`typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// @CurrentUser() decorator
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // 'data' is the argument passed to the decorator
    return data ? user?.[data] : user;
  },
);

// Usage:
@Get('profile')
getProfile(@CurrentUser() user: User) { return user; }

@Get('name')
getName(@CurrentUser('name') name: string) { return name; }
\`\`\`

**More param decorator examples**:
\`\`\`typescript
// Extract client IP (behind proxies)
export const ClientIp = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  },
);

// Extract locale from Accept-Language header
export const Locale = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.headers['accept-language']?.split(',')[0] || 'en';
  },
);
\`\`\`

**SetMetadata + Reflector** — attach metadata for guards/interceptors to read:
\`\`\`typescript
// Define metadata key
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Guard reads the metadata
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check route-level first, then controller-level
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true; // No roles required

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage:
@Roles(UserRole.ADMIN)
@Get('admin-only')
adminRoute() {}
\`\`\`

**Reflector methods**:
- \`get(key, target)\`: Get metadata from one target
- \`getAll(key, targets)\`: Get from multiple targets as array
- \`getAllAndOverride(key, targets)\`: Get from first target that has it
- \`getAllAndMerge(key, targets)\`: Merge arrays from all targets

**Composing decorators** — combine multiple into one:
\`\`\`typescript
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(SessionAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

// Usage — replaces 4 decorators with 1:
@Auth(UserRole.ADMIN)
@Get('users')
getUsers() {}
\`\`\`

**Class decorator** — transform all routes in a controller:
\`\`\`typescript
export function ApiController(prefix: string) {
  return applyDecorators(
    Controller(prefix),
    UseGuards(SessionAuthGuard),
    UseInterceptors(TransformInterceptor),
    ApiTags(prefix),
  );
}

@ApiController('users')
export class UserController {}
\`\`\`

**Common mistakes**:
- Using \`ExecutionContext.getHandler()\` only and missing controller-level metadata — use \`getAllAndOverride\`
- Forgetting that \`createParamDecorator\` data is the argument to the decorator, not request data
- Not using \`applyDecorators\` — manually applying 5+ decorators to every route

**Follow-up**: How does \`reflector.getAllAndMerge\` differ from \`getAllAndOverride\`? When would you merge metadata instead of overriding?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "TypeORM in NestJS: repository pattern, transactions, and QueryBuilder",
    content:
      "How do you use TypeORM effectively in a NestJS application? Explain the repository pattern, how to handle database transactions, and when to use QueryBuilder over standard repository methods.",
    answer: `**Repository injection**:
\`\`\`typescript
@Module({
  imports: [TypeOrmModule.forFeature([User, Order])],
  providers: [UserService],
})
export class UserModule {}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}
}
\`\`\`

**Common repository methods**:
\`\`\`typescript
// Find
await this.userRepo.findOne({ where: { id }, relations: ['orders'] });
await this.userRepo.find({ where: { role: UserRole.ADMIN }, order: { createdAt: 'DESC' } });

// Count
const count = await this.userRepo.count({ where: { isActive: true } });

// Create and save (triggers hooks and events)
const user = this.userRepo.create({ name, email });
await this.userRepo.save(user);

// Update
await this.userRepo.update(id, { name }); // No hooks
await this.userRepo.save({ id, name });   // Triggers hooks

// Delete
await this.userRepo.delete(id);           // Hard delete
await this.userRepo.softDelete(id);       // Soft delete (deletedAt)

// Exists
const exists = await this.userRepo.existsBy({ email });
\`\`\`

**Transactions** — critical for data consistency:
\`\`\`typescript
// Method 1: DataSource.transaction (recommended)
@Injectable()
export class OrderService {
  constructor(private dataSource: DataSource) {}

  async createOrder(userId: string, items: OrderItem[]) {
    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, { userId, status: 'pending' });
      await manager.save(order);

      for (const item of items) {
        // Check and decrement stock atomically
        const result = await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'stock - :qty' })
          .where('id = :id AND stock >= :qty', { id: item.productId, qty: item.quantity })
          .execute();

        if (result.affected === 0) {
          throw new Error(\`Insufficient stock for product \${item.productId}\`);
          // Transaction auto-rolls back on throw
        }

        await manager.save(manager.create(OrderItem, { orderId: order.id, ...item }));
      }

      return order;
    });
  }
}
\`\`\`

**Method 2: QueryRunner (manual control)**:
\`\`\`typescript
async transferFunds(fromId: string, toId: string, amount: number) {
  const runner = this.dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction('SERIALIZABLE');

  try {
    await runner.manager.decrement(Account, { id: fromId }, 'balance', amount);
    await runner.manager.increment(Account, { id: toId }, 'balance', amount);
    await runner.commitTransaction();
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
  }
}
\`\`\`

**QueryBuilder** — when repository methods aren't enough:
\`\`\`typescript
// Complex joins, aggregations, conditional WHERE
async findTopUsers(limit = 10) {
  return this.userRepo
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.orders', 'order')
    .leftJoin('order.items', 'item')
    .addSelect('SUM(item.price * item.quantity)', 'totalSpent')
    .where('user.isActive = :active', { active: true })
    .andWhere('order.createdAt > :since', { since: subDays(new Date(), 30) })
    .groupBy('user.id')
    .orderBy('totalSpent', 'DESC')
    .limit(limit)
    .getRawAndEntities();
}
\`\`\`

**When to use QueryBuilder**:
- Complex JOINs with aggregation
- Subqueries
- Conditional WHERE clauses built dynamically
- Batch updates/deletes with WHERE
- Raw SQL expressions (\`() => 'column + 1'\`)

**Custom repository**:
\`\`\`typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  findByEmailWithOrders(email: string) {
    return this.findOne({ where: { email }, relations: ['orders'] });
  }
}
\`\`\`

**Common mistakes**:
- Using \`save()\` in a loop — N queries instead of bulk insert
- Not using transactions for multi-entity mutations
- Using \`delete()\` when you need \`softDelete()\` — permanent data loss
- Using \`update()\` when you need events/hooks — use \`save()\` instead

**Follow-up**: How do you handle optimistic locking with TypeORM? What is the \`@VersionColumn\` decorator?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "DTOs and validation: class-validator, class-transformer, whitelist, and nested objects",
    content:
      "How do you implement robust request validation in NestJS? Explain class-validator decorators, class-transformer, the whitelist option, and how to validate nested DTOs.",
    answer: `**Basic validation setup**:
\`\`\`typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Throw on unknown properties
  transform: true,            // Transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true, // Convert strings to numbers for @IsNumber()
  },
}));
\`\`\`

**DTO with class-validator**:
\`\`\`typescript
import { IsEmail, IsString, IsEnum, IsInt, Min, Max, IsOptional,
         Length, Matches, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;

  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'Password must be at least 8 chars with letters and numbers',
  })
  password: string;
}
\`\`\`

**Nested DTO validation**:
\`\`\`typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsArray, ArrayMinSize } from 'class-validator';

export class AddressDto {
  @IsString() street: string;
  @IsString() city: string;
  @IsString() @Length(5, 5) postalCode: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => AddressDto)  // Required for nested validation!
  shippingAddress: AddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
\`\`\`

**Critical**: Without \`@Type(() => Dto)\`, class-validator treats nested objects as plain objects and skips validation.

**class-transformer** — shape the data:
\`\`\`typescript
import { Exclude, Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @Exclude()  // Never serialized in response
  password: string;

  @Exclude()
  internalNotes: string;
}

// In controller:
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.userService.findById(id);
  return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
}
\`\`\`

**Response serialization globally**:
\`\`\`typescript
// main.ts — auto-apply class-transformer to all responses
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

// Or per-controller:
@UseInterceptors(ClassSerializerInterceptor)
\`\`\`

**Custom validator**:
\`\`\`typescript
import { ValidatorConstraint, ValidatorConstraintInterface,
         ValidationArguments, registerDecorator } from 'class-validator';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private userService: UserService) {}

  async validate(email: string) {
    const user = await this.userService.findByEmail(email);
    return !user;
  }

  defaultMessage() {
    return 'Email $value is already taken';
  }
}

// Custom decorator
export function IsEmailUnique() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      validator: IsEmailUniqueConstraint,
    });
  };
}

// DTO usage:
export class RegisterDto {
  @IsEmail()
  @IsEmailUnique()
  email: string;
}

// Required in module:
providers: [IsEmailUniqueConstraint]
\`\`\`

**Common mistakes**:
- Forgetting \`transform: true\` — DTO class methods don't work because it's a plain object
- Missing \`@Type()\` on nested DTOs — nested validation silently skipped
- Not using \`whitelist: true\` — extra fields from client are passed to services
- Using \`@Exclude()\` without \`ClassSerializerInterceptor\` — password still exposed

**Follow-up**: How does \`@IsOptional()\` interact with \`whitelist: true\`? What happens when you apply ValidationPipe at the route level vs globally?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Authentication with Passport.js: strategies, session serialization, and JWT vs session-based auth",
    content:
      "How do you implement authentication in NestJS with Passport.js? Explain strategies, session serialization, and the trade-offs between session-based and JWT-based authentication.",
    answer: `**Passport strategy setup**:
\`\`\`typescript
// local.strategy.ts (username/password)
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user; // Attached to req.user
  }
}

// google.strategy.ts (OAuth)
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService, config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return this.authService.findOrCreateGoogleUser(profile);
  }
}
\`\`\`

**Session-based auth** (stateful):
\`\`\`typescript
// Serialize: what to store in the session (session ID → user ID)
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private userService: UserService) { super(); }

  serializeUser(user: User, done: Function) {
    done(null, user.id); // Store only ID in session
  }

  async deserializeUser(id: string, done: Function) {
    try {
      const user = await this.userService.findById(id);
      done(null, user); // Loaded on every request
    } catch (err) {
      done(err);
    }
  }
}

// Auth guard for sessions
@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.isAuthenticated(); // Passport method
  }
}
\`\`\`

**JWT-based auth** (stateless):
\`\`\`typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}

// Issue token
async login(user: User) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
    refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
  };
}
\`\`\`

**Trade-offs**:

| | Session-based | JWT |
|---|---|---|
| Server state | Yes (session store) | No |
| Revocation | Instant (delete session) | Hard (wait for expiry) |
| Scalability | Needs shared store (Redis) | Stateless (any instance) |
| Payload size | Cookie (small, server holds data) | Token (larger, self-contained) |
| Mobile/API | Awkward (cookie issues) | Natural (Bearer token) |
| CSRF protection | Required | Not needed |

**Controller guards**:
\`\`\`typescript
// Protect route with strategy
@UseGuards(AuthGuard('local'))       // Triggers LocalStrategy.validate()
@Post('login')
login(@Req() req: Request) {
  return req.user;
}

@UseGuards(AuthGuard('jwt'))
@Get('profile')
profile(@CurrentUser() user: User) {
  return user;
}

// Session-based
@UseGuards(SessionAuthGuard)
@Get('dashboard')
dashboard(@CurrentUser() user: User) {
  return user;
}
\`\`\`

**Common mistakes**:
- Not storing refresh tokens in the database — can't revoke them on logout
- Setting JWT expiry too long — compromised tokens stay valid
- Not using HTTPS — sessions and JWTs can be intercepted
- Deserializing the full user object on every request without caching

**Follow-up**: How do you implement refresh token rotation? What is the difference between \`AuthGuard\` and a custom guard using \`PassportStrategy\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "ConfigModule and ConfigService: validation, namespacing, and typed configuration",
    content:
      "How do you manage application configuration in NestJS with ConfigModule? Explain environment-specific config, validation, namespacing, and how to get type-safe configuration.",
    answer: `**Basic setup with validation**:
\`\`\`typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  NODE_ENV: string;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;
}

function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString()); // Fail fast at startup
  }
  return validatedConfig;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // No need to import in every module
      validate,               // Validate at startup
      envFilePath: ['.env.local', '.env'], // Load order
    }),
  ],
})
export class AppModule {}
\`\`\`

**Namespaced configuration** (organize by domain):
\`\`\`typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  },
  ssl: process.env.NODE_ENV === 'production',
}));

// config/auth.config.ts
export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  refreshExpiry: process.env.REFRESH_EXPIRY || '7d',
}));

// app.module.ts
ConfigModule.forRoot({
  load: [databaseConfig, authConfig],
})
\`\`\`

**Injecting config**:
\`\`\`typescript
// Method 1: ConfigService (string-based)
@Injectable()
export class AuthService {
  constructor(private config: ConfigService) {}

  getJwtSecret() {
    return this.config.get<string>('auth.jwtSecret');       // Namespaced
    return this.config.get<string>('JWT_SECRET');           // Direct env var
    return this.config.getOrThrow<string>('JWT_SECRET');    // Throws if missing
  }
}

// Method 2: Inject namespaced config directly (typed)
@Injectable()
export class DatabaseService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    // dbConfig.url, dbConfig.pool.min — fully typed!
  }
}
\`\`\`

**Environment-specific files**:
\`\`\`
.env                 # Base (committed, no secrets)
.env.local           # Local overrides (gitignored)
.env.development     # Dev-specific (committed)
.env.production      # Prod-specific (committed, no secrets)
.env.test            # Test-specific (committed)
\`\`\`

**TypeORM async config pattern**:
\`\`\`typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.getOrThrow('DATABASE_URL'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: config.get('NODE_ENV') !== 'production',
    ssl: config.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  }),
  inject: [ConfigService],
})
\`\`\`

**Common mistakes**:
- Not using \`isGlobal: true\` — importing ConfigModule in every module
- Not validating at startup — undefined config values cause runtime errors
- Using \`config.get()\` without \`getOrThrow()\` — silently gets \`undefined\`
- Committing \`.env\` files with real secrets to git

**Follow-up**: How does \`ConfigModule.forFeature()\` differ from \`forRoot()\`? How do you test services that depend on ConfigService?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Testing NestJS: unit testing services, mocking providers, and e2e testing with supertest",
    content:
      "What is the recommended testing strategy for a NestJS application? Show how to unit test a service with mocked dependencies, and how to write an e2e test for an API endpoint.",
    answer: `**Unit testing a service**:
\`\`\`typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const mockUser = { id: '1', name: 'Alice', email: 'alice@test.com' };
      userRepo.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('999'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
\`\`\`

**Testing with ConfigService**:
\`\`\`typescript
const module = await Test.createTestingModule({
  providers: [
    AuthService,
    {
      provide: ConfigService,
      useValue: { get: jest.fn((key) => {
        const config = { JWT_SECRET: 'test-secret', JWT_EXPIRY: '15m' };
        return config[key];
      })},
    },
  ],
}).compile();
\`\`\`

**E2E testing**:
\`\`\`typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],   // Full app module
    })
    .overrideProvider(UserRepository)
    .useValue(mockUserRepository)  // Override only the DB layer
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('creates a user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Alice', email: 'alice@test.com', age: 30 })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Alice',
        email: 'alice@test.com',
      });
      expect(response.body.id).toBeDefined();
    });

    it('rejects invalid email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Alice', email: 'not-an-email', age: 30 })
        .expect(400);
    });

    it('requires authentication for protected routes', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });
});
\`\`\`

**Testing authenticated routes**:
\`\`\`typescript
it('returns profile for authenticated user', async () => {
  // Get token from login endpoint
  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'alice@test.com', password: 'Password123!' })
    .expect(200);

  const { access_token } = loginRes.body;

  // Use token in subsequent requests
  const profileRes = await request(app.getHttpServer())
    .get('/users/me')
    .set('Authorization', \`Bearer \${access_token}\`)
    .expect(200);

  expect(profileRes.body.email).toBe('alice@test.com');
});
\`\`\`

**Testing with real database** (integration tests):
\`\`\`typescript
// Use testcontainers or a dedicated test database
// Reset after each test with transactions:
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

**Common mistakes**:
- Not calling \`app.close()\` after e2e tests — leaves DB connections open
- Over-mocking in integration tests — mocking the DB in e2e defeats the purpose
- Not applying the same pipes/interceptors in tests as in production — false passing tests
- Using \`beforeEach\` instead of \`beforeAll\` for app initialization — slow tests

**Follow-up**: How do you test guards and interceptors in isolation? What is \`moduleFixture.get()\` vs \`module.get()\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Dynamic modules: forRoot/forRootAsync pattern and configurable module builder",
    content:
      "What are dynamic modules in NestJS? How do you implement the forRoot/forRootAsync pattern to create configurable, reusable modules? When would you use ConfigurableModuleBuilder?",
    answer: `**Static module**: Fixed providers — same behavior everywhere it's imported.
**Dynamic module**: Returns a module object with providers computed at runtime, allowing configuration.

**forRoot pattern** (synchronous config):
\`\`\`typescript
// mailer.module.ts
@Module({})
export class MailerModule {
  static forRoot(options: MailerOptions): DynamicModule {
    return {
      module: MailerModule,
      providers: [
        {
          provide: MAILER_OPTIONS,
          useValue: options,
        },
        MailerService,
      ],
      exports: [MailerService],
      global: true, // Optional: make globally available
    };
  }
}

// Usage:
MailerModule.forRoot({
  host: 'smtp.gmail.com',
  from: 'noreply@example.com',
})
\`\`\`

**forRootAsync pattern** (async config with DI):
\`\`\`typescript
@Module({})
export class MailerModule {
  static forRootAsync(asyncOptions: MailerAsyncOptions): DynamicModule {
    return {
      module: MailerModule,
      imports: asyncOptions.imports || [],
      providers: [
        {
          provide: MAILER_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject || [],
        },
        MailerService,
      ],
      exports: [MailerService],
    };
  }
}

// Usage — inject ConfigService:
MailerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    host: config.get('MAIL_HOST'),
    from: config.get('MAIL_FROM'),
  }),
  inject: [ConfigService],
})
\`\`\`

**forFeature pattern** (per-module config, e.g., TypeORM):
\`\`\`typescript
// Register specific entities for a module
TypeOrmModule.forFeature([User, Order])
// This makes UserRepository and OrderRepository injectable in that module's providers
\`\`\`

**ConfigurableModuleBuilder** (NestJS 9+ — auto-generates forRoot/forRootAsync):
\`\`\`typescript
// mailer.module-definition.ts
import { ConfigurableModuleBuilder } from '@nestjs/common';

export interface MailerOptions {
  host: string;
  port: number;
  from: string;
}

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<MailerOptions>()
  .setClassMethodName('forRoot')  // Generates forRoot and forRootAsync
  .setExtras({ isGlobal: false }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();

// mailer.module.ts — just extend the generated class!
@Module({ providers: [MailerService], exports: [MailerService] })
export class MailerModule extends ConfigurableModuleClass {}

// mailer.service.ts — inject options with typed token
@Injectable()
export class MailerService {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private options: MailerOptions,
  ) {}
}
\`\`\`

**Usage of ConfigurableModuleBuilder result**:
\`\`\`typescript
// Synchronous
MailerModule.forRoot({ host: 'smtp.gmail.com', port: 587, from: 'x@y.com' })

// Async with DI (auto-generated!)
MailerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    host: config.get('MAIL_HOST'),
    port: config.get<number>('MAIL_PORT'),
    from: config.get('MAIL_FROM'),
  }),
  inject: [ConfigService],
})

// With global flag (from setExtras)
MailerModule.forRoot({ host: '...', isGlobal: true })
\`\`\`

**Common mistakes**:
- Forgetting \`imports\` in the dynamic module definition — provider dependencies unresolved
- Not exporting the service from the dynamic module — consumers can't inject it
- Duplicating forRoot/forRootAsync boilerplate instead of using \`ConfigurableModuleBuilder\`

**Follow-up**: What is the difference between \`global: true\` in a dynamic module and using \`@Global()\`? Can a dynamic module also use \`forFeature()\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Caching in NestJS: cache-manager, Redis integration, and cache invalidation strategies",
    content:
      "How do you implement caching in a NestJS application? Explain the CacheModule, @CacheKey/@CacheTTL decorators, Redis backend, and how to handle cache invalidation.",
    answer: `**CacheModule setup with Redis**:
\`\`\`typescript
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        ttl: 60,         // Default TTL in seconds
        max: 100,        // Max items (in-memory stores)
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
\`\`\`

**Route-level caching with interceptor**:
\`\`\`typescript
@Controller('products')
export class ProductController {
  // Cache entire response for 5 minutes
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products-list')
  @CacheTTL(300)
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  // Cache per product ID (uses route params in key by default)
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
\`\`\`

**Manual cache control** (fine-grained):
\`\`\`typescript
@Injectable()
export class ProductService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findById(id: string): Promise<Product> {
    const cacheKey = \`product:\${id}\`;

    // Check cache
    const cached = await this.cacheManager.get<Product>(cacheKey);
    if (cached) return cached;

    // Fetch from DB
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException();

    // Store in cache
    await this.cacheManager.set(cacheKey, product, 300); // 300s TTL
    return product;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.save({ id, ...data });

    // Invalidate specific cache entry
    await this.cacheManager.del(\`product:\${id}\`);

    return product;
  }

  async clearProductsCache() {
    // Invalidate all product-related keys (requires store support)
    const keys = await this.cacheManager.store.keys('product:*');
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
\`\`\`

**Cache-aside vs Write-through**:
\`\`\`typescript
// Cache-aside: check cache first, populate on miss
async getUser(id: string) {
  const cached = await this.cache.get(\`user:\${id}\`);
  if (cached) return cached;
  const user = await this.userRepo.findOne({ where: { id } });
  await this.cache.set(\`user:\${id}\`, user, 600);
  return user;
}

// Write-through: update both cache and DB simultaneously
async updateUser(id: string, data: Partial<User>) {
  const [user] = await Promise.all([
    this.userRepo.save({ id, ...data }),
    this.cache.del(\`user:\${id}\`),
  ]);
  await this.cache.set(\`user:\${id}\`, user, 600);
  return user;
}
\`\`\`

**Cache key strategies**:
\`\`\`typescript
// Version-based keys (easy invalidation of groups)
const key = \`v2:products:\${categoryId}:page:\${page}\`;

// Tag-based (requires Redis 7+ with tagged caching)
await this.cache.set(key, data, { ttl: 300, tags: ['product', 'category:electronics'] });
// Invalidate all tagged 'product':
await this.cache.invalidateByTag('product');
\`\`\`

**Common mistakes**:
- Not invalidating cache on mutations — stale data served indefinitely
- Caching non-deterministic responses (with timestamps, request-specific data)
- Using the default key for routes with query params — all variants share one cache entry
- Over-caching — cache TTL too long, users see outdated data
- Not handling cache misses gracefully — if Redis is down, app should still work

**Follow-up**: How does \`CacheInterceptor\` determine the cache key? How would you implement a cache stampede prevention strategy?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Task scheduling in NestJS: @nestjs/schedule, cron jobs, and distributed task management",
    content:
      "How do you implement scheduled tasks in NestJS? Explain @Cron, @Interval, @Timeout decorators and how to handle distributed scheduling when running multiple instances.",
    answer: `**Setup**:
\`\`\`typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
})
export class AppModule {}
\`\`\`

**Decorator types**:
\`\`\`typescript
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  // @Cron: run on a schedule (cron expression)
  @Cron('0 0 * * *', {                    // Every day at midnight
    name: 'dailyCleanup',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleDailyCleanup() {
    this.logger.log('Running daily cleanup...');
    await this.cleanupExpiredSessions();
  }

  // Predefined expressions:
  @Cron(CronExpression.EVERY_HOUR)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron(CronExpression.EVERY_WEEK)

  // @Interval: run every N milliseconds
  @Interval('healthCheck', 30000)         // Every 30 seconds
  async checkExternalServices() {
    await this.healthService.pingAll();
  }

  // @Timeout: run once after N milliseconds (on app start)
  @Timeout('initTask', 5000)              // 5 seconds after startup
  async handleInit() {
    await this.warmupCache();
  }
}
\`\`\`

**Dynamic cron management** (add/remove at runtime):
\`\`\`typescript
@Injectable()
export class DynamicSchedulerService {
  constructor(
    @InjectSchedulerRegistry()
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  addCronJob(name: string, expression: string, callback: () => void) {
    const job = new CronJob(expression, callback);
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
  }

  pauseCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.stop();
  }

  listAllJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key) => {
      const next = value.nextDate();
      this.logger.log(\`Job \${key} — next run: \${next}\`);
    });
  }
}
\`\`\`

**Distributed scheduling problem**: When running 2+ instances, \`@Cron\` fires on EVERY instance simultaneously. For tasks that should run only once (e.g., send 1 email), this causes duplicates.

**Solution 1: BullMQ repeatable jobs**:
\`\`\`typescript
// Queue-based scheduling — only one worker processes each job
const queue = new Queue('scheduled-tasks', { connection: redisConnection });

await queue.add('daily-report', {}, {
  repeat: { pattern: '0 0 * * *', tz: 'Asia/Ho_Chi_Minh' },
  jobId: 'daily-report', // Ensures only one scheduled job exists
});

// Worker (only one instance processes each job)
const worker = new Worker('scheduled-tasks', async (job) => {
  if (job.name === 'daily-report') {
    await sendDailyReport();
  }
});
\`\`\`

**Solution 2: Distributed lock**:
\`\`\`typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async handleDailyTask() {
  const lockKey = 'lock:daily-task';
  const lockTtl = 60; // 60 seconds

  const locked = await this.redis.set(lockKey, '1', 'EX', lockTtl, 'NX');
  if (!locked) return; // Another instance has the lock

  try {
    await this.runDailyTask();
  } finally {
    await this.redis.del(lockKey);
  }
}
\`\`\`

**Common mistakes**:
- Running @Cron jobs without distributed locks in multi-instance deployments
- Not handling job failures — if the task throws, next run still proceeds
- Overly frequent intervals for tasks that access the database — connection pool exhaustion
- Not logging task start/end — can't tell if scheduled tasks are running

**Follow-up**: How does BullMQ handle job retries and failure callbacks? What is the difference between \`@Interval\` and \`setInterval\` in NestJS context?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "File upload handling: Multer, validation, storage strategies, and streaming",
    content:
      "How do you handle file uploads in NestJS? Explain Multer configuration, file validation, different storage strategies (disk, memory, S3), and how to handle large files.",
    answer: `**Basic file upload**:
\`\`\`typescript
@Controller('upload')
export class UploadController {
  // Single file
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.uploadService.saveAvatar(user.id, file);
  }

  // Multiple files
  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadService.saveDocuments(files);
  }
}
\`\`\`

**Multer configuration** (memory vs disk storage):
\`\`\`typescript
// Memory storage (for processing, then sending to S3)
@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),  // Buffer in memory
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = /image\/(jpeg|png|gif|webp)/;
        if (allowedTypes.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('File type not allowed'), false);
        }
      },
    }),
  ],
})
export class UploadModule {}

// Disk storage (for serving files locally)
MulterModule.register({
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const ext = extname(file.originalname);
      const filename = \`\${uuidv4()}\${ext}\`;
      cb(null, filename);
    },
  }),
})
\`\`\`

**S3 upload after memory storage**:
\`\`\`typescript
@Injectable()
export class UploadService {
  constructor(private s3: S3Client) {}

  async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
    const key = \`\${folder}/\${uuidv4()}\${extname(file.originalname)}\`;

    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    }));

    return \`https://\${process.env.S3_BUCKET}.s3.amazonaws.com/\${key}\`;
  }
}
\`\`\`

**Large file streaming** (avoid loading into memory):
\`\`\`typescript
@Post('large-upload')
async handleLargeUpload(@Req() req: Request, @Res() res: Response) {
  const upload = multer({
    storage: multerS3({
      s3: this.s3Client,
      bucket: process.env.S3_BUCKET,
      key: (req, file, cb) => cb(null, \`uploads/\${uuidv4()}\`),
    }),
  }).single('file');

  await new Promise<void>((resolve, reject) => {
    upload(req as any, res as any, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // File is now in S3 without loading into Node.js memory
  res.json({ url: (req as any).file.location });
}
\`\`\`

**File download / streaming response**:
\`\`\`typescript
@Get('download/:filename')
async downloadFile(
  @Param('filename') filename: string,
  @Res() res: Response,
) {
  const filePath = join('./uploads', filename);

  // Validate path
  const safePath = resolve('./uploads', filename);
  if (!safePath.startsWith(resolve('./uploads'))) {
    throw new ForbiddenException('Invalid file path');
  }

  const stat = await fsp.stat(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
  createReadStream(filePath).pipe(res);
}
\`\`\`

**Common mistakes**:
- Using memory storage for large files — OOM errors
- Not validating file type server-side (MIME type can be spoofed — also check magic bytes)
- Storing files in the local filesystem of a stateless/containerized app — files lost on restart
- Path traversal in filename — always sanitize filenames before saving to disk
- Not setting \`Content-Length\` for downloads — client can't show progress

**Follow-up**: How do you implement resumable uploads (chunked upload)? How do you generate pre-signed S3 URLs for direct client-to-S3 uploads?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Circular dependency resolution: forwardRef and module restructuring strategies",
    content:
      "What are circular dependencies in NestJS and how do you resolve them? When should you use forwardRef vs restructuring the module architecture?",
    answer: `**Circular dependency**: Module A depends on Module B, which depends on Module A. Or Service A depends on Service B, which depends on Service A.

\`\`\`
UserModule → AuthModule → UserModule (circular!)
UserService → AuthService → UserService (circular!)
\`\`\`

**forwardRef** — tell NestJS to resolve the reference lazily:
\`\`\`typescript
// user.module.ts
@Module({
  imports: [
    forwardRef(() => AuthModule),  // Breaks the circular reference
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// auth.module.ts
@Module({
  imports: [
    forwardRef(() => UserModule),  // Both sides need forwardRef
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

// For services — inject with forwardRef
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
}
\`\`\`

**forwardRef for circular providers** (same module):
\`\`\`typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}
}
\`\`\`

**When forwardRef is acceptable**:
- Truly bidirectional relationships (User ↔ Auth)
- Legacy code you can't easily restructure
- Temporary fix while planning a refactor

**Better approach: restructure to eliminate circularity**:

**Problem**: UserService needs AuthService to check tokens; AuthService needs UserService to validate users.

**Solution 1: Extract shared logic to a separate module**:
\`\`\`
Before: UserModule ↔ AuthModule (circular)
After:  UserModule → SharedModule ← AuthModule

// shared/token-validator.service.ts
@Injectable()
export class TokenValidatorService {
  constructor(private jwtService: JwtService) {}
  validateToken(token: string) { ... }
}
\`\`\`

**Solution 2: Use events instead of direct injection**:
\`\`\`typescript
// Instead of AuthService calling UserService directly:
// AuthService emits an event, UserService handles it
@Injectable()
export class AuthService {
  constructor(private eventEmitter: EventEmitter2) {}

  async onUserLogin(userId: string) {
    this.eventEmitter.emit('auth.login', { userId });
  }
}

@Injectable()
export class UserService {
  @OnEvent('auth.login')
  handleUserLogin({ userId }: { userId: string }) {
    this.updateLastLogin(userId);
  }
}
\`\`\`

**Solution 3: Interface segregation** — depend on interfaces, not concrete classes:
\`\`\`typescript
// Break the circular dependency by introducing an abstraction
export abstract class IUserLookup {
  abstract findById(id: string): Promise<User | null>;
}

// UserService implements IUserLookup
// AuthService depends on IUserLookup (not UserService directly)
\`\`\`

**Detecting circular dependencies**:
\`\`\`bash
# NestJS throws at startup:
# "A circular dependency has been detected (x -> y -> x)"
\`\`\`

**Common mistakes**:
- Reaching for \`forwardRef\` immediately without questioning the design
- Using \`forwardRef\` on only one side — both providers in a circular dep need it
- Using \`forwardRef\` in module imports on only one module — both need it too

**Follow-up**: How does \`ModuleRef\` allow lazy resolution to avoid circular dependencies? What is the \`LazyModuleLoader\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Health checks and graceful shutdown: @nestjs/terminus and Kubernetes probes",
    content:
      "How do you implement health checks in a NestJS application? Explain liveness vs readiness probes, the Terminus module, and how to implement graceful shutdown for zero-downtime deployments.",
    answer: `**Setup with Terminus**:
\`\`\`typescript
import { TerminusModule, TypeOrmHealthIndicator,
         MemoryHealthIndicator, HttpHealthIndicator } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
\`\`\`

**Health controller**:
\`\`\`typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  // Liveness probe — is the process alive?
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      // Only basic checks — don't check DB here
      () => this.memory.checkHeap('heap', 512 * 1024 * 1024), // 512MB
    ]);
  }

  // Readiness probe — can the app handle traffic?
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('heap', 512 * 1024 * 1024),
      // Optional: check external dependencies
      () => this.http.pingCheck('redis', 'http://redis:6379'),
    ]);
  }
}
\`\`\`

**Custom health indicator**:
\`\`\`typescript
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redis: Redis) { super(); }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Redis failed',
        this.getStatus(key, false, { message: e.message }),
      );
    }
  }
}
\`\`\`

**Kubernetes probe configuration**:
\`\`\`yaml
containers:
  - name: api
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 15    # Wait for startup
      periodSeconds: 20
      failureThreshold: 3         # Restart after 3 consecutive failures

    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 10
      failureThreshold: 3         # Stop sending traffic after 3 failures
\`\`\`

**Liveness vs Readiness**:
| | Liveness | Readiness |
|---|---|---|
| Purpose | Is the process alive? | Can it handle requests? |
| On failure | Container restarted | Removed from load balancer |
| Check | Basic (memory, process) | Full (DB, cache, dependencies) |
| Path | \`/health/live\` | \`/health/ready\` |

**Graceful shutdown**:
\`\`\`typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks (SIGTERM/SIGINT handlers)
  app.enableShutdownHooks();

  await app.listen(3000);
}

// In any provider:
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  async onModuleDestroy() {
    // Called when app starts shutting down
    await this.pool.end();
    this.logger.log('Database connections closed');
  }
}

// Or use OnApplicationShutdown for final cleanup:
@Injectable()
export class AppService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    this.logger.log(\`Application shutting down due to \${signal}\`);
  }
}
\`\`\`

**Graceful shutdown flow**:
\`\`\`
SIGTERM received
  → Stop accepting new connections (server.close())
  → Wait for in-flight requests to complete
  → Call OnModuleDestroy on all providers (in reverse init order)
  → Close DB/Redis/queue connections
  → Process exits
\`\`\`

**Common mistakes**:
- Checking the database in the liveness probe — one DB blip causes pod restarts
- Not setting \`initialDelaySeconds\` long enough — pod restarted before app is ready
- Not implementing \`OnModuleDestroy\` — connections not closed on shutdown
- Not calling \`app.enableShutdownHooks()\` — graceful shutdown handlers never fire

**Follow-up**: How does the Terminus module report partial health failures? What is a startup probe and how does it differ from a readiness probe?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Database migrations with TypeORM: generate, run, revert, and production workflow",
    content:
      "How do you manage database schema changes in a NestJS/TypeORM application? Explain the migrations workflow, how to safely run migrations in production, and common pitfalls.",
    answer: `**Migration workflow** (never use synchronize: true in production!):

\`\`\`typescript
// data-source.ts — standalone DataSource for migration CLI
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // NEVER true in production
});
\`\`\`

**CLI commands**:
\`\`\`bash
# Generate migration from entity changes (diff between entities and DB)
npx typeorm migration:generate -d src/database/data-source.ts \
  src/database/migrations/AddUserProfileColumns

# Create empty migration (for data migrations, custom SQL)
npx typeorm migration:create src/database/migrations/SeedInitialData

# Run pending migrations
npx typeorm migration:run -d src/database/data-source.ts

# Revert last migration
npx typeorm migration:revert -d src/database/data-source.ts

# Show migration status
npx typeorm migration:show -d src/database/data-source.ts
\`\`\`

**Migration file anatomy**:
\`\`\`typescript
// 1709123456789-AddUserProfileColumns.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileColumns1709123456789 implements MigrationInterface {
  name = 'AddUserProfileColumns1709123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Forward: apply changes
    await queryRunner.query(\`
      ALTER TABLE "users"
      ADD COLUMN "bio" TEXT,
      ADD COLUMN "avatar_url" VARCHAR(500),
      ADD COLUMN "location" VARCHAR(100)
    \`);

    await queryRunner.query(\`
      CREATE INDEX "IDX_users_location" ON "users" ("location")
    \`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: undo changes
    await queryRunner.query(\`DROP INDEX "IDX_users_location"\`);
    await queryRunner.query(\`
      ALTER TABLE "users"
      DROP COLUMN "bio",
      DROP COLUMN "avatar_url",
      DROP COLUMN "location"
    \`);
  }
}
\`\`\`

**Data migration example**:
\`\`\`typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Migrate: split fullName into firstName + lastName
  await queryRunner.query(\`
    ALTER TABLE "users"
    ADD COLUMN "first_name" VARCHAR(100),
    ADD COLUMN "last_name" VARCHAR(100)
  \`);

  // Batch update to avoid locking large tables
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const users = await queryRunner.query(
      'SELECT id, full_name FROM users LIMIT $1 OFFSET $2',
      [batchSize, offset]
    );
    if (users.length === 0) break;

    for (const user of users) {
      const [firstName, ...rest] = user.full_name.split(' ');
      await queryRunner.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
        [firstName, rest.join(' '), user.id]
      );
    }

    offset += batchSize;
  }
}
\`\`\`

**Production deployment pattern** (zero-downtime):
\`\`\`
1. Deploy migration (expand phase): Add new columns (nullable), add new tables
2. Deploy new code: Write to both old and new columns
3. Backfill data: Fill new columns from old data
4. Deploy updated code: Read from new columns
5. Deploy cleanup migration (contract phase): Remove old columns
\`\`\`

**Running migrations automatically on startup**:
\`\`\`typescript
// In main.ts (for simple apps)
const dataSource = app.get(DataSource);
await dataSource.runMigrations();

// Better: run as a separate step in CI/CD
// kubectl run migrate --image=myapp --command -- node dist/migrate.js
\`\`\`

**Common mistakes**:
- Using \`synchronize: true\` in production — can DROP columns!
- Not having a \`down()\` migration — can't roll back on bad deploy
- Adding NOT NULL columns without a DEFAULT — migration fails on existing rows
- Not testing migrations against production data volume — 30s migration on 1GB table
- Committing auto-generated migrations without reviewing them

**Follow-up**: How do you handle multi-instance deployments where multiple pods might run migrations simultaneously? What are advisory locks in PostgreSQL?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Logging in NestJS: built-in logger, custom logger, and structured logging integration",
    content:
      "How do you implement production-ready logging in a NestJS application? Explain the built-in Logger, how to replace it with Pino or Winston, and context-aware logging patterns.",
    answer: `**Built-in Logger** (basic, good for development):
\`\`\`typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(dto: CreateUserDto) {
    this.logger.log(\`Creating user: \${dto.email}\`);
    this.logger.debug({ dto }, 'User creation payload');
    this.logger.warn('Rate limit approaching');
    this.logger.error('Failed to send email', error.stack);
    this.logger.verbose('Detailed trace info');
  }
}

// main.ts — control log levels
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'], // Disable 'debug' and 'verbose' in prod
});
\`\`\`

**Custom Logger (Pino — production recommended)**:
\`\`\`typescript
// pino.logger.ts
import pino from 'pino';
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class PinoLogger implements LoggerService {
  private logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }
  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }
  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }
  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }
  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }
}

// main.ts — replace default logger
const app = await NestFactory.create(AppModule, {
  bufferLogs: true, // Buffer until custom logger is set
});
app.useLogger(app.get(PinoLogger));
\`\`\`

**nestjs-pino** (recommended library):
\`\`\`typescript
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', 'info'),
          transport: config.get('NODE_ENV') === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
          serializers: {
            req: (req) => ({
              method: req.method,
              url: req.url,
              // Don't log auth headers
            }),
          },
          customLogLevel: (req, res, err) => {
            if (res.statusCode >= 500 || err) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}

// In services — inject PinoLogger
@Injectable()
export class UserService {
  constructor(private logger: Logger) {}   // From nestjs-pino

  async createUser(dto: CreateUserDto) {
    this.logger.log({ email: dto.email }, 'Creating user');
  }
}
\`\`\`

**Request-scoped logging (correlation IDs)**:
\`\`\`typescript
// nestjs-pino automatically includes request ID in every log
// from x-request-id header or generates a new one

// Custom: use AsyncLocalStorage for manual correlation
@Injectable({ scope: Scope.REQUEST })
export class RequestLogger {
  private requestId: string;

  constructor(@Inject(REQUEST) private request: Request) {
    this.requestId = request.headers['x-request-id'] as string
      || randomUUID();
  }

  log(message: string, context?: Record<string, unknown>) {
    this.baseLogger.info({ requestId: this.requestId, ...context }, message);
  }
}
\`\`\`

**Log levels by environment**:
\`\`\`
Development: debug (verbose output)
Staging:     info (normal operations)
Production:  info (suppress debug noise)
Testing:     error (only failures)
\`\`\`

**Common mistakes**:
- Using \`console.log\` in NestJS — bypasses the logger, unstructured output
- Logging sensitive data (tokens, passwords, PII)
- Using debug logs in production — high volume, cost, performance
- Not including request context — can't correlate logs across a request lifecycle
- Creating logger instances with wrong context: \`new Logger('wrong-name')\`

**Follow-up**: How does \`nestjs-pino\`'s automatic HTTP request logging work? How do you ship logs to ELK stack or Datadog?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Rate limiting and throttling: @nestjs/throttler, per-route config, and distributed rate limiting",
    content:
      "How do you implement rate limiting in NestJS? Explain @nestjs/throttler, per-route and global configuration, different storage backends, and distributed rate limiting with Redis.",
    answer: `**Basic setup**:
\`\`\`typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,     // 1 second
        limit: 10,     // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,    // 1 minute
        limit: 100,    // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000,  // 1 hour
        limit: 1000,   // 1000 requests per hour
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply globally
    },
  ],
})
export class AppModule {}
\`\`\`

**Per-route customization**:
\`\`\`typescript
@Controller('auth')
export class AuthController {
  // Override global limit for sensitive endpoints
  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 5 } }) // 5 per minute
  login(@Body() dto: LoginDto) { ... }

  // Skip throttling for public/internal endpoints
  @Get('health')
  @SkipThrottle()
  health() { return 'ok'; }

  // Or skip specific throttles
  @Get('public-data')
  @SkipThrottle({ long: true }) // Skip only 'long' throttle
  publicData() { ... }
}
\`\`\`

**Custom key generator** (throttle by user instead of IP):
\`\`\`typescript
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Authenticated: rate limit per user
    if (req.user) {
      return \`user:\${req.user.id}\`;
    }
    // Unauthenticated: rate limit per IP
    return req.ip;
  }
}
\`\`\`

**Custom error response**:
\`\`\`typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      {
        statusCode: 429,
        message: 'Too many requests',
        retryAfter: 60,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
\`\`\`

**Redis storage** (required for distributed/multi-instance apps):
\`\`\`typescript
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'default', ttl: 60000, limit: 100 },
    ],
    storage: new ThrottlerStorageRedisService({
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
    }),
  }),
  inject: [ConfigService],
})
\`\`\`

**Why Redis storage matters**: Default in-memory storage is per-process. With 4 Node.js instances, each user can make 4× the configured limit. Redis provides a shared counter across all instances.

**Response headers**:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709208000
Retry-After: 45  (when limit exceeded)
\`\`\`

**Different limits for different endpoints**:
\`\`\`typescript
// Authentication routes: strict
@Post('register')
@Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5/hour

// API routes: moderate
@Get('data')
// Uses global default: 100/min

// Webhooks: no throttle (authenticated by signature)
@Post('webhooks/stripe')
@SkipThrottle()
\`\`\`

**Common mistakes**:
- Using in-memory throttler in a multi-instance deployment — each instance has its own counter
- Throttling by IP only — users behind NAT share the same IP
- Not sending \`Retry-After\` headers — clients don't know when to retry
- Setting limits too low for authenticated users — good users blocked

**Follow-up**: How do you implement sliding window rate limiting vs fixed window? What is the token bucket algorithm and how does it compare to counter-based approaches?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
  {
    title:
      "Exception filters: custom filters, global registration, and standardizing error responses",
    content:
      "How do you build a production-ready exception handling layer in NestJS? Explain custom exception filters, the exception hierarchy, global vs local registration, and standardizing API error responses.",
    answer: `**NestJS exception hierarchy**:
\`\`\`
Error
  └── HttpException
        ├── BadRequestException     (400)
        ├── UnauthorizedException   (401)
        ├── ForbiddenException      (403)
        ├── NotFoundException       (404)
        ├── ConflictException       (409)
        ├── UnprocessableEntityException (422)
        ├── InternalServerErrorException (500)
        └── ... (all standard HTTP codes)
\`\`\`

**Custom exception**:
\`\`\`typescript
export class BusinessRuleException extends HttpException {
  constructor(
    public readonly rule: string,
    message: string,
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super({ message, rule, statusCode }, statusCode);
  }
}

// Usage:
throw new BusinessRuleException(
  'INSUFFICIENT_BALANCE',
  'Account balance is insufficient for this transfer',
);
\`\`\`

**Custom exception filter**:
\`\`\`typescript
// all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const { status, message, details } = this.extractErrorInfo(exception);

    // Log based on severity
    if (status >= 500) {
      this.logger.error(
        { exception, url: request.url, method: request.method },
        'Internal server error',
      );
    } else if (status >= 400) {
      this.logger.warn(
        { status, url: request.url },
        message,
      );
    }

    const responseBody = {
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'],
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }

  private extractErrorInfo(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        status: exception.getStatus(),
        message: typeof response === 'string'
          ? response
          : (response as any).message,
        details: typeof response === 'object'
          ? (response as any)
          : undefined,
      };
    }

    if (exception instanceof QueryFailedError) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        details: undefined, // Don't expose DB errors
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: undefined,
    };
  }
}
\`\`\`

**Registration options**:
\`\`\`typescript
// Global (with DI support — preferred)
// main.ts
const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

// Global via APP_FILTER (supports DI injection in the filter)
// app.module.ts
providers: [
  {
    provide: APP_FILTER,
    useClass: AllExceptionsFilter,
  },
]

// Controller-level
@UseFilters(new HttpExceptionFilter())
@Controller('users')
export class UserController {}

// Route-level
@UseFilters(DatabaseExceptionFilter)
@Post()
createUser() {}
\`\`\`

**Filter execution order**: Filters registered later have higher priority:
\`\`\`
Specific filter (route/controller) → General filter (global)
\`\`\`

**Typed exception filter** (catch specific exceptions only):
\`\`\`typescript
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Unique constraint violation
    if (exception.driverError?.code === '23505') {
      return response.status(409).json({
        statusCode: 409,
        message: 'Resource already exists',
      });
    }

    response.status(500).json({
      statusCode: 500,
      message: 'Database error',
    });
  }
}
\`\`\`

**Standard error response format**:
\`\`\`json
{
  "statusCode": 422,
  "message": "Validation failed",
  "details": {
    "email": ["must be a valid email"],
    "age": ["must be a positive number"]
  },
  "timestamp": "2026-03-02T10:00:00.000Z",
  "path": "/api/users",
  "requestId": "a1b2c3d4"
}
\`\`\`

**Common mistakes**:
- Registering filters with \`useGlobalFilters\` — loses DI, can't inject services
- Catching all exceptions and hiding bugs — distinguish operational vs programmer errors
- Exposing raw database errors or stack traces in production
- Not logging 5xx errors — production bugs go undetected

**Follow-up**: How do you handle WebSocket exceptions with exception filters? How does the \`@Catch()\` decorator with no arguments differ from \`@Catch(Error)\`?`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "nestjs",
  },
];

// ============================================
// EXPORT
// ============================================

export const middleNestjsQuestions: QuestionSeed[] = nestjsMiddleQuestions;

// Summary
console.log("=".repeat(50));
console.log("MIDDLE-LEVEL NESTJS INTERVIEW QUESTIONS");
console.log("=".repeat(50));
console.log(`NestJS: ${nestjsMiddleQuestions.length}`);
console.log(`Total: ${middleNestjsQuestions.length}`);
console.log("=".repeat(50));
