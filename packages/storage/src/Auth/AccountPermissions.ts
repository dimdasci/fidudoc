import { Data } from "effect";
import * as Effect from "effect/Effect";
import { CasbinEnforcer, type CasbinEnforcerError } from "./Casbin.ts";

/**
 * Account permissions management errors
 */
export class AccountPermissionsError
  extends Data.TaggedError("AccountPermissionsError")<{
    readonly message: string;
    readonly cause?: unknown;
  }>
{}

/**
 * Role information with permissions
 */
export interface RoleInfo {
  readonly role: string;
  readonly permissions: ReadonlyArray<{
    readonly domain: string;
    readonly object: string;
    readonly action: string;
  }>;
}

/**
 * User information with roles and permissions
 */
export interface UserInfo {
  readonly user: string;
  readonly directRoles: ReadonlyArray<string>;
  readonly inheritedRoles: ReadonlyArray<string>;
  readonly allPermissions: ReadonlyArray<{
    readonly subject: string;
    readonly domain: string;
    readonly object: string;
    readonly action: string;
  }>;
}

/**
 * Service for managing account permissions using Casbin
 */
export class AccountPermissionsService
  extends Effect.Service<AccountPermissionsService>()(
    "AccountPermissionsService",
    {
      effect: Effect.gen(function*() {
        const casbin = yield* CasbinEnforcer;

        /**
         * Get all users assigned to a role in a specific domain
         */
        const getUsersForRoleInDomain = (
          role: string,
          domain: string,
          includeInherited: boolean = false,
        ): Effect.Effect<string[], AccountPermissionsError | CasbinEnforcerError> =>
          Effect.gen(function*() {
            if (includeInherited) {
              return yield* casbin.getImplicitUsersForRole(role, domain);
            } else {
              return yield* casbin.getUsersForRole(role, domain);
            }
          });

        /**
         * Get all roles for a user in a specific domain
         */
        const getRolesForUserInDomain = (
          user: string,
          domain: string,
          includeInherited: boolean = false,
        ): Effect.Effect<string[], AccountPermissionsError | CasbinEnforcerError> =>
          Effect.gen(function*() {
            if (includeInherited) {
              return yield* casbin.getImplicitRolesForUser(user, domain);
            } else {
              return yield* casbin.getRolesForUser(user, domain);
            }
          });

        /**
         * Get permissions for a specific role
         * Note: Casbin doesn't have a direct "getPermissionsForRole" method,
         * so we get permissions for the role as if it were a user
         */
        const getPermissionsForRole = (
          role: string,
        ): Effect.Effect<RoleInfo, AccountPermissionsError | CasbinEnforcerError> =>
          Effect.gen(function*() {
            const permissions = yield* casbin.getPermissionsForUser(role);

            const formattedPermissions = permissions.map((
              [, domain, object, action],
            ) => ({
              domain: domain ?? "",
              object: object ?? "",
              action: action ?? "",
            }));

            return {
              role,
              permissions: formattedPermissions,
            };
          });

        /**
         * Get comprehensive user information including roles and permissions
         */
        const getUserInfoInDomain = (
          user: string,
          domain: string,
        ): Effect.Effect<UserInfo, AccountPermissionsError | CasbinEnforcerError> =>
          Effect.gen(function*() {
            const directRoles = yield* casbin.getRolesForUser(user, domain);
            const inheritedRoles = yield* casbin.getImplicitRolesForUser(
              user,
              domain,
            );
            const allPermissionsRaw = yield* casbin.getImplicitPermissionsForUser(
              user,
              domain,
            );

            const allPermissions = allPermissionsRaw.map((
              [subject, domain, object, action],
            ) => ({
              subject: subject ?? "",
              domain: domain ?? "",
              object: object ?? "",
              action: action ?? "",
            }));

            return {
              user,
              directRoles,
              inheritedRoles,
              allPermissions,
            };
          });

        /**
         * Get all resources/policies that a user can access in a domain
         */
        const getUserResourcesInDomain = (
          user: string,
          domain: string,
        ): Effect.Effect<
          ReadonlyArray<{
            readonly subject: string;
            readonly domain: string;
            readonly object: string;
            readonly action: string;
          }>,
          AccountPermissionsError | CasbinEnforcerError
        > =>
          Effect.gen(function*() {
            const resources = yield* casbin.getImplicitResourcesForUser(user, domain);

            return resources.map(([subject, domain, object, action]) => ({
              subject: subject ?? "",
              domain: domain ?? "",
              object: object ?? "",
              action: action ?? "",
            }));
          });

        /**
         * Check if a user has a specific permission in a domain
         */
        const hasUserPermission = (
          user: string,
          domain: string,
          object: string,
          action: string,
        ): Effect.Effect<boolean, AccountPermissionsError | CasbinEnforcerError> =>
          casbin.enforce(user, domain, object, action);

        /**
         * Get all users in a domain with their roles
         */
        const getAllUsersInDomain = (
          domain: string,
          roles: string[],
        ): Effect.Effect<
          ReadonlyArray<{
            readonly user: string;
            readonly roles: ReadonlyArray<string>;
          }>,
          AccountPermissionsError | CasbinEnforcerError
        > =>
          Effect.gen(function*() {
            const userRoleMap = new Map<string, Set<string>>();

            const addUserRole = (user: string, role: string) => {
              if (!userRoleMap.has(user)) {
                userRoleMap.set(user, new Set());
              }
              const userRoles = userRoleMap.get(user);
              if (userRoles) {
                userRoles.add(role);
              }
            };

            // Collect users for each role
            for (const role of roles) {
              const users = yield* casbin.getUsersForRole(role, domain);
              users.forEach(user => {
                addUserRole(user, role);
              });
            }

            return Array.from(userRoleMap.entries()).map(([user, roleSet]) => ({
              user,
              roles: Array.from(roleSet),
            }));
          });

        /**
         * Get all roles defined in a domain
         */
        const getAllRolesInDomain = (
          domain: string,
        ): Effect.Effect<
          ReadonlyArray<string>,
          AccountPermissionsError | CasbinEnforcerError
        > => casbin.getAllRolesInDomain(domain);

        /**
         * Get all roles in a domain with their permission counts
         */
        const getAllRolesWithPermissions = (
          domain: string,
        ): Effect.Effect<
          ReadonlyArray<{
            readonly role: string;
            readonly permissionCount: number;
            readonly userCount: number;
          }>,
          AccountPermissionsError | CasbinEnforcerError
        > =>
          Effect.gen(function*() {
            const roles = yield* casbin.getAllRolesInDomain(domain);

            const rolesWithInfo = yield* Effect.all(
              roles.map((role) =>
                Effect.gen(function*() {
                  const permissions = yield* casbin.getPermissionsForUser(role);
                  const domainPermissions = permissions.filter(
                    (p) => p[1] === domain,
                  );
                  const users = yield* casbin.getUsersForRole(role, domain);

                  return {
                    role,
                    permissionCount: domainPermissions.length,
                    userCount: users.length,
                  };
                })
              ),
              { concurrency: "unbounded" },
            );

            return rolesWithInfo;
          });

        return {
          getUsersForRoleInDomain,
          getRolesForUserInDomain,
          getPermissionsForRole,
          getUserInfoInDomain,
          getUserResourcesInDomain,
          hasUserPermission,
          getAllUsersInDomain,
          getAllRolesInDomain,
          getAllRolesWithPermissions,
        } as const;
      }),
      dependencies: [CasbinEnforcer.Default],
    },
  )
{}

export const AccountPermissionsLive = AccountPermissionsService.Default;
