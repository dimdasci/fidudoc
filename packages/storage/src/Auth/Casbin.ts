import * as Sentry from "@sentry/node";
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
      const enforcer = yield* createEnforcer(modelPath, adapter).pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            console.error("[Casbin] Failed to initialize enforcer", {
              error,
              modelPath,
            });

            const throwable = error instanceof Error
              ? error
              : new Error(
                (error as { message?: string }).message
                  ?? "Casbin enforcer initialization failed",
                {
                  cause: (error as { cause?: unknown }).cause,
                },
              );

            Sentry.captureException(throwable, {
              tags: {
                component: "casbin_enforcer",
              },
              extra: {
                modelPath,
                originalError: error,
              },
            });
          })
        ),
      );

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
       * Get all users that have a specific role in a domain
       */
      const getUsersForRole = (
        role: string,
        domain: string,
      ): Effect.Effect<string[], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getUsersForRole(role, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get users for role",
              cause: error,
            }),
        });

      /**
       * Get all users that have a specific role in a domain (including inherited roles)
       */
      const getImplicitUsersForRole = (
        role: string,
        domain: string,
      ): Effect.Effect<string[], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getImplicitUsersForRole(role, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get implicit users for role",
              cause: error,
            }),
        });

      /**
       * Get all implicit roles for a user in a domain (including inherited roles)
       */
      const getImplicitRolesForUser = (
        user: string,
        domain: string,
      ): Effect.Effect<string[], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getImplicitRolesForUser(user, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get implicit roles for user",
              cause: error,
            }),
        });

      /**
       * Get direct permissions for a user/role
       */
      const getPermissionsForUser = (
        user: string,
      ): Effect.Effect<string[][], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getPermissionsForUser(user),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get permissions for user",
              cause: error,
            }),
        });

      /**
       * Get all permissions for a user in a domain (including inherited from roles)
       */
      const getImplicitPermissionsForUser = (
        user: string,
        domain: string,
      ): Effect.Effect<string[][], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getImplicitPermissionsForUser(user, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get implicit permissions for user",
              cause: error,
            }),
        });

      /**
       * Get all policies/resources that a user can access in a domain
       */
      const getImplicitResourcesForUser = (
        user: string,
        domain: string,
      ): Effect.Effect<string[][], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getImplicitResourcesForUser(user, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get implicit resources for user",
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

      /**
       * Get all roles defined in a specific domain
       * Returns unique role names from grouping policies (g) for the domain
       */
      const getAllRolesInDomain = (
        domain: string,
      ): Effect.Effect<string[], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: async () => {
            // Get all grouping policies (g, user, role, domain)
            const allGroupings = await enforcer.getFilteredGroupingPolicy(
              2,
              domain,
            );
            // Extract unique role names (index 1 in each grouping)
            const roles = new Set(
              allGroupings.map((g) => g[1]).filter((r) => r !== undefined),
            );
            return Array.from(roles);
          },
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get all roles in domain",
              cause: error,
            }),
        });

      /**
       * Get all policies (permissions) defined in a specific domain
       * Returns all policy rules for the domain
       */
      const getAllPoliciesInDomain = (
        domain: string,
      ): Effect.Effect<string[][], CasbinEnforcerError> =>
        Effect.tryPromise({
          try: () => enforcer.getFilteredPolicy(1, domain),
          catch: (error) =>
            new CasbinEnforcerError({
              message: "Failed to get all policies in domain",
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
        getUsersForRole,
        getImplicitUsersForRole,
        getImplicitRolesForUser,
        getPermissionsForUser,
        getImplicitPermissionsForUser,
        getImplicitResourcesForUser,
        reloadPolicy,
        getAllRolesInDomain,
        getAllPoliciesInDomain,
      } as const;
    }),
    dependencies: [AppConfig.Default],
  },
) {}

export const CasbinLive = CasbinEnforcer.Default;
