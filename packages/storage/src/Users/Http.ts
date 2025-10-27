/**
 * Users HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Users service operations
 */

import { Effect, Option, Schema } from "effect";
import type { Express } from "express";
import { UserId, UserJson, UserNotFound } from "../Domain/User.ts";
import { effectHandler } from "../middleware/effect.ts";
import type { AppRuntime } from "../runtime.ts";
import type { IUsers } from "../Users.ts";
import { UsersRepo } from "./Repo.ts";

export function registerUsersRoutes(
  app: Express,
  usersService: IUsers,
  runtime: AppRuntime,
) {
  // GET /users/:id - Get user by ID (Effect-based)
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

        // Get the users repository from context
        const repo = yield* UsersRepo;

        // Find user by ID (returns Option<User>)
        const userOption = yield* repo.findById(userId);

        // Convert Option to Effect, failing with UserNotFound if None
        const user = yield* Option.match(userOption, {
          onNone: () => Effect.fail(new UserNotFound({ id: userId })),
          onSome: (user) => Effect.succeed(user),
        });

        // Encode to JSON schema for API response
        return yield* Schema.encode(UserJson)(user);
      })),
  );
  // GET /users - List all users
  app.get("/users", async (_req, res) => {
    try {
      const result = await usersService.listUsers();
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to list users" });
    }
  });

  // POST /users - Create a new user
  app.post("/users", async (req, res) => {
    try {
      const { email, name, role } = req.body;

      if (!email || !name || !role) {
        return res.status(400).json({
          error: "Invalid request: email, name, and role are required",
        });
      }

      const result = await usersService.createUser({ email, name, role });
      res.status(201).json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // PUT /users/:id - Update a user
  app.put("/users/:id", async (req, res) => {
    try {
      const { name, role, isActive } = req.body;

      const result = await usersService.updateUser(req.params.id, {
        name,
        role,
        isActive,
      });
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // GET /audit-log - Get audit trail
  app.get("/audit-log", async (req, res) => {
    try {
      const result = await usersService.getAuditLog({
        userId: req.query.userId as string,
        action: req.query.action as string,
        resourceType: req.query.resourceType as string,
      });
      res.json(result);
    } catch (_error) {
      res.status(500).json({ error: "Failed to retrieve audit log" });
    }
  });
}
