# Transaction Handling in Effect SQL

This document explains how database transactions work in Effect SQL, covering both the internal implementation and practical usage patterns in this project.

## Overview

Effect SQL provides **real database-level transactions** with automatic connection management through Effect's context system. When you use `sql.withTransaction`, you get genuine SQL `BEGIN`/`COMMIT`/`ROLLBACK` behavior with seamless connection sharing across all repository operations.

## Implementation Details

### Context-Based Connection Management

Effect SQL uses a sophisticated context system to manage transactional connections:

```typescript
// From @effect/sql/src/internal/client.ts
export const TransactionConnection = Context.GenericTag<
  Client.TransactionConnection,
  readonly [conn: Connection.Connection, counter: number]
>("@effect/sql/SqlClient/TransactionConnection");
```

**Key Points:**

- `TransactionConnection` is a context tag that tracks the current connection and nesting level
- `counter` enables nested transactions using database savepoints
- All SQL operations check this context to determine which connection to use

### Automatic Connection Resolution

Repository operations automatically resolve the correct connection:

```typescript
// From @effect/sql/src/internal/client.ts
const getConnection = Effect.flatMap(
  Effect.serviceOption(TransactionConnection),
  Option.match({
    onNone: () => acquirer, // Regular pooled connection
    onSome: ([conn]) => Effect.succeed(conn), // Transactional connection
  }),
);
```

**Behavior:**

- **Outside transactions**: Gets connection from pool
- **Inside transactions**: Reuses the same transactional connection
- **No repository code changes needed**: Connection resolution is transparent

### Real Database Transactions

Effect SQL executes actual SQL transaction commands:

```typescript
// From @effect/sql/src/internal/client.ts
const withTransaction = makeWithTransaction({
  begin: (conn) => conn.executeUnprepared("BEGIN", [], undefined),
  commit: (conn) => conn.executeUnprepared("COMMIT", [], undefined),
  rollback: (conn) => conn.executeUnprepared("ROLLBACK", [], undefined),
  savepoint: (conn, id) =>
    conn.executeUnprepared(`SAVEPOINT effect_sql_${id}`, [], undefined),
  rollbackSavepoint: (conn, id) =>
    conn.executeUnprepared(
      `ROLLBACK TO SAVEPOINT effect_sql_${id}`,
      [],
      undefined,
    ),
});
```

**Transaction Lifecycle:**

1. **Acquire connection** from pool or reuse existing transactional connection
2. **Execute `BEGIN TRANSACTION`** (or create savepoint for nested)
3. **Add connection to context** so all operations use the same connection
4. **Execute all SQL operations** on the transactional connection
5. **`COMMIT` on success** or **`ROLLBACK` on failure**
6. **Return connection** to pool

### Context Propagation

The transaction context is propagated through Effect's fiber context:

```typescript
// From @effect/sql/src/internal/client.ts
Effect.locally(
  restore(effect),
  FiberRef.currentContext,
  Context.add(context, options.transactionTag, [conn, id]).pipe(
    Context.add(Tracer.ParentSpan, span),
  ),
);
```

This ensures that **all Effect operations** within the transaction scope automatically receive the transactional connection.

## Practical Usage in This Project

### Basic Transaction Pattern

The standard pattern used throughout the project:

```typescript
// From src/Accounts.ts
const updateUser = (id: UserId, user: Partial<typeof User.jsonUpdate.Type>) =>
  userRepo.findById(id).pipe( // SQL: SELECT * FROM users WHERE id = ?
    Effect.flatMap(/* validation logic */),
    Effect.andThen((previous) =>
      userRepo.update({ // SQL: UPDATE users SET ... WHERE id = ?
        ...previous,
        ...user,
        id,
        updatedAt: undefined,
      })
    ),
    sql.withTransaction, // Wraps both operations in transaction
    Effect.catchTag("SqlError", (err) => Effect.die(err)),
    Effect.withSpan("Accounts.updateUser", { attributes: { id, user } }),
    policyRequire("User", "update"),
  );
```

**Generated SQL:**

```sql
BEGIN TRANSACTION;
  SELECT * FROM users WHERE id = 123;
  UPDATE users SET email = 'new@email.com', updated_at = CURRENT_TIMESTAMP WHERE id = 123;
COMMIT;  -- or ROLLBACK if any operation fails
```

### Multi-Repository Transactions

Complex operations spanning multiple repositories:

```typescript
// From src/Accounts.ts
const createUser = (user: typeof User.jsonCreate.Type) =>
  accountRepo.insert(Account.insert.make({})).pipe( // INSERT INTO accounts
    Effect.bindTo("account"),
    Effect.bind(
      "accessToken",
      () => uuid.generate.pipe(Effect.map(accessTokenFromString)),
    ),
    Effect.bind(
      "user",
      ({ accessToken, account }) =>
        userRepo.insert(User.insert.make({ // INSERT INTO users
          ...user,
          accountId: account.id,
          accessToken,
        })),
    ),
    Effect.map(({ account, user }) =>
      new UserWithSensitive({ ...user, account })
    ),
    sql.withTransaction, // Both INSERTs in same transaction
    Effect.orDie,
    Effect.withSpan("Accounts.createUser", { attributes: { user } }),
    policyRequire("User", "create"),
  );
```

**Generated SQL:**

```sql
BEGIN TRANSACTION;
  INSERT INTO accounts (created_at, updated_at) VALUES (NOW(), NOW());
  INSERT INTO users (email, account_id, access_token, created_at, updated_at) 
         VALUES ('user@example.com', 1, 'uuid-token', NOW(), NOW());
COMMIT;
```

### Repository Implementation (No Transaction Awareness)

Repositories don't need any transaction-specific code:

```typescript
// From src/Accounts/UsersRepo.ts
export class UsersRepo extends Effect.Service<UsersRepo>()("Accounts/UsersRepo", {
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient    // Gets appropriate connection automatically
    const repo = yield* Model.makeRepository(User, {
      tableName: "users",
      spanPrefix: "UsersRepo", 
      idColumn: "id"
    })

    const findByAccessToken = (apiKey: AccessToken) =>
      pipe(
        findByAccessTokenSchema(apiKey),      // Uses same connection as other operations
        Effect.orDie,
        Effect.withSpan("UsersRepo.findByAccessToken")
      )

    return { ...repo, findByAccessToken } as const
  }),
  dependencies: [SqlLive]
})
```

**Key Point**: The `sql` client automatically provides either a pooled connection (normal) or the transactional connection (within `withTransaction`).

## Transaction Guarantees

### ACID Properties

Effect SQL transactions provide full ACID guarantees:

- **Atomicity**: All operations succeed or all are rolled back
- **Consistency**: Database constraints are maintained
- **Isolation**: Other transactions don't see partial updates
- **Durability**: Committed changes are permanent

### Error Handling

Automatic rollback on any failure:

```typescript
// Example: If second operation fails, first is rolled back
const riskyOperation = userRepo.insert(newUser).pipe( // ✅ Succeeds
  Effect.andThen(() => groupRepo.insert(invalidGroup) // ❌ Fails (constraint violation)
  ),
  sql.withTransaction, // 🔄 Automatic rollback of both operations
);
```

### Nested Transactions

Effect SQL handles nested transactions using savepoints:

```typescript
const nestedTransactionExample = Effect.gen(function*() {
  // Outer transaction
  yield* accountRepo.insert(newAccount);

  // Inner transaction (uses savepoint)
  yield* userRepo.insert(newUser).pipe(sql.withTransaction);

  yield* groupRepo.insert(newGroup);
}).pipe(sql.withTransaction);
```

**Generated SQL:**

```sql
BEGIN TRANSACTION;                          -- Outer transaction
  INSERT INTO accounts (...) VALUES (...);
  SAVEPOINT effect_sql_1;                   -- Inner transaction savepoint
    INSERT INTO users (...) VALUES (...);
  -- COMMIT/ROLLBACK to savepoint based on inner result
  INSERT INTO groups (...) VALUES (...);
COMMIT;                                     -- Outer transaction commit
```

## Best Practices

### ✅ Good Transaction Usage

**Short, Focused Transactions:**

```typescript
const transferFunds = (fromId: AccountId, toId: AccountId, amount: number) =>
  Effect.gen(function*() {
    yield* accountRepo.debit(fromId, amount);
    yield* accountRepo.credit(toId, amount);
  }).pipe(sql.withTransaction); // Perfect: atomic financial operation
```

**Business Logic Operations:**

```typescript
const completeOrder = (orderId: OrderId) =>
  Effect.gen(function*() {
    const order = yield* orderRepo.findById(orderId);
    yield* orderRepo.updateStatus(orderId, "completed");
    yield* inventoryRepo.decrementStock(order.items);
    yield* paymentRepo.processPayment(order.payment);
  }).pipe(sql.withTransaction); // Good: all related to single business operation
```

### ❌ Avoid These Patterns

**Long-Running Transactions:**

```typescript
// Don't do this - holds connection too long
const badExample = Effect.gen(function*() {
  yield* userRepo.update(user);
  yield* sendEmailNotification(user.email); // External service call!
  yield* callThirdPartyAPI(user.data); // Network call!
  yield* generateReport(user.id); // CPU-intensive operation!
}).pipe(sql.withTransaction); // Bad: holds DB connection during external calls
```

**Better Approach:**

```typescript
const goodExample = Effect.gen(function*() {
  // Short transaction for DB operations only
  const updatedUser = yield* userRepo.update(user).pipe(sql.withTransaction);

  // External operations outside transaction
  yield* sendEmailNotification(updatedUser.email);
  yield* callThirdPartyAPI(updatedUser.data);
  yield* generateReport(updatedUser.id);
});
```

## Performance Considerations

### Connection Pool Efficiency

- **Transactional connections** are held for the duration of the transaction
- **Regular connections** are returned to pool immediately after each query
- **Nested transactions** reuse the same connection (no additional pool pressure)

### Lock Duration

Transactions hold database locks until commit/rollback:

```typescript
// Shorter lock duration (preferred)
const quickUpdate = userRepo.update(user).pipe(sql.withTransaction);

// Longer lock duration (use carefully)
const slowUpdate = Effect.gen(function*() {
  const user = yield* userRepo.findById(id);
  const processed = yield* heavyBusinessLogic(user); // CPU work while holding locks
  yield* userRepo.update(processed);
}).pipe(sql.withTransaction);
```

## Testing Transactions

The project uses test layers that don't require real transactions:

```typescript
// From test/Accounts.test.ts - Mock repository behavior
static Test = makeTestLayer(UsersRepo)({
  findById: (id: UserId) => Effect.succeed(Option.some(mockUser)),
  update: (user) => Effect.succeed(user)
})
```

For integration tests with real transactions:

```typescript
it.effect("transaction rollback", () =>
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`INSERT INTO test (name) VALUES ('hello')`.pipe(
      Effect.andThen(Effect.fail("boom")),
      sql.withTransaction,
      Effect.ignore,
    );
    const rows = yield* sql`SELECT * FROM test`;
    assert.deepStrictEqual(rows, []); // Verify rollback worked
  }));
```

## Summary

Effect SQL's transaction system provides:

1. **Real database transactions** with proper SQL semantics
2. **Automatic connection management** through Effect's context system
3. **Zero configuration** - repositories work transparently
4. **Nested transaction support** using database savepoints
5. **Production-ready reliability** with comprehensive error handling

The system allows you to focus on business logic while automatically handling all the complex aspects of transaction management, connection pooling, and error recovery.
