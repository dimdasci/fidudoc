/**
 * Auth HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to AccountPermissions service operations for role and
 * permission management
 */

import { Effect, Schema } from "effect";
import type { IRouter } from "express";
import { AccountIdFromString } from "../Domain/Account.ts";
import { effectHandler } from "../middleware/effect.ts";
import type { AppRuntime } from "../Runtime.ts";
import { AccountPermissionsService } from "./AccountPermissions.ts";
import { CasbinEnforcer } from "./Casbin.ts";

// Schema definitions for request/response validation

const PermissionRequest = Schema.Struct({
  object: Schema.String,
  action: Schema.String,
});

const PermissionCheckRequest = Schema.Struct({
  object: Schema.String,
  action: Schema.String,
});

const RolesListRequest = Schema.Struct({
  roles: Schema.Array(Schema.String),
});

export function registerAuthRoutes(app: IRouter, runtime: AppRuntime) {
  // ============================================================================
  // Role Discovery
  // ============================================================================

  // GET /accounts/:accountId/roles
  // Get all roles in an account
  app.get(
    "/accounts/:accountId/roles",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const includeStats = req.query.includeStats === "true";

        const service = yield* AccountPermissionsService;

        if (includeStats) {
          const rolesWithStats = yield* service.getAllRolesWithPermissions(
            accountId,
          );
          return { domain: accountId, roles: rolesWithStats };
        } else {
          const roles = yield* service.getAllRolesInDomain(accountId);
          return { domain: accountId, roles };
        }
      })),
  );

  // ============================================================================
  // Role-Permission Management
  // ============================================================================

  // POST /accounts/:accountId/roles/:roleName/permissions
  // Add a permission to a role
  app.post(
    "/accounts/:accountId/roles/:roleName/permissions",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const roleName = req.params.roleName ?? "";
        const { object, action } = yield* Schema.decodeUnknown(
          PermissionRequest,
        )(req.body);

        const casbin = yield* CasbinEnforcer;
        const success = yield* casbin.addPolicy(
          roleName,
          accountId,
          object,
          action,
        );

        return { success, roleName, domain: accountId, object, action };
      })),
  );

  // DELETE /accounts/:accountId/roles/:roleName/permissions
  // Remove a permission from a role
  app.delete(
    "/accounts/:accountId/roles/:roleName/permissions",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const roleName = req.params.roleName ?? "";
        const { object, action } = yield* Schema.decodeUnknown(
          PermissionRequest,
        )(req.body);

        const casbin = yield* CasbinEnforcer;
        const success = yield* casbin.removePolicy(
          roleName,
          accountId,
          object,
          action,
        );

        return { success, roleName, domain: accountId, object, action };
      })),
  );

  // GET /accounts/:accountId/roles/:roleName/permissions
  // Get all permissions for a role
  app.get(
    "/accounts/:accountId/roles/:roleName/permissions",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const roleName = req.params.roleName ?? "";

        const service = yield* AccountPermissionsService;
        const roleInfo = yield* service.getPermissionsForRole(roleName);

        // Filter permissions by domain (accountId)
        const domainPermissions = roleInfo.permissions.filter(
          (p) => p.domain === accountId,
        );

        return {
          role: roleName,
          domain: accountId,
          permissions: domainPermissions,
        };
      })),
  );

  // ============================================================================
  // User-Role Assignment
  // ============================================================================

  // POST /accounts/:accountId/users/:userId/roles/:roleName
  // Assign a role to a user in an account
  app.post(
    "/accounts/:accountId/users/:userId/roles/:roleName",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const userId = req.params.userId ?? "";
        const roleName = req.params.roleName ?? "";

        const casbin = yield* CasbinEnforcer;
        const success = yield* casbin.addRoleForUser(
          userId,
          roleName,
          accountId,
        );

        return { success, userId, roleName, domain: accountId };
      })),
  );

  // DELETE /accounts/:accountId/users/:userId/roles/:roleName
  // Unassign a role from a user in an account
  app.delete(
    "/accounts/:accountId/users/:userId/roles/:roleName",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const userId = req.params.userId ?? "";
        const roleName = req.params.roleName ?? "";

        const casbin = yield* CasbinEnforcer;
        const success = yield* casbin.removeRoleForUser(
          userId,
          roleName,
          accountId,
        );

        return { success, userId, roleName, domain: accountId };
      })),
  );

  // GET /accounts/:accountId/users/:userId/roles
  // Get all roles for a user in an account
  app.get(
    "/accounts/:accountId/users/:userId/roles",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const userId = req.params.userId ?? "";
        const includeInherited = req.query.includeInherited === "true";

        const service = yield* AccountPermissionsService;
        const roles = yield* service.getRolesForUserInDomain(
          userId,
          accountId,
          includeInherited,
        );

        return { userId, domain: accountId, roles, includeInherited };
      })),
  );

  // GET /accounts/:accountId/roles/:roleName/users
  // Get all users assigned to a role in an account
  app.get(
    "/accounts/:accountId/roles/:roleName/users",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const roleName = req.params.roleName ?? "";
        const includeInherited = req.query.includeInherited === "true";

        const service = yield* AccountPermissionsService;
        const users = yield* service.getUsersForRoleInDomain(
          roleName,
          accountId,
          includeInherited,
        );

        return { roleName, domain: accountId, users, includeInherited };
      })),
  );

  // ============================================================================
  // User Information
  // ============================================================================

  // GET /accounts/:accountId/users/:userId/info
  // Get comprehensive user information (roles and permissions)
  app.get(
    "/accounts/:accountId/users/:userId/info",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const userId = req.params.userId ?? "";

        const service = yield* AccountPermissionsService;
        const userInfo = yield* service.getUserInfoInDomain(userId, accountId);

        return { domain: accountId, ...userInfo };
      })),
  );

  // POST /accounts/:accountId/users/:userId/check-permission
  // Check if a user has a specific permission
  app.post(
    "/accounts/:accountId/users/:userId/check-permission",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const userId = req.params.userId ?? "";
        const { object, action } = yield* Schema.decodeUnknown(
          PermissionCheckRequest,
        )(req.body);

        const service = yield* AccountPermissionsService;
        const hasPermission = yield* service.hasUserPermission(
          userId,
          accountId,
          object,
          action,
        );

        return {
          userId,
          domain: accountId,
          object,
          action,
          hasPermission,
        };
      })),
  );

  // ============================================================================
  // Domain Management
  // ============================================================================

  // POST /accounts/:accountId/users
  // Get all users in an account with their roles
  app.post(
    "/accounts/:accountId/users",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );
        const { roles } = yield* Schema.decodeUnknown(RolesListRequest)(
          req.body,
        );

        const service = yield* AccountPermissionsService;
        const users = yield* service.getAllUsersInDomain(accountId, [...roles]);

        return { domain: accountId, users };
      })),
  );
}
