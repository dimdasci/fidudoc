/**
 * Users HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Users service operations using Effect bridge pattern
 */

import { Console, Effect, ParseResult, Schema } from "effect";
import type { IRouter } from "express";
import { AccountIdFromString } from "../Domain/Account.ts";
import {
  UserId,
  UserJson,
  UserJsonCreate,
  UserJsonUpdate,
  UserNotFound,
  UserValidationError,
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
  // User Management - Account-Scoped Routes
  // ============================================================================

  // GET /accounts/:accountId/users - List all users in account
  app.get(
    "/accounts/:accountId/users",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        const usersService = yield* UsersService;
        // Parse accountId from URL
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );

        // List users scoped to current account
        const result = yield* usersService.listByAccount(accountId);

        // Encode each user to JSON schema for proper serialization
        // Note: result.users includes lastSignInAt from Supabase Auth which is not part of User domain
        const encodedUsers = yield* Effect.all(
          result.users.map(user =>
            Schema.encode(UserJson)(user).pipe(
              Effect.map(encodedUser => ({
                ...encodedUser,
                lastSignInAt: user.lastSignInAt, // Pass through auth metadata
              })),
            )
          ),
        );

        return {
          total: result.total,
          users: encodedUsers,
        };
      })),
  );

  // GET /accounts/:accountId/users/:id - Get user by ID
  app.get(
    "/accounts/:accountId/users/:id",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse accountId from URL
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );

        // Parse and validate user ID from URL parameter
        const userId = yield* Schema.decodeUnknown(UserId)(
          req.params.id,
        ).pipe(
          Effect.catchTag("ParseError", (_parseError) =>
            Effect.fail(new UserNotFound({ id: req.params.id || "<undefined>" }))),
        );

        const usersService = yield* UsersService;

        // Find user by ID (handles UserNotFound internally)
        const user = yield* usersService.findById(userId);

        // Verify user belongs to the requested account
        if (user.accountId !== accountId) {
          return yield* Effect.fail(
            new UserNotFound({ id: req.params.id || "<undefined>" }),
          );
        }

        // Encode to JSON schema for API response
        return yield* Schema.encode(UserJson)(user);
      })),
  );

  // POST /accounts/:accountId/users - Create a new user
  app.post(
    "/accounts/:accountId/users",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse accountId from URL
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );

        yield* Effect.logInfo(`Creating user in account ${accountId}`);

        // Validate and decode request body
        // Convert ParseError to UserValidationError for proper 400 response
        const userData = yield* Schema.decodeUnknown(CreateUserRequest)(req.body)
          .pipe(
            Effect.catchTag("ParseError", (parseError) => {
              const formattedErrors = ParseResult.ArrayFormatter.formatErrorSync(
                parseError,
              );
              Console.log("Parsed Errors:", formattedErrors);
              return Effect.die(
                new UserValidationError({
                  message: "Invalid user data",
                  errors: formattedErrors,
                }),
              );
            }),
          );

        const usersService = yield* UsersService;

        // Create user (includes validation, duplicate checking, and transaction)
        const result = yield* usersService.create(accountId, userData);

        // Encode user to JSON schema for API response
        const userJson = yield* Schema.encode(UserJson)(result.user);

        yield* Effect.logInfo(`User created successfully: ${userJson}`);

        return {
          success: result.success,
          message: result.message,
          user: userJson,
        };
      })),
  );

  // PUT /accounts/:accountId/users/:id - Update a user
  app.put(
    "/accounts/:accountId/users/:id",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse accountId from URL
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.accountId,
        );

        // Parse user ID
        const userId = yield* Schema.decodeUnknown(UserId)(
          req.params.id,
        ).pipe(
          Effect.catchTag("ParseError", (_parseError) =>
            Effect.fail(new UserNotFound({ id: req.params.id || "<undefined>" }))),
        );

        // Validate and decode update data
        // Convert ParseError to UserValidationError for proper 400 response
        const updateData = yield* Schema.decodeUnknown(UpdateUserRequest)(req.body)
          .pipe(
            Effect.catchTag("ParseError", (parseError) => {
              const formattedErrors = ParseResult.ArrayFormatter.formatErrorSync(
                parseError,
              );
              return Effect.fail(
                new UserValidationError({
                  message: "Invalid user data",
                  errors: formattedErrors,
                }),
              );
            }),
          );

        const usersService = yield* UsersService;

        // Update user (includes validation, security checks, and transaction)
        const result = yield* usersService.update(
          accountId,
          userId,
          updateData,
        );

        // Encode user to JSON schema for API response
        const userJson = yield* Schema.encode(UserJson)(result.user);

        return {
          success: result.success,
          message: result.message,
          user: userJson,
        };
      })),
  );
}
