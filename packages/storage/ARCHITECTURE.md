# Storage Service Architecture

Effect-TS backend with DDD patterns, multi-tenant RBAC, and screaming architecture.

## ⚠️ Critical Pitfalls - Read First

### 1. NEVER Use Effect in Express Middleware (Cost: 5 hours debugging)

**Problem:** Effect runtime in middleware causes stuck requests.

```typescript
// ❌ WRONG - causes stuck requests
export const authMiddleware = (runtime: AppRuntime) => async (req, res, next) => {
  const program = Effect.gen(function*() { ... });
  await runtime.runPromiseExit(program);
};

// ✅ RIGHT - plain async/await
export const authMiddleware = (supabaseClient: SupabaseClient) =>
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      if (error) return res.status(401).json({ error: "Unauthorized" });
      req.principal = makePrincipal(data);
      next();
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
```

**Rule:** Effect ONLY in business logic, NEVER in middleware. Exception: `effect/Schema` is OK everywhere.

### 2. Convert Tagged Errors to Error Objects for Sentry

```typescript
// Tagged errors won't show in Sentry - convert them:
Effect.tapError((error) =>
  Effect.sync(() => {
    const throwable = error instanceof Error
      ? error
      : new Error(error.message ?? "Operation failed", { cause: error.cause });

    Sentry.captureException(throwable, {
      tags: { component: "component_name" },
      extra: { originalError: error },
    });
  })
);
```

### 3. Copy Non-TypeScript Assets in Build

`tsc` doesn't copy `.conf` or migration files. Add `scripts/copy-assets.mjs`:

```javascript
// Copy model.conf and migrations to dist/
await copyFile("src/Auth/model.conf", "dist/model.conf");
await copyDirectory("src/migrations", "dist/migrations");
```

Update `package.json`: `"build": "tsc && node scripts/copy-assets.mjs"`

## Tech Stack

- **Runtime:** Node.js 23, Express
- **Business Logic:** Effect-TS (services, repos, domain)
- **Database:** @effect/sql + @effect/sql-pg (Postgres)
- **Schema:** effect/Schema (validation everywhere)
- **Auth:** Supabase Auth (JWT) + Casbin (RBAC with domains)
- **Observability:** Sentry

## Folder Structure

```
src/
├── index.ts                      # Express app + Effect runtime
├── Runtime.ts                    # Effect runtime (global services)
├── Config.ts                     # Environment config service
├── Sql.ts                        # Database client layer
│
├── Domain/                       # Entities + domain errors
│   ├── Account.ts                # Account entity (Effect Model)
│   ├── User.ts                   # User entity + UserNotFound error
│   └── Principal.ts              # Auth context (userId + accountId)
│
├── Accounts/
│   ├── Service.ts                # Account business logic
│   ├── Repo.ts                   # Account repository (Effect Service)
│   └── Http.ts                   # HTTP handlers (Effect-based)
│
├── Users/
│   ├── Service.ts                # User business logic
│   ├── Repo.ts                   # User repository (Effect Service)
│   └── Http.ts                   # HTTP handlers (Effect-based)
│
├── Auth/
│   ├── Casbin.ts                 # Casbin enforcer service (scoped)
│   ├── AccountPermissions.ts     # Role/permission service
│   ├── Supabase.ts               # Supabase client service
│   ├── Http.ts                   # Auth API endpoints (Effect-based)
│   └── model.conf                # Casbin RBAC model (copied to dist/)
│
├── middleware/
│   ├── auth.ts                   # Auth middleware (plain async/await!)
│   ├── effect.ts                 # Effect → Express bridge
│   ├── errorHandler.ts           # Express error handler
│   └── logging.ts                # Request/response logging
│
└── migrations/                   # Database migrations (copied to dist/)
```

## Architecture Layers

```
HTTP Request
    ↓
Express Middleware (plain async/await) ← NO Effect here!
    ↓
effectHandler bridge ← Effect starts here
    ↓
Effect Business Logic (Services, Repos)
    ↓
Response
```

### When to Use Effect

| Layer               | Effect Runtime? | effect/Schema? |
| ------------------- | --------------- | -------------- |
| Express Middleware  | ❌ NEVER        | ✅ YES         |
| Route Handlers      | ✅ via bridge   | ✅ YES         |
| Business Logic      | ✅ YES          | ✅ YES         |
| Database Operations | ✅ YES          | ✅ YES         |

## Effect Runtime Composition

### Global Services (ManagedRuntime)

Created once at boot, shared across all requests:

```typescript
// Runtime.ts
const GlobalLayer = Layer.mergeAll(
  AppConfigLive,
  SqlLive,
  SupabaseLive,
  CasbinLive,
  AccountsRepoLive,
  UsersRepoLive,
  AccountsServiceLive,
  UsersServiceLive,
  AccountPermissionsLive,
).pipe(Layer.provide(AppConfigLive));

export const createRuntime = () => ManagedRuntime.make(GlobalLayer);
```

### Per-Request Services (provideService)

Created fresh per request in `effectHandler`:

- `CurrentPrincipal` - Auth context (userId + accountId from JWT)

```typescript
// middleware/effect.ts
const authReq = req as AuthenticatedRequest;
if (authReq.principal) {
  program = program.pipe(
    Effect.provideService(CurrentPrincipal, authReq.principal),
  );
}
```

## Effect → Express Bridge

**Rule:** This is the ONLY place Effect meets Express!

```typescript
// middleware/effect.ts
export const effectHandler = <R, E, A>(
  runtime: AppRuntime,
  handler: EffectHandler<R, E, A>,
) =>
async (req: Request, res: Response, next: NextFunction) => {
  let program = handler(req);

  // Inject per-request services
  const authReq = req as AuthenticatedRequest;
  if (authReq.principal) {
    program = program.pipe(
      Effect.provideService(CurrentPrincipal, authReq.principal),
    );
  }

  // Run Effect program (no AbortSignal - see note below)
  const exit = await runtime.runPromiseExit(program);

  Exit.match(exit, {
    onSuccess: (value) => res.json(value),
    onFailure: (cause) => {
      const failure = Cause.failureOption(cause);
      if (failure._tag === "Some") return next(failure.value);

      const defect = Cause.dieOption(cause);
      if (defect._tag === "Some") return next(defect.value);

      console.error("[effectHandler] Unknown Effect error", cause);
      next(new Error("Unknown Effect error"));
    },
  });
};
```

**Note:** No `AbortSignal` - `express.json()` closes request stream immediately, triggering premature cancellation. Trade-off accepted for fast operations (<1s).

## Domain Errors

Use tagged errors for type-safe error handling:

```typescript
// Domain/User.ts
export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  { id: Schema.String },
) {}

export class UserValidationError
  extends Schema.TaggedError<UserValidationError>()(
    "UserValidationError",
    {
      message: Schema.String,
      errors: Schema.Array(Schema.Unknown),
    },
  )
{}
```

**Pattern:** Convert ParseError → domain error (hide implementation details):

```typescript
Schema.decodeUnknown(UserId)(req.params.id).pipe(
  Effect.catchTag(
    "ParseError",
    () => Effect.fail(new UserNotFound({ id: req.params.id })),
  ),
);
```

## Casbin RBAC (Multi-Tenant)

### Architecture

- **Model:** RBAC with domains (`subject, domain, object, action`)
- **Domain:** Maps to `accountId` for tenant isolation
- **Storage:** `casbin_rule` table in Postgres
- **Lifecycle:** Scoped service with dedicated `pg.Client`

### Critical Implementation Details

**TRICKY:** BasicAdapter requires unconnected `pg.Client`:

```typescript
// ❌ WRONG - causes hang
const client = new Client({ connectionString });
await client.connect(); // Pre-connected
await BasicAdapter.newAdapter("pg", client); // Hangs!

// ✅ RIGHT - let BasicAdapter connect
const client = new Client({ connectionString }); // Unconnected
await BasicAdapter.newAdapter("pg", client); // Works!
```

**Why?** BasicAdapter calls `client.connect()` internally. Pre-connecting causes it to hang.

### Resource Lifecycle

```typescript
// Scoped service with acquireRelease
const createPgClient = (url): Effect<Client, Error, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() => new Client({ connectionString: url })), // Unconnected
    (client) => Effect.promise(() => client.end()), // Cleanup on dispose
  );
```

## API Endpoints

### Accounts

- `POST /accounts` - Create account
- `GET /accounts/:id` - Get account by ID

### Users (Account-Scoped)

All user routes require `:accountId` prefix:

- `GET /accounts/:accountId/users` - List users in account
- `GET /accounts/:accountId/users/:id` - Get user by ID
- `POST /accounts/:accountId/users` - Create user
  - Body: `{email, displayName, role?}`
- `PUT /accounts/:accountId/users/:id` - Update user
  - Body: `{displayName?, role?}`

### Auth - Role Management

- `GET /accounts/:accountId/roles?includeStats=true` - List roles (with stats)
- `GET /accounts/:accountId/roles/:roleName/permissions` - Get role permissions
- `POST /accounts/:accountId/roles/:roleName/permissions` - Add permission to role
  - Body: `{object: string, action: string}`
- `DELETE /accounts/:accountId/roles/:roleName/permissions` - Remove permission

### Auth - User-Role Assignment

- `GET /accounts/:accountId/users/:userId/roles?includeInherited=true` - Get user roles
- `POST /accounts/:accountId/users/:userId/roles/:roleName` - Assign role
- `DELETE /accounts/:accountId/users/:userId/roles/:roleName` - Unassign role
- `GET /accounts/:accountId/roles/:roleName/users?includeInherited=true` - Users with role

### Auth - User Permissions

- `GET /accounts/:accountId/users/:userId/info` - Comprehensive user info (roles + permissions)
- `POST /accounts/:accountId/users/:userId/check-permission` - Check permission
  - Body: `{object: string, action: string}`
  - Returns: `{userId, domain, object, action, hasPermission: boolean}`

### Auth - Domain Query

- `POST /accounts/:accountId/roles/users` - Get users by multiple roles
  - Body: `{roles: string[]}`
  - Returns: `{domain, users: [{user, roles}]}`

### Other Services

Documents and Settings are legacy Promise-based services (to be refactored).

## Error Handling

### Minimal Error Set

Expose only meaningful business errors to frontend:

- `UserNotFound` → 404
- `AccountNotFound` → 404
- `Unauthorized` → 401
- `Forbidden` → 403
- `CasbinEnforcerError` → 500

Don't leak implementation details (ParseError, ValidationError → convert to domain errors).

### Error Response Format

```json
{
  "error": {
    "_tag": "UserNotFound",
    "message": "User not found",
    "id": "..."
  }
}
```

Frontend maps `_tag` to i18n keys.

### Sentry Reporting

Only report 5xx errors to Sentry. Domain errors (4xx) are expected.

```typescript
// middleware/errorHandler.ts
if (statusCode >= 500) {
  Sentry.captureException(err, { tags: { error_tag: errorTag } });
}
```

## Development

```bash
# Run dev server (hot reload)
pnpm --filter @fidudoc/storage dev

# Build for production
pnpm --filter @fidudoc/storage build

# Type check
pnpm --filter @fidudoc/storage typecheck

# Lint
pnpm --filter @fidudoc/storage lint
```

## Testing Protected Endpoints

### Get Authentication Token

Use the CLI utility from `packages/utils` to authenticate and get a token:

```bash
# Get access token for authenticated requests
pnpm auth admin@example.com

# Get formatted Authorization header for curl
AUTH_HEADER=$(pnpm auth admin@example.com -h 2>/dev/null | tail -1)
```

See [packages/utils/README.md](../../utils/README.md) for setup instructions.

### Test Endpoints with Auth

```bash
# Start server
pnpm dev

# Set variables
ACCOUNT_ID="019a261c-e755-708f-8240-ab4ec58e594e"
USER_ID="ff60f64e-76cc-4234-b232-c9fa47327549"
AUTH_HEADER=$(pnpm auth admin@example.com -h 2>/dev/null | tail -1)

# Test protected endpoints
curl -H "$AUTH_HEADER" "http://localhost:3000/accounts/$ACCOUNT_ID/users"
curl -H "$AUTH_HEADER" "http://localhost:3000/accounts/$ACCOUNT_ID/roles"

# Assign role to user
curl -H "$AUTH_HEADER" -X POST \
  "http://localhost:3000/accounts/$ACCOUNT_ID/users/$USER_ID/roles/admin"

# Check user permission
curl -H "$AUTH_HEADER" -X POST \
  "http://localhost:3000/accounts/$ACCOUNT_ID/users/$USER_ID/check-permission" \
  -H "Content-Type: application/json" \
  -d '{"object": "documents", "action": "read"}'
```

## Migration Status

### ✅ Completed

- Effect runtime with global services
- Domain entities (User, Account) with Effect Models
- Repositories (Users, Accounts) as Effect Services
- Effect → Express bridge
- Users API (account-scoped, Effect-based)
- Accounts API (Effect-based)
- Auth API (Casbin, roles, permissions, Effect-based)
- Error handling with tagged errors
- Sentry integration
- Authentication middleware (plain async/await)

### 🚧 To Refactor

- Documents service (Promise-based → Effect)
- Settings service (Promise-based → Effect)
