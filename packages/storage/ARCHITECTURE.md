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
├── lib/
│   └── ErrorMapper.ts            # Domain error → HTTP response mapping
│
├── middleware/
│   ├── effect.ts                 # Effect → Express bridge (runPromiseExit)
│   ├── errorHandler.ts           # Express error middleware
│   ├── deduplication.ts          # Request deduplication (caches status + body)
│   └── logging.ts                # Request/response logging
│
└── migrations/                   # Database migrations
    ├── 001_create_accounts.ts
    └── 002_create_users.ts
```

## Architecture Patterns

### 1. Effect-First Domain Layer

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

export const createRuntime = () =>
  ManagedRuntime.make(StorageServiceLive);
```

**Effect runtime patterns:**
- Layers compose services via dependency injection
- Runtime manages resource lifecycle (DB connections, etc.)
- Single runtime instance per application

### 4. Effect → Express Bridge (Critical Pattern)

**The Challenge:** Effect errors are wrapped in `FiberFailure` when using `runPromise()`, losing domain error metadata.

**The Solution:** Use `runPromiseExit()` for type-safe unwrapping:

```typescript
// middleware/effect.ts
const exit = await runtime.runPromiseExit(program, { signal });

Exit.match(exit, {
  onSuccess: (value) => res.json(value),
  onFailure: (cause) => {
    if (Cause.isInterrupted(cause)) return; // Request cancelled

    const failure = Cause.failureOption(cause);
    if (failure._tag === "Some") {
      next(failure.value); // Pass unwrapped UserNotFound to error handler
    }
  },
});
```

**Why this matters:**
- `runPromise()` throws `FiberFailure` wrapper → error handler sees wrong type
- `runPromiseExit()` returns `Exit<A, E>` → clean pattern matching
- Domain errors (Effect.fail) extracted via `Cause.failureOption()`
- Defects (throw/Die) extracted via `Cause.dieOption()`

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
  Effect.catchTag("ParseError", () =>
    Effect.fail(new UserNotFound({ id: req.params.id }))
  ),
);
```

Treat invalid UUIDs same as nonexistent users (404) - follows minimal error principle.

### 6. Request Deduplication (Tricky Pattern)

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
app.get("/users/:id",
  effectHandler(runtime, (req) =>
    Effect.gen(function*() {
      // 1. Parse & validate (convert ParseError → UserNotFound)
      const userId = yield* Schema.decodeUnknown(UserId)(req.params.id).pipe(
        Effect.catchTag("ParseError", () =>
          Effect.fail(new UserNotFound({ id: req.params.id }))
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
    })
  )
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
  }
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
    "_tag": "UserNotFound",      // Frontend i18n key
    "message": "User not found",  // Fallback
    "details": { "id": "..." }    // Interpolation context
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

## Migration Status

### ✅ Completed (Effect-Based)
- Domain entities (User, Account, Document)
- Repository layer (UsersRepo, AccountsRepo, DocumentsRepo)
- Effect runtime with Layers
- Effect → Express bridge
- Error handling infrastructure
- GET /users/:id endpoint

### 🚧 In Progress
- Migrating remaining endpoints to Effect
- Converting Promise-based services to Effect Services

### 📋 Planned
- Authorization with Casbin (Forbidden error)
- Authentication with Supabase (Unauthorized error)
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
