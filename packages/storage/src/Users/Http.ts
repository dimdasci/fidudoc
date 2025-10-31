/**
 * Users HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Users service operations using Effect bridge pattern
 */

import { Effect, Schema } from "effect";
import type { IRouter } from "express";
import { CurrentPrincipal } from "../Domain/Principal.ts";
import {
  CurrentUser,
  UserId,
  UserJson,
  UserJsonCreate,
  UserJsonUpdate,
  UserNotFound,
} from "../Domain/User.ts";
import { effectHandler } from "../middleware/effect.ts";
import type { AppRuntime } from "../Runtime.ts";
import { UsersService } from "./Service.ts";

// Schema definitions for request/response validation

const CreateUserRequest = UserJsonCreate;
const UpdateUserRequest = UserJsonUpdate;

export function registerUsersRoutes(
  app: IRouter,
  runtime: AppRuntime,
) {
  // ============================================================================
  // User Management
  // ============================================================================

  // GET /users/:id - Get user by ID
  app.get(
    "/users/:id",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse and validate UUID from URL parameter
        // If parsing fails (invalid UUID), convert to UserNotFound error
        const userId = yield* Schema.decodeUnknown(UserId)(
          req.params.id,
        ).pipe(
          Effect.catchTag("ParseError", (_parseError) =>
            // Treat invalid UUID same as nonexistent user (404)
            // Preserve the invalid input in error details for debugging
            Effect.fail(new UserNotFound({ id: req.params.id || "<undefined>" }))),
        );

        // Get the users service from context
        const usersService = yield* UsersService;

        // Find user by ID (handles UserNotFound internally)
        const user = yield* usersService.findById(userId);

        // Encode to JSON schema for API response
        return yield* Schema.encode(UserJson)(user);
      })),
  );

  // GET /users - List all users in current account
  app.get(
    "/users",
    effectHandler(runtime, (_req) =>
      Effect.gen(function*() {
        const usersService = yield* UsersService;
        const principal = yield* CurrentPrincipal;

        // Ensure accountId is present (should be guaranteed by auth middleware)
        if (!principal.accountId) {
          return yield* Effect.fail(new Error("Missing account ID in principal"));
        }

        // List users scoped to current account
        const result = yield* usersService.listByAccount(principal.accountId);

        return result;
      })),
  );

  // POST /users - Create a new user
  app.post(
    "/users",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Validate and decode request body
        const userData = yield* Schema.decodeUnknown(CreateUserRequest)(req.body);

        const usersService = yield* UsersService;
        const principal = yield* CurrentPrincipal;

        // Ensure accountId is present
        if (!principal.accountId) {
          return yield* Effect.fail(new Error("Missing account ID in principal"));
        }

        // Create user (includes validation, duplicate checking, and transaction)
        const result = yield* usersService.create(principal.accountId, userData);

        return result;
      })),
  );

  // PUT /users/:id - Update a user
  app.put(
    "/users/:id",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse user ID
        const userId = yield* Schema.decodeUnknown(UserId)(
          req.params.id,
        ).pipe(
          Effect.catchTag("ParseError", (_parseError) =>
            Effect.fail(new UserNotFound({ id: req.params.id || "<undefined>" }))),
        );

        // Validate and decode update data
        const updateData = yield* Schema.decodeUnknown(UpdateUserRequest)(req.body);

        const usersService = yield* UsersService;
        const principal = yield* CurrentPrincipal;

        // Ensure accountId is present
        if (!principal.accountId) {
          return yield* Effect.fail(new Error("Missing account ID in principal"));
        }

        // Update user (includes validation, security checks, and transaction)
        const result = yield* usersService.update(
          principal.accountId,
          userId,
          updateData,
        );

        return result;
      })),
  );

  // ============================================================================
  // Additional User Operations
  // ============================================================================

  // GET /users/current - Get current authenticated user
  app.get(
    "/users/current",
    effectHandler(runtime, (_req) =>
      Effect.gen(function*() {
        // Get current user directly from authentication context
        const user = yield* CurrentUser;

        // Encode to JSON schema for API response
        return yield* Schema.encode(UserJson)(user);
      })),
  );
}
