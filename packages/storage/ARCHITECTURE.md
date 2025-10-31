# Storage Service Architecture - Effect-TS + DDD + Screaming Architecture

## Overview

The Storage service follows **Screaming Architecture** combined with **Domain-Driven Design (DDD)** and **Effect-TS** for type-safe, composable business logic. The structure immediately communicates business capabilities while maintaining clean separation between domain, application, and infrastructure layers.

## Tech Stack

- **Runtime**: Node.js 23 (LTS)
- **Framework**: Express (HTTP adapter layer)
- **Business Logic**: Effect-TS (typed errors, dependency injection, composability)
- **Database**: @effect/sql + @effect/sql-pg (Postgres with Effect integration)
- **Schema & Validation**: effect/Schema (runtime type safety)
- **Observability**: Sentry (error tracking, tracing)

## Folder Structure

```
src/
├── index.ts                      # Application entry & Effect runtime composition
├── runtime.ts                    # Effect runtime with Layer dependencies
├── config.ts                     # AppConfig service (environment variables)
├── Sql.ts                        # Database client layer
│
├── Settings.ts                   # Settings business capability (legacy Promise-based)
├── Documents.ts                  # Documents business capability (legacy Promise-based)
├── Users.ts                      # Users business capability (legacy Promise-based)
│
├── Domain/                       # Core business entities & domain errors
│   ├── Account.ts                # Account entity (Effect Model)
│   ├── User.ts                   # User entity + UserNotFound error
│   ├── Document.ts               # Document entity (Effect Model)
│   ├── types.ts                  # Legacy shared types
│   ├── constants.ts              # Business domain constants
│   └── mocks.ts                  # Mock data generators
│
├── Accounts/
│   └── Repo.ts                   # Account repository (Effect Service)
│
├── Users/
│   ├── Http.ts                   # HTTP handlers (Effect-based)
│   └── Repo.ts                   # User repository (Effect Service)
│
├── Documents/
│   ├── Http.ts                   # HTTP handlers (legacy Promise-based)
│   └── Repo.ts                   # Document repository (Effect Service)
│
├── Settings/
│   └── Http.ts                   # HTTP handlers (legacy Promise-based)
│
├── Auth/
│   ├── Casbin.ts                 # Casbin enforcer service (Effect scoped)
│   ├── AccountPermissions.ts     # Role/permission management service
│   ├── Http.ts                   # Auth API endpoints (roles, permissions)
│   ├── Api.ts                    # Auth endpoint definitions
│   ├── model.conf                # Casbin RBAC model with domains
│   ├── Jwt.ts                    # JWT validation with Supabase
│   └── Supabase.ts               # Supabase client service
│
├── lib/
│   └── ErrorMapper.ts            # Domain error → HTTP response mapping
│
├── middleware/
│   ├── auth.ts                   # Authentication middleware (JWT validation)
│   ├── effect.ts                 # Effect → Express bridge (runPromiseExit)
│   ├── errorHandler.ts           # Express error middleware
│   ├── deduplication.ts          # Request deduplication (caches status + body)
│   └── logging.ts                # Request/response logging
│
└── migrations/                   # Database migrations
    ├── 001_create_accounts.ts
    ├── 002_create_users.ts
    └── 005_create_casbin_policy.ts
```

## Architecture Patterns

### 1. Global vs Per-Request Dependencies

Effect services are provided through two different mechanisms depending on their lifecycle:

**Global Dependencies (ManagedRuntime)**

Built once at boot, reused across all requests:

- `AppConfig` - Environment variables, bucket names, URLs
- `SqlClient` - Database connection pool (not per-request connections)
- `Supabase` - Object storage client
- `CasbinEnforcer` - Loaded RBAC model + policies (scoped service)
- Repositories - `UsersRepo`, `AccountsRepo`, `DocumentsRepo`

These live in the `ManagedRuntime` created by [runtime.ts](runtime.ts):

```typescript
const GlobalLayer = Layer.mergeAll(
  SupabaseLive,
  SqlLive,
  CasbinLive,
  UsersRepo.Default,
).pipe(Layer.provide(AppConfigLive));

export const createRuntime = () => ManagedRuntime.make(GlobalLayer);
```

**Per-Request Dependencies (Effect.provideService)**

Created fresh for each HTTP request:

- `CurrentUser` - Full user profile from database
- `CurrentPrincipal` - Lightweight auth identity (userId + accountId)
- Future: `RequestId`, `TraceSpan`, `IdempotencyKey`

These are provided in [middleware/effect.ts](middleware/effect.ts) via `Effect.provideService`:

```typescript
// Auth middleware populates req.user and req.principal
const authReq = req as AuthenticatedRequest;

// Provide per-request services to the Effect program
if (authReq.user) {
  program = program.pipe(Effect.provideService(CurrentUser, authReq.user));
}
if (authReq.principal) {
  program = program.pipe(
    Effect.provideService(CurrentPrincipal, authReq.principal),
  );
}
```

**Key Principle**: Never create heavyweight resources (DB clients, storage clients) per request. Never memoize request-specific data (user, tenant) at the global level.

**Usage in Route Handlers**:

```typescript
// Route handler can access both global and per-request services
app.get(
  "/documents",
  effectHandler(runtime, (req) =>
    Effect.gen(function*() {
      // Global service (from ManagedRuntime)
      const documentsRepo = yield* DocumentsRepo;

      // Per-request service (from Effect.provideService)
      const currentUser = yield* CurrentUser;
      const principal = yield* CurrentPrincipal;

      // Use principal for authorization (Casbin)
      const canRead = yield* authorize(
        principal.userId,
        principal.accountId,
        "document",
        "read",
      );

      // Use user for business logic
      return yield* documentsRepo.findByAccountId(currentUser.accountId);
    })),
);
```

### 2. Effect-First Domain Layer

Domain entities use `@effect/sql` Model for automatic repository generation:

```typescript
// Domain/User.ts
export class User extends Model.Class<User>("User")({
  id: Model.GeneratedByApp(UserId),
  email: Email,
  displayName: Schema.NonEmptyTrimmedString,
  // ...
}) {}

// Domain errors are tagged for type-safe error handling
export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  { id: UserId },
) {}
```

**Key benefits:**

- Compile-time type safety
- Runtime schema validation
- Automatic JSON serialization
- Tagged errors for exhaustive handling

### 2. Repository Layer (Effect Services)

Repositories use Effect for composable, type-safe data access:

```typescript
// Users/Repo.ts
export class UsersRepo extends Effect.Service<UsersRepo>()("UsersRepo", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;
    const repo = yield* Model.makeRepository(User, {
      tableName: "users",
      idColumn: "id",
      spanPrefix: "UsersRepo",
    });

    return {
      ...repo,
      findById: (id: UserId) =>
        SqlSchema.findOne({ ... }).pipe(Effect.withSpan("UsersRepo.findById")),
    };
  }),
  dependencies: [PgLive],
}) {}
```

**Key patterns:**

- Services use Effect's dependency injection
- Automatic span tracking for observability
- Type-safe SQL queries via SqlSchema
- Errors propagate through Effect type system

### 3. Effect Runtime Composition

The runtime provides all service dependencies:

```typescript
// runtime.ts
export const StorageServiceLive = Layer.mergeAll(
  AppConfigLive,
  SqlLive,
  PgLive,
).pipe(
  Layer.provide(AccountsRepo.Default),
  Layer.provide(UsersRepo.Default),
);

export const createRuntime = () => ManagedRuntime.make(StorageServiceLive);
```

**Effect runtime patterns:**

- Layers compose services via dependency injection
- Runtime manages resource lifecycle (DB connections, etc.)
- Single runtime instance per application

### 4. Effect → Express Bridge

**Implementation (middleware/effect.ts):**

```typescript
export const effectHandler = <R, E, A>(
  runtime: AppRuntime,
  handler: EffectHandler<R, E, A>,
) =>
async (req: Request, res: Response, next: NextFunction) => {
  let program = handler(req);

  // Inject per-request services
  const authReq = req as AuthenticatedRequest;
  if (authReq.user) {
    program = program.pipe(Effect.provideService(CurrentUser, authReq.user));
  }
  if (authReq.principal) {
    program = program.pipe(
      Effect.provideService(CurrentPrincipal, authReq.principal),
    );
  }

  // Run Effect program (no AbortSignal - see cancellation note below)
  const exit = await runtime.runPromiseExit(program);

  Exit.match(exit, {
    onSuccess: (value) => res.json(value),
    onFailure: (cause) => {
      // Unexpected interruption (should not happen without signal)
      if (Cause.isInterrupted(cause)) {
        console.error("[effectHandler] UNEXPECTED: Effect interrupted", {
          method: req.method,
          url: req.url,
          cause: Cause.pretty(cause),
        });
        return next(new Error("Request processing was interrupted"));
      }

      // Extract domain error (Effect.fail)
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") return next(failure.value);

      // Extract defect (throw/Die)
      const defect = Cause.dieOption(cause);
      if (defect._tag === "Some") return next(defect.value);

      // Fallback
      console.error("[effectHandler] Unknown Effect error", {
        method: req.method,
        url: req.url,
        cause: Cause.pretty(cause),
      });
      next(new Error("Unknown Effect error"));
    },
  });
};
```

**Request Cancellation Note:**

AbortSignal removed due to Express body parsing behavior:

- `express.json()` consumes request body stream
- Stream closure triggers `req.on('close')` event immediately
- AbortSignal fires prematurely, interrupting Effect before execution
- Effect returns without sending response → client hangs

Without cancellation:

- Client disconnect → Effect completes normally
- Transaction commits/rolls back via Effect transaction management
- DB connection returns to pool
- No resource leaks (connections pooled at runtime level, not per-request)
- Response send fails silently (Express handles closed connection)

Trade-off accepted: Effect continues processing after client disconnect. Acceptable for fast operations (<1s). Effect transaction lifecycle ensures proper cleanup regardless of HTTP response status.

**Error Unwrapping:**

- `runPromise()` throws `FiberFailure` wrapper
- `runPromiseExit()` returns `Exit<A, E>` for pattern matching
- `Cause.failureOption()` extracts domain errors (Effect.fail)
- `Cause.dieOption()` extracts defects (throw/Die)

### 5. Error Handling Architecture

**Minimal Domain Error Set:**

- Only expose meaningful business errors to frontend
- Hide implementation details (ParseError → UserNotFound)
- 4xx for domain errors, 5xx for system errors

**Error Flow:**

```
Effect.fail(UserNotFound)
  → runPromiseExit returns Exit.failure
  → Cause.failureOption extracts domain error
  → next(error) passes to Express error middleware
  → errorHandler formats: { error: { _tag, message, details } }
  → Frontend uses _tag for i18n key, details for interpolation
```

**Error Handler (middleware/errorHandler.ts):**

```typescript
// Map domain error → HTTP status
const statusCode = getStatusCode(errorTag); // UserNotFound → 404

// Minimal error set:
UserNotFound → 404
Unauthorized → 401
Forbidden → 403
InternalError → 500

// Log appropriately
if (statusCode >= 500) {
  console.error(err); // Full stack trace for system errors
} else {
  console.log(errorTag); // Clean log for domain errors
}

// Only report 5xx to Sentry (domain errors are expected)
if (shouldReportToSentry(errorTag)) {
  Sentry.captureException(err, { tags: { trace_id } });
}
```

**Parse Error Handling:**

```typescript
// Users/Http.ts - Convert schema validation to domain error
Schema.decodeUnknown(UserId)(req.params.id).pipe(
  Effect.catchTag(
    "ParseError",
    () => Effect.fail(new UserNotFound({ id: req.params.id })),
  ),
);
```

Treat invalid UUIDs same as nonexistent users (404) - follows minimal error principle.

### 6. Authorization with Casbin (RBAC + Multi-Tenancy)

**Architecture:**

- Casbin enforcer loaded once at boot as global service
- RBAC with domains model: `(subject, domain, object, action)`
- Domain = tenant accountId for multi-tenant isolation
- Policies stored in `casbin_rule` PostgreSQL table
- Model defined in `Auth/model.conf`

**Service Implementation (Auth/Casbin.ts):**

```typescript
export class CasbinEnforcer extends Effect.Service<CasbinEnforcer>()(
  "Casbin",
  {
    scoped: Effect.gen(function*() {
      const config = yield* AppConfig;
      const databaseUrl = Redacted.value(config.database.url);

      // Create unconnected PostgreSQL client
      const client = yield* createPgClient(databaseUrl);

      // BasicAdapter will call client.connect() internally
      const adapter = yield* createAdapter(client);

      // Load model and initialize enforcer with policies from DB
      const enforcer = yield* createEnforcer(modelPath, adapter);

      return {
        enforce: (sub, dom, obj, act) => Effect.tryPromise(...),
        addPolicy: (sub, dom, obj, act) => Effect.tryPromise(...),
        // ...
      };
    }),
    dependencies: [AppConfig.Default],
  },
) {}
```

**Critical Implementation Details:**

1. **Scoped Service with Separate PostgreSQL Client:**
   - CasbinEnforcer uses its own `pg.Client`, separate from Effect SQL client
   - BasicAdapter requires `pg.Client`, not compatible with `@effect/sql`
   - Client created via `Effect.acquireRelease` for automatic cleanup
   - Finalizer calls `client.end()` when runtime disposes

2. **BasicAdapter Connection Handling (TRICKY!):**
   ```typescript
   // WRONG - causes hang:
   const client = new Client({ connectionString });
   await client.connect(); // ❌ Pre-connected
   await BasicAdapter.newAdapter("pg", client, "casbin_rule"); // Hangs!

   // RIGHT - let BasicAdapter handle connection:
   const client = new Client({ connectionString }); // ✅ Unconnected
   await BasicAdapter.newAdapter("pg", client, "casbin_rule"); // Works!
   ```

   **Why?** BasicAdapter.newAdapter() internally calls:
   ```javascript
   // From casbin-basic-adapter source
   static async newAdapter(drive, client, tableName) {
     const a = new BasicAdapter(drive, client, tableName);
     await a.connect();  // Calls client.connect() here!
     await a.createTable();
     return a;
   }
   ```

   Passing a pre-connected client causes `client.connect()` to hang waiting for connection that's already established.

3. **Resource Lifecycle:**
   ```typescript
   const createPgClient = (url): Effect<Client, Error, Scope.Scope> =>
     Effect.acquireRelease(
       Effect.sync(() => new Client({ connectionString: url })), // Create unconnected
       (client) =>
         Effect.promise(() => client.end()).pipe( // Cleanup on dispose
           Effect.catchAll(() => Effect.void),
         ),
     );
   ```

   - `Effect.sync` creates client synchronously (not async)
   - `acquireRelease` requires `Scope.Scope` in requirements
   - ManagedRuntime automatically provides Scope for scoped services
   - Finalizer runs when runtime shuts down

4. **Layer Integration:**
   ```typescript
   // Runtime.ts
   const GlobalLayer = Layer.mergeAll(
     SupabaseLive,
     SqlLive,
     CasbinLive, // CasbinEnforcer.Default
     UsersRepo.Default,
   ).pipe(Layer.provide(AppConfigLive));
   ```

   - `CasbinEnforcer.Default` is already a Layer
   - No need for `Layer.scoped` or `Layer.scopedDiscard` wrapper
   - Effect.Service automatically handles `scoped` property
   - ManagedRuntime.make() provides Scope for all scoped services

5. **Error Types:**
   ```typescript
   export class CasbinConnectionError
     extends Data.TaggedError("CasbinConnectionError")<{
       readonly message: string;
       readonly cause?: unknown;
     }>
   {}

   export class CasbinAdapterError
     extends Data.TaggedError("CasbinAdapterError")<{
       readonly message: string;
       readonly cause?: unknown;
     }>
   {}

   export class CasbinEnforcerError
     extends Data.TaggedError("CasbinEnforcerError")<{
       readonly message: string;
       readonly cause?: unknown;
     }>
   {}
   ```

   All Casbin methods return `Effect<A, CasbinEnforcerError>` for type-safe error handling.

6. **Supabase Transaction Pooling:**
   ```typescript
   new Client({
     connectionString: databaseUrl,
     ssl: { rejectUnauthorized: false }, // Required for Supabase
     connectionTimeoutMillis: 5000,
   });
   ```

**Model Configuration (Auth/model.conf):**

```
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act
```

**Database Schema:**

```sql
CREATE TABLE casbin_rule (
  id SERIAL PRIMARY KEY,
  ptype VARCHAR(255) NOT NULL,
  v0 VARCHAR(255),  -- subject/role
  v1 VARCHAR(255),  -- domain
  v2 VARCHAR(255),  -- object
  v3 VARCHAR(255),  -- action
  v4 VARCHAR(255),
  v5 VARCHAR(255)
);
CREATE INDEX idx_casbin_rule ON casbin_rule(ptype, v0, v1);
```

**Usage in Handlers:**

```typescript
app.get(
  "/documents",
  effectHandler(runtime, (req) =>
    Effect.gen(function*() {
      const principal = yield* CurrentPrincipal;
      const casbin = yield* CasbinEnforcer;

      // Check permission: user can read documents in their account domain
      const allowed = yield* casbin.enforce(
        principal.userId,
        principal.accountId, // Domain for tenant isolation
        "document",
        "read",
      );

      if (!allowed) {
        return yield* Effect.fail(
          new Forbidden({
            resource: "document",
            action: "read",
          }),
        );
      }

      // Proceed with business logic...
    })),
);
```

**Key Differences from Effect SQL Client:**

| Aspect      | Effect SQL (@effect/sql-pg) | Casbin (pg.Client)                           |
| ----------- | --------------------------- | -------------------------------------------- |
| Connection  | Connection pool             | Single client                                |
| Lifecycle   | Managed by Effect Layer     | Manual via acquireRelease                    |
| API         | Effect-based                | Promise-based (wrapped in Effect.tryPromise) |
| Usage       | Application data            | Authorization policies                       |
| Integration | @effect/sql Model           | BasicAdapter interface                       |

### 7. Request Deduplication (Tricky Pattern)

**The Problem:** Concurrent identical requests should wait for first request, not duplicate work.

**Bug #1 Fixed:** Status codes were lost - all cached responses returned 200!

**Solution:** Cache both status code AND body:

```typescript
// middleware/deduplication.ts
interface CachedResponse {
  statusCode: number;
  body: unknown;
}

// On response
res.send = function(body) {
  resolveResponse({ statusCode: this.statusCode, body });
};

// On cache hit
res.status(cachedResponse.statusCode).json(cachedResponse.body);
```

**Bug #2 Fixed:** Dead `errorAwareNext` override tried to replace closure variable.

**Why cache errors?** During database overload:

- Without caching: 100 requests → 100 DB attempts → cascading failure
- With caching: 1 DB attempt fails → cached 500 error → backend protected

## HTTP Layer Patterns

### Effect-Based Route Handler (GET /users/:id)

```typescript
app.get(
  "/users/:id",
  effectHandler(runtime, (req) =>
    Effect.gen(function*() {
      // 1. Parse & validate (convert ParseError → UserNotFound)
      const userId = yield* Schema.decodeUnknown(UserId)(req.params.id).pipe(
        Effect.catchTag(
          "ParseError",
          () => Effect.fail(new UserNotFound({ id: req.params.id })),
        ),
      );

      // 2. Get repository from Effect context
      const repo = yield* UsersRepo;

      // 3. Query database (returns Option<User>)
      const userOption = yield* repo.findById(userId);

      // 4. Convert Option → Effect (None becomes UserNotFound)
      const user = yield* Option.match(userOption, {
        onNone: () => Effect.fail(new UserNotFound({ id: userId })),
        onSome: (user) => Effect.succeed(user),
      });

      // 5. Encode to JSON schema for response
      return yield* Schema.encode(UserJson)(user);
    })),
);
```

**Benefits:**

- Type-safe error handling (UserNotFound in function signature)
- Automatic dependency injection (UsersRepo)
- Composable error handling (catchTag, Option.match)
- No try/catch - errors handled by Effect bridge

## Key Learnings & Tricky Patterns

### 1. FiberFailure Unwrapping (CRITICAL!)

**Wrong:**

```typescript
runtime.runPromise(program).catch(error => {
  // error is FiberFailure wrapper
  // error._tag === "FiberFailure" ❌
  // Actual error buried at error.cause.failure
});
```

**Right:**

```typescript
const exit = await runtime.runPromiseExit(program);
Exit.match(exit, {
  onFailure: (cause) => {
    const failure = Cause.failureOption(cause);
    // failure.value is the actual UserNotFound ✅
  },
});
```

### 2. Minimal Domain Errors

Don't expose implementation details:

- ❌ `ParseError`, `ValidationError`, `InvalidUUIDError`
- ✅ `UserNotFound` (treat all "not found" cases the same)

### 3. Error Response Format (i18n-Friendly)

```json
{
  "error": {
    "_tag": "UserNotFound", // Frontend i18n key
    "message": "User not found", // Fallback
    "details": { "id": "..." } // Interpolation context
  }
}
```

Frontend maps `_tag` to translation key, uses `details` for message interpolation.

### 4. Cache Error Responses

Don't reject promises on error responses - cache them with status codes:

- Protects backend during overload
- Prevents thundering herd
- Requires caching status code, not just body

### 5. Observability Logging Strategy

```typescript
// Domain errors (4xx): Clean logs, no stack trace
console.log(`[Error Handler] UserNotFound → 404`, { id });

// System errors (5xx): Full stack trace + Sentry
console.error(`[Error Handler] InternalError → 500`, err);
Sentry.captureException(err, { tags: { trace_id } });
```

## API Endpoints

### Users Context (Effect-Based)

- `GET /users/:id` - Get user by ID (Effect + repo)
  - Returns: 200 with User JSON
  - Errors: 404 UserNotFound
- `GET /users` - List users (legacy Promise-based)
- `POST /users` - Create user (legacy Promise-based)
- `PUT /users/:id` - Update user (legacy Promise-based)

### Documents Context (Legacy Promise-Based)

- `GET /documents` - List with filters
- `GET /documents/:id` - Get metadata
- `POST /documents/approve` - Approve documents
- `POST /documents/reject` - Reject documents

### Settings Context (Legacy Promise-Based)

- `GET /settings` - Retrieve settings
- `PUT /settings` - Update settings

### Auth Context (Effect-Based)

**Role Discovery:**

- `GET /accounts/:accountId/roles` - List all roles in domain
  - Query: `?includeStats=true` - Include permission/user counts
  - Returns: `{domain, roles: string[]}` or `{domain, roles: [{role, permissionCount, userCount}]}`

**Role-Permission Management:**

- `POST /accounts/:accountId/roles/:roleName/permissions` - Add permission to role
  - Body: `{object: string, action: string}`
  - Returns: `{success, roleName, domain, object, action}`
- `DELETE /accounts/:accountId/roles/:roleName/permissions` - Remove permission from role
  - Body: `{object: string, action: string}`
- `GET /accounts/:accountId/roles/:roleName/permissions` - List role permissions
  - Returns: `{role, domain, permissions: [{domain, object, action}]}`

**User-Role Assignment:**

- `POST /accounts/:accountId/users/:userId/roles/:roleName` - Assign role to user
  - Returns: `{success, userId, roleName, domain}`
- `DELETE /accounts/:accountId/users/:userId/roles/:roleName` - Unassign role from user
- `GET /accounts/:accountId/users/:userId/roles` - List user's roles
  - Query: `?includeInherited=true` - Include inherited roles
  - Returns: `{userId, domain, roles: string[], includeInherited}`
- `GET /accounts/:accountId/roles/:roleName/users` - List users with role
  - Query: `?includeInherited=true` - Include users with inherited role
  - Returns: `{roleName, domain, users: string[], includeInherited}`

**User Information:**

- `GET /accounts/:accountId/users/:userId/info` - Get comprehensive user info
  - Returns: `{domain, user, directRoles, inheritedRoles, allPermissions: [{subject, domain, object, action}]}`
- `POST /accounts/:accountId/users/:userId/check-permission` - Check user permission
  - Body: `{object: string, action: string}`
  - Returns: `{userId, domain, object, action, hasPermission: boolean}`

**Domain Management:**

- `POST /accounts/:accountId/users` - Get all users in domain with roles
  - Body: `{roles: string[]}`
  - Returns: `{domain, users: [{user, roles: string[]}]}`

**Implementation (Auth/):**

```typescript
// Auth/AccountPermissions.ts - Service layer
export class AccountPermissionsService extends Effect.Service<AccountPermissionsService>() {
  // Wraps CasbinEnforcer with domain-specific operations
  getAllRolesInDomain(domain): Effect<string[], CasbinEnforcerError>
  getAllRolesWithPermissions(domain): Effect<RoleWithStats[], CasbinEnforcerError>
  getPermissionsForRole(role): Effect<RoleInfo, CasbinEnforcerError>
  // ...
}

// Auth/Http.ts - HTTP handlers
registerAuthRoutes(app, runtime) {
  app.get("/accounts/:accountId/roles", effectHandler(...));
  app.post("/accounts/:accountId/roles/:roleName/permissions", effectHandler(...));
  // ...
}

// Runtime.ts - Global layer
const GlobalLayer = Layer.mergeAll(
  CasbinLive,
  AccountPermissionsLive, // Added to global runtime
  // ...
);
```

**No Domain Entity:**

- Roles are pure Casbin strings, no Role table/repository
- Role names stored in `casbin_rule` table via grouping policies
- `getAllRolesInDomain()` queries `getFilteredGroupingPolicy(2, domain)` to extract unique role names

**Multi-Tenancy:**

- All endpoints require `:accountId` parameter
- `accountId` maps to Casbin `domain` for tenant isolation
- Cross-account role queries return empty results

## Migration Status

### ✅ Completed (Effect-Based)

- Domain entities (User, Account, Document)
- Repository layer (UsersRepo, AccountsRepo, DocumentsRepo)
- Effect runtime with Layers
- Effect → Express bridge
- Error handling infrastructure
- GET /users/:id endpoint
- Authorization with Casbin (CasbinEnforcer service with scoped lifecycle)
- Authentication with Supabase (JWT validation middleware)
- Role & permission management API (AccountPermissionsService, Auth HTTP endpoints)

### 🚧 In Progress

- Migrating remaining endpoints to Effect
- Converting Promise-based services to Effect Services
- Integrating Casbin authorization checks in route handlers

### 📋 Planned

- Schema validation for all endpoints
- Integration tests for Effect flows

## Development Workflow

### Running the Service

```bash
pnpm --filter @fidudoc/storage dev    # Dev mode with hot reload
pnpm --filter @fidudoc/storage start  # Production mode
```

### Type Checking

```bash
pnpm --filter @fidudoc/storage typecheck
```

### Database Migrations

```bash
# Migrations run automatically on startup via Sql.ts
```

### Testing Error Responses

```bash
# Valid user
curl http://localhost:3000/users/ff60f64e-76cc-4234-b232-c9fa47327549

# Nonexistent user (404 UserNotFound)
curl http://localhost:3000/users/00000000-0000-0000-0000-000000000000

# Invalid UUID (404 UserNotFound - parse error converted)
curl http://localhost:3000/users/invalid-uuid
```

### Testing Auth API

```bash
# Run integration test (requires dev server running)
pnpm exec tsx src/scratchpad-api.ts

# Test manually
ACCOUNT_ID="019a261c-e755-708f-8240-ab4ec58e594e"
USER_ID="ff60f64e-76cc-4234-b232-c9fa47327549"

# List all roles in account
curl "http://localhost:3000/accounts/$ACCOUNT_ID/roles"
curl "http://localhost:3000/accounts/$ACCOUNT_ID/roles?includeStats=true"

# Assign role to user
curl -X POST "http://localhost:3000/accounts/$ACCOUNT_ID/users/$USER_ID/roles/admin"

# Add permission to role
curl -X POST "http://localhost:3000/accounts/$ACCOUNT_ID/roles/admin/permissions" \
  -H "Content-Type: application/json" \
  -d '{"object": "documents", "action": "read"}'

# Check user permission
curl -X POST "http://localhost:3000/accounts/$ACCOUNT_ID/users/$USER_ID/check-permission" \
  -H "Content-Type: application/json" \
  -d '{"object": "documents", "action": "read"}'

# Get comprehensive user info
curl "http://localhost:3000/accounts/$ACCOUNT_ID/users/$USER_ID/info"
```

## Benefits of This Architecture

1. **Type Safety**: Effect's type system catches errors at compile time
2. **Composability**: Effect programs compose like Lego blocks
3. **Testability**: Pure Effect programs, easy to test
4. **Observability**: Automatic spans, structured logging, Sentry integration
5. **Error Handling**: Type-safe, exhaustive, i18n-friendly
6. **Resource Management**: Effect runtime handles lifecycle
7. **Dependency Injection**: Layers provide clean composition
8. **Screaming Architecture**: Folder structure shows business capabilities

---

This architecture demonstrates **Effect-TS best practices** for building type-safe, composable backend services with proper error handling and observability.
