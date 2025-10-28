import { type Enforcer, newEnforcer } from "casbin";
import { BasicAdapter } from "casbin-basic-adapter";
import { Data, Redacted, type Scope } from "effect";
import * as Effect from "effect/Effect";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { AppConfig } from "../Config.ts";

/**
 * Casbin-related errors
 */
export class CasbinAdapterError extends Data.TaggedError("CasbinAdapterError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CasbinEnforcerError extends Data.TaggedError("CasbinEnforcerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class CasbinConnectionError extends Data.TaggedError(
  "CasbinConnectionError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Creates a PostgreSQL client for Casbin with proper connection management.
 * Uses Supabase transaction pooler configuration.
 *
 * NOTE: BasicAdapter.newAdapter() will call client.connect() internally,
 * so we create an unconnected client here and let BasicAdapter handle connection.
 */
const createPgClient = (
  databaseUrl: string,
): Effect.Effect<Client, CasbinConnectionError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.sync(() =>
      new Client({
        connectionString: databaseUrl,
        // Supabase transaction pooler configuration
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      })
    ),
    (client) =>
      Effect.promise(() => client.end()).pipe(
        Effect.catchAll(() => Effect.void),
      ),
  );

/**
 * Creates a Casbin BasicAdapter with proper error handling
 */
const createAdapter = (
  client: Client,
): Effect.Effect<BasicAdapter<"pg">, CasbinAdapterError> =>
  Effect.tryPromise({
    try: () => BasicAdapter.newAdapter("pg", client, "casbin_rule"),
    catch: (error) =>
      new CasbinAdapterError({
        message: "Failed to create Casbin adapter",
        cause: error,
      }),
  });

/**
 * Creates and initializes a Casbin enforcer
 */
const createEnforcer = (
  modelPath: string,
  adapter: BasicAdapter<"pg">,
): Effect.Effect<Enforcer, CasbinEnforcerError> =>
  Effect.tryPromise({
    try: async () => {
      const enforcer = await newEnforcer(modelPath, adapter);
      await enforcer.loadPolicy();
      return enforcer;
    },
    catch: (error) =>
      new CasbinEnforcerError({
        message: "Failed to create or load Casbin enforcer",
        cause: error,
      }),
  });

export class CasbinEnforcer extends Effect.Service<CasbinEnforcer>()(
  "Casbin",
  {
    scoped: Effect.gen(function*() {
      const config = yield* AppConfig;

      // Get database URL from config (it's a redacted secret)
      const databaseUrl = Redacted.value(config.database.url);

      // Create PostgreSQL client with proper lifecycle management
      const client = yield* createPgClient(databaseUrl);

      // Create Casbin adapter
      const adapter = yield* createAdapter(client);

      // Load model from file
      const modelPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "model.conf",
      );

      // Create and initialize enforcer
      const enforcer = yield* createEnforcer(modelPath, adapter);

      /**
       * Check if a user has permission to perform an action on a resource in a domain
       */
      const enforce = (
        sub: string,
        dom: string,
        obj: string,
        act: string,
      ): Effect.Effect<boolean, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.enforce(sub, dom, obj, act),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to enforce policy",
              cause: error,
            }),
        });

      /**
       * Add a policy rule
       */
      const addPolicy = (
        sub: string,
        dom: string,
        obj: string,
        act: string,
      ): Effect.Effect<boolean, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.addPolicy(sub, dom, obj, act),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to add policy",
              cause: error,
            }),
        });

      /**
       * Remove a policy rule
       */
      const removePolicy = (
        sub: string,
        dom: string,
        obj: string,
        act: string,
      ): Effect.Effect<boolean, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.removePolicy(sub, dom, obj, act),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to remove policy",
              cause: error,
            }),
        });

      /**
       * Add a role for a user in a domain
       */
      const addRoleForUser = (
        user: string,
        role: string,
        domain: string,
      ): Effect.Effect<boolean, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.addRoleForUser(user, role, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to add role for user",
              cause: error,
            }),
        });

      /**
       * Remove a role from a user in a domain
       */
      const removeRoleForUser = (
        user: string,
        role: string,
        domain: string,
      ): Effect.Effect<boolean, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.deleteRoleForUser(user, role, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to remove role from user",
              cause: error,
            }),
        });

      /**
       * Get all roles for a user in a domain
       */
      const getRolesForUser = (
        user: string,
        domain: string,
      ): Effect.Effect<string[], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getRolesForUser(user, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get roles for user",
              cause: error,
            }),
        });

      /**
       * Reload all policies from database
       */
      const reloadPolicy = (): Effect.Effect<void, CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.loadPolicy(),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to reload policies",
              cause: error,
            }),
        });

      return {
        enforce,
        addPolicy,
        removePolicy,
        addRoleForUser,
        removeRoleForUser,
        getRolesForUser,
        reloadPolicy,
      } as const;
    }),
    dependencies: [AppConfig.Default],
  },
) {}

export const CasbinLive = CasbinEnforcer.Default;
